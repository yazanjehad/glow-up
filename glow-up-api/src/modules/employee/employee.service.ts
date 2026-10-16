import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ClientSession } from 'mongoose';

import { RoleType } from 'src/common/enum/roletype.enum';
import { EmployeeWorkFor } from '../../common/enum/employee-workfor.enum';
import { LookupService } from '../lookup/lookup.service';
import { ProviderService } from '../provider/provider.service';
import {
  ServiceProvider,
  ServiceProviderDocument,
} from '../provider/schemas/service-provider.schema';
import { BreakCustom, BreakWeekly, WorkingDay, WorkingHours } from '../provider/schemas/working-day.schema';
import { Rating, RatingDocument } from '../rating/schemas/rating.schema';
import { UsersService } from '../users/users.service';
import { BreakCustomDto, BreakWeeklyDto, CreateEmployeeDto, WorkingBreaksDto } from './dto/create-employee.dto';
import { BreakCustomRequestDto, BreakStatusUpdateDto } from './dto/break-custom.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Employee, EmployeeDocument } from './schemas/employee.schema';
import { WeekDay } from '../../common/enum/weekday.enum';
import { BreakStatus } from 'src/common/enum/break-status.enum';
import { CustomBreak, CustomBreakDocument } from './schemas/custom-breaks.schemas';
import { EmployeeWorkingHoursValidator } from './utils/working-hours.validator';
import { Appointment } from '../appointment/schemas/appointment.schema';
import { AppointmentStatus } from '../appointment/enum/appointmentstatus.enum';
import { User, UserDocument } from '../users/schemas/user.schema';
import { UserStatus } from '../users/enum/userstatus.enum';

@Injectable()
export class EmployeeService {
  private readonly MAX_BREAKS_PER_DAY = 3;
  private readonly MAX_BREAK_DURATION_MINUTES = 60;

  constructor(
    @InjectModel(Employee.name)
    private readonly employeeModel: Model<EmployeeDocument>,
    @InjectModel(ServiceProvider.name)
    private readonly serviceProviderModel: Model<ServiceProviderDocument>,
    private readonly providerService: ProviderService,
    @Inject(forwardRef(() => UsersService)) private readonly usersService: UsersService,

    private readonly lookupService: LookupService,
    @InjectModel(Rating.name)
    private readonly ratingModel: Model<RatingDocument>,
    @InjectModel(User.name)
     private readonly userModel: Model<UserDocument>,


    // customBreakModel
    @InjectModel(CustomBreak.name)
    private readonly customBreakModel: Model<CustomBreakDocument>,

     @InjectModel(Appointment.name)
        private readonly appointmentModel: Model<Appointment>,
  ) { }

  /* ============================
      Helper: Time to Minutes
  ============================ */
  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  /* ============================
      Helper: Get Day Name From Date
  ============================ */
  private getDayNameFromDate(date: Date | string): WeekDay {
    const days = [
      WeekDay.SUNDAY,
      WeekDay.MONDAY,
      WeekDay.TUESDAY,
      WeekDay.WEDNESDAY,
      WeekDay.THURSDAY,
      WeekDay.FRIDAY,
      WeekDay.SATURDAY,
    ];
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return days[dateObj.getDay()];
  }

  /* ============================
      Helper: Get Day of Week Number (MongoDB $dayOfWeek format)
      MongoDB: Sunday=1, Monday=2, ..., Saturday=7
  ============================ */
  private getDayOfWeekNumber(dayName: WeekDay | string): number {
    const dayMap: Record<string, number> = {
      [WeekDay.SUNDAY]: 1,
      [WeekDay.MONDAY]: 2,
      [WeekDay.TUESDAY]: 3,
      [WeekDay.WEDNESDAY]: 4,
      [WeekDay.THURSDAY]: 5,
      [WeekDay.FRIDAY]: 6,
      [WeekDay.SATURDAY]: 7,
    };
    return dayMap[dayName] || 1;
  }

  /* ============================
      Helper: Map BreakCustom DTO to Model
  ============================ */
  private mapBreaksDtoToModel(customDto: BreakCustomDto[]) {
    return {
      custom: customDto.map((b) => ({
        _id: b._id ? new Types.ObjectId(b._id) : new Types.ObjectId(),
        date: new Date(b.date),
        startTime: b.startTime,
        endTime: b.endTime,
        reason: b.reason,
        status: BreakStatus.APPROVED,
      })),
    };
  }

  /* ================= Create ================= */

