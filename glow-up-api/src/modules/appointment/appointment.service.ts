import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';

import { Appointment, AppointmentDocument } from './schemas/appointment.schema';
import {
  AppointmentServiceDto,
  CreateAppointmentDto,
} from './dto/create-appointment.dto';
import { AppointmentStatus } from './enum/appointmentstatus.enum';
import {
  ServiceProvider,
  ServiceProviderDocument,
} from '../provider/schemas/service-provider.schema';
import {
  Employee,
  EmployeeDocument,
} from '../employee/schemas/employee.schema';
import { AppointmentServiceSnapshot } from './schemas/appointment.schema';
import { Payment } from '../payment/schemas/payment.schema';
import { PaymentService } from '../payment/payment.service';
import { CreatePaymentDto } from '../payment/dto/create-payment.dto';
import { WeekDay } from 'src/common/enum/weekday.enum';
import { WorkingHours } from '../provider/schemas/working-day.schema';
import { PaymentType } from './enum/paymenttype.enum';
import { PaymentStatus } from './enum/paymentstatus.enum';
import { AppointmentBookingType } from './enum/appointmentType.enum';
import { RoleType } from '../../common/enum/roletype.enum';
import { GetAllAppointmentsAdminDto } from './dto/get-all-appointments-admin.dto';
import { CouponService } from '../coupon/coupon.service';
import { UserPackageStatus } from 'src/common/enum/userpackegestatus.enum';
import {
  UserPackage,
  UserPackageDocument,
} from '../userPackage/schemas/user-package.schema';
import { WalletService } from 'src/modules/wallet/wallet.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';
import { ProviderCreateAppointmentDto } from './dto/provider-create-appointment.dto';
import { types } from 'util';
import { ProviderStatus } from 'src/common/enum/providerstatus.enum';
import { PaymentTransactionsService } from '../PaymentTransaction/PaymentTransaction.service';
import { ProviderSubscription } from '../subscription/schemas/provider-subscription.schema';

import { appointmentStrategy } from 'src/common/enum/appointment-approve-strategy.enum';
import { PaymentTransactionStatus } from 'src/common/enum/PaymentTransactionStatus.enum';
import { SubscripionStatus } from 'src/common/enum/subscriptionStatus.enum';
@Injectable()
export class AppointmentService {
  constructor(
    @InjectModel(Appointment.name)
    private readonly appointmentModel: Model<AppointmentDocument>,
    @InjectModel(ServiceProvider.name)
    private readonly providerModel: Model<ServiceProviderDocument>,
    @InjectModel(Employee.name)
    private readonly employeeModel: Model<EmployeeDocument>,
    @InjectModel(ServiceProvider.name)
    private readonly serviceProviderModel: Model<ServiceProviderDocument>,
    private readonly notificationsService: NotificationsService,

    private readonly paymentService: PaymentService,

    private readonly couponService: CouponService,
    @InjectModel(UserPackage.name)
    private readonly userPackageModel: Model<UserPackageDocument>,
    private walletService: WalletService,
    @InjectConnection() private readonly connection: Connection,
    private readonly paymentTransactionsService: PaymentTransactionsService,
    @InjectModel(ProviderSubscription.name)
    private readonly subscriptionModel: Model<ProviderSubscription>,
  ) { }

  /* =====================================================
      Create Appointment with conflict prevention
      ===================================================== */
  async createAppointment(
    customerId: string | undefined,
    dto: CreateAppointmentDto,
  ) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      /* ================= Load Provider ================= */
      const provider = await this.providerModel
        .findById(dto.providerId)
        .session(session);
      if (!provider)
        throw new NotFoundException('common.errors.PROVIDER_NOT_FOUND');

      /* ================= Validate Provider Status ================= */
      if (provider.status !== ProviderStatus.APPROVED)
        throw new BadRequestException('common.errors.PROVIDER_NOT_APPROVED');

      /* ================= Load Provider Employees ================= */
      const providerEmployees = await this.employeeModel
        .find({
          providerId: provider._id,
        })
        .session(session);

      /* ================= L0doad Active User Packages ================= */
      const activeUserPackages = await this.userPackageModel
        .find({
          userId: customerId,
          providerId: provider._id.toString(),
          status: UserPackageStatus.ACTIVE,
        })
        .session(session)
        .exec();

      /* ================= Build Service Definitions Map ================= */
      const serviceMap = this.buildProviderServiceMap(provider);


      /* ================= Process Services ================= */
      const servicesSnapshot: AppointmentServiceSnapshot[] = [];
      let totalDurationMinutes = 0;
      let servicesTotal = 0;
      let totalDiscount = 0;

