import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { GetProvidersFilterDto } from './dto/get-providers-filter.dto';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';

import {
  Package,
  ProviderServiceItem,
  ServiceCategory,
  ServiceProvider,
  ServiceProviderDocument,
} from './schemas/service-provider.schema';
import { CreateServiceProviderDto } from './dto/create-service-provider.dto';
import { UpdateServiceProviderDto } from './dto/update-service-provider.dto';
import { ProviderStatus } from 'src/common/enum/providerstatus.enum';

import { GetSlotsDto } from './dto/get-slots.dto';
import {
  Appointment,
  AppointmentDocument,
} from '../appointment/schemas/appointment.schema';
import { AppointmentStatus } from '../appointment/enum/appointmentstatus.enum';
import {
  Employee,
  EmployeeDocument,
} from '../employee/schemas/employee.schema';
import { ProviderResponseDto } from './dto/provider-response.dto';
import { mapProviderToResponse } from './dto/mapper/provider.mapper';
import { RelatedProvidersQueryDto } from './dto/related-providers.dto';
import { PaginatedProviderResponseDto } from './dto/paginated-provider-response.dto';
import { count } from 'rxjs/internal/operators/count';
import { CustomerProfile } from '../customer/schemas/customer-profile.schema';
import { Rating, RatingDocument } from '../rating/schemas/rating.schema';
import { RatingService } from '../rating/rating.service';
import { ProviderRatingsResponseDto } from '../rating/dto/provider-rating-response.dto';
import { LookupService } from '../lookup/lookup.service';
import { Lookup, LookupDocument } from '../lookup/schemas/lookup.schema';
import { ServiceLocation } from 'src/common/enum/service-location.enum';
import { User } from '../users/schemas/user.schema';
import { ProviderCustomerResponseDto } from './dto/provider-customer-response.dto';
import { BreakStatus } from 'src/common/enum/break-status.enum';
import { WorkingHoursValidator } from './utils/working-hours.validator';
import { LocationDto } from './dto/location.dto';
import { CustomBreak, CustomBreakDocument } from '../employee/schemas/custom-breaks.schemas';
import e from 'express';
import { RoleType } from 'src/common/enum/roletype.enum';
import { UserStatus } from '../users/enum/userstatus.enum';

@Injectable()
export class ProviderService {
  private readonly MAX_BREAKS_PER_DAY = 3;
  private readonly MAX_BREAK_DURATION_MINUTES = 60;

  constructor(
    @InjectModel(ServiceProvider.name)
    private readonly providerModel: Model<ServiceProviderDocument>,
    @InjectModel(Appointment.name)
    private readonly appointmentModel: Model<Appointment>,
    @InjectModel(Employee.name)
    private readonly employeeModel: Model<EmployeeDocument>,
    @InjectModel(CustomerProfile.name)
    private readonly customerProfileModel: Model<CustomerProfile>,
    @InjectModel(Rating.name)
    private readonly ratingModel: Model<RatingDocument>,
    private readonly ratingService: RatingService,

private readonly lookupService: LookupService,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @InjectModel(CustomBreak.name)
    private readonly customBreakModel: Model<CustomBreakDocument>,
  ) {}

  /* =====================================================
   Create Provider Profile (Provider only – once)
   ===================================================== */
  async createProvider(
    userId: string,
    dto: CreateServiceProviderDto,
    session?: ClientSession,
  ): Promise<ServiceProviderDocument> {
    const exists = await this.providerModel.findOne({
      userId: new Types.ObjectId(userId),
    });
    if (exists) {
      throw new BadRequestException('common.errors.PROVIDER_PROFILE_ALREADY_EXISTS');
    }

    if (dto.type) {
      const lookup = await this.lookupService.findOne(dto.type);
      if (!lookup || lookup.key !== 'PROVIDER_TYPE' || !lookup.isActive) {
        throw new BadRequestException('common.errors.INVALID_PROVIDER_TYPE_SELECTION');
      }
    }

    // ===== Service Location =====
    if (dto.serviceLocation) {
      if (!Object.values(ServiceLocation).includes(dto.serviceLocation)) {
        throw new BadRequestException('common.errors.INVALID_SERVICE_LOCATION');
      }
    }

    const servicesToSave: ServiceCategory[] = [];

    if (dto.services && dto.services.length > 0) {
      for (const categoryDto of dto.services) {
        const categoryLookup = await this.lookupService.findOne(
          categoryDto.category,
        );
        if (
          !categoryLookup ||
          categoryLookup.key !== 'SERVICE_CATEGORY' ||
          !categoryLookup.isActive
        ) {
          throw new BadRequestException({
            message: 'common.errors.INVALID_SERVICE_CATEGORY_WITH_NAME',
            args: { category: categoryDto.category },
          });
        }

        const itemsToSave: ProviderServiceItem[] = [];
        for (const itemDto of categoryDto.items) {
          const typeLookup = await this.lookupService.findOne(itemDto.type);
          if (
            !typeLookup ||
            typeLookup.key !== 'SERVICE_TYPE' ||
            !typeLookup.isActive
          ) {
            throw new BadRequestException({
              message: 'common.errors.INVALID_SERVICE_TYPE_IN_CATEGORY',
              args: { type: itemDto.type, category: categoryDto.category },
            });
          }

          itemsToSave.push({
            _id: new Types.ObjectId(),
            name: itemDto.name,
            type: new Types.ObjectId(itemDto.type),
            description: itemDto.description,
            image: itemDto.image,
            price: itemDto.price,
            durationMinutes: itemDto.durationMinutes,
            isActive: itemDto.isActive ?? true,
          });
        }

        servicesToSave.push({
          _id: new Types.ObjectId(),
          category: new Types.ObjectId(categoryDto.category),
          items: itemsToSave,
        });
      }
    }

    const packagesToSave: Package[] = [];

    if (dto.packages && dto.packages.length > 0) {
      for (const pkgDto of dto.packages) {
        const items = pkgDto.items.map((i) => ({
          _id: new Types.ObjectId(),
          serviceItemId: new Types.ObjectId(i.serviceItemId),
          quantity: i.quantity,
        }));

        packagesToSave.push({
           _id: new Types.ObjectId(),
          name: pkgDto.name,
          desc: pkgDto.desc,
          price: pkgDto.price,
          isActive: true,
          items,
        });
      }
    }

    const provider = new this.providerModel({
      ...dto,
      userId: new Types.ObjectId(userId),
      status: ProviderStatus.PENDING,
      services: servicesToSave,
      packages: packagesToSave,
    });

    return provider.save({ session });
  }