  async create(providerUserId: string, dto: CreateEmployeeDto) {
    const session = await this.employeeModel.db.startSession();
    session.startTransaction();

    try {
      const provider = await this.providerService.getByOwnerUserId(providerUserId);

      if (!provider) {
        throw new ForbiddenException('common.errors.PROVIDER_NOT_FOUND_OR_INVALID');
      }
       //PHONE_ALREADY_EXISTS
      if (dto.phone) {
        const existingUser = await this.userModel.findOne({ phone: dto.phone }).session(session ?? null);
        if (existingUser) {
          throw new BadRequestException('common.errors.PHONE_ALREADY_EXISTS');
        }
      }

      const providerWorkingHours: WorkingHours =
        (provider.workingHours as WorkingHours) || {
          weekly: [],
          exceptions: [],
          timezone: 'Asia/Riyadh',
        };

      // ===== Validate Services =====
      const activeServiceIds = new Set<string>();
      provider.services.forEach((cat) =>
        cat.items.forEach((item) => {
          if (item.isActive) activeServiceIds.add(item._id.toString());
        }),
      );

      if (dto.position) {
        const emp_pos = await this.lookupService.findOne(dto.position);
        if (!emp_pos || emp_pos.key !== 'EMPLOYEE_POSITION' || !emp_pos.isActive) {
          throw new BadRequestException('common.errors.INVALID_EMPLOYEE_POSITION');
        }
      }
     

      dto.services?.forEach((serviceId) => {
        if (!activeServiceIds.has(serviceId.toString())) {
          throw new BadRequestException({
            message: 'common.errors.SERVICE_ITEM_NOT_ACTIVE_OR_NOT_BELONGS',
            args: { serviceId: serviceId.toString() },
          });
        }
      });

      const employeeServices = dto.services?.map((id) => ({
        serviceItemId: new Types.ObjectId(id),
        addedAt: new Date(),
        isActive: true,
      }));

      // ===== Determine weekly hours =====
      // If no weekly schedule sent → use provider's weekly schedule
      const weeklyToUse = dto.workingHours?.weekly?.length
        ? dto.workingHours.weekly
        : providerWorkingHours.weekly;

      // Validate weekly schedule against provider
      EmployeeWorkingHoursValidator.validateEmployeeWorkingHours(
        { weekly: providerWorkingHours.weekly },
        { weekly: weeklyToUse },
      );

      // Build employee working hours
      const employeeWorkingHours: WorkingHours = {
        timezone: dto.workingHours?.timezone || providerWorkingHours.timezone || 'Asia/Riyadh',
        weekly: weeklyToUse,
        breaks: {
          weekly: [],
          custom: [],
        },
      };

      // ===== Create user =====
      const user = await this.usersService.createUser(
        {
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          password: dto.password,
          role: RoleType.EMPLOYEE,
        },
        session,
      );

      // ===== Create employee =====
      const employee = new this.employeeModel({
        ...dto,
        userId: user._id,
        position: dto.position ? new Types.ObjectId(dto.position) : undefined,
        providerId: provider._id,
        workingHours: employeeWorkingHours,
        services: employeeServices || [],
        workFor: dto.workFor || EmployeeWorkFor.BOTH,
      });

      await employee.save({ session });

      // ===== Save custom breaks separately =====
      if (dto.workingHours?.breaks?.custom?.length) {
        // Validate custom breaks
        EmployeeWorkingHoursValidator.validateCustomBreaks(
          weeklyToUse,
          dto.workingHours.breaks.custom.map(b => ({
            _id: b._id ? new Types.ObjectId(b._id) : undefined,
            date: new Date(b.date),
            startTime: b.startTime,
            endTime: b.endTime,
            reason: b.reason,
            status: BreakStatus.APPROVED,
          })),
        );

        const customBreakDocs = dto.workingHours.breaks.custom.map((b) => ({
          _id: b._id ? new Types.ObjectId(b._id) : new Types.ObjectId(),
          providerId: provider._id,
          employeeId: employee._id,
          date: new Date(b.date),
          startTime: b.startTime,
          endTime: b.endTime,
          reason: b.reason,
          status: BreakStatus.APPROVED,
        }));

        await this.customBreakModel.insertMany(customBreakDocs, { session });
      }

      // ===== commit transaction =====
      await session.commitTransaction();
      session.endSession();

      return { employee, user };

    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /* ================= Update ================= */

  async update(
    employeeId: string,
    providerUserId: string,
    dto: UpdateEmployeeDto,
  ) {
    const session = await this.employeeModel.db.startSession();
    session.startTransaction();

    try {
      const provider = await this.providerService.getByOwnerUserId(providerUserId);
      if (!provider) throw new NotFoundException('common.errors.SERVICE_PROVIDER_NOT_FOUND');

      const employee = await this.employeeModel.findById(employeeId).session(session);
      if (!employee) throw new NotFoundException('common.errors.EMPLOYEE_NOT_FOUND');

      const user = await this.userModel.findById(employee.userId).session(session);
      if (!user) throw new NotFoundException('User not found');

      if (employee.providerId.toString() !== provider._id.toString()) {
        throw new ForbiddenException('common.errors.CANNOT_MODIFY_EMPLOYEE');
      }
      const oldIsActive = employee.isActive;
  if (dto.isActive !== undefined && dto.isActive !== oldIsActive && employee.userId) {
     employee.isActive= dto.isActive;
    user.status = dto.isActive ? UserStatus.ACTIVE : UserStatus.INACTIVE;
  }
      const providerWorkingHours: WorkingHours =
        (provider.workingHours as WorkingHours) || {
          weekly: [],
          exceptions: [],
          timezone: 'Asia/Riyadh',
        };

      // ===== Basic Fields Update =====
      const fieldsToUpdate = ['name', 'role', 'email', 'phone', 'status', 'workFor'] as (keyof UpdateEmployeeDto)[];
      for (const field of fieldsToUpdate) {
        if (dto[field] !== undefined) {
          (employee as any)[field] = dto[field];
        }
      }
      if (dto.email !== undefined) user.email = dto.email;
      if (dto.phone !== undefined) user.phone = dto.phone;

      // ===== Working Hours Partial Update (Safe Merge) =====
      if (dto.workingHours) {
        // Initialize if not exists - use provider as base
        employee.workingHours = employee.workingHours || {
          timezone: providerWorkingHours.timezone,
          weekly: [],
          breaks: { weekly: [], custom: [] },
        };

        // ===== Timezone =====
        if (dto.workingHours.timezone !== undefined) {
          employee.workingHours.timezone = dto.workingHours.timezone;
        }

    // ===== Weekly Schedule (Merge) =====
if (dto.workingHours.weekly !== undefined) {
  for (const dayDto of dto.workingHours.weekly) {
    const existing = employee.workingHours?.weekly.find(
      (d) => d.day === dayDto.day,
    );
    const dayName = dayDto.day;

    // ادمج بيانات اليوم الحالية مع الجديد
    const openTime = dayDto.openTime ?? existing?.openTime;
    const closeTime = dayDto.closeTime ?? existing?.closeTime;
    const isOpen = dayDto.isOpen ?? existing?.isOpen;

    // جلب كل المواعيد المستقبلية لهذا اليوم
    const futureAppointments = await this.appointmentModel.find({
      providerId: provider._id,
      'services.employeeId': employee._id,
      'services.date': { $gte: new Date() },
      'services.timeSlot': { $exists: true },
    });

    // فلترة المواعيد المتعارضة
    const conflictingAppointments = futureAppointments.filter((a) =>
      a.services.some((s) => {
        const serviceDayName = this.getDayNameFromDate(s.date);
        if (serviceDayName !== dayName) return false;

        // لو الموظف يغلق اليوم بالكامل، أي موعد موجود يعتبر تعارض
        if (!isOpen) return true;

        if (!openTime || !closeTime) {
          throw new BadRequestException({
            message: 'common.errors.WORKING_DAY_OPEN_MUST_HAVE_OPEN_CLOSE_FOR_DAY',
            args: { day: `common.days.${dayName}` },
          });
        }

        const newOpenMinutes = this.timeToMinutes(openTime);
        const newCloseMinutes = this.timeToMinutes(closeTime);
        const serviceStart = this.timeToMinutes(s.timeSlot.start);
        const serviceEnd = this.timeToMinutes(s.timeSlot.end);

        // تحقق إذا كان الموعد خارج الفترة الجديدة
        return serviceStart < newOpenMinutes || serviceEnd > newCloseMinutes;
      }),
    );

    if (conflictingAppointments.length > 0) {
      throw new BadRequestException({
        message: !isOpen
          ? 'common.errors.CANNOT_CLOSE_DAY_HAS_APPOINTMENTS'
          : 'common.errors.CANNOT_UPDATE_DAY_APPOINTMENTS_CONFLICT',
        args: { dayName: `common.days.${dayName}` },
      });
    }

    // ===== تحديث اليوم بعد التأكد =====
    if (existing) {
      existing.isOpen = isOpen;
      existing.openTime = openTime;
      existing.closeTime = closeTime;
    } else {
      employee.workingHours?.weekly.push({
        day: dayName,
        isOpen,
        openTime,
        closeTime,
      });
    }
  }
}

        // Ensure breaks object exists
        employee.workingHours.breaks = employee.workingHours.breaks || {
          weekly: [],
          custom: [],
        };

       

        // ===== Custom Breaks (Add / Update / Delete) =====
        if (dto.workingHours?.breaks?.custom) {
          for (const incomingBreak of dto.workingHours.breaks.custom) {
            // Check if this is a delete request (marked with _id and delete: true)
            if ((incomingBreak as any).delete && incomingBreak._id) {
              const existingBreak = await this.customBreakModel.findById(incomingBreak._id).session(session);
              if (!existingBreak) {
                throw new BadRequestException('common.errors.CUSTOM_BREAK_NOT_FOUND');
              }
              if (existingBreak?.employeeId?.toString() !== employee._id.toString()) {
                throw new ForbiddenException('common.errors.CANNOT_DELETE_BREAK');
              }
              await this.customBreakModel.findByIdAndDelete(incomingBreak._id).session(session);
              continue;
            }

            if (!incomingBreak.date || !incomingBreak.startTime || !incomingBreak.endTime) {
    throw new BadRequestException({
        message:'common.errors.CUSTOM_BREAK_MUST_HAVE_DATE_START_END',
        args: { date: `${incomingBreak.date}`},
        
    });
         }

const breakDateStr = new Date(`${incomingBreak.date}T00:00:00`);
const today = new Date();
today.setHours(0, 0, 0, 0);

// منع إنشاء break بتاريخ قديم
if (!incomingBreak._id && breakDateStr < today) {
 throw new BadRequestException({
      message:  'common.errors.CUSTOM_BREAK_DATE_PAST',
      args: { date: `${incomingBreak.date}` },

      });
}
// منع إنشاء break إذا كان اليوم نفسه والوقت انتهى
if (breakDateStr.getTime() === today.getTime()) {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  // تحويل endTime لبساطه دقائق
  const [endHours, endMinutes] = incomingBreak.endTime.split(':').map(Number);
  const breakEndMinutes = endHours * 60 + endMinutes;

  if (breakEndMinutes <= nowMinutes) {
    throw new BadRequestException({
      message: 'common.errors.CUSTOM_BREAK_TIME_PAST',
      args: {
        date: incomingBreak.date,
        startTime: incomingBreak.startTime,
        endTime: incomingBreak.endTime,
        time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
      },
    });
  }
}

// منع تعديل break بتاريخ قديم
if (incomingBreak._id && breakDateStr < today) {
  throw new BadRequestException('common.errors.CANNOT_EDIT_PAST_BREAK');
}

            const breakDate = new Date(incomingBreak.date);

            const dayName = this.getDayNameFromDate(breakDate);

            const workingDay = employee.workingHours?.weekly?.find(
              (d) => d.day === dayName,
            );

            if (!workingDay || !workingDay.isOpen) {
              throw new BadRequestException({
                message: 'common.errors.CUSTOM_BREAK_CLOSED_DAY',
                args: { dayName: `common.days.${dayName}` },
              });
            }

            if (!workingDay.openTime || !workingDay.closeTime) {
              throw new BadRequestException('common.errors.WORKING_DAY_MUST_HAVE_OPEN_CLOSE');
            }

            const breakStart = this.timeToMinutes(incomingBreak.startTime);
            const breakEnd = this.timeToMinutes(incomingBreak.endTime);
            const openTime = this.timeToMinutes(workingDay.openTime);
            const closeTime = this.timeToMinutes(workingDay.closeTime);

            // Validate range
            if (breakStart >= breakEnd) {
              throw new BadRequestException({
                message: 'common.errors.CUSTOM_BREAK_INVALID_RANGE',
                args: { date: String(incomingBreak.date), startTime: incomingBreak.startTime, endTime: incomingBreak.endTime },
              });
            }

            if (breakStart < openTime || breakEnd > closeTime) {
              throw new BadRequestException({
                message: 'common.errors.CUSTOM_BREAK_EXCEEDS_HOURS',
                args: { dayName: `common.days.${dayName}`, openTime: workingDay.openTime, closeTime: workingDay.closeTime },
              });
            }

            // ===== Check overlap with other custom breaks (same date only) =====
            const existingCustomBreaks = await this.customBreakModel
              .find({
                employeeId: employee._id,
                _id: incomingBreak._id
                  ? { $ne: new Types.ObjectId(incomingBreak._id) }
                  : { $ne: null },
              })
              .session(session);

            const overlappingBreak = existingCustomBreaks
              .filter(
                (b) =>
                  new Date(b.date).toDateString() === breakDate.toDateString(),
              )
              .find(
                (b) =>
                  breakStart < this.timeToMinutes(b.endTime) &&
                  breakEnd > this.timeToMinutes(b.startTime),
              );

          if (overlappingBreak) {
  throw new BadRequestException({
    message: 'common.errors.CUSTOM_BREAK_OVERLAPS',
    args: {
      dayName: `common.days.${dayName}`,
      date: String(incomingBreak.date),
      startTime: incomingBreak.startTime,
      endTime: incomingBreak.endTime,
      existingStart: overlappingBreak.startTime,
      existingEnd: overlappingBreak.endTime,
    },
  });
}

            // ===== Check conflict with future employee appointments =====
            const now = new Date();

            const conflict = await this.appointmentModel.aggregate([
              {
                $match: {
                  providerId: provider._id,
                  status: { $in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
                },
              },
              { $unwind: "$services" },

              {
                $match: {
                  "services.employeeId": employee._id,
                  "services.date": { $gte: now },
                },
              },

              {
                $match: {
                  $expr: {
                    $eq: [
                      { $dateToString: { format: "%Y-%m-%d", date: "$services.date" } },
                      { $dateToString: { format: "%Y-%m-%d", date: breakDate } }
                    ],
                  },
                },
              },

              {
                $addFields: {
                  serviceStart: {
                    $add: [
                      { $multiply: [{ $toInt: { $substr: ["$services.timeSlot.start", 0, 2] } }, 60] },
                      { $toInt: { $substr: ["$services.timeSlot.start", 3, 2] } },
                    ],
                  },
                  serviceEnd: {
                    $add: [
                      { $multiply: [{ $toInt: { $substr: ["$services.timeSlot.end", 0, 2] } }, 60] },
                      { $toInt: { $substr: ["$services.timeSlot.end", 3, 2] } },
                    ],
                  },
                },
              },

              {
                $match: {
                  $expr: {
                    $and: [
                      { $lt: [breakStart, "$serviceEnd"] },
                      { $gt: [breakEnd, "$serviceStart"] },
                    ],
                  },
                },
              },     {
  $project: {
    serviceStart: 1,
    serviceEnd: 1,
    "services.timeSlot.start": 1,
    "services.timeSlot.end": 1
  }
},

      { $limit: 1 },
    ]);

    const appointment = conflict[0];

    if (conflict.length > 0) {
      throw new BadRequestException({
       message: 'common.errors.CUSTOM_BREAK_APPOINTMENT_CONFLICT',
  args: {
    date: String(incomingBreak.date),
    startTime: incomingBreak.startTime,
    endTime: incomingBreak.endTime,
    appointmentStart: appointment.services.timeSlot.start,
    appointmentEnd: appointment.services.timeSlot.end, },
      });
    }

            // ===== CREATE OR UPDATE =====
            if (incomingBreak._id) {
              // UPDATE
              const existing = await this.customBreakModel.findById(incomingBreak._id).session(session);

              if (!existing) {
                throw new BadRequestException('common.errors.CUSTOM_BREAK_NOT_FOUND');
              }

              if (existing?.employeeId?.toString() !== employee._id.toString()) {
                throw new ForbiddenException('common.errors.CANNOT_MODIFY_BREAK');
              }
            
             
              existing.date = breakDate;
              existing.startTime = incomingBreak.startTime;
              existing.endTime = incomingBreak.endTime;
              existing.reason = incomingBreak.reason ?? existing.reason;

              await existing.save({ session });
            } else {
              // CREATE
              const newBreak = new this.customBreakModel({
                _id: new Types.ObjectId(),
                providerId: provider._id,
                employeeId: employee._id,
                date: breakDate,
                startTime: incomingBreak.startTime,
                endTime: incomingBreak.endTime,
                reason: incomingBreak.reason,
                status: BreakStatus.APPROVED,
              });

              await newBreak.save({ session });
            }
          }
        }

        // ===== Final Validation =====
        if (employee.workingHours.weekly?.length) {
          EmployeeWorkingHoursValidator.validateWeeklySchedule(
            employee.workingHours.weekly,
          );
        }

        if (
          employee.workingHours.weekly?.length &&
          providerWorkingHours.weekly?.length
        ) {
          EmployeeWorkingHoursValidator.validateEmployeeInsideProvider(
            employee.workingHours.weekly,
            providerWorkingHours.weekly,
          );
        }
      }

      // ===== Position Update =====
      if (dto.position) {
        const empPos = await this.lookupService.findOne(dto.position);
        if (!empPos || empPos.key !== 'EMPLOYEE_POSITION' || !empPos.isActive) {
          throw new BadRequestException('common.errors.INVALID_EMPLOYEE_POSITION');
        }
        employee.position = new Types.ObjectId(dto.position);
      }

      // ===== Services Update =====
      if (dto.services) {
        await this.handleServiceAssigned(
          employee,
          provider,
          providerUserId,
          dto.services,
        );
      }

      await employee.save({ session });
      await user.save({ session });

      // ===== commit transaction =====
      await session.commitTransaction();
      session.endSession();

      return employee.toObject();
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
// ================= Get Custom Breaks (For Employee) =================
  async getCustomBreaksForEmployee(employeeId: string) {
    const employee = await this.employeeModel.findOne({ userId: new Types.ObjectId(employeeId) });
    if (!employee) {
      throw new NotFoundException('common.errors.EMPLOYEE_NOT_FOUND');
    }
    const customBreaks = await this.customBreakModel.find({
      employeeId: employee._id,
    });

    customBreaks.sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    })
    return customBreaks;
  }




  /* ================= Set Permission ================= */

  async setCapabilitiesForEmployee(
    employeeId: string,
    providerUserId: string,
    // permissionKey: keyof Employee['capabilities'],
    // value: boolean,
    capabilities: Partial<Employee['capabilities']>,
  ) {
    const provider =
      await this.providerService.getByOwnerUserId(providerUserId);
    if (!provider) {
      throw new NotFoundException('common.errors.SERVICE_PROVIDER_NOT_FOUND');
    }

    const employee = await this.employeeModel.findById(employeeId);
    if (!employee) {
      throw new NotFoundException('common.errors.EMPLOYEE_NOT_FOUND');
    }
    if (employee.providerId.toString() !== provider._id.toString()) {
      throw new ForbiddenException('common.errors.CANNOT_MODIFY_EMPLOYEE');
    }
    for (const key of Object.keys(capabilities)) {
      if (!(key in employee.capabilities)) {
        throw new BadRequestException({
          message: 'common.errors.INVALID_PERMISSION_KEY',
          args: { key },
        });
      }
    }
    const updateQuery: Record<string, any> = {};
    for (const [key, value] of Object.entries(capabilities)) {
      updateQuery[`capabilities.${key}`] = value;
    }

    return this.employeeModel.findByIdAndUpdate(
      employeeId,
      { $set: updateQuery },
      { new: true },
    );
  }

  /* ================= Get ================= */
  async findByProvider(providerUserId: string) {
    const provider =
      await this.providerService.getByOwnerUserId(providerUserId);
    if (!provider) {
      throw new NotFoundException('common.errors.SERVICE_PROVIDER_NOT_FOUND');
    }

    const employees = await this.employeeModel
      .find({ providerId: provider._id })
      .populate('userId', 'email phone')
      .populate('position', 'key code name')
      .lean();

    employees.forEach((emp: any) => {
      emp.email = emp.userId?.email || null;
      emp.phone = emp.userId?.phone || null;
    });

    return employees;
  }


    async findByUserId(userId: any):Promise<Employee | null>  {
      return this.employeeModel.findOne({
        userId: userId,
      }).lean();
    }
  //   const employees = await this.employeeModel.find({
  //   providerId: new Types.ObjectId(providerId),
  // });

  async getByProvider(providerId: string) {
    const employees = await this.employeeModel
      .find({ providerId: new Types.ObjectId(providerId), isActive:true })
      .populate('position', 'key code name')
      .populate('userId', 'email phone status')
.lean<
      (Employee & {
        _id: Types.ObjectId;
        workFor: EmployeeWorkFor;
        userId: {
          email: string;
          phone: string;
          status: string;
        };
      })[]
    >();
    if (!employees.length) {
      throw new NotFoundException('common.errors.NO_EMPLOYEES_FOR_PROVIDER');
    }

    const employeeIds = employees.map((e) => e._id);

    const ratings = await this.ratingModel.aggregate([
      {
        $match: {
          employeeId: { $in: employeeIds },
          type: 'employee',
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: '$employeeId',
          averageRating: { $avg: '$rating' },
          totalRatings: { $sum: 1 },
        },
      },
    ]);

    return employees.map((e) => {
      const r = ratings.find((r) => r._id.toString() === e._id.toString());
      return {
        id: e._id,
        name: e.name,
        position: e.position || null,
        rating: r ? Number(r.averageRating.toFixed(1)) : 0,
        workFor: e.workFor,
        totalRatings: r ? r.totalRatings : 0,
        profileImage: e.profileImage,
          email: e.userId?.email || null,
      phone: e.userId?.phone || null,
      status: e.userId?.status || null,
       
      };
    });
  }
    //getByProviderForAdmin
  async getByProviderForAdmin(providerId: string) {
  const provider = await this.serviceProviderModel
    .findById(providerId)
    .populate('userId', 'phone')
    .lean<{
      name: string;
      userId?: {
        phone?: string;
      };
    }>();

  const employees = await this.employeeModel
    .find({ providerId: new Types.ObjectId(providerId) })
    .populate('position', 'key code name')
    .populate('userId', 'email phone status ')
    .lean<
      (Employee & {
        _id: Types.ObjectId;
        workFor: EmployeeWorkFor;
        userId: {
          email: string;
          phone: string;
          status: string;
    capabilities: Record<string, boolean>;
        };
      })[]
    >();

  if (!employees.length) {
    throw new NotFoundException('common.errors.NO_EMPLOYEES_FOR_PROVIDER');
  }

  const employeeIds = employees.map((e) => e._id);

  const ratings = await this.ratingModel.aggregate([
    {
      $match: {
        employeeId: { $in: employeeIds },
        type: 'employee',
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: '$employeeId',
        averageRating: { $avg: '$rating' },
        totalRatings: { $sum: 1 },
      },
    },
  ]);

  return {
    provider: {
      name: provider?.name || null,
      phone: provider?.userId?.phone || null,
    },

    employees: employees.map((e) => {
      const r = ratings.find((r) => r._id.toString() === e._id.toString());

      return {
        id: e._id,
        name: e.name,
        position: e.position || null,
        rating: r ? Number(r.averageRating.toFixed(1)) : 0,
        workFor: e.workFor,
        isActive:e.isActive,
        totalRatings: r ? r.totalRatings : 0,
        profileImage: e.profileImage,
        email: e.userId?.email || null,
        phone: e.userId?.phone || null,
        status: e.userId?.status || null,
capabilities: e.capabilities || null,      };
    }),
  };
}
  
   

  async findById(employeeId: string) {
    const employee = await this.employeeModel
      .findById(employeeId)
      .populate('position', 'key code name')
      .lean();

    if (!employee) {
      throw new NotFoundException('common.errors.EMPLOYEE_NOT_FOUND');
    }

    return employee;
  }

  async getEmployeesByProviderAndService(
    providerId: string,
    serviceId: string,
  ) {
    const employees = await this.employeeModel.find({
      providerId: new Types.ObjectId(providerId),
      isActive:true,
      services: {
        $elemMatch: {
          serviceItemId: new Types.ObjectId(serviceId),
          isActive: true,
        },
      },
    });

    if (!employees || employees.length === 0) {
      throw new NotFoundException('common.errors.NO_EMPLOYEES_FOR_SERVICE_PROVIDER');
    }

    const employeeIds = employees.map((e) => e._id);

    const ratings = await this.ratingModel.aggregate([
      {
        $match: {
          employeeId: { $in: employeeIds },
          type: 'employee',
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: '$employeeId',
          averageRating: { $avg: '$rating' },
          totalRatings: { $sum: 1 },
        },
      },
    ]);

    return employees.map((e) => {
      const r = ratings.find((r) => r._id.toString() === e._id.toString());
      return {
        id: e._id,
        name: e.name,
        position: e.position || null,
        workFor: e.workFor,
         profileImage: e.profileImage,
        services: e.services || [],
        totalRatings: r ? r.totalRatings : 0,
        rating: r ? Number(r.averageRating.toFixed(1)) : 0,
      };
    });
  }

  async handleServiceAssigned(
    employee: EmployeeDocument,
    provider: any,
    providerUserId: string,
    serviceIds: string[],
  ) {
    const serviceItemMap = new Map<string, boolean>();
    provider.services.forEach((category) => {
      category.items.forEach((item) => {
        if (item.isActive) {
          serviceItemMap.set(item._id.toString(), true);
        }
      });
    });

    serviceIds.forEach((id) => {
      if (!serviceItemMap.has(id)) {
        throw new BadRequestException({
          message: 'common.errors.SERVICE_ITEM_NOT_ACTIVE_OR_NOT_BELONGS',
          args: { serviceId: id },
        });
      }
    });

    const existingMap = new Map<string, any>();
    employee.services?.forEach((s) =>
      existingMap.set(s.serviceItemId.toString(), s),
    );

    const user = await this.usersService.findById(providerUserId);

    serviceIds.forEach((id) => {
      const existing = existingMap.get(id);
      if (existing) {
        existing.isActive = !existing.isActive;
        existing.updatedBy = {
          _id: user._id,
          name: user.name,
          role: user.role,
        };
        existing.updatedAt = new Date();
      } else {
        employee.services?.push({
          serviceItemId: new Types.ObjectId(id),
          addedAt: new Date(),
          isActive: true,
        } as any);
      }
    });
  }

  /* ================= Request Break ================= */

  async requestBreak(employeeUserId: string, dto: BreakCustomRequestDto) {
    // Find employee by userId
    const employee = await this.employeeModel.findOne({ userId: new Types.ObjectId(employeeUserId) });

    if (!employee) {
      throw new NotFoundException('common.errors.EMPLOYEE_NOT_FOUND');
    }
 

    if (!employee.capabilities.canManageBreakTime) {
      throw new ForbiddenException('common.errors.NOT_ALLOWED_REQUEST_BREAK');
    }


    const provider = await this.providerService.getById(employee.providerId.toString());

    if (!provider) {
      throw new NotFoundException('common.errors.PROVIDER_NOT_FOUND');
    }

    // Validate break date is not in the past
    const breakDate = new Date(dto.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (breakDate < today) {
      throw new BadRequestException('common.errors.BREAK_DATE_PAST');
    }
    // // Prevent past time if same day
   
if (
  breakDate.getFullYear() === today.getFullYear() &&
  breakDate.getMonth() === today.getMonth() &&
  breakDate.getDate() === today.getDate()
) {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  // تحويل startTime و endTime للبريك إلى دقائق
  const [startH, startM] = dto.startTime.split(':').map(Number);
  const [endH, endM] = dto.endTime.split(':').map(Number);

  const breakStartMinutes = startH * 60 + startM;
  const breakEndMinutes = endH * 60 + endM;

  // إذا انتهى البريك بالفعل
  if (breakEndMinutes <= nowMinutes) {
    throw new BadRequestException({
      message: 'common.errors.CUSTOM_BREAK_TIME_PAST',
      args: {
        date: dto.date,
        startTime: dto.startTime,
        endTime: dto.endTime,
        time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
      },
    });
  }
}

    const dayName = this.getDayNameFromDate(breakDate);

    // Get working hours for the employee (or use provider's if not set)
    const employeeWorkingHours = employee.workingHours as WorkingHours;
    const providerWorkingHours = provider.workingHours as WorkingHours;

    const workingHours = employeeWorkingHours?.weekly?.length
      ? employeeWorkingHours
      : providerWorkingHours;

    const workingDay = workingHours?.weekly?.find((d) => d.day === dayName);

    if (!workingDay || !workingDay.isOpen) {
      throw new BadRequestException({
        message: 'common.errors.BREAK_CLOSED_DAY_NOT_OPEN',
        args: { dayName: `common.days.${dayName}` },
      });
    }

    if (!workingDay.openTime || !workingDay.closeTime) {
      throw new BadRequestException('common.errors.WORKING_DAY_MUST_HAVE_OPEN_CLOSE');
    }

    const breakStart = this.timeToMinutes(dto.startTime);
    const breakEnd = this.timeToMinutes(dto.endTime);
    const openTime = this.timeToMinutes(workingDay.openTime);
    const closeTime = this.timeToMinutes(workingDay.closeTime);

    // Validate break time range
    if (breakStart >= breakEnd) {
      throw new BadRequestException({
        message: 'common.errors.BREAK_INVALID_RANGE_START_END',
        args: { startTime: dto.startTime, endTime: dto.endTime },
      });
    }

    if (breakStart < openTime || breakEnd > closeTime) {
      throw new BadRequestException({
        message: 'common.errors.BREAK_EXCEEDS_WORKING_HOURS',
        args: { day: `common.days.${dayName}`, openTime: workingDay.openTime, closeTime: workingDay.closeTime },
      });
    }

    // // Check maximum break duration
    // if (breakEnd - breakStart > this.MAX_BREAK_DURATION_MINUTES) {
    //   throw new BadRequestException(
    //     `Break exceeds maximum duration (${this.MAX_BREAK_DURATION_MINUTES} minutes)`,
    //   );
    // }

    // Check for overlapping breaks (existing custom breaks)
    const existingBreaks = await this.customBreakModel.find({
      employeeId: employee._id,
      date: {
        $gte: new Date(breakDate.setHours(0, 0, 0, 0)),
        $lt: new Date(breakDate.setHours(23, 59, 59, 999)),
      },
    });

    const overlappingBreak = existingBreaks.find(
      (b) =>
        breakStart < this.timeToMinutes(b.endTime) &&
        breakEnd > this.timeToMinutes(b.startTime),
    );

    if (overlappingBreak) {
      throw new BadRequestException({
        message: 'common.errors.BREAK_OVERLAPS_ANOTHER',
        args: { startTime: overlappingBreak.startTime, endTime: overlappingBreak.endTime },
      });
    }

    // Create the break request with PENDING status
    const newBreak = new this.customBreakModel({
      providerId: new Types.ObjectId(provider._id),
      employeeId: employee._id,
      date: new Date(dto.date),
      startTime: dto.startTime,
      endTime: dto.endTime,
      reason: dto.reason,
      status: BreakStatus.PENDING,
    });

    return newBreak.save();
  }

  /* ================= Get Custom Breaks (Provider) ================= */

  async getCustomBreaksByProvider(
  providerUserId: string,
  query: {
    employeeId?: string;
    status?: BreakStatus;
    page?: number;
    limit?: number;
  },
) {
  const provider = await this.providerService.getByOwnerUserId(providerUserId);

  if (!provider) {
    throw new NotFoundException('common.errors.PROVIDER_NOT_FOUND');
  }

  const { employeeId, status, page = 1, limit = 10 } = query;
  const skip = (page - 1) * limit;

  /* ================= Build Base Filter ================= */

  const baseFilter: any = {
    providerId: new Types.ObjectId(provider._id),
  };

  if (employeeId) {
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('common.errors.EMPLOYEE_ID_INVALID');
    }
    baseFilter.employeeId = new Types.ObjectId(employeeId);
  }

  if (status) {
    baseFilter.status = status;
  }

  /* ================= Get Data + Total ================= */

  const [total, breaks] = await Promise.all([
    this.customBreakModel.countDocuments(baseFilter),

    this.customBreakModel
      .find(baseFilter)
      .sort({ date: -1, startTime: 1 })
      .skip(skip)
      .limit(limit)
      .populate('employeeId', 'name')
      .lean(),
  ]);

  /* ================= Stats (IMPORTANT FIX) ================= */

  const statsAggregation = await this.customBreakModel.aggregate([
    {
      $match: {
        providerId: new Types.ObjectId(provider._id),
        ...(employeeId && {
          employeeId: new Types.ObjectId(employeeId),
        }),
      },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const statsMap = {
    pending: 0,
    approved: 0,
    rejected: 0,
    total,
  };

  statsAggregation.forEach((s) => {
    const key = s._id?.toLowerCase() as keyof typeof statsMap;
    if (key in statsMap) {
      statsMap[key] = s.count;
    }
  });

  return {
    data: breaks.map((b: any) => ({
      id: b._id,
      date: b.date,
      startTime: b.startTime,
      endTime: b.endTime,
      reason: b.reason,
      status: b.status,
      employeeId: b.employeeId?._id,
      employeeName: b.employeeId?.name,
      createdAt: b.createdAt,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    stats: statsMap,
  };
}

  /* ================= Update Break Status (Provider) ================= */

  async updateBreakStatus(
    breakId: string,
    providerUserId: string,
    status: BreakStatus,
  ) {
    const provider = await this.providerService.getByOwnerUserId(providerUserId);

    if (!provider) {
      throw new NotFoundException('common.errors.PROVIDER_NOT_FOUND');
    }

    const breakDoc = await this.customBreakModel.findById(breakId);

    if (!breakDoc) {
      throw new NotFoundException('common.errors.BREAK_REQUEST_NOT_FOUND');
    }

    // Verify the break belongs to this provider
    if (breakDoc.providerId.toString() !== provider._id.toString()) {
      throw new ForbiddenException('common.errors.CANNOT_MODIFY_BREAK_REQUEST');
    }

    // Update status
    breakDoc.status = status;
    return breakDoc.save();
  }

  /* ================= Get Employee Full Info Paginated ================= */

///////////////////////////////full info for employee by id /////////////
  async getEmployeeFullInfoPaginated(employeeId: string, page = 1, limit = 10) {
    const employee: any = await this.employeeModel
      .findById(employeeId)
      .populate('position', 'key code name')
      .populate('userId', 'email phone name')
      .lean();

    if (!employee) throw new NotFoundException('common.errors.EMPLOYEE_NOT_FOUND');

    const ratingsAgg = await this.ratingModel.aggregate([
      {
        $match: {
          employeeId: employee._id,
          type: 'employee',
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: '$employeeId',
          totalRatings: { $sum: 1 },
          averageRating: { $avg: '$rating' },
        },
      },
    ]);

    const totalRatings = ratingsAgg[0]?.totalRatings || 0;
    const averageRating = ratingsAgg[0]?.averageRating
      ? Number(ratingsAgg[0].averageRating.toFixed(1))
      : 0;

    const ratings = await this.ratingModel
      .find({ employeeId: employee._id, type: 'employee', isDeleted: false })
      .select('rating comment customerId')
      .populate('customerId', 'name avatar')
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const serviceProvider = await this.serviceProviderModel
      .findById(employee.providerId)
      .select('services')
      .lean();

    const fullServices =
      employee.services?.map((empService) => {
        let fullService;

        for (const category of serviceProvider?.services || []) {
          fullService = category.items.find(
            (item) =>
              item._id.toString() === empService.serviceItemId.toString(),
          );
          if (fullService) break;
        }

        return {
          serviceItemId: empService.serviceItemId,

          isActive: empService.isActive,
          name: fullService?.name || null,
          description: fullService?.description || null,
        };
      }) || [];

    return {
      id: employee._id,
      name: employee.name,
      email: employee.userId?.email || null,
      phone: employee.userId?.phone || null,
      position: employee.position || null,
      workfor: employee.workFor,
      isActive:employee.isActive,
      profileImage:employee.profileImage,
      services: fullServices,
      ratings: ratings.map((r) => ({
        customerId: r.customerId,
        rating: r.rating,
        comment: r.comment,
      })),
      totalRatings,
      averageRating,

      page,
      limit,
    };
  }
  async getEmployeeFullInfoProvider(
    employeeId: string,
    reqUserId: string,
    page = 1,
    limit = 10,
  ) {
    const employee: any = await this.employeeModel
      .findById(employeeId)
      .populate('position', 'key code name')
      .populate('userId', 'email phone name')
      .lean();

    if (!employee) throw new NotFoundException('common.errors.EMPLOYEE_NOT_FOUND');

    const provider = await this.serviceProviderModel
      .findById(employee.providerId)
      .select('userId services')
      .lean();

    if (!provider) throw new NotFoundException('common.errors.SERVICE_PROVIDER_NOT_FOUND');

    if (provider.userId.toString() !== reqUserId) {
      throw new ForbiddenException('common.errors.CANNOT_ACCESS_EMPLOYEE');
    }

    const ratingsAgg = await this.ratingModel.aggregate([
      { $match: { employeeId: employee._id, type: 'employee', isDeleted: false } },
      {
        $group: {
          _id: '$employeeId',
          totalRatings: { $sum: 1 },
          averageRating: { $avg: '$rating' },
        },
      },
    ]);

    const totalRatings = ratingsAgg[0]?.totalRatings || 0;
    const averageRating = ratingsAgg[0]?.averageRating
      ? Number(ratingsAgg[0].averageRating.toFixed(1))
      : 0;

    const ratingsQuery = this.ratingModel
      .find({ employeeId: employee._id, type: 'employee', isDeleted: false })
      .select('rating comment customerId')
      .populate('customerId', 'name avatar');

    if (page && limit) {
      ratingsQuery.skip((page - 1) * limit).limit(limit);
    }

    const ratings = await ratingsQuery.lean();

    const fullServices =
      employee.services?.map((empService) => {
        let fullService;
        for (const category of provider?.services || []) {
          fullService = category.items.find(
            (item) => item._id.toString() === empService.serviceItemId.toString(),
          );
          if (fullService) break;
        }

        return {
          serviceItemId: empService.serviceItemId,
          isActive: empService.isActive,
          name: fullService?.name || null,
          description: fullService?.description || null,
        };
      }) || [];

    const schedule = employee.workingHours || null;
    const capabilities = employee.capabilities || null;

    // 7️⃣ التجميع النهائي
    return {
      id: employee._id,
      name: employee.name,
      email: employee.userId?.email || null,
      phone: employee.userId?.phone || null,
      position: employee.position || null,
      workFor: employee.workFor,
      profileImage: employee.profileImage || null,
      services: fullServices,
      isActive:employee.isActive,
      ratings: ratings.map((r) => ({
        customerId: r.customerId,
        rating: r.rating,
        comment: r.comment,
      })),
      totalRatings,
      averageRating,
      schedule,
      capabilities,
      page,
      limit,
    };
  }

 async getEmployeeProfile(
    userId: string,
    
    page = 1,
    limit = 10,
  ) {
    
    const employee: any = await this.employeeModel
      .findOne({userId: new Types.ObjectId(userId) })
      .populate('position', 'key code name')
      .populate('userId', 'email phone name')
      .lean();

    if (!employee) throw new NotFoundException('common.errors.EMPLOYEE_NOT_FOUND');

    const provider = await this.serviceProviderModel
      .findById(employee.providerId)
      .select('_id userId name services')
      .lean();

    if (!provider) throw new NotFoundException('common.errors.SERVICE_PROVIDER_NOT_FOUND');

     

    const ratingsAgg = await this.ratingModel.aggregate([
      { $match: { employeeId: employee._id, type: 'employee', isDeleted: false } },
      {
        $group: {
          _id: '$employeeId',
          totalRatings: { $sum: 1 },
          averageRating: { $avg: '$rating' },
        },
      },
    ]);

    const totalRatings = ratingsAgg[0]?.totalRatings || 0;
    const averageRating = ratingsAgg[0]?.averageRating
      ? Number(ratingsAgg[0].averageRating.toFixed(1))
      : 0;

    const ratingsQuery = this.ratingModel
      .find({ employeeId: employee._id, type: 'employee', isDeleted: false })
      .select('rating comment customerId')
      .populate('customerId', 'name avatar');

    if (page && limit) {
      ratingsQuery.skip((page - 1) * limit).limit(limit);
    }

    const ratings = await ratingsQuery.lean();

    const fullServices =
      employee.services?.map((empService) => {
        let fullService;
        for (const category of provider?.services || []) {
          fullService = category.items.find(
            (item) => item._id.toString() === empService.serviceItemId.toString(),
          );
          if (fullService) break;
        }

        return {
          serviceItemId: empService.serviceItemId,
          isActive: empService.isActive,
          name: fullService?.name || null,
          description: fullService?.description || null,
        };
      }) || [];

    const schedule = employee.workingHours || null;
    const capabilities = employee.capabilities || null;

    // 7️⃣ التجميع النهائي
    return {
      id: employee._id,
      name: employee.name,
      email: employee.userId?.email || null,
      phone: employee.userId?.phone || null,
      position: employee.position || null,
      workFor: employee.workFor,
      isActive:employee.isActive,
      providerId:provider._id,
      providerName:provider.name,
      profileImage: employee.profileImage || null,
      services: fullServices,
      ratings: ratings.map((r) => ({
        customerId: r.customerId,
        rating: r.rating,
        comment: r.comment,
      })),
      totalRatings,
      averageRating,
      schedule,
      capabilities,
      page,
      limit,
    };
  }

}