      for (const serviceDto of dto.services) {
        if (customerId) {
          await this.ensureCustomerNoExternalConflict(customerId, serviceDto);
        }

        const serviceDef = serviceMap.get(serviceDto.serviceItemId);
        if (!serviceDef)
          throw new BadRequestException({
            message: 'common.errors.SERVICE_NOT_FOUND',
            args: { serviceItemId: serviceDto.serviceItemId },
          });

        const startStr = serviceDto.timeSlot.start;
        const [hours, minutes] = startStr.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes + serviceDef.durationMinutes * (serviceDto.numberOfCustomers || 1);
        const calculatedEnd = `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
        serviceDto.timeSlot.end = calculatedEnd;

        /* ===== Assign Employee ===== */
        const assignedEmployee = await this.assignEmployeeForService(
          provider,
          providerEmployees,
          serviceDef,
          serviceDto,
        );

        /* ===== Initialize Snapshot ===== */
        const snapshot: AppointmentServiceSnapshot = {
          serviceItemId: serviceDef._id,
          employeeId: assignedEmployee?._id,
          date: new Date(serviceDto.date),
          anyEmployee: serviceDto.anyEmployee ?? false,
          numberOfCustomers: serviceDto.numberOfCustomers,
          timeSlot: {
            start: startStr,
            end: calculatedEnd,
          },
          name: serviceDef.name,
          price: serviceDef.price,
          durationMinutes: serviceDef.durationMinutes,

          usedUserPackageId: undefined,
          packageDiscountApplied: 0,
        };

        /* ===== Apply User Package Only If Explicitly Requested ===== */
        if (serviceDto.userPackageId) {
          const selectedPackage = activeUserPackages.find(
            (p) => p._id.toString() === serviceDto.userPackageId,
          );

          if (!selectedPackage)
            throw new BadRequestException('common.errors.PACKAGE_FULLY_USED');

          const itemInPackage = selectedPackage.items.find(
            (i) => i.serviceItemId.toString() === serviceDto.serviceItemId,
          );

          if (!itemInPackage)
            throw new BadRequestException(
              'common.errors.SERVICE_NOT_PART_OF_PACKAGE',
            );

          if (itemInPackage.remaining <= 0)
            throw new BadRequestException(
              'common.errors.PACKAGE_USED_UP_FOR_SERVICE',
            );

          itemInPackage.remaining -= 1;

          selectedPackage.markModified('items');

          if (selectedPackage.items.every((i) => i.remaining <= 0))
            selectedPackage.status = UserPackageStatus.USED_UP;

          snapshot.usedUserPackageId = selectedPackage._id;
          snapshot.packageDiscountApplied = serviceDef.price;

          await selectedPackage.save({ session });
        }

        servicesSnapshot.push(snapshot);

        totalDurationMinutes +=
          serviceDef.durationMinutes * (serviceDto.numberOfCustomers || 1);
        const servicePriceTotal =
          serviceDef.price * (serviceDto.numberOfCustomers || 1);

        servicesTotal += servicePriceTotal;
        totalDiscount += snapshot.packageDiscountApplied ?? 0;
      }
      this.validateInternalConflicts(dto.services);

      /* ================= Resolve Appointment Status From Provider Strategy ================= */
      const appointmentStatus =
        provider.appointmentStrategy === appointmentStrategy.NEED_APPROVAL
          ? AppointmentStatus.PENDING
          : AppointmentStatus.CONFIRMED;
      /* ================= Save Appointment ================= */
      const appointmentData: any = {
        providerId: provider._id,
        services: servicesSnapshot,
        totalDurationMinutes,
        price: {
          servicesTotal,
          discount: totalDiscount,
          finalTotal: Math.max(servicesTotal - totalDiscount, 0),
        },
        status: appointmentStatus,
        bookingType: dto.bookingType ?? AppointmentBookingType.SELF,
      };

      if (customerId) {
        appointmentData.customerId = new Types.ObjectId(customerId);
        appointmentData.isExternalCustomer = false;
      } else {
        appointmentData.isExternalCustomer = true;
        appointmentData.externalCustomerName = dto.externalName;
        appointmentData.externalCustomerPhone = dto.externalPhone;
      }

      const appointment = await this.appointmentModel.create(
        [appointmentData],
        { session },
      );

      /* ================= Apply Coupon ================= */
      let discountAmount = 0;

      if (customerId && dto.couponCode) {
        const coupon = await this.couponService.getByCode(
          dto.couponCode,
          customerId,
          provider._id.toString(),
          session,
        );
        if (!coupon)
          throw new NotFoundException('common.errors.COUPON_NOT_FOUND');

        const availableAmount = coupon.totalPrice - (coupon.usedPrice || 0);

        const appliedCoupon = await this.couponService.useCoupon(
          dto.providerId,
          customerId,
          dto.couponCode,
          {
            appointmentId: appointment[0]._id.toString(),
            usedAmount: Math.min(availableAmount, servicesTotal),
            usedAt: new Date(),
          },
          session,
        );

        discountAmount = appliedCoupon.usedAmount;

        appointment[0].price.discount = discountAmount;
        appointment[0].price.finalTotal = Math.max(
          servicesTotal - discountAmount,
          0,
        );
        appointment[0].couponCode = dto.couponCode;

        await appointment[0].save({ session });
      }


      /* ================= Payment Integration ================= */

      const finalAmount = appointment[0].price.finalTotal;

      let payment: any = null;
      let paymentStatus = PaymentStatus.PENDING;

      if (finalAmount === 0) {
        paymentStatus = PaymentStatus.PAID;
      }

      // 💳 إذا Wallet → خصم مباشر
      if (customerId && dto.paymentMethod === PaymentType.WALLET) {
        await this.walletService.deductCredit(
          customerId,
          {
            amount: finalAmount,
            description: `Appointment payment ${appointment[0]._id}`,
          },
          session,
        );

        paymentStatus = PaymentStatus.PAID;
      }

      if (customerId && finalAmount > 0) {
        payment = await this.paymentService.create(
          {
            customerId,
            appointmentId: appointment[0]._id.toString(),
            providerId: dto.providerId,
            items: servicesSnapshot
              .filter((s) => !s.usedUserPackageId)
              .map((s) => ({
                serviceId: s.serviceItemId?.toString() ?? '',
                name: s.name,
                price: s.price,
                quantity: s.numberOfCustomers,
                durationMinutes: s.durationMinutes,
              })),
            amount: {
              subtotal: servicesTotal,
              discount: totalDiscount + discountAmount,
              tax: 0,
              total: finalAmount,
            },
            method: dto.paymentMethod,
            status: paymentStatus,
          },
          session,
        );
      }
      /* ================= CREATE PAYMENT TRANSACTION ================= */

      if (customerId) {
        const subscription = await this.subscriptionModel
          .findOne({
            providerId: provider._id,
            status: 'ACTIVE',
          })
          .populate('planId')
          .session(session);


        if (!subscription) {
          throw new BadRequestException('common.errors.NO_ACTIVE_SUBSCRIPTION');
        }

        const plan: any = subscription.planId;

        const hasCommissionModel =
          plan?.commissionPercent !== undefined &&
          plan?.commissionPercent !== null;

        if (hasCommissionModel) {
          await this.paymentTransactionsService.createTransaction(
            {
              appointmentId: new Types.ObjectId(appointment[0]._id),
              paymentId: payment?._id
                ? new Types.ObjectId(payment._id)
                : undefined,
              providerId: provider._id,
              totalAmount: servicesTotal,
              paidAmount: finalAmount,
              commissionPercent: plan.commissionPercent,


              paymentSource: finalAmount === 0
                ? PaymentType.PACKAGE
                : dto.paymentMethod ?? 'UNKNOWN',
            },
            session,
          );
        }
      }

      /* ================= SEND NOTIFICATION ================= */
      try {
        const firstService = servicesSnapshot[0];
        const dateStr = firstService.date.toLocaleDateString('en-GB');
        const startTime = firstService.timeSlot.start;
        const endTime = firstService.timeSlot.end;

        /* ================= Update User Packages Remaining ================= */
        for (const pkg of activeUserPackages) {
          await pkg.save({ session });
        }
        await this.notificationsService.create({
          userId: provider.userId.toString(),
          title: {
            ar: 'حجز جديد 📅',
            en: 'New Appointment 📅',
          },
          message: {
            ar: `لديك حجز جديد بتاريخ ${dateStr} من الساعة ${startTime} إلى ${endTime}`,
            en: `You have a new appointment on ${dateStr} from ${startTime} to ${endTime}`,
          },
          type: NotificationType.APPOINTMENT,
          relatedEntityId: appointment[0]._id.toString(),
          link_to: `admin-dashboard/orders`,
          data: {
            appointmentId: appointment[0]._id.toString(),
            totalPrice: appointment[0].price.finalTotal,
          },
        });
      } catch (error) {
        console.error('Notification failed but appointment created:', error);
      }

      /* ================= Commit Transaction ================= */
      await session.commitTransaction();
      session.endSession();

      return appointment[0];
    } catch (error) {
      /* ================= Abort on Error ================= */
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  private validateInternalConflicts(services: CreateAppointmentDto['services']) {
    for (let i = 0; i < services.length; i++) {
      const a = services[i];

      if (a.timeSlot.start >= a.timeSlot.end) {
        throw new BadRequestException({
          message: 'common.errors.INVALID_TIME_SLOT',

        });
      }

      for (let j = i + 1; j < services.length; j++) {
        const b = services[j];

        if (a.date !== b.date) continue;

        const isOverlap =
          a.timeSlot.start < b.timeSlot.end &&
          a.timeSlot.end > b.timeSlot.start;

        if (isOverlap) {
          throw new BadRequestException('common.errors.CUSTOMER_OVERLAPPING_SERVICES');
        }
      }
    }
  }

  private async assignEmployeeForService(
    provider: any,
    employees: EmployeeDocument[],
    serviceDef: any,
    serviceDto: AppointmentServiceDto,
  ): Promise<EmployeeDocument | null> {
    /* ===== CASE 1: Specific Employee ===== */
    if (serviceDto.employeeId) {
      const employee = employees.find(
        (e) => e._id.toString() === serviceDto.employeeId,
      );

      if (!employee)
        throw new BadRequestException(
          'common.errors.EMPLOYEE_NOT_PART_OF_PROVIDER',
        );

      this.validateEmployeeSupportsService(employee, serviceDef._id);

      await this.validateWorkingHours(provider, employee, serviceDto);

      await this.ensureNoExternalConflict(provider, employee, serviceDto);

      return employee;
    }

    /* ===== CASE 2: Any Employee ===== */

    const candidates: EmployeeDocument[] = [];

    for (const employee of employees) {
      try {
        this.validateEmployeeSupportsService(employee, serviceDef._id);

        await this.validateWorkingHours(provider, employee, serviceDto);

        await this.ensureNoExternalConflict(provider, employee, serviceDto);

        candidates.push(employee);
      } catch {
        continue;
      }
    }

    if (!candidates.length)
      throw new BadRequestException(
        'common.errors.NO_AVAILABLE_EMPLOYEE_FOR_THIS_SERVICE_TIME',
      );

    return candidates[0];
  }
  private validateEmployeeSupportsService(employee, serviceItemId) {
    const supportsService = employee.services.some(
      (s) => s.serviceItemId.toString() === serviceItemId.toString(),
    );

    if (!supportsService)
      throw new BadRequestException(
        'common.errors.EMPLOYEE_DOES_NOT_SUPPORT_SERVICE',
      );
  }

  private async validateWorkingHours(provider, employee, serviceDto) {
    const scheduleSource = employee?.workingHours ?? provider.workingHours;

    if (!scheduleSource)
      throw new BadRequestException(
        'common.errors.WORKING_HOURS_NOT_CONFIGURED',
      );

    this.validateTimeSlot(
      new Date(serviceDto.date),
      serviceDto.timeSlot.start,
      serviceDto.timeSlot.end,
      scheduleSource,
    );
  }
  private async ensureNoExternalConflict(provider, employee, serviceDto) {
    const conflict = await this.appointmentModel.findOne({
      providerId: provider._id,
      status: {
        $in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
      },
      services: {
        $elemMatch: {
          employeeId: employee._id,
          date: new Date(serviceDto.date),
          'timeSlot.start': { $lt: serviceDto.timeSlot.end },
          'timeSlot.end': { $gt: serviceDto.timeSlot.start },
        },
      },
    });

    if (conflict)
      throw new BadRequestException(
        'common.errors.EMPLOYEE_ALREADY_BOOKED_IN_THIS_TIME',
      );
  }
  private buildProviderServiceMap(provider: any) {
    const map = new Map();

    for (const category of provider.services || []) {
      for (const item of category.items || []) {
        if (item.isActive) map.set(item._id.toString(), item);
      }
    }

    return map;
  }
  private async ensureCustomerNoExternalConflict(
    customerId: string | undefined,
    serviceDto: AppointmentServiceDto,
    appointmentIdToExclude?: string,
  ) {
    if (!customerId) return;

    const conflict = await this.appointmentModel.findOne({
      customerId: new Types.ObjectId(customerId),
      _id: {
        $ne: appointmentIdToExclude
          ? new Types.ObjectId(appointmentIdToExclude)
          : undefined,
      },
      status: {
        $in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
      },
      services: {
        $elemMatch: {
          date: new Date(serviceDto.date),
          'timeSlot.start': { $lt: serviceDto.timeSlot.end },
          'timeSlot.end': { $gt: serviceDto.timeSlot.start },
        },
      },
    });

    if (conflict)
      throw new BadRequestException(
        'common.errors.CUSTOMER_ALREADY_HAS_APPOINTMENT_AT_THIS_TIME',
      );
  }

  /* ================= Get My Appointments(Customer) ================= */
  async getCustomerAppointments(
    customerId: string,
    status?: AppointmentStatus,
  ) {
    const filter: any = { customerId: new Types.ObjectId(customerId) };
    if (status) filter.status = status;

    const appointments = await this.appointmentModel
      .find(filter)
      .sort({ date: -1 })
      .populate({ path: 'customerId', select: 'name' })
      .populate({ path: 'providerId', select: 'name services' })
      .populate({
        path: 'services.employeeId',
        select: 'name',
        model: 'Employee',
      })
      .lean();

    return appointments.map((a: any) => {
      const providerServices = a.providerId.services || [];

      return {
        id: a._id,
        providerName: a.providerId.name,
        customerName: a.customerId?.name,
        totalDurationMinutes: a.totalDurationMinutes,
        services: a.services.map((s: any) => {
          const serviceFromProvider = providerServices
            .flatMap((cat) => cat.items)
            .find((i) => i._id.toString() === s.serviceItemId.toString());

          return {
            itemId: s._id,
            serviceItemId: s.serviceItemId,
            name: serviceFromProvider?.name || '',
            employeeId: s.employeeId,
            numberOfCustomers: s.numberOfCustomers,
            anyEmployee: s.anyEmployee,
            date: s.date,
            timeSlot: s.timeSlot,
            price: s.price,
            durationMinutes: s.durationMinutes,
          };
        }),
        price: a.price,
        status: a.status,
        cancellation: a.cancellation,
        source: a.source,
        customerNote: a.customerNote,
      };
    });
  }
  /* ================= Provider Appointments (Provider) ================= */
  async getProviderAppointments(
    providerUserId: string,
    status?: AppointmentStatus,
    skip: number = 0,
    limit: number = 10,
  ) {
    const provider = await this.providerModel.findOne({
      userId: new Types.ObjectId(providerUserId),
    });
    if (!provider)
      throw new NotFoundException('common.errors.SERVICE_PROVIDER_NOT_FOUND');

    const filter: any = {
      providerId: provider._id,
    };

    if (status) {
      filter.status = status;
    }

    const total = await this.appointmentModel.countDocuments(filter);

    const appointments = await this.appointmentModel
      .find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: 'customerId', select: 'name' })
      .populate({ path: 'services.employeeId', select: 'name' })
      .lean();

    const data = appointments.map((a: any) => ({
      appointmentId: a._id,
      customerName: a.customerId?.name,
      employeeName: a.employeeId?.name,
      date: a.date,
      timeSlot: a.timeSlot,
      totalDurationMinutes: a.totalDurationMinutes,
      services: a.services,
      price: a.price,
      status: a.status,
      cancellation: a.cancellation,
      source: a.source,
      customerNote: a.customerNote,
    }));
    return {
      data,
      page: Math.floor(skip / limit) + 1,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  /* ================= Employee Appointments (Employee) ================= */
  async getEmployeeAppointments(
    userId: string,
    status?: AppointmentStatus,
    skip: number = 0,
    limit: number = 20,
  ) {
    const employee = await this.employeeModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!employee)
      throw new NotFoundException('common.errors.EMPLOYEE_NOT_FOUND');

    if (!employee?.capabilities?.canViewOwnBookings) {
      throw new ForbiddenException('common.errors.APPOINTMENTS_ACCESS_DENIED');
    }

    const match: any = {
      providerId: employee.providerId,
      'services.employeeId': employee._id,
    };

    if (status) {
      match.status = status;
    }
    const totalAgg = await this.appointmentModel.aggregate([
      { $match: match },
      { $unwind: '$services' },
      { $match: { 'services.employeeId': employee._id } },
      { $count: 'total' },
    ]);
    const total = totalAgg[0]?.total || 0;

    const appointments = await this.appointmentModel.aggregate([
      { $match: match },

      // unwind services
      { $unwind: '$services' },

      // filter only this employee services
      {
        $match: {
          'services.employeeId': employee._id,
        },
      },

      // lookup customer
      {
        $lookup: {
          from: 'users',
          localField: 'customerId',
          foreignField: '_id',
          as: 'customer',
        },
      },
      { $unwind: '$customer' },

      // project clean result
      {
        $project: {
          appointmentId: '$_id',
          customerName: '$customer.name',
          date: '$services.date',
          timeSlot: '$services.timeSlot',
          totalDurationMinutes: '$services.durationMinutes',
          serviceName: '$services.name',
          price: '$price',
          status: 1,
          source: 1,
          createdAt: 1,
        },
      },

      { $sort: { date: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    return {
      data: appointments,
      page: Math.floor(skip / limit) + 1,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  /* ================= Update Appointment Status (Provider) ================= */
  async updateAppointmentStatus(
    providerId: string,
    userRole: string,
    appointmentId: string,
    status: AppointmentStatus,
  ) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // ===== Fetch appointment =====
      const appointment = await this.appointmentModel.findById(appointmentId).session(session);
      if (!appointment)
        throw new BadRequestException('common.errors.APPOINTMENT_NOT_FOUND');

      // ===== Verify service provider =====
      const serviceProvider = await this.serviceProviderModel.findOne({
        userId: new Types.ObjectId(providerId),
      })
        .session(session);

      if (!serviceProvider) {
        throw new BadRequestException('common.errors.SERVICE_PROVIDER_NOT_FOUND');
      }

      if (appointment.providerId.toString() !== serviceProvider._id.toString()) {
        throw new BadRequestException('common.errors.UNAUTHORIZED');
      }

      if (appointment.status === AppointmentStatus.COMPLETED) {
        throw new BadRequestException('common.errors.APPOINTMENT_ALREADY_COMPLETED');
      }

      if (status === AppointmentStatus.COMPLETED && appointment.status !== AppointmentStatus.CONFIRMED) {
        throw new BadRequestException('common.errors.APPOINTMENT_NOT_CONFIRMED');
      }
      //Only CONFIRMED appointments can be marked as completed

      if (
        status === AppointmentStatus.CANCELLED &&
        ![AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING].includes(appointment.status)
      ) {
        throw new BadRequestException('appointments.errors.CANCEL_ONLY_CONFIRMED_OR_PENDING');
      }

      appointment.status = status;

      if (status === AppointmentStatus.COMPLETED) {
        appointment.completedBy = new Types.ObjectId(providerId);
        appointment.completedAt = new Date();
      }

      if (status === AppointmentStatus.CANCELLED) {
        appointment.cancellation = {
          cancelledBy: userRole,
          cancelledAt: new Date(),
        };

        /* ========= RESTORE PACKAGES ========= */

        const servicesWithPackages = appointment.services.filter(
          (s): s is typeof s & {
            usedUserPackageId: Types.ObjectId;
            serviceItemId: Types.ObjectId;
          } => !!s.usedUserPackageId && !!s.serviceItemId,
        );

        const packageMap = new Map<string, any>();

        for (const service of servicesWithPackages) {
          const packageId = service.usedUserPackageId.toString();

          if (!packageMap.has(packageId)) {
            const pkg = await this.userPackageModel
              .findById(packageId)
              .session(session);

            if (!pkg) continue;

            packageMap.set(packageId, pkg);
          }

          const pkg = packageMap.get(packageId);

          const item = pkg.items.find(
            (i) =>
              i.serviceItemId.toString() ===
              service.serviceItemId.toString(),
          );

          if (item) {
            item.remaining += 1;
          }
        }

        for (const pkg of packageMap.values()) {
          pkg.markModified('items');

          const hasRemaining = pkg.items.some((i) => i.remaining > 0);

          if (hasRemaining && pkg.status === UserPackageStatus.USED_UP) {
            pkg.status = UserPackageStatus.ACTIVE;
          }

          await pkg.save({ session });
        }
        if ((appointment.price?.discount ?? 0) > 0) {
          await this.couponService.refundCouponUsage(
            appointment._id.toString(),
            session,
          );
        }
      }

      /* ================= Save appointment ================= */
      const savedAppointment = await appointment.save({ session });

      /* ================= UPDATE PAYMENT TRANSACTION ================= */

      if (status === AppointmentStatus.COMPLETED) {
        await this.paymentTransactionsService.updateStatusByAppointment(
          appointmentId,
          PaymentTransactionStatus.COMPLETED,
          session,
        );
      }

      if (status === AppointmentStatus.CANCELLED) {
        await this.paymentTransactionsService.updateStatusByAppointment(
          appointmentId,
          PaymentTransactionStatus.CANCELLED,
          session,
        );
      }

      /* ================= Commit ================= */
      await session.commitTransaction();
      session.endSession();

      return savedAppointment;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  // // /* ================= Update Appointment (Customer)  ================= */
  async updateAppointment(
    customerId: string,
    appointmentId: string,
    dto: Partial<CreateAppointmentDto>,
  ) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const appointment = await this.appointmentModel
        .findById(appointmentId)
        .session(session);
      if (!appointment)
        throw new BadRequestException('common.errors.APPOINTMENT_NOT_FOUND');
      //
      if (appointment?.customerId?.toString() !== customerId) {
        throw new BadRequestException('common.errors.UNAUTHORIZED');
      }

      if (appointment.status !== AppointmentStatus.CONFIRMED) {
        throw new BadRequestException(
          'common.errors.ONLY_CONFIRMED_CAN_BE_MODIFIED',
        );
      }

      if (dto.services) {
        const provider = await this.providerModel
          .findById(appointment.providerId)
          .session(session);
        if (!provider)
          throw new BadRequestException('common.errors.PROVIDER_NOT_FOUND');

        const providerEmployees = await this.employeeModel
          .find({ providerId: provider._id })
          .session(session);
        const serviceMap = this.buildProviderServiceMap(provider);

        for (let i = 0; i < dto.services.length; i++) {
          const updatedService = dto.services[i];
          let currentService = appointment.services[i];

          if (!currentService) {
            throw new BadRequestException({
              message: 'common.errors.SERVICE_NOT_FOUND_IN_APPOINTMENT',
              args: { index: i },
            });
          }

          const serviceDef = serviceMap.get(updatedService.serviceItemId);
          if (!serviceDef) {
            throw new BadRequestException({
              message: 'common.errors.SERVICE_NOT_FOUND',
              args: { serviceItemId: updatedService.serviceItemId },
            });
          }
          let assignedEmployee: EmployeeDocument | null = null;

          if (updatedService.employeeId) {
            const emp = providerEmployees.find(
              (e) => e._id.toString() === updatedService.employeeId,
            );
            if (!emp)
              throw new BadRequestException(
                'common.errors.EMPLOYEE_NOT_FOUND_IN_PROVIDER',
              );
            this.validateEmployeeSupportsService(emp, serviceDef._id);
            await this.validateWorkingHours(provider, emp, updatedService);
            await this.ensureNoExternalConflict(provider, emp, updatedService);
            assignedEmployee = emp;
          } else if (updatedService.anyEmployee) {
            const candidates: EmployeeDocument[] = [];
            for (const emp of providerEmployees) {
              try {
                this.validateEmployeeSupportsService(emp, serviceDef._id);
                await this.validateWorkingHours(provider, emp, updatedService);
                await this.ensureNoExternalConflict(
                  provider,
                  emp,
                  updatedService,
                );
                candidates.push(emp);
              } catch {
                continue;
              }
            }
            if (!candidates.length)
              throw new BadRequestException(
                'common.errors.NO_AVAILABLE_EMPLOYEE_FOR_THIS_SERVICE_TIME',
              );
            assignedEmployee = candidates[0];
          }

          await this.ensureCustomerNoExternalConflict(
            customerId,
            updatedService,
            appointment._id.toString(),
          );
          currentService.serviceItemId = serviceDef._id;
          currentService.name = serviceDef.type;
          currentService.price = serviceDef.price;
          currentService.durationMinutes = serviceDef.durationMinutes;
          currentService.date = updatedService.date
            ? new Date(updatedService.date)
            : currentService.date;
          currentService.timeSlot =
            updatedService.timeSlot || currentService.timeSlot;
          currentService.employeeId =
            assignedEmployee?._id || currentService.employeeId;
          currentService.numberOfCustomers =
            updatedService.numberOfCustomers ||
            currentService.numberOfCustomers;
          currentService.anyEmployee =
            updatedService.anyEmployee ?? currentService.anyEmployee;
          currentService.usedUserPackageId = updatedService.userPackageId
            ? new Types.ObjectId(updatedService.userPackageId)
            : currentService.usedUserPackageId;
        }
        appointment.totalDurationMinutes = appointment.services.reduce(
          (sum, s) => sum + s.durationMinutes * (s.numberOfCustomers || 1),
          0,
        );
        const servicesTotal = appointment.services.reduce(
          (sum, s) => sum + s.price * (s.numberOfCustomers || 1),
          0,
        );
        appointment.price.servicesTotal = servicesTotal;
        appointment.price.finalTotal =
          servicesTotal - (appointment.price.discount || 0);
      }

      // 6️⃣ حفظ الحجز
      const savedAppointment = await appointment.save({ session });
      await session.commitTransaction();
      session.endSession();

      return savedAppointment;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  } /* =====================================================
      Cancel Appointment
      ===================================================== */
  async cancelAppointment(
    customerId: string,
    appointmentId: string,
    reason?: string,
  ) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const appointment = await this.appointmentModel
        .findById(appointmentId)
        .session(session)
        .exec();
      if (!appointment)
        throw new BadRequestException('common.errors.APPOINTMENT_NOT_FOUND');

      if (
        appointment.status === AppointmentStatus.COMPLETED ||
        appointment.status === AppointmentStatus.CANCELLED
      )
        throw new BadRequestException('common.errors.CANNOT_CANCEL_COMPLETED_APPOINTMENT');

      appointment.status = AppointmentStatus.CANCELLED;
      appointment.cancellation = {
        cancelledBy: 'CUSTOMER',
        reason,
        cancelledAt: new Date(),
      };
      await appointment.save({ session });

      await this.paymentTransactionsService.updateStatusByAppointment(
        appointmentId,
        PaymentTransactionStatus.CANCELLED,
        session,
      );

      if (appointment.couponCode) {
        await this.couponService.refundCouponUsage(
          appointment._id.toString(),
          session,
        );
      }

      const servicesWithPackages = appointment.services.filter(
        (s): s is typeof s & {
          usedUserPackageId: Types.ObjectId;
          serviceItemId: Types.ObjectId;
        } => !!s.usedUserPackageId && !!s.serviceItemId,
      );

      const packageMap = new Map<string, any>();

      for (const service of servicesWithPackages) {
        const packageId = service.usedUserPackageId.toString();

        if (!packageMap.has(packageId)) {
          const pkg = await this.userPackageModel
            .findById(packageId)
            .session(session);

          if (!pkg) continue;

          packageMap.set(packageId, pkg);
        }

        const pkg = packageMap.get(packageId);

        const item = pkg.items.find(
          (i) => i.serviceItemId.toString() === service.serviceItemId.toString(),
        );

        if (item) {
          item.remaining += 1;
        }
      }

      for (const pkg of packageMap.values()) {
        pkg.markModified('items');

        const hasRemaining = pkg.items.some((i) => i.remaining > 0);

        if (hasRemaining && pkg.status === UserPackageStatus.USED_UP) {
          pkg.status = UserPackageStatus.ACTIVE;
        }

        await pkg.save({ session });
      }

      await session.commitTransaction();
      session.endSession();

      return appointment;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  /* =====================================================
     Helper: Validate Time Slot Logic
     ===================================================== */
  private validateTimeSlot(
    date: Date,
    start: string,
    end: string,
    schedule: WorkingHours,
  ) {
    // 1. Check Exceptions first
    const dateString = date.toISOString().split('T')[0];

    const exception = schedule.exceptions?.find((e) => {
      const exDate = new Date(e.date).toISOString().split('T')[0];
      return exDate === dateString;
    });

    if (exception) {
      if (!exception.isOpen) {
        throw new BadRequestException({
          message: 'common.errors.CLOSED_ON_THIS_DATE',
          args: { reason: exception.reason || 'Special Holiday' },
        });
      }

      if (!exception.openTime || !exception.closeTime) {
        throw new BadRequestException(
          'common.errors.SPECIAL_OPERATING_HOURS_NOT_DEFINED',
        );
      }

      if (start < exception.openTime || end > exception.closeTime) {
        throw new BadRequestException({
          message: 'common.errors.TIME_OUTSIDE_SPECIAL_OPERATING_HOURS',
          args: {
            openTime: exception.openTime,
            closeTime: exception.closeTime,
          },
        });
      }
      return;
    }

    // 2. Check Weekly Schedule
    const days = [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ];
    const dayName = days[date.getDay()] as WeekDay;

    const shift = schedule.weekly.find((d) => d.day === dayName);

    if (!shift || !shift.isOpen) {
      throw new BadRequestException({
        message: 'common.errors.BUSINESS_CLOSED_ON_DAY',
        args: { dayName },
      });
    }

    if (!shift.openTime || !shift.closeTime) {
      throw new BadRequestException({
        message: 'common.errors.WORKING_HOURS_NOT_DEFINED_FOR_DAY',
        args: { dayName },
      });
    }

    if (start < shift.openTime || end > shift.closeTime) {
      throw new BadRequestException({
        message: 'common.errors.TIME_OUTSIDE_WORKING_HOURS',
        args: { dayName, openTime: shift.openTime, closeTime: shift.closeTime },
      });
    }
  }

  ////////////////////// get by appoitment id ////////////////////
  async getAppointmentById(
    userId: string,
    appointmentId: string,
    role: RoleType,
  ) {
    const appointment = await this.appointmentModel
      .findById(appointmentId)
      .populate({ path: 'customerId', select: 'name' })
      .populate({ path: 'providerId' })
      .populate({
        path: 'services.employeeId',
        select: 'name',
        model: 'Employee',
      });

    if (!appointment)
      throw new NotFoundException('common.errors.APPOINTMENT_NOT_FOUND');

    if (role === RoleType.CUSTOMER) {
      if (!appointment.customerId) {
        throw new BadRequestException('common.errors.UNAUTHORIZED');
      }

      if (appointment.customerId._id.toString() !== userId) {
        throw new BadRequestException('common.errors.UNAUTHORIZED');
      }
    }

    if (role === RoleType.PROVIDER) {
      const provider = await this.providerModel.findOne({
        userId: new Types.ObjectId(userId),
      });
      if (!provider)
        throw new BadRequestException(
          'common.errors.SERVICE_PROVIDER_NOT_FOUND',
        );
      if (appointment.providerId._id.toString() !== provider._id.toString()) {
        throw new BadRequestException('common.errors.UNAUTHORIZED');
      }
    }
    const customer = appointment.customerId as any;
    const provider = appointment.providerId as any;
    const providerServices = provider.services || [];
    const services = appointment.services.map((s: any) => {
      const serviceFromProvider = providerServices
        .flatMap((cat: any) => cat.items)
        .find((i: any) => i._id.toString() === s.serviceItemId.toString());

      return {
        itemId: s._id,
        serviceItemId: s.serviceItemId,
        name: serviceFromProvider?.name || '',
        employeeId: s.employeeId,
        numberOfCustomers: s.numberOfCustomers,
        anyEmployee: s.anyEmployee,
        date: s.date,
        timeSlot: s.timeSlot,
        price: s.price,
        durationMinutes: s.durationMinutes,
      };
    });

    return {
      provider,
      customerName: customer?.name,
      totalDurationMinutes: appointment.totalDurationMinutes,
      services,
      price: appointment.price,
      status: appointment.status,
      cancellation: appointment.cancellation,
      source: appointment.source,
      customerNote: appointment.customerNote,
    };
  }
  async getAllAppointmentsSuperAdmin(query: GetAllAppointmentsAdminDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.status) filter.status = query.status;
    if (query.providerId)
      filter.providerId = new Types.ObjectId(query.providerId);
    if (query.customerId)
      filter.customerId = new Types.ObjectId(query.customerId);
    if (query.dateFrom || query.dateTo) {
      filter['services.date'] = {};
      if (query.dateFrom)
        filter['services.date'].$gte = new Date(query.dateFrom);
      if (query.dateTo) filter['services.date'].$lte = new Date(query.dateTo);
    }

    let appointments = await this.appointmentModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: 'customerId', select: 'name' })
      .populate({ path: 'providerId', select: 'name' })
      .populate({
        path: 'services.employeeId',
        model: 'Employee',
        select: 'name',
      })
      .lean();

    if (query.customerName) {
      const nameRegex = new RegExp(query.customerName, 'i');
      appointments = appointments.filter((a) =>
        (a.customerId as any)?.name?.match(nameRegex),
      );
    }

    if (query.providerName) {
      const nameRegex = new RegExp(query.providerName, 'i');
      appointments = appointments.filter((a) =>
        (a.providerId as any)?.name?.match(nameRegex),
      );
    }

    const total = appointments.length;

    const [approvedCount, completedCount, cancelledCount] = await Promise.all([
      this.appointmentModel.countDocuments({ ...filter, status: 'CONFIRMED' }),
      this.appointmentModel.countDocuments({ ...filter, status: 'COMPLETED' }),
      this.appointmentModel.countDocuments({ ...filter, status: 'CANCELLED' }),
    ]);

    const formattedAppointments = appointments.map((a) => {
      const servicesWithEmployeeName = a.services.map((s: any) => ({
        ...s,
        employeeName: s.employeeId?.name || 'N/A',
      }));

      return {
        ...a,
        services: servicesWithEmployeeName,
      };
    });

    return {
      totalPages: Math.ceil(total / limit),
      data: formattedAppointments,
      stats: {
        approved: approvedCount,
        completed: completedCount,
        cancelled: cancelledCount,
      },
      total,
      page,
      limit,
    };
  }

  async createAppointmentByProvider(
    providerUserId: string,
    dto: ProviderCreateAppointmentDto,
  ) {
    const provider = await this.providerModel.findOne({
      userId: new Types.ObjectId(providerUserId),
    });

    if (!provider)
      throw new NotFoundException('common.errors.SERVICE_PROVIDER_NOT_FOUND');

    let customerIdToUse: string | undefined;
    let externalData: { name?: string; phone?: string } = {};

    if (dto.isExternalCustomer) {
      if (!dto.externalName || !dto.externalPhone) {
        throw new BadRequestException(
          'common.errors.EXTERNAL_CUSTOMER_NAME_PHONE_REQUIRED',
        );
      }
      externalData = { name: dto.externalName, phone: dto.externalPhone };
    } else {
      if (!dto.customerId) {
        throw new BadRequestException('common.errors.CUSTOMER_ID_REQUIRED');
      }

      const hasHistory = await this.appointmentModel.exists({
        providerId: provider._id,
        customerId: new Types.ObjectId(dto.customerId),
      });

      if (!hasHistory) {
        throw new BadRequestException(
          'common.errors.ONLY_EXISTING_CUSTOMERS_BOOK',
        );
      }

      customerIdToUse = dto.customerId;
    }

    /* ===== Call main logic but inject providerId & force CASH ===== */
    return this.createAppointment(customerIdToUse ?? '', {
      providerId: provider._id.toString(),
      services: dto.services,
      bookingType: dto.bookingType,
      paymentMethod: PaymentType.CASH,
      externalName: externalData.name,
      externalPhone: externalData.phone,
    });
  }

  async hasUpcomingAppointments(customerId: string): Promise<boolean> {
    const count = await this.appointmentModel.countDocuments({
      customerId: new Types.ObjectId(customerId),
      status: { $in: ['PENDING', 'CONFIRMED'] },
      "services.date": { $gte: new Date() },
    });
    return count > 0;
  }

  async hasUpcomingAppointmentsForProvider(providerId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(providerId)) {
      throw new BadRequestException('Invalid providerId');
    }

    const now = new Date();

    const upcomingAppointment = await this.appointmentModel.findOne({
      providerId: new Types.ObjectId(providerId),
      startAt: { $gte: now },
      status: {
        $nin: ['CANCELLED', 'COMPLETED', 'REJECTED'],
      },
    }).select('_id');

    return !!upcomingAppointment;
  }

  async hasActiveSubscription(providerId: string): Promise<boolean> {
    const sub = await this.subscriptionModel.findOne({
      providerId: new Types.ObjectId(providerId),
      status: SubscripionStatus.ACTIVE,
      $or: [{ endDate: null }, { endDate: { $gte: new Date() } }],
    });

    return !!sub;
  }
  async cancelUserAppointmentsDueToDeletion(userId: string) {
    await this.appointmentModel.updateMany(
      {
        customerId: new Types.ObjectId(userId),
        status: {
          $in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
        },
      },
      {
        $set: {
          status: AppointmentStatus.CANCELLED,
          cancellation: {
            cancelledBy: 'SYSTEM',
            reason: 'User account deleted',
            cancelledAt: new Date(),
          },
        },
      }
    );
  }
}