  /* =====================================================
    Update Provider Profile (Owner only)
    ===================================================== */
async updateProvider(
  providerId: string,
  userId: string,
  dto: UpdateServiceProviderDto,
): Promise<ServiceProviderDocument> {
  const session = await this.providerModel.db.startSession();
  session.startTransaction();

  try {
    const provider = await this.providerModel.findById(providerId).session(session);

    if (!provider) {
      throw new NotFoundException('common.errors.SERVICE_PROVIDER_NOT_FOUND');
    }

    if (provider.userId.toString() !== userId) {
      throw new ForbiddenException('common.errors.CANNOT_UPDATE_THIS_PROVIDER');
    }

    // ===== Provider Type =====
    if (dto.type) {
      const lookup = await this.lookupService.findOne(dto.type);
      if (!lookup || lookup.key !== 'PROVIDER_TYPE' || !lookup.isActive) {
        throw new BadRequestException('common.errors.INVALID_PROVIDER_TYPE_SELECTION');
      }
      provider.type = new Types.ObjectId(dto.type);
    }

   // ===== Services Update =====
    if (dto.services) {
      provider.services = provider.services || [];

      // Track items to delete (by item ID)
      const itemsToDelete = new Set<string>();
      if (dto.deleteItems && Array.isArray(dto.deleteItems)) {
        for (const itemId of dto.deleteItems) {
          itemsToDelete.add(itemId);
        }
      }

      // First pass: handle deletions and collect items to move
      for (const categoryDto of dto.services) {
        // Handle items marked for deletion
        if (categoryDto.items) {
          for (const itemDto of categoryDto.items) {
            if (itemDto._id && itemsToDelete.has(itemDto._id)) {
              // Find and remove the item from its current category
              for (const cat of provider.services) {
                const itemIndex = cat.items?.findIndex(
                  (i) => i._id?.toString() === itemDto._id,
                );
                if (itemIndex !== undefined && itemIndex >= 0) {
                  cat.items.splice(itemIndex, 1);
                  break;
                }
              }
            }
          }
        }
      }

      // Second pass: process categories and items
      for (const categoryDto of dto.services) {
        // Validate category exists in Lookup
        const categoryLookup = await this.lookupService.findOne(
          categoryDto.category,
        );
        if (
          !categoryLookup ||
          categoryLookup.key !== 'SERVICE_CATEGORY' ||
          !categoryLookup.isActive
        ) {
          throw new BadRequestException({
            message: 'common.errors.INVALID_SERVICE_CATEGORY_WITH_NAME',
            args: { category: categoryDto.category },
          });
        }

        // Find existing category or create new one
        let existingCategory = provider.services.find(
          (c) => c.category.toString() === categoryDto.category,
        );

      if (!existingCategory) {
  // Create new category with items directly
  const newItems: any[] = [];
  for (const itemDto of categoryDto.items) {
    if (itemDto._id && itemsToDelete.has(itemDto._id)) {
      continue;
    }
    newItems.push({
      _id: itemDto._id ? new Types.ObjectId(itemDto._id) : new Types.ObjectId(),
      name: itemDto.name,
      type: new Types.ObjectId(itemDto.type),
      description: itemDto.description,
      image: itemDto.image,
      price: itemDto.price,
      durationMinutes: itemDto.durationMinutes,
      isActive: itemDto.isActive ?? true,
    });
  }
  existingCategory = {
    _id: new Types.ObjectId(),
    category: new Types.ObjectId(categoryDto.category),
    items: newItems,
  };

  provider.services.push(existingCategory);
}

        existingCategory.items = existingCategory.items || [];

        // Process each item in the category
        for (const itemDto of categoryDto.items) {
          // Skip items marked for deletion
          if (itemDto._id && itemsToDelete.has(itemDto._id)) {
            continue;
          }

          // Validate type exists in Lookup
          const typeLookup = await this.lookupService.findOne(itemDto.type);
          if (
            !typeLookup ||
            typeLookup.key !== 'SERVICE_TYPE' ||
            !typeLookup.isActive
          ) {
            throw new BadRequestException({
              message: 'common.errors.INVALID_SERVICE_TYPE',
              args: { type: itemDto.type },
            });
          }

          // Validate price and duration
          if (itemDto.price !== undefined && itemDto.price <= 0) {
            throw new BadRequestException('common.errors.SERVICE_PRICE_MUST_BE_GREATER_THAN_ZERO');
          }
          if (
            itemDto.durationMinutes !== undefined &&
            itemDto.durationMinutes <= 0
          ) {
            throw new BadRequestException('common.errors.SERVICE_DURATION_MUST_BE_GREATER_THAN_ZERO');
          }

          // Check if this is an update (item has _id)
          if (itemDto._id) {
            // Find the existing item across ALL categories in the provider
            let existingItemWithCategory: { item: any; categoryIndex: number } | null = null;

            for (let catIdx = 0; catIdx < provider.services.length; catIdx++) {
              const cat = provider.services[catIdx];
              const itemIndex = cat.items?.findIndex(
                (i) => i._id?.toString() === itemDto._id,
              );
              if (itemIndex !== undefined && itemIndex >= 0) {
                existingItemWithCategory = {
                  item: cat.items[itemIndex],
                  categoryIndex: catIdx,
                };
                break;
              }
            }

            if (existingItemWithCategory) {
              const existingItem = existingItemWithCategory.item;
              const currentCategoryIndex = existingItemWithCategory.categoryIndex;
              const currentCategory = provider.services[currentCategoryIndex];
              const currentCategoryId = currentCategory.category.toString();
              const newCategoryId = categoryDto.category;

              if (currentCategoryId !== newCategoryId) {
                // Remove from current category
                currentCategory.items.splice(
                  currentCategory.items.findIndex(
                    (i) => i._id?.toString() === itemDto._id,
                  ),
                  1,
                );

                // Add to target category (existingCategory) with updated fields
                existingCategory.items.push({
                  _id: existingItem._id,
                  name: itemDto.name ?? existingItem.name,
                  type: new Types.ObjectId(itemDto.type),
                  description: itemDto.description ?? existingItem.description,
                  image: itemDto.image ?? existingItem.image,
                  price: itemDto.price ?? existingItem.price,
                  durationMinutes:
                    itemDto.durationMinutes ?? existingItem.durationMinutes,
                  isActive:
                    itemDto.isActive !== undefined
                      ? itemDto.isActive
                      : existingItem.isActive,
                });
              } else {
                // Same category - just update fields (in the original category)
                existingItem.name = itemDto.name ?? existingItem.name;
                existingItem.type = new Types.ObjectId(itemDto.type);
                existingItem.description =
                  itemDto.description ?? existingItem.description;
                existingItem.image = itemDto.image ?? existingItem.image;
                existingItem.price = itemDto.price ?? existingItem.price;
                existingItem.durationMinutes =
                  itemDto.durationMinutes ?? existingItem.durationMinutes;
                if (itemDto.isActive !== undefined) {
                  existingItem.isActive = itemDto.isActive;
                }
              }
            } else {
              // Item ID provided but not found in any category - create new item
              existingCategory.items.push({
                _id: new Types.ObjectId(),
                name: itemDto.name,
                type: new Types.ObjectId(itemDto.type),
                description: itemDto.description,
                image: itemDto.image,
                price: itemDto.price,
                durationMinutes: itemDto.durationMinutes,
                isActive: itemDto.isActive ?? true,
              });
            }
          } else {
            // New item - create it
            existingCategory.items.push({
              _id: new Types.ObjectId(),
              name: itemDto.name,
              type: new Types.ObjectId(itemDto.type),
              description: itemDto.description,
              image: itemDto.image,
              price: itemDto.price,
              durationMinutes: itemDto.durationMinutes,
              isActive: itemDto.isActive ?? true,
            });
          }
        }
      }
    }

    // ===== Service Location =====
    if (dto.serviceLocation) {
      if (!Object.values(ServiceLocation).includes(dto.serviceLocation)) {
        throw new BadRequestException('common.errors.INVALID_SERVICE_LOCATION');
      }
    }

    // ===== Packages Update (Add / Update Smart) =====
    if (dto.packages) {
      provider.packages = provider.packages || [];

      const allServiceItemIds = provider.services
        .flatMap((category) => category.items)
        .map((item) => item._id.toString());

      for (const pkgDto of dto.packages) {

        const pkgItems = pkgDto.items.map((i) => {
          if (!allServiceItemIds.includes(i.serviceItemId)) {
            throw new BadRequestException({
              message: 'common.errors.INVALID_SERVICE_ITEM_IN_PACKAGE',
              args: { serviceItemId: i.serviceItemId, packageName: pkgDto.name },
            });
          }

          return {
            serviceItemId: new Types.ObjectId(i.serviceItemId),
            quantity: i.quantity,
          };
        });

        // =============================
        // UPDATE EXISTING PACKAGE
        // =============================
        if (pkgDto._id) {
          const existingPackage = provider.packages.find(
            (p) => p._id.toString() === pkgDto._id,
          );

          if (!existingPackage) {
            throw new BadRequestException('common.errors.PACKAGE_NOT_FOUND');
          }

          existingPackage.name = pkgDto.name ?? existingPackage.name;
          existingPackage.desc = pkgDto.desc ?? existingPackage.desc;
          existingPackage.price = pkgDto.price ?? existingPackage.price;
          existingPackage.isActive = pkgDto.isActive ?? existingPackage.isActive;
          existingPackage.items = pkgItems ?? existingPackage.items;

        }
        // =============================
        // CREATE NEW PACKAGE
        // =============================
        else {
          provider.packages.push({
            _id: new Types.ObjectId(),
            name: pkgDto.name,
            desc: pkgDto.desc,
            price: pkgDto.price,
            isActive: true,
            items: pkgItems,
          });
        }
      }
    }

 // ===== Working Hours Partial Update (Safe Merge) =====
if (dto.workingHours) {
  // Initialize if not exists
  provider.workingHours = provider.workingHours || {
    timezone: 'Asia/Riyadh',
    weekly: [],
    exceptions: [],
    breaks: { weekly: [], custom: [] },
  };

  // ===== Timezone =====
  if (dto.workingHours.timezone !== undefined) {
    provider.workingHours.timezone = dto.workingHours.timezone;
  }

// ===== Weekly Schedule (Merge) =====
if (dto.workingHours.weekly !== undefined) {
  for (const dayDto of dto.workingHours.weekly) {
    const existing = provider.workingHours?.weekly.find(
      (d) => d.day === dayDto.day,
    );


    const dayName = dayDto.day;


    const futureAppointments = await this.appointmentModel.find({
      providerId: provider._id,
      'services.date': { $gte: new Date() },
      'services.timeSlot': { $exists: true },
  status: { $in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] }, 

    });


    const conflictingAppointments = futureAppointments.filter((a) =>
      a.services.some((s) => {
        const serviceDayName = this.getDayNameFromDate(s.date);
        if (serviceDayName !== dayName) return false;

        if (dayDto.isOpen === false) return true;

        const openTime = dayDto.openTime ?? existing?.openTime;
        const closeTime = dayDto.closeTime ?? existing?.closeTime;
        if (!openTime || !closeTime) {
          throw new BadRequestException({
            message: 'common.errors.WORKING_DAY_OPEN_MUST_HAVE_OPEN_CLOSE_FOR_DAY',
            args: { day: dayDto.day },
          });
        }


        const newOpenMinutes = this.timeToMinutes(openTime);
        const newCloseMinutes = this.timeToMinutes(closeTime);
        const serviceStart = this.timeToMinutes(s.timeSlot.start);
        const serviceEnd = this.timeToMinutes(s.timeSlot.end);


        return serviceStart < newOpenMinutes || serviceEnd > newCloseMinutes;
      }),
    );

    if (conflictingAppointments.length > 0) {
      throw new BadRequestException({
        message: 'common.errors.CANNOT_UPDATE_DAY_APPOINTMENTS_CONFLICT',
        args: { dayName:`common.days.${dayName}` },
      });
    }


    if (existing) {
  existing.isOpen = dayDto.isOpen ?? existing.isOpen;

  if (existing.isOpen) {
    existing.openTime = dayDto.openTime ?? existing.openTime;
    existing.closeTime = dayDto.closeTime ?? existing.closeTime;
  } else {
    existing.openTime = undefined;
    existing.closeTime = undefined;
  }
} else {
  provider.workingHours?.weekly.push({
    day: dayDto.day,
    isOpen: dayDto.isOpen ?? true,
    openTime: dayDto.isOpen !== false ? dayDto.openTime : undefined,
    closeTime: dayDto.isOpen !== false ? dayDto.closeTime : undefined,
  });
}
  }
}

  // Ensure breaks object exists
  provider.workingHours.breaks = provider.workingHours.breaks || {
    weekly: [],
    custom: [],
  };


// ===== Weekly Breaks (Add / Update) =====
if (dto.workingHours?.breaks?.weekly) {
  for (const incomingBreak of dto.workingHours.breaks.weekly) {
    const workingDay = provider.workingHours?.weekly?.find(
      (d) => d.day === incomingBreak.day
    );

    if (!workingDay || !workingDay.isOpen) {
      throw new BadRequestException({
        message: 'common.errors.BREAK_CLOSED_DAY_OPEN_FIRST',
        args: { day:`common.days.${incomingBreak.day}`},
      });
    }

    // Check startTime & endTime exist
 if (!incomingBreak.startTime || !incomingBreak.endTime) {
  throw new BadRequestException({
    message: 'common.errors.BREAK_MUST_HAVE_START_END',
  args: { day:`common.days.${incomingBreak.day}`, startTime: incomingBreak.startTime, endTime: incomingBreak.endTime },
  });
}

    const breakStart = this.timeToMinutes(incomingBreak.startTime);
    const breakEnd = this.timeToMinutes(incomingBreak.endTime);
    const openTime = this.timeToMinutes(workingDay.openTime!);
    const closeTime = this.timeToMinutes(workingDay.closeTime!);

    // Validate break range
    if (breakStart >= breakEnd) {
      throw new BadRequestException({
        message: 'common.errors.BREAK_INVALID_RANGE',
        args: { day: `common.days.${incomingBreak.day}`, startTime: incomingBreak.startTime, endTime: incomingBreak.endTime },
      });
    }

    if (breakStart < openTime || breakEnd > closeTime) {
      throw new BadRequestException({
        message: 'common.errors.BREAK_EXCEEDS_WORKING_HOURS',
        args: { day: `common.days.${incomingBreak.day}`, startTime: incomingBreak.startTime, endTime: incomingBreak.endTime, openTime: workingDay.openTime!, closeTime: workingDay.closeTime! },
      });
    }

    // ===== Check overlap with existing breaks =====
    const overlappingBreak = provider.workingHours?.breaks?.weekly
      ?.filter((b) => b.day === incomingBreak.day)
      .find((b) => b._id?.toString() !== incomingBreak._id &&
                   breakStart < this.timeToMinutes(b.endTime) &&
                   breakEnd > this.timeToMinutes(b.startTime));

    if (overlappingBreak) {
      throw new BadRequestException({
        message: 'common.errors.BREAK_OVERLAPS_WITH',
        args: {
          day: `common.days.${incomingBreak.day}`,
          startTime: incomingBreak.startTime,
          endTime: incomingBreak.endTime,
          otherStart: overlappingBreak.startTime,
          otherEnd: overlappingBreak.endTime,
        },
      });
    }

    // ===== Check conflict with future appointments =====
    const mongoDay = this.getMongoDayNumber(incomingBreak.day);
    const now = new Date();

    const conflict = await this.appointmentModel.aggregate([
      { $match: { providerId: provider._id, status: { $in: ['PENDING', 'CONFIRMED'] } } },
      { $unwind: "$services" },
      { $match: { "services.date": { $gte: now } } },
      { $match: { $expr: { $eq: [{ $dayOfWeek: "$services.date" }, mongoDay] } } },
      { $addFields: {
          serviceStart: {
            $add: [
              { $multiply: [{ $toInt: { $substr: ["$services.timeSlot.start", 0, 2] } }, 60] },
              { $toInt: { $substr: ["$services.timeSlot.start", 3, 2] } }
            ]
          },
          serviceEnd: {
            $add: [
              { $multiply: [{ $toInt: { $substr: ["$services.timeSlot.end", 0, 2] } }, 60] },
              { $toInt: { $substr: ["$services.timeSlot.end", 3, 2] } }
            ]
          }
        }
      },
      { $match: { $expr: { $and: [ { $lt: [breakStart, "$serviceEnd"] }, { $gt: [breakEnd, "$serviceStart"] } ] } } },
      { $limit: 1 }
    ]);

    if (conflict.length > 0) {
      throw new BadRequestException({
        message: 'common.errors.BREAK_APPOINTMENT_CONFLICT',
        args: { day: `common.days.${incomingBreak.day}`, startTime: incomingBreak.startTime, endTime: incomingBreak.endTime },
      });
    }

    // ===== Create or Update =====
    if (incomingBreak._id) {
      // UPDATE
      const existing = provider.workingHours?.breaks?.weekly.find(
        (b) => b._id?.toString() === incomingBreak._id
      );
      if (!existing) {
        throw new BadRequestException('common.errors.WEEKLY_BREAK_NOT_FOUND');
      }

      existing.day = incomingBreak.day;
      existing.startTime = incomingBreak.startTime;
      existing.endTime = incomingBreak.endTime;
      existing.reason = incomingBreak.reason ?? existing.reason;
    } else {
      // CREATE
      if (
        (provider.workingHours?.breaks?.weekly?.filter(b => b.day === incomingBreak.day).length || 0) >= this.MAX_BREAKS_PER_DAY
      ) {
        throw new BadRequestException({
          message: 'common.errors.MAX_BREAKS_REACHED',
          args: { day: `common.days.${incomingBreak.day}`, max: this.MAX_BREAKS_PER_DAY },
        });
      }


      if (breakEnd - breakStart > this.MAX_BREAK_DURATION_MINUTES) {
        throw new BadRequestException({
          message: 'common.errors.BREAK_EXCEEDS_MAX_DURATION',
          args: { day: `common.days.${incomingBreak.day}`, minutes: this.MAX_BREAK_DURATION_MINUTES },
        });
      }

      provider.workingHours?.breaks?.weekly.push({
        _id: new Types.ObjectId(),
        day: incomingBreak.day,
        startTime: incomingBreak.startTime,
        endTime: incomingBreak.endTime,
        reason: incomingBreak.reason,
      });
    }
  }
}

  // ===== Custom Breaks (Add / Update) =====
if (dto.workingHours?.breaks?.custom) {
  for (const incomingBreak of dto.workingHours.breaks.custom) {

    if (!incomingBreak.date || !incomingBreak.startTime || !incomingBreak.endTime) {
      throw new BadRequestException({
        message:'common.errors.CUSTOM_BREAK_MUST_HAVE_DATE_START_END',
        args: { date: `${incomingBreak.date}`},

    });
    }

const breakDate = new Date(`${incomingBreak.date}T00:00:00`);
const today = new Date();
today.setHours(0, 0, 0, 0);

// Prevent past dates
if (breakDate < today) {
  throw new BadRequestException({
    message: 'common.errors.CUSTOM_BREAK_DATE_PAST',
    args: { date: `${incomingBreak.date}` },
  });
}

// Prevent past time if same day
if (breakDate.getTime() === today.getTime()) {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const breakEndMinutes = this.timeToMinutes(incomingBreak.endTime);

  if (breakEndMinutes <= nowMinutes) {
    throw new BadRequestException({
      message: 'common.errors.CUSTOM_BREAK_TIME_PAST',
      args: {
        date: `${incomingBreak.date}`,
        startTime: incomingBreak.startTime,
        endTime: incomingBreak.endTime,
        time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
      },
    });
  }
}

    const dayName = this.getDayNameFromDate(breakDate);

    const workingDay = provider.workingHours?.weekly?.find(
      (d) => d.day === dayName
    );

    if (!workingDay || !workingDay.isOpen) {
      throw new BadRequestException({
        message: 'common.errors.CUSTOM_BREAK_CLOSED_DAY',
        args: {dayName:`common.days.${dayName}`},
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
        args: { dayName:`common.days.${dayName}` ,date: String(incomingBreak.date), startTime: incomingBreak.startTime, endTime: incomingBreak.endTime },
      });
    }

    if (breakStart < openTime || breakEnd > closeTime) {
      throw new BadRequestException({
        message: 'common.errors.CUSTOM_BREAK_EXCEEDS_HOURS',
        args: { dayName: `common.days.${dayName}`, openTime: workingDay.openTime, closeTime: workingDay.closeTime },
      });
    }

    // ===== Check overlap with other custom breaks (same date only) =====
    const overlappingBreak = provider.workingHours?.breaks?.custom
      ?.filter(b =>
        b._id?.toString() !== incomingBreak._id &&
        new Date(b.date).toDateString() === breakDate.toDateString()
      )
      .find(b =>
        breakStart < this.timeToMinutes(b.endTime) &&
        breakEnd > this.timeToMinutes(b.startTime)
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
      existingEnd: overlappingBreak.endTime
    },
  });
}

    // ===== Check conflict with future appointments =====
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

      },
      {
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
      const existing = provider.workingHours?.breaks?.custom.find(
        b => b._id?.toString() === incomingBreak._id
      );

      if (!existing) {
        throw new BadRequestException('common.errors.CUSTOM_BREAK_NOT_FOUND');
      }

      existing.date = breakDate;
      existing.startTime = incomingBreak.startTime;
      existing.endTime = incomingBreak.endTime;
      existing.reason = incomingBreak.reason ?? existing.reason;

    } else {
      // CREATE
      provider.workingHours?.breaks?.custom.push({
        _id: new Types.ObjectId(),
        date: breakDate,
        startTime: incomingBreak.startTime,
        endTime: incomingBreak.endTime,
        reason: incomingBreak.reason,
        status: BreakStatus.APPROVED,
      });
    }
  }
}

  // ========================================
  //  FINAL STATE VALIDATION (IMPORTANT)
  // ========================================

  // Validate Weekly Schedule
  if (provider.workingHours.weekly?.length) {
    WorkingHoursValidator.validateWeeklySchedule(
      provider.workingHours.weekly,
    );
  }



  delete (dto as any).workingHours;
}


Object.assign(provider, {
  ...dto,
  type: provider.type,
  services: provider.services,
  serviceLocation: dto.serviceLocation ?? provider.serviceLocation,
  packages: provider.packages,
});


    // ===== Location Update =====
    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      provider.location = {
        type: 'Point',
        coordinates: [dto.longitude, dto.latitude],
      };
    }

    const savedProvider = await provider.save({ session });

     // Sync employees' working hours after provider working hours are updated
    await this.syncEmployeesWorkingHours(provider._id, session);

    await session.commitTransaction();
    session.endSession();

    return savedProvider;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}


/* =====================================================
   Get Provider by ID (Public) - Updated
   ===================================================== */
async getById(
  providerId: string,
  excludeEmployees: boolean = false,
): Promise<
  ProviderResponseDto & {
    employees: any[];
    rating: ProviderRatingsResponseDto;
  }
> {
  /* =========================
   1️⃣ Get Provider
   ========================= */
  const provider = await this.providerModel
    .findById(providerId)
    .populate('userId', 'phone email')
    .populate('type', 'code name')
    .populate('services.category', 'code name')
    .populate('services.items.type', 'code name')
    .lean();

  if (!provider || provider.status != ProviderStatus.APPROVED ) {
    throw new NotFoundException('common.errors.SERVICE_PROVIDER_NOT_FOUND');
  }

  /* =========================
   2️⃣ Get Provider Rating (always)
   ========================= */
  const rating = await this.ratingService.getRatingsByProvider(provider._id);

  /* =========================
   3️⃣ Skip Employees if requested
   ========================= */
  if (excludeEmployees) {
    const providerResponse = mapProviderToResponse(provider);

    // فلترة الخدمات فقط للأكتيف
    providerResponse.services = (providerResponse.services || []).map(
      (service) => ({
        ...service,
        items: (service.items || []).filter((item) => item.isActive),
      })
    ).filter((service) => service.items.length > 0);
  
    // فلترة البكجات لتشمل فقط الـ active
    providerResponse.packages = (providerResponse.packages || []).filter(
      (pkg) => pkg.isActive
    );

    return {
      ...providerResponse,
      employees: [],
      rating,
    };
  }

  /* =========================
   4️⃣ Get Employees
   ========================= */
  const employees = await this.employeeModel
    .find({ providerId: provider._id, isActive: true })
    .populate('position', 'code name')
    .limit(10)
    .lean();

  let employeesWithRatings: any[] = [];

  if (employees.length) {
    const employeeIds = employees.map((emp) => emp._id);

    const employeeRatings = await this.ratingModel.aggregate([
      {
        $match: {
          employeeId: { $in: employeeIds },
        },
      },
      {
        $group: {
          _id: '$employeeId',
          average: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    const ratingMap = new Map<string, { average: number; count: number }>(
      employeeRatings.map((r) => [
        r._id.toString(),
        {
          average: Number(r.average.toFixed(1)),
          count: r.count,
        },
      ]),
    );

    employeesWithRatings = employees.map((emp) => ({
      ...emp,
      rating: ratingMap.get(emp._id.toString()) ?? {
        average: 0,
        count: 0,
      },
    }));
  }

  /* =========================
   5️⃣ Prepare Provider Response
   ========================= */
  const providerResponse = mapProviderToResponse(provider);

  // فلترة البكجات لتشمل فقط الـ active
  providerResponse.packages = (providerResponse.packages || []).filter(
    (pkg) => pkg.isActive
  );

  // فلترة الخدمات لتشمل فقط الأكتيف والمرتبطة بموظف واحد على الأقل
  providerResponse.services = (providerResponse.services || [])
    .map((service) => ({
      ...service,
      items: (service.items || []).filter((item) => {
        if (!item.isActive) return false;

        // Check if any employee has this serviceItemId
        const assigned = employeesWithRatings.some((emp) =>
          emp.services?.some(
            (s) => s.serviceItemId.toString() === item._id.toString() && s.isActive
          )
        );

        return assigned;
      }),
    }))
    .filter((service) => service.items.length > 0); // Keep service only if it has items

  /* =========================
   6️⃣ Return Final Response
   ========================= */
  return {
    ...providerResponse,
    employees: employeesWithRatings,
    rating,
  };
}

//findById
async getByIdSimple(providerId: string): Promise<ServiceProviderDocument> {
  const provider = await this.providerModel.findById(providerId);
  if (!provider) {
    throw new NotFoundException('common.errors.SERVICE_PROVIDER_NOT_FOUND');
  }
  return provider;
}

  /* =====================================================
    Get Provider by Owner (Provider dashboard)
    ===================================================== */
  async getByOwner(userId: string): Promise<ProviderResponseDto> {
    const provider = await this.providerModel
      .findOne({
        userId: new Types.ObjectId(userId),
      })
      .populate('userId', 'phone email')
      .populate('type', 'code name')
      .lean();
    if (!provider) {
      throw new NotFoundException('common.errors.SERVICE_PROVIDER_NOT_FOUND');
    }
    const employees = await this.employeeModel
      .find({ providerId: provider._id })
      .populate('position', 'code name')
      .lean();

    return {
      ...mapProviderToResponse(provider),
      employees: employees,
    };
  }

  /* =====================================================
     Find All Providers with Filters & Pagination (Updated)
     ===================================================== */
  async findAll(filters: GetProvidersFilterDto, userId?: string) {
    const {
      name,
      type,
      service,
      serviceCategory,
      location,
      rating,
      serviceLocation,
      latitude,
      longitude,
      page = 1,
      limit = 10,
    } = filters;

    if ((latitude && !longitude) || (!latitude && longitude)) {
      throw new BadRequestException('common.errors.LAT_LNG_REQUIRED_TOGETHER');
    }

    const query: any = {
      status: ProviderStatus.APPROVED,
     // services: { $exists: true, $ne: [] },
    };

    if (service) {
  query.services = {
    $elemMatch: {
      items: {
        $elemMatch: {
          $or: [
            { name: { $regex: service, $options: 'i' } },
          ],
        },
      },
    },
  };
}

    if (serviceLocation) {
      query.serviceLocation = serviceLocation;
    }

    if (name) query.name = { $regex: name, $options: 'i' };

    if (serviceCategory) {
  let categoryId: any;

  if (Types.ObjectId.isValid(serviceCategory)) {
    categoryId = serviceCategory;
  } else {
    const lookup = await this.lookupService.getDataByKey(
      'SERVICE_CATEGORY',
      serviceCategory,
    );

    if (!lookup) {
      throw new BadRequestException('common.errors.INVALID_SERVICE_CATEGORY');
    }

    categoryId = lookup._id.toString();
  }

  query['services.category'] = new Types.ObjectId(categoryId);
}

    let typeId: any;
    if (type) {
      if (Types.ObjectId.isValid(type)) {
        typeId = type;
      } else {
        const lookup = await this.lookupService.getDataByKey(
          'PROVIDER_TYPE',
          type,
        );

        if (!lookup) {
          throw new BadRequestException('common.errors.INVALID_PROVIDER_TYPE');
        }

        typeId = lookup._id.toString();
      }
      query.type = typeId;
      query.type = new Types.ObjectId(typeId);
    }


    if (location) query.address = { $regex: location, $options: 'i' };
    if (location) query.address = { $regex: location, $options: 'i' };
    if (rating) query['rating.average'] = { $gte: rating };

    const skip = (page - 1) * limit;

    // const [data, total] = await Promise.all([
    //   this.providerModel.find(query).skip(skip).limit(limit).exec(),
    //   this.providerModel.countDocuments(query).exec(),
    // ]);

    let data: any[] = [];
    let total = 0;

    if (latitude !== undefined && longitude !== undefined) {
      // Geo query with distance
   const geoQuery: any = [
  {
    $geoNear: {
      near: { type: 'Point', coordinates: [longitude, latitude] },
      distanceField: 'distance',
      spherical: true,
      key: 'location',
      query,
    },
  },

  {
    $lookup: {
      from: 'lookups',
      localField: 'type',
      foreignField: '_id',
      as: 'type',
    },
  },

  {
    $unwind: {
      path: '$type',
      preserveNullAndEmptyArrays: true,
    },
  },

  {
   $sort: { distance: 1 }, // newest first
  },

  { $skip: skip },

  { $limit: limit },
];

      data = await this.providerModel.aggregate(geoQuery);
      total = await this.providerModel.countDocuments(query);
    } else {
      data = await this.providerModel
        .find(query)
        .skip(skip)
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('type', 'code name')
        .lean();
      total = await this.providerModel.countDocuments(query);
    }

    // Map response after fetching
    let favoriteIds: string[] = [];
    if (userId) {
      const customer = await this.customerProfileModel
        .findOne({
          userId: new Types.ObjectId(userId),
        })
        .lean();

      favoriteIds = customer?.favorites?.map((f) => f.toString()) || [];
    }

    const dataMapped = data.map((p) => ({
      _id: p._id,
      name: p.name,
      description: p.description,
      type: p.type
        ? {
            id: (p.type as any)._id.toString(),
            code: (p.type as any).code,
            name: (p.type as any).name,
          }
        : null,
      address: p.address,
      rating: { average: p.rating.average, count: p.rating.count },
      _coverImage: p.coverImage,
      genderType: p.genderType,
      isFavorite: favoriteIds.includes(p._id.toString()),
      serviceLocation: p.serviceLocation,
      location: p.location,
      distance: (p as any).distance,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      employees: (p.employees || []).filter((emp) => emp.isActive !== false),
    }));

    return {
      data: dataMapped,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  /* =====================================================
      Admin – Approve / Reject Provider (later use)
      ===================================================== */

  async approveProvider(providerId: string) {
    const provider = await this.providerModel.findById(providerId);

    if (!provider) {
      throw new NotFoundException('common.errors.SERVICE_PROVIDER_NOT_FOUND');
    }

    provider.status = ProviderStatus.APPROVED;
    provider.rejectionReason = undefined;

    return provider.save();
  }
  async rejectProvider(providerId: string, reason: string) {
    const provider = await this.providerModel.findById(providerId);

    if (!provider) {
      throw new NotFoundException('common.errors.SERVICE_PROVIDER_NOT_FOUND');
    }

    provider.status = ProviderStatus.REJECTED;
    provider.rejectionReason = reason;

    return provider.save();
  }

  async getByOwnerUserId(userId: string) {
    return this.providerModel.findOne({ userId: new Types.ObjectId(userId) });
  }

  async getRelatedProviders(
    providerId: string,
    query: RelatedProvidersQueryDto,
  ): Promise<PaginatedProviderResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const provider = await this.providerModel.findById(providerId);
    if (!provider) throw new NotFoundException('common.errors.PROVIDER_NOT_FOUND');

    const filter = {
      _id: { $ne: provider._id },
      type: provider.type,
      genderType: provider.genderType,
      status: ProviderStatus.APPROVED,
    };

    const [items, total] = await Promise.all([
      this.providerModel
        .find(filter)
        .sort({ 'rating.average': -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'phone email'),
      this.providerModel.countDocuments(filter),
    ]);

    return {
      data: items.map((provider) => mapProviderToResponse(provider)),
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

/* =====================================================
   Get Provider Time Slots
   ===================================================== */
  async getProviderSlots(providerId: string, query: GetSlotsDto) {
    const { date, serviceId, employeeId, numberOfCustomers } = query;

    // Get provider with full workingHours (including breaks)
    const provider = await this.providerModel.findById(providerId).lean();
    if (!provider) {
      throw new NotFoundException('common.errors.SERVICE_PROVIDER_NOT_FOUND');
    }

    const service = this.findServiceInProvider(provider, serviceId);
    if (!service) {
      throw new NotFoundException({
        message: 'common.errors.SERVICE_NOT_FOUND',
        args: { serviceItemId: serviceId },
      });
    }

    let scheduleSource: any = null;
    let allEmployeeIds: string[] = [];
    let breaksSource: any = null;
    let employeesData: any[] = [];

    if (employeeId) {
      // Scenario 1: Employee is selected - use only that employee's working hours
      const employee = await this.employeeModel.findById(employeeId);

      if (!employee || employee.providerId.toString() !== providerId) {
        throw new BadRequestException('common.errors.INVALID_EMPLOYEE');
      }

      if (employee.workingHours?.weekly?.length) {
        scheduleSource = employee.workingHours;
      } else if (provider.workingHours?.weekly?.length) {
        // Fallback to provider working hours if employee has no specific hours
        scheduleSource = provider.workingHours;
      }

      // Get custom breaks from database for this employee
      const employeeCustomBreaks = await this.getEmployeeCustomBreaksFromDB(employeeId, new Date(date));

      // Get breaks from employee (priority) or fallback to provider breaks
      breaksSource = this.getBreaksSource(employee.workingHours, provider.workingHours, employeeCustomBreaks);
      allEmployeeIds = [employeeId];
    } else {
      // Scenario 2: No employee selected - check each employee individually
      // Get all employees with their working hours
      const employees = await this.employeeModel
        .find({ providerId: new Types.ObjectId(providerId) })
        .select('workingHours')
        .lean();

      allEmployeeIds = employees.map((emp) => emp._id.toString());
      employeesData = employees;

      // Use provider's working hours as the base schedule
      scheduleSource = provider.workingHours;

      // Get custom breaks from database for all employees
      const targetDate = new Date(date);
      const allEmployeesCustomBreaks = await this.getAllEmployeesCustomBreaksFromDB(
        allEmployeeIds,
        targetDate,
      );

      // Get provider breaks
      const providerCustomBreaks = provider.workingHours?.breaks?.custom?.filter(
        (b: any) => b.status === BreakStatus.APPROVED,
      ) || [];

      // Store both in breaksSource for use in isAnyEmployeeAvailable
      breaksSource = {
        weekly: provider.workingHours?.breaks?.weekly || [],
        custom: providerCustomBreaks,
        employeesCustomBreaks: allEmployeesCustomBreaks, // Map of employeeId -> custom breaks
      };
    }

    const effectiveDuration =
      service.durationMinutes * (numberOfCustomers ?? 1);

    let result: any;

    if (employeeId) {
      // Single employee scenario - use existing logic
      result = await this.generateDaySlots(
        providerId,
        date,
        effectiveDuration,
        scheduleSource,
        allEmployeeIds,
        breaksSource,
      );
    } else {
      // Multiple employees scenario - check each employee individually
      result = await this.generateDaySlotsForMultipleEmployees(
        providerId,
        date,
        effectiveDuration,
        scheduleSource,
        employeesData,
        breaksSource,
      );
    }

    return this.disablePastSlots(result, date);
  }

  /* =====================================================
   Get Breaks Source (Employee breaks with provider fallback)
   ===================================================== */
  private getBreaksSource(
    employeeWorkingHours: any,
    providerWorkingHours: any,
    employeeCustomBreaksFromDB: any[] = [],
  ) {
    const breaks = {
      weekly: [] as any[],
      custom: [] as any[],
    };

    // Get employee's weekly breaks
    if (employeeWorkingHours?.breaks?.weekly?.length) {
      breaks.weekly = [...employeeWorkingHours.breaks.weekly];
    }

    // Get provider's weekly breaks as fallback
    if (providerWorkingHours?.breaks?.weekly?.length) {
      // Merge, avoiding duplicates
      const existingWeekly = new Set(breaks.weekly.map(b => `${b.day}-${b.startTime}-${b.endTime}`));
      for (const breakItem of providerWorkingHours.breaks.weekly) {
        const key = `${breakItem.day}-${breakItem.startTime}-${breakItem.endTime}`;
        if (!existingWeekly.has(key)) {
          breaks.weekly.push(breakItem);
        }
      }
    }

    // Add custom breaks from database first (highest priority)
    if (employeeCustomBreaksFromDB?.length) {
      breaks.custom = [...employeeCustomBreaksFromDB];
    }

    // Get employee's custom breaks from embedded object (as fallback)
    if (employeeWorkingHours?.breaks?.custom?.length) {
      // Only include APPROVED custom breaks
      const approvedEmployeeCustom = employeeWorkingHours.breaks.custom.filter(
        (b: any) => b.status === BreakStatus.APPROVED,
      );
      // Merge, avoiding duplicates
      const existingCustom = new Set(breaks.custom.map(b => `${new Date(b.date).toDateString()}-${b.startTime}-${b.endTime}`));
      for (const breakItem of approvedEmployeeCustom) {
        const key = `${new Date(breakItem.date).toDateString()}-${breakItem.startTime}-${breakItem.endTime}`;
        if (!existingCustom.has(key)) {
          breaks.custom.push(breakItem);
        }
      }
    }

    // Get provider's custom breaks as fallback
    if (providerWorkingHours?.breaks?.custom?.length) {
      // Only include APPROVED custom breaks
      const approvedProviderCustom = providerWorkingHours.breaks.custom.filter(
        (b: any) => b.status === BreakStatus.APPROVED,
      );
      // Merge, avoiding duplicates
      const existingCustom = new Set(breaks.custom.map(b => `${new Date(b.date).toDateString()}-${b.startTime}-${b.endTime}`));
      for (const breakItem of approvedProviderCustom) {
        const key = `${new Date(breakItem.date).toDateString()}-${breakItem.startTime}-${breakItem.endTime}`;
        if (!existingCustom.has(key)) {
          breaks.custom.push(breakItem);
        }
      }
    }

    return breaks;
  }

  /* =====================================================
   Get Employee Custom Breaks From Database
   ===================================================== */
  private async getEmployeeCustomBreaksFromDB(
    employeeId: string,
    targetDate: Date,
  ): Promise<any[]> {
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const customBreaks = await this.customBreakModel
      .find({
        employeeId: new Types.ObjectId(employeeId),
        date: { $gte: startOfDay, $lte: endOfDay },
        status: BreakStatus.APPROVED,
      })
      .lean();

    return customBreaks.map((brk) => ({
      date: brk.date,
      startTime: brk.startTime,
      endTime: brk.endTime,
      reason: brk.reason,
      status: brk.status,
    }));
  }

  /* =====================================================
   Get All Employees Custom Breaks From Database (for multiple employees)
   ===================================================== */
  private async getAllEmployeesCustomBreaksFromDB(
    employeeIds: string[],
    targetDate: Date,
  ): Promise<Map<string, any[]>> {
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const customBreaks = await this.customBreakModel
      .find({
        employeeId: { $in: employeeIds.map((id) => new Types.ObjectId(id)) },
        date: { $gte: startOfDay, $lte: endOfDay },
        status: BreakStatus.APPROVED,
      })
      .lean();

    // Group by employeeId
    const breaksByEmployee = new Map<string, any[]>();
    for (const empId of employeeIds) {
      breaksByEmployee.set(empId, []);
    }

    for (const brk of customBreaks) {
      if (brk.employeeId) {
        const empIdStr = brk.employeeId.toString();
        if (breaksByEmployee.has(empIdStr)) {
          breaksByEmployee.get(empIdStr)!.push({
            date: brk.date,
            startTime: brk.startTime,
            endTime: brk.endTime,
            reason: brk.reason,
            status: brk.status,
          });
        }
      }
    }

    return breaksByEmployee;
  }

  private calculateUnionWorkingHoursAndBreaks(employees: any[], providerWorkingHours: any) {
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const unionSchedule: any = {
    timezone: providerWorkingHours?.timezone || 'Asia/Riyadh',
    weekly: [],
  };

  const allWeeklyBreaks: any[] = [];
  const allCustomBreaks: any[] = [];

  for (const dayName of days) {
    let earliestOpen = '';
    let latestClose = '';
    let isAnyEmployeeOpen = false;

    // 1. استخراج النطاق الزمني للموظفين فقط
    for (const employee of employees) {
      const empDay = employee.workingHours?.weekly?.find(d => d.day === dayName && d.isOpen);
      if (empDay) {
        isAnyEmployeeOpen = true;
        if (!earliestOpen || empDay.openTime < earliestOpen) earliestOpen = empDay.openTime;
        if (!latestClose || empDay.closeTime > latestClose) latestClose = empDay.closeTime;
      }
      // جمع الاستراحات (كما في الكود السابق)
      if (employee.workingHours?.breaks?.weekly) {
        allWeeklyBreaks.push(...employee.workingHours.breaks.weekly.filter(b => b.day === dayName));
      }
      if (employee.workingHours?.breaks?.custom) {
        allCustomBreaks.push(...employee.workingHours.breaks.custom.filter(b => b.status === 'APPROVED'));
      }
    }

    // 2. مطابقة النطاق مع ساعات المركز (Constraint)
    const providerDay = providerWorkingHours?.weekly?.find(d => d.day === dayName);

    // إذا لم يكن هناك أي موظف يعمل، أو المركز مغلق، يكون اليوم مغلقاً
    const finalIsOpen = isAnyEmployeeOpen && (providerDay?.isOpen ?? false);

    let finalOpen = earliestOpen;
    let finalClose = latestClose;

    // التأكد أن وقت الموظفين لا يتجاوز حدود المركز
    if (providerDay?.isOpen) {
      if (earliestOpen < providerDay.openTime) finalOpen = providerDay.openTime;
      if (latestClose > providerDay.closeTime) finalClose = providerDay.closeTime;
    }

    unionSchedule.weekly.push({
      day: dayName,
      isOpen: finalIsOpen,
      openTime: finalOpen,
      closeTime: finalClose,
    });
  }

  // إضافة استراحات المركز للمجموع العام
  if (providerWorkingHours?.breaks?.weekly) allWeeklyBreaks.push(...providerWorkingHours.breaks.weekly);
  if (providerWorkingHours?.breaks?.custom) allCustomBreaks.push(...providerWorkingHours.breaks.custom.filter(b => b.status === 'APPROVED'));

  return {
    schedule: unionSchedule,
    breaks: { weekly: allWeeklyBreaks, custom: allCustomBreaks },
  };
}

  /* =====================================================
   Find Service In Provider
   ===================================================== */
  private findServiceInProvider(provider: any, serviceId: string) {
    for (const category of provider.services || []) {
      const found = category.items.find((s) => s._id.toString() === serviceId);
      if (found) return found;
    }
    return null;
  }

  /* =====================================================
   Disable Past Slots
   ===================================================== */
  private disablePastSlots(result: any, date: string) {
    const now = new Date();
    const selectedDate = new Date(date);

    if (!result.isOpen || !result.slots?.length) return result;

    result.slots = result.slots.map((slot) => {
      const [h, m] = slot.time.split(':').map(Number);

      const slotDate = new Date(selectedDate);
      slotDate.setHours(h, m, 0, 0);

      if (selectedDate.toDateString() === now.toDateString()) {
        return {
          ...slot,
          available: slot.available && slotDate > now,
        };
      }

      return slot;
    });

    return result;
  }

  /* =====================================================
   Generate Day Slots
   ===================================================== */
  private async generateDaySlots(
    providerId: string,
    dateStr: string,
    duration: number,
    scheduleSource: any,
    employeeIds?: string[],
    breaksSource?: any,
  ) {
    const targetDate = new Date(dateStr);

    const days = [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ];

    const dayName = days[targetDate.getDay()];

    // Check for exception dates first (specific date overrides)
    const exception = scheduleSource?.exceptions?.find(
      (exc: any) => new Date(exc.date).toDateString() === targetDate.toDateString(),
    );

    let schedule: any;
    let isException = false;

    if (exception) {
      // Use exception schedule if it exists
      isException = true;
      schedule = {
        day: dayName,
        isOpen: exception.isOpen,
        openTime: exception.openTime,
        closeTime: exception.closeTime,
      };
    } else {
      // Use regular weekly schedule
      schedule = scheduleSource?.weekly?.find((d: any) => d.day === dayName);
    }

    if (!schedule?.isOpen || !schedule.openTime || !schedule.closeTime) {
      return {
        date: dateStr,
        day: dayName,
        isOpen: false,
        slots: [],
      };
    }

    const startMinutes = this.timeToMinutes(schedule.openTime);
    const endMinutes = this.timeToMinutes(schedule.closeTime);

    const appointments = await this.getDayAppointments(
      providerId,
      dateStr,
      employeeIds,
    );

    // Get breaks for this specific day
    const dayBreaks = this.getBreaksForDay(
      breaksSource,
      dayName,
      targetDate,
    );

    const bufferTime = 0;

    let current = startMinutes;
    const slots: { time: string; available: boolean }[] = [];

    while (current + duration <= endMinutes) {
      const slotEnd = current + duration;

      // Check if slot overlaps with any break
      const isDuringBreak = this.isSlotDuringBreak(
        current,
        slotEnd,
        dayBreaks,
      );

      if (isDuringBreak) {
        // Slot is during a break - mark as unavailable
        slots.push({
          time: this.minutesToTime(current),
          available: false,
        });
        current += duration;
        continue;
      }

      // Check if ANY employee is free (for multiple employees scenario)
      // or the specific employee is free (for single employee scenario)
      const isBusy = this.isSlotBusy(
        current,
        slotEnd,
        appointments,
        employeeIds,
        bufferTime,
      );

      slots.push({
        time: this.minutesToTime(current),
        available: !isBusy,
      });

      current += duration;
    }

    return {
      date: dateStr,
      day: dayName,
      isOpen: true,
      openTime: schedule.openTime,
      closeTime: schedule.closeTime,
      slotDuration: duration,
      slots,
    };
  }

  /* =====================================================
   Get Breaks For Specific Day
   ===================================================== */
  private getBreaksForDay(
    breaksSource: any,
    dayName: string,
    targetDate: Date,
  ): any[] {
    if (!breaksSource) return [];

    const dayBreaks: any[] = [];

    // Get weekly breaks for this day
    if (breaksSource?.weekly?.length) {
      for (const brk of breaksSource.weekly) {
        if (brk.day === dayName) {
          dayBreaks.push({
            startTime: brk.startTime,
            endTime: brk.endTime,
            reason: brk.reason,
          });
        }
      }
    }

    // Get custom breaks for this specific date
    if (breaksSource?.custom?.length) {
      for (const brk of breaksSource.custom) {
        if (brk.status === BreakStatus.APPROVED) {
          const breakDate = new Date(brk.date);
          if (breakDate.toDateString() === targetDate.toDateString()) {
            dayBreaks.push({
              startTime: brk.startTime,
              endTime: brk.endTime,
              reason: brk.reason,
            });
          }
        }
      }
    }

    return dayBreaks;
  }

  /* =====================================================
   Check if Slot is During Break
   ===================================================== */
  private isSlotDuringBreak(
    startMin: number,
    endMin: number,
    dayBreaks: any[],
  ): boolean {
    if (!dayBreaks || dayBreaks.length === 0) return false;

    for (const brk of dayBreaks) {
      const breakStart = this.timeToMinutes(brk.startTime);
      const breakEnd = this.timeToMinutes(brk.endTime);

      // Check for overlap: slot overlaps with break if:
      // slot starts before break ends AND slot ends after break starts
      if (startMin < breakEnd && endMin > breakStart) {
        return true;
      }
    }

    return false;
  }

  /* =====================================================
   Get Day Appointments
   ===================================================== */
  private async getDayAppointments(
    providerId: string,
    dateStr: string,
    employeeIds?: string[],
  ) {
    const start = new Date(dateStr);
    start.setHours(0, 0, 0, 0);

    const end = new Date(dateStr);
    end.setHours(23, 59, 59, 999);

    const query: any = {
      providerId: new Types.ObjectId(providerId),
      'services.date': { $gte: start, $lte: end },
      status: {
        $in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
      },
    };

    // If employeeIds is provided and has values, filter by those employees
    // If it's an empty array, get all appointments (for union of employees scenario)
    if (employeeIds && employeeIds.length > 0) {
      query['services.employeeId'] = {
        $in: employeeIds.map((id) => new Types.ObjectId(id)),
      };
    }
    return this.appointmentModel.find(query).select('services');
  }

  /* =====================================================
   Slot Busy Checker - Checks if ANY employee is free
   ===================================================== */
  private isSlotBusy(
    startMin: number,
    endMin: number,
    appointments: any[],
    employeeIds?: string[],
    bufferTime = 15,
  ) {
    // If we have multiple employees, check if ALL employees are busy
    // A slot is available if at least ONE employee is free
    if (employeeIds && employeeIds.length > 1) {
      // For each employee, check if they are busy
      const busyEmployeeIds = new Set<string>();

      appointments.forEach((app) => {
        app.services.forEach((service: any) => {
          if (service.employeeId) {
            const appStart = this.timeToMinutes(service.timeSlot.start);
            const appEnd = this.timeToMinutes(service.timeSlot.end) + bufferTime;

            if (startMin < appEnd && endMin > appStart) {
              busyEmployeeIds.add(service.employeeId.toString());
            }
          }
        });
      });

      // Slot is busy only if ALL employees are busy
      const allBusy = employeeIds.every((id) => busyEmployeeIds.has(id));
      return allBusy;
    } else {
      // Single employee or no specific employee - check if any appointment overlaps
      return appointments.some((app) =>
        app.services.some((service: any) => {
          const appStart = this.timeToMinutes(service.timeSlot.start);
          const appEnd = this.timeToMinutes(service.timeSlot.end) + bufferTime;

          return startMin < appEnd && endMin > appStart;
        }),
      );
    }
  }

/* =====================================================
   Time Helpers
   ===================================================== */
  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }


  private minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;

    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  private breaksOverlap(
    start1: number,
    end1: number,
    start2: number,
    end2: number,
  ): boolean {
    return start1 < end2 && end1 > start2;
  }
  private getMongoDayNumber(day: string): number {
  const map = {
    SUNDAY: 1,
    MONDAY: 2,
    TUESDAY: 3,
    WEDNESDAY: 4,
    THURSDAY: 5,
    FRIDAY: 6,
    SATURDAY: 7,
  };

  return map[day];
}


  private getDayNameFromDate(date: string | Date): string {
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return days[dateObj.getDay()];
  }

  /* =====================================================
   Generate Day Slots For Multiple Employees
   (When no employee is selected - check each employee individually)
   ===================================================== */
  private async generateDaySlotsForMultipleEmployees(
    providerId: string,
    dateStr: string,
    duration: number,
    providerWorkingHours: any,
    employeesData: any[],
    providerBreaksSource: any,
  ) {
    const targetDate = new Date(dateStr);

    const days = [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ];

    const dayName = days[targetDate.getDay()];

    // Check for exception dates first
    const exception = providerWorkingHours?.exceptions?.find(
      (exc: any) => new Date(exc.date).toDateString() === targetDate.toDateString(),
    );

    let schedule: any;

    if (exception) {
      schedule = {
        day: dayName,
        isOpen: exception.isOpen,
        openTime: exception.openTime,
        closeTime: exception.closeTime,
      };
    } else {
      schedule = providerWorkingHours?.weekly?.find((d: any) => d.day === dayName);
    }

    if (!schedule?.isOpen || !schedule.openTime || !schedule.closeTime) {
      return {
        date: dateStr,
        day: dayName,
        isOpen: false,
        slots: [],
      };
    }

    // Calculate union of all employees' working hours for this day
    let earliestOpen = '';
    let latestClose = '';
    let isAnyEmployeeOpen = false;

    for (const employee of employeesData) {
      const empDay = employee.workingHours?.weekly?.find(
        (d: any) => d.day === dayName && d.isOpen,
      );
      if (empDay) {
        isAnyEmployeeOpen = true;
        if (!earliestOpen || empDay.openTime < earliestOpen) {
          earliestOpen = empDay.openTime;
        }
        if (!latestClose || empDay.closeTime > latestClose) {
          latestClose = empDay.closeTime;
        }
      }
    }

    // If no employee is working on this day, return closed
    if (!isAnyEmployeeOpen) {
      return {
        date: dateStr,
        day: dayName,
        isOpen: false,
        slots: [],
      };
    }

    // Constrain schedule to employees' working hours
    const providerStartMinutes = this.timeToMinutes(schedule.openTime);
    const providerEndMinutes = this.timeToMinutes(schedule.closeTime);
    const empStartMinutes = this.timeToMinutes(earliestOpen);
    const empEndMinutes = this.timeToMinutes(latestClose);

    // Use the intersection of provider and employee hours
    const startMinutes = Math.max(providerStartMinutes, empStartMinutes);
    const endMinutes = Math.min(providerEndMinutes, empEndMinutes);

    // If no valid time range after intersection
    if (startMinutes >= endMinutes) {
      return {
        date: dateStr,
        day: dayName,
        isOpen: false,
        slots: [],
      };
    }

    // Get all appointments for all employees on this day
    const employeeIds = employeesData.map(emp => emp._id.toString());
    const appointments = await this.getDayAppointments(
      providerId,
      dateStr,
      employeeIds,
    );

    // Get provider's breaks for this specific day
    const dayBreaks = this.getBreaksForDay(
      providerBreaksSource,
      dayName,
      targetDate,
    );

    const bufferTime = 15;

    let current = startMinutes;
    const slots: { time: string; available: boolean }[] = [];

    while (current + duration <= endMinutes) {
      const slotEnd = current + duration;
      const slotStartTime = this.minutesToTime(current);

      // Check if slot overlaps with provider's break
      const isDuringProviderBreak = this.isSlotDuringBreak(
        current,
        slotEnd,
        dayBreaks,
      );

      if (isDuringProviderBreak) {
        // Slot is during provider break - mark as unavailable
        slots.push({
          time: slotStartTime,
          available: false,
        });
        current += duration;
        continue;
      }

      // Check each employee individually
      // Slot is available if at least ONE employee is available
const isAvailable = this.isAnyEmployeeAvailable(
  current,
  slotEnd,
  appointments,
  employeesData,
  dayName,
  targetDate,
  bufferTime,
  providerBreaksSource?.employeesCustomBreaks,
);

      slots.push({
        time: slotStartTime,
        available: isAvailable,
      });

      current += duration;
    }

    return {
      date: dateStr,
      day: dayName,
      isOpen: true,
      openTime: schedule.openTime,
      closeTime: schedule.closeTime,
      slotDuration: duration,
      slots,
    };
  }

  /* =====================================================
   Check if ANY Employee is Available
   Returns true if at least one employee can take this slot
   ===================================================== */
private isAnyEmployeeAvailable(
  slotStartMin: number,
  slotEndMin: number,
  allAppointments: any[],
  employeesData: any[],
  dayName: string,
  targetDate: Date,
  bufferTime: number,
  employeesCustomBreaks?: Map<string, any[]>,
): boolean {

  for (const employee of employeesData) {

    const employeeId = employee._id.toString();

    const empWorkingHours = employee.workingHours;

    const empDaySchedule = empWorkingHours?.weekly?.find(
      (d: any) => d.day === dayName && d.isOpen,
    );

    if (!empDaySchedule) continue;

    const empStartMin = this.timeToMinutes(empDaySchedule.openTime);
    const empEndMin = this.timeToMinutes(empDaySchedule.closeTime);

    if (slotStartMin < empStartMin || slotEndMin > empEndMin) continue;

    /* ================================
       Merge employee breaks + DB breaks
    ================================= */

    const dbCustomBreaks = employeesCustomBreaks?.get(employeeId) || [];

    const empBreaks = {
      weekly: empWorkingHours?.breaks?.weekly || [],
      custom: [
        ...(empWorkingHours?.breaks?.custom || []),
        ...dbCustomBreaks,
      ],
    };

    const isOnBreak = this.isEmployeeOnBreak(
      empBreaks,
      dayName,
      targetDate,
      slotStartMin,
      slotEndMin,
    );

    if (isOnBreak) continue;

    const hasConflict = this.doesEmployeeHaveConflict(
      allAppointments,
      employeeId,
      slotStartMin,
      slotEndMin,
      bufferTime,
    );

    if (!hasConflict) {
      return true;
    }
  }

  return false;
}
  /* =====================================================
   Check if Employee is on Break for a specific slot
   ===================================================== */
  private isEmployeeOnBreak(
  employeeBreaks: any,
  dayName: string,
  targetDate: Date,
  slotStartMin: number,
  slotEndMin: number,
): boolean {

  if (!employeeBreaks) return false;

  /* =====================
     Weekly Breaks
  ===================== */

  if (employeeBreaks.weekly?.length) {

    for (const brk of employeeBreaks.weekly) {

      if (brk.day === dayName) {

        const breakStart = this.timeToMinutes(brk.startTime);
        const breakEnd = this.timeToMinutes(brk.endTime);

        if (slotStartMin < breakEnd && slotEndMin > breakStart) {
          return true;
        }
      }
    }
  }

  /* =====================
     Custom Breaks
  ===================== */

  if (employeeBreaks.custom?.length) {

    for (const brk of employeeBreaks.custom) {

      if (!brk.date) continue;

      const breakDate = new Date(brk.date);

      if (breakDate.toDateString() !== targetDate.toDateString()) continue;

      const breakStart = this.timeToMinutes(brk.startTime);
      const breakEnd = this.timeToMinutes(brk.endTime);

      if (slotStartMin < breakEnd && slotEndMin > breakStart) {
        return true;
      }
    }
  }

  return false;
}

  /* =====================================================
   Check if Employee has appointment conflict
   ===================================================== */
  private doesEmployeeHaveConflict(
    appointments: any[],
    employeeId: string,
    slotStartMin: number,
    slotEndMin: number,
    bufferTime: number,
  ): boolean {
    for (const app of appointments) {
      for (const service of app.services) {
        if (service.employeeId && service.employeeId.toString() === employeeId) {
          const appStart = this.timeToMinutes(service.timeSlot.start);
          const appEnd = this.timeToMinutes(service.timeSlot.end) + bufferTime;

          // Check if there's an overlap
          if (slotStartMin < appEnd && slotEndMin > appStart) {
            return true; // Conflict found
          }
        }
      }
    }

    return false; // No conflict
  }



  public async findByUserId(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('common.errors.INVALID_USER_ID');
    }

    return this.providerModel.findOne({
      userId: new Types.ObjectId(userId),
    });
  }

  async isApproved(userId: string): Promise<boolean> {
    const provider = await this.providerModel
      .findOne({ userId: userId }, { status: 1 })
      .lean();

    if (!provider) {
      return false;
    }

    return provider.status === ProviderStatus.APPROVED;
  }
  private normalizePhone(phone: string): string {
    return phone.replace(/\s+/g, '');
  }

  /* =====================================================
   SUPER ADMIN – List Providers With Status Filter
   ===================================================== */
  async findAllWithStatus(filters: GetProvidersFilterDto, userId?: string) {
    const {
      status,
      name,
      type,
      service,
      serviceCategory,
      location,
      rating,
      serviceLocation,
      latitude,
      longitude,
      page = 1,
      limit = 10,
    } = filters as any;

    const query: any = {};

    if (status) query.status = status;

    if (service) {
      query.services = {
        $elemMatch: {
          items: {
            $elemMatch: {
              $or: [{ name: { $regex: service, $options: 'i' } }],
            },
          },
        },
      };
    }

    if (serviceLocation) {
      query.serviceLocation = serviceLocation;
    }

    if (name) query.name = { $regex: name, $options: 'i' };


    if (serviceCategory) {
      let categoryId: any;

      if (Types.ObjectId.isValid(serviceCategory)) {
        categoryId = serviceCategory;
      } else {
        const lookup = await this.lookupService.getDataByKey(
          'SERVICE_CATEGORY',
          serviceCategory,
        );

        if (!lookup) throw new BadRequestException('common.errors.INVALID_SERVICE_CATEGORY');

        categoryId = lookup._id.toString();
      }

      query['services.category'] = new Types.ObjectId(categoryId);
    }

    if (type) {
      let typeId: any;

      if (Types.ObjectId.isValid(type)) {
        typeId = type;
      } else {
        const lookup = await this.lookupService.getDataByKey('PROVIDER_TYPE', type);

        if (!lookup) throw new BadRequestException('common.errors.INVALID_PROVIDER_TYPE');

        typeId = lookup._id.toString();
      }

      query.type = new Types.ObjectId(typeId);
    }

    if (location) query.address = { $regex: location, $options: 'i' };
    if (rating) query['rating.average'] = { $gte: rating };

    const skip = (page - 1) * limit;

    // =======================
    //   GEO FILTER
    // =======================
    let data: any[] = [];
    let total = 0;

    const hasGeo = latitude !== undefined && longitude !== undefined;

    if ((latitude && !longitude) || (!latitude && longitude)) {
      throw new BadRequestException('common.errors.LAT_LNG_REQUIRED_TOGETHER');
    }

    if (hasGeo) {
      const geoQuery: any = [
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [Number(longitude), Number(latitude)] },
            distanceField: 'distance',
            spherical: true,
            key: 'location',
            query,
          },
        },

        {
          $lookup: {
            from: 'lookups',
            localField: 'type',
            foreignField: '_id',
            as: 'type',
          },
        },

        {
          $unwind: {
            path: '$type',
            preserveNullAndEmptyArrays: true,
          },
        },

        { $sort: { distance: 1 } },
        { $skip: skip },
        { $limit: limit },
      ];

      data = await this.providerModel.aggregate(geoQuery);
      total = await this.providerModel.countDocuments(query);
    } else {
      data = await this.providerModel
        .find(query)
        .skip(skip)
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('type', 'code name')
        .populate('userId','phone email')
        .lean();

      total = await this.providerModel.countDocuments(query);
    }


    let favoriteIds: string[] = [];

    if (userId) {
      const customer = await this.customerProfileModel
        .findOne({ userId: new Types.ObjectId(userId) })
        .lean();

      favoriteIds = customer?.favorites?.map((f) => f.toString()) || [];
    }


    const dataMapped = data.map((p) => ({
      _id: p._id,
      name: p.name,
      description: p.description,
      status: p.status,
      phone: p.userId?.phone || null,
      email: p.userId?.email || null,
      type: p.type
        ? {
          id: (p.type as any)._id.toString(),
          code: (p.type as any).code,
          name: (p.type as any).name,
        }
        : null,
      address: p.address,
      rating: { average: p.rating?.average, count: p.rating?.count },
      _coverImage: p.coverImage,
      genderType: p.genderType,
      isFavorite: favoriteIds.includes(p._id.toString()),
      serviceLocation: p.serviceLocation,
      location: p.location,
      distance: (p as any).distance,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    return {
      data: dataMapped,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }


  async getProviderCustomers(providerUserId: string): Promise<ProviderCustomerResponseDto[]> {
    const providerObjectId = new Types.ObjectId(providerUserId);
    const salon = await this.providerModel.findOne({ userId: providerObjectId }).exec();
    if (!salon) throw new NotFoundException('common.errors.PROVIDER_SALON_NOT_FOUND');

    const appointments = await this.appointmentModel.find({ providerId: salon._id }).exec();
    const customerIds = appointments.map(a => a.customerId);

    const customers = await this.userModel
      .find({ _id: { $in: customerIds.map(id => new Types.ObjectId(id)) } })
      .select('-passwordHash') // remove password
      .exec();

    return customers.map(c => ({
      _id: c._id.toString(),
      name: c.name,
      phone: c.phone,
      email: c.email,
      role: c.role,
      status: c.status,
      fcmTokens: c.fcmTokens,
    }));
  }


  /* =====================================================
    Get Booking Statistics for Provider
  ===================================================== */
  async getBookingStats(
    userId: string,
    role: RoleType,
    period: 'week' | 'month' | 'year' | '3months' | '6months' | 'all' = 'all',
  ) {
    let provider;

    if (role === RoleType.PROVIDER) {
      provider = await this.providerModel.findOne({
        userId: new Types.ObjectId(userId),
      });
    }

    if (role === RoleType.EMPLOYEE) {
      const employee = await this.employeeModel.findOne({
        userId: new Types.ObjectId(userId),
      });

      if (!employee) {
        throw new NotFoundException('common.errors.EMPLOYEE_NOT_FOUND');
      }

      if (!employee.capabilities?.canViewStatistics) {
        throw new ForbiddenException('common.errors.NOT_ALLOWED');
      }

      provider = await this.providerModel.findById(employee.providerId);
    }

    if (!provider) throw new NotFoundException('common.errors.PROVIDER_NOT_FOUND');

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date();
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '3months':
        startDate = new Date();
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6months':
        startDate = new Date();
        startDate.setMonth(now.getMonth() - 6);
        break;
      case 'year':
        startDate = new Date();
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
      default:
        startDate = new Date(0);
        break;
    }

    const appointments = await this.appointmentModel
      .find({
        providerId: provider._id,
        createdAt: { $gte: startDate, $lte: now },
      })
      .select('status')
      .lean();

    const stats = {
      total: appointments.length,
      completed: appointments.filter(a => a.status === AppointmentStatus.COMPLETED).length,
      confirmed: appointments.filter(a => a.status === AppointmentStatus.CONFIRMED).length,
      pending: appointments.filter(a => a.status === AppointmentStatus.PENDING).length,
      cancelled: appointments.filter(a => a.status === AppointmentStatus.CANCELLED).length,
    };

    return stats;
  }


  async getProviderStats(userId: string, role: RoleType) {
    let provider;

    if (role === RoleType.PROVIDER) {
      provider = await this.providerModel.findOne({
        userId: new Types.ObjectId(userId),
      });
    }

    if (role === RoleType.EMPLOYEE) {
      const employee = await this.employeeModel.findOne({
        userId: new Types.ObjectId(userId),
      });

      if (!employee) {
        throw new NotFoundException('common.errors.EMPLOYEE_NOT_FOUND');
      }

      if (!employee.capabilities?.canViewStatistics) {
        throw new ForbiddenException('common.errors.NOT_ALLOWED');
      }

      provider = await this.providerModel.findById(employee.providerId);
    }

    if (!provider) {
      throw new NotFoundException('common.errors.PROVIDER_NOT_FOUND');
    }

    const totalServices = provider.services?.reduce(
      (acc, category) => acc + (category.items?.length || 0),
      0
    ) || 0;

    const totalEmployees = await this.employeeModel.countDocuments({ providerId: provider._id });

    const appointments = await this.appointmentModel.find({ providerId: provider._id }).exec();
    const totalBookings = appointments.length;

    const customerIds = appointments.map(a => a.customerId?.toString() || '');
    const totalCustomers = new Set(customerIds).size;

    const totalPackages = provider.packages?.length || 0;

    return {
      totalServices,
      totalEmployees,
      totalCustomers,
      totalBookings,
      totalPackages,
    };
  }

 async getRevenueStats(
    userId: string,
    role: RoleType,
    period: 'week' | 'month' | 'year' = 'week',
  ) {
    let provider;

    if (role === RoleType.PROVIDER) {
      provider = await this.providerModel.findOne({
        userId: new Types.ObjectId(userId),
      });
    }

    if (role === RoleType.EMPLOYEE) {
      const employee = await this.employeeModel.findOne({
        userId: new Types.ObjectId(userId),
      });

      if (!employee) {
        throw new NotFoundException('EMPLOYEE_NOT_FOUND');
      }

      if (!employee.capabilities?.canViewStatistics) {
        throw new ForbiddenException('NOT_ALLOWED');
      }

      provider = await this.providerModel.findById(employee.providerId);
    }

    if (!provider) {
      throw new NotFoundException('PROVIDER_NOT_FOUND');
    }

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date();
        startDate.setDate(now.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(now.getMonth() - 11);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'year':
        startDate = new Date();
        startDate.setFullYear(now.getFullYear() - 4);
        startDate.setMonth(0, 1);
        startDate.setHours(0, 0, 0, 0);
        break;
    }

    const appointments = await this.appointmentModel.find({
      providerId: provider._id,
      status: AppointmentStatus.COMPLETED,
      createdAt: { $gte: startDate, $lte: now },
    }).lean();

    const calculateAppointmentRevenue = (appointment: any) => {
      if (!appointment.services) return 0;
      return appointment.services.reduce((sum, s) => sum + (s.price || 0), 0);
    };

    const result: Record<string, number> = {};

    if (period === 'week') {
      const last7Days: Date[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        last7Days.push(d);
      }

      last7Days.forEach(d => {
        const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
        result[dayName] = 0;
      });

      appointments.forEach(appt => {
        appt.services.forEach(service => {
          const serviceDate = new Date(service.date);
          last7Days.forEach(d => {
            if (
              serviceDate.getFullYear() === d.getFullYear() &&
              serviceDate.getMonth() === d.getMonth() &&
              serviceDate.getDate() === d.getDate()
            ) {
              const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
              result[dayName] += calculateAppointmentRevenue(appt);
            }
          });
        });
      });
    } else if (period === 'month') {
      for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        result[key] = 0;
      }

      appointments.forEach(appt => {
        appt.services.forEach(service => {
          const d = new Date(service.date);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          if (result[key] !== undefined) result[key] += calculateAppointmentRevenue(appt);
        });
      });
    } else if (period === 'year') {
      for (let i = 0; i < 5; i++) {
        const year = now.getFullYear() - i;
        result[year.toString()] = 0;
      }

      appointments.forEach(appt => {
        appt.services.forEach(service => {
          const year = new Date(service.date).getFullYear();
          const key = year.toString();
          if (result[key] !== undefined) result[key] += calculateAppointmentRevenue(appt);
        });
      });
    }

    return result;
  }

  async getBookingCounts(
    userId: string,
    role: RoleType,
    period: 'week' | 'month' | 'year' = 'week'
  ) {
    let provider;

    if (role === RoleType.PROVIDER) {
      provider = await this.providerModel.findOne({
        userId: new Types.ObjectId(userId),
      });
    }

    if (role === RoleType.EMPLOYEE) {
      const employee = await this.employeeModel.findOne({
        userId: new Types.ObjectId(userId),
      });

      if (!employee) {
        throw new NotFoundException('EMPLOYEE_NOT_FOUND');
      }

      if (!employee.capabilities?.canViewStatistics) {
        throw new ForbiddenException('NOT_ALLOWED');
      }

      provider = await this.providerModel.findById(employee.providerId);
    }

    if (!provider) {
      throw new NotFoundException('PROVIDER_NOT_FOUND');
    }

    const appointments = await this.appointmentModel.find({
      providerId: provider._id,
      status: 'COMPLETED',
    }).lean();

    const result: Record<string, number> = {};
    const now = new Date();

    if (period === 'week') {
      const last7Days: Date[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        last7Days.push(d);
      }

      last7Days.forEach(d => {
        const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
        result[dayName] = 0;
      });

      appointments.forEach(appt => {
        appt.services.forEach(service => {
          const serviceDate = new Date(service.date);
          last7Days.forEach(d => {
            if (
              serviceDate.getFullYear() === d.getFullYear() &&
              serviceDate.getMonth() === d.getMonth() &&
              serviceDate.getDate() === d.getDate()
            ) {
              const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
              result[dayName] += 1;
            }
          });
        });
      });
    } else if (period === 'month') {
      for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        result[key] = 0;
      }

      appointments.forEach(appt => {
        appt.services.forEach(service => {
          const d = new Date(service.date);
          const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
          if (result[key] !== undefined) result[key] += 1;
        });
      });

    } else if (period === 'year') {
      for (let i = 0; i < 5; i++) {
        result[(now.getFullYear() - i).toString()] = 0;
      }

      appointments.forEach(appt => {
        appt.services.forEach(service => {
          const year = new Date(service.date).getFullYear();
          const key = year.toString();
          if (result[key] !== undefined) result[key] += 1;
        });
      });
    }

    return result;
  }


async getHomeProviders(
  userId?: string,
  locationDto?: LocationDto,
) {
  const LIMIT = 20;

  const baseQuery: any = {
    status: ProviderStatus.APPROVED,
    //services: { $exists: true, $ne: [] },
  };

  // ========= Favorites =========
  let favoriteIds: string[] = [];

  if (userId) {
    const customer = await this.customerProfileModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .lean();

    favoriteIds =
      customer?.favorites?.map((f) => f.toString()) || [];
  }

  // ========= Newest =========
  const newestPromise = this.providerModel
    .find(baseQuery)
    .populate({
  path: 'type',
  select: 'code name',
})
    .sort({ createdAt: -1 })
    .limit(LIMIT)
    .lean();

  // ========= Top Rated =========
  const topRatedPromise = this.providerModel
    .find(baseQuery)
    .sort({ 'rating.average': -1 })
    .populate({
  path: 'type',
  select: 'code name',
})
    .limit(LIMIT)
    .lean();

  // ========= Nearest =========
  let nearestPromise: Promise<any[]> = Promise.resolve([]);

  if (
    locationDto?.latitude !== undefined &&
    locationDto?.longitude !== undefined &&
    locationDto.latitude >= -90 &&
    locationDto.latitude <= 90 &&
    locationDto.longitude >= -180 &&
    locationDto.longitude <= 180
  ) {
nearestPromise = this.providerModel.aggregate([
  {
    $geoNear: {
      near: {
        type: 'Point',
        coordinates: [
         locationDto.longitude,
         locationDto.latitude,
        ],
      },
      distanceField: 'distanceInKm',
      spherical: true,
      key: 'location',
      // maxDistance: 10000, //
      distanceMultiplier: 0.001,
      query: baseQuery,
    },
  },

  {
    $addFields: {
      distanceInKm: { $round: ['$distanceInKm', 2] },
    },
  },

  { $limit: LIMIT },

  {
    $lookup: {
      from: 'lookups',
      localField: 'type',
      foreignField: '_id',
      as: 'type',
    },
  },
  { $unwind: { path: '$type', preserveNullAndEmptyArrays: true } },
]);

  }
    // ===== anonymousList  =====
const anonymousPromise = this.providerModel
  .find(baseQuery)
  .populate({
    path: 'type',
    select: 'code name',
  })
  .limit(LIMIT)
  .lean();

const [newest, topRated, nearest, anonymousList] =
  await Promise.all([
    newestPromise,
    topRatedPromise,
    nearestPromise,
    anonymousPromise,
  ]);

  // ========= Mapper =========
  const mapProvider = (p: any) => ({
    _id: p._id,
    userId: p.userId,
    name: p.name,
      type: p.type
    ? {
        id: p.type._id,
        code: p.type.code,
        name: {
          ...p.type.name,
          _id: p.type.name?._id,
        },
      }
    : null,
    description: p.description,
    address: p.address,
    logo: p.logo,
    coverImage: p.coverImage,
    serviceLocation: p.serviceLocation,
    rating: p.rating,
    genderType: p.genderType,
    location: p.location ?? null,
      distanceInKm: p.distanceInKm ?? null, // ✅ أضف هذا

    isFavorite: favoriteIds.includes(
      p._id.toString(),
    ),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  });

  return {
    newest: newest.map(mapProvider),
    topRated: topRated.map(mapProvider),
    nearest: nearest.map(mapProvider),
    anonymousList: anonymousList.map(mapProvider),

  };
}
/* =====================================================
   Sync Employees Working Hours to Provider
   Called when provider updates their working hours
   ===================================================== */
  private async syncEmployeesWorkingHours(
    providerId: Types.ObjectId,
    session: ClientSession,
  ): Promise<void> {
    // Get the provider with updated working hours
    const provider = await this.providerModel.findById(providerId).session(session);

    if (!provider || !provider.workingHours || !provider.workingHours.weekly) {
      return;
    }

    // Get all employees for this provider who have custom working hours
    const employees = await this.employeeModel
      .find({
        providerId: providerId,
        workingHours: { $exists: true, $ne: null },
      })
      .session(session);

    if (employees.length === 0) {
      return;
    }

    // For each employee, update their working hours based on provider changes
    for (const employee of employees) {
      if (!employee.workingHours || !employee.workingHours.weekly) {
        continue;
      }

      // Get the old provider working hours (before update) - we need to compare
      // Since we're in the update flow, we use the dto values that were applied

      // Process each day in provider's working hours
      for (const providerDay of provider.workingHours.weekly) {
        const employeeDay = employee.workingHours.weekly.find(
          (d) => d.day === providerDay.day,
        );

        if (!employeeDay) {
          // Employee doesn't have this day, skip (they'll fall back to provider)
          continue;
        }

        // Case 1: Provider closes a day (isOpen: false)
        // → Employee should also be closed
        if (providerDay.isOpen === false) {
          employeeDay.isOpen = false;
          employeeDay.openTime = undefined;
          employeeDay.closeTime = undefined;
          continue;
        }

        // Provider is open, but employee was closed
        // → No change to employee (they stay closed or can open separately)
        if (employeeDay.isOpen === false) {
          continue;
        }

        // Now both provider and employee are open
        // We need to ensure employee hours are within provider hours

        // Get old provider values from the existing provider.workingHours (before this update completed)
        // Since we're inside the update transaction, we need to get the original values
        // For simplicity, we'll use the current providerDay values (which are the NEW values)

        if (providerDay.openTime && employeeDay.openTime) {
          const providerOpenMinutes = this.timeToMinutes(providerDay.openTime);
          const employeeOpenMinutes = this.timeToMinutes(employeeDay.openTime);

          // Case 2: Provider opens later (10 → 12)
          // → Employee open time should be >= new provider open time
          if (employeeOpenMinutes < providerOpenMinutes) {
            employeeDay.openTime = providerDay.openTime;
          }
        }

        if (providerDay.closeTime && employeeDay.closeTime) {
          const providerCloseMinutes = this.timeToMinutes(providerDay.closeTime);
          const employeeCloseMinutes = this.timeToMinutes(employeeDay.closeTime);

          // Case 3: Provider closes earlier (18 → 16)
          // → Employee close time should be <= new provider close time
          if (employeeCloseMinutes > providerCloseMinutes) {
            employeeDay.closeTime = providerDay.closeTime;
          }
        }

        // Case 4: Employee within provider range
        // → No change needed (already handled above)
      }

      // Save the employee with updated working hours
      await employee.save({ session });
    }
  }

  async updateManyStatus(
    providerIds: string[],
    status: 'ACTIVE' | 'UNPAID',
    reason?: string,
  ) {
    return this.providerModel.updateMany(
      { _id: { $in: providerIds } },
      {
        $set: {
          status,
          ...(reason ? { rejectionReason: reason } : {}),
        },
      },
    );
  }

  async updateStatus(providerId: string, status: ProviderStatus) {
    return this.providerModel.updateOne(
      { _id: providerId },
      { $set: { status } }
    );
  }

  // delete working hours (break weekly) of provider
  async deleteBreak(
  providerId: string,
  breakId: string,
  type: 'weekly' | 'custom',
) {
  const path =
    type === 'weekly'
      ? 'workingHours.breaks.weekly'
      : 'workingHours.breaks.custom';

  const provider = await this.providerModel.findOneAndUpdate(
    {
      userId: new Types.ObjectId(providerId),
    },
    {
      $pull: {
        [path]: {
          _id: new Types.ObjectId(breakId),
        },
      },
    },
    { new: true },
  );

 
  if (!provider) {
    throw new NotFoundException('common.errors.SERVICE_PROVIDER_NOT_FOUND');
  }

  return {
    message: 'common.success.BREAK_DELETED',
  };
}

async getByOwnerUserIdWithSession(userId: string, session: any) {
  return this.providerModel.findOne({ userId: new Types.ObjectId(userId) }).session(session);
}

async markProviderAsDeleted(
  providerId: string,
  session: any,
  reason?: string,
) {
  await this.providerModel.updateOne(
    { _id: new Types.ObjectId(providerId) },
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        deleteReason: reason || '',
        isActive: false,
        status: ProviderStatus.DELETED,
      },
    },
    { session },
  );
}

async deactivateEmployeesByProvider(providerId: string, session: any) {
  if (!Types.ObjectId.isValid(providerId)) {
    throw new BadRequestException('Invalid providerId');
  }

  const providerObjectId = new Types.ObjectId(providerId);
  const now = new Date();

  const employees = await this.employeeModel
    .find({ providerId: providerObjectId })
    .select('userId')
    .session(session);

  await this.employeeModel.updateMany(
    { providerId: providerObjectId },
    {
      $set: {
        isActive: false,
        isDeleted: true,
        deletedAt: now,
        deleteReason: '',
      },
    },
    { session },
  );

  const employeeUserIds = employees
    .map((e: any) => e.userId)
    .filter(Boolean);

  if (employeeUserIds.length > 0) {
    const users = await this.userModel.find({
      _id: { $in: employeeUserIds },
    }).session(session);

    for (const user of users) {
      user.isDeleted = true;
      user.deletedAt = now;
      user.deleteReason = '';
      user.status = UserStatus.DELETED;

      user.name = 'Deleted User';
      if (user.email) {
        user.email = `deleted_${user._id}@deleted.local`;
      }
      user.phone = `deleted_${user._id}`;
      user.fcmTokens = [];

      await user.save({ session });
    }
  }
}

}
