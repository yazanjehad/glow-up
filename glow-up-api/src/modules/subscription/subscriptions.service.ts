import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
 
import { ProviderSubscription } from './schemas/provider-subscription.schema';
import { SubscriptionPlan } from './schemas/subscription-plan.schema';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { ProviderService } from '../provider/provider.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscripionStatus } from 'src/common/enum/subscriptionStatus.enum'
import { ProviderStatus } from 'src/common/enum/providerstatus.enum';
import { GetAllSubscriptionsDto } from './dto/get-all-subscriptions.dto';
import { ServiceProvider, ServiceProviderDocument } from '../provider/schemas/service-provider.schema';
import { PlanType } from 'src/common/enum/planType.enum';
 

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectModel(ProviderSubscription.name)
    private providerSubscriptionModel: Model<ProviderSubscription>,
    @InjectModel(SubscriptionPlan.name)
    private planModel: Model<SubscriptionPlan>,

    @InjectModel(ServiceProvider.name)
    private providerModel: Model<ServiceProviderDocument>,
    private readonly providerService: ProviderService,
  ) {}
  async getAllSubscriptions(query: GetAllSubscriptionsDto) {
  const {
    page = 1,
    limit = 10,
    providerId,
    status,
    createdFrom,
    createdTo,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = query;

  const filter: any = {};

  if (providerId) {
  if (!Types.ObjectId.isValid(providerId)) {
    throw new BadRequestException('common.errors.INVALID_PROVIDER_ID_FORMAT');
  }

  filter.providerId = new Types.ObjectId(providerId);
}

  if (status) {
    filter.status = status;
  }

  if (createdFrom || createdTo) {
    filter.createdAt = {};

    if (createdFrom) {
      filter.createdAt.$gte = new Date(createdFrom);
    }

    if (createdTo) {
      const toDate = new Date(createdTo);
      toDate.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = toDate;
    }
  }

  const skip = (page - 1) * limit;
  const sortDirection = sortOrder === 'asc' ? 1 : -1;
const allowedSortFields = ['createdAt', 'startDate', 'endDate', 'status'];
const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
const [items, total] = await Promise.all([
  this.providerSubscriptionModel
    .find(filter)
    .populate('planId')
    .populate({
      path: 'providerId',
      select: 'name userId status',
      populate: {
        path: 'userId',
        select: 'name email phone status',
      },
    })
    .sort({ [safeSortBy]: sortDirection })
    .skip(skip)
    .limit(limit)
    .lean(),
  this.providerSubscriptionModel.countDocuments(filter),
]);
  return {
    items,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
  };
}
  async getPlans() {
    return this.planModel
      .find({ isDeleted: { $ne: true } })
      .sort({ createdAt: -1 });
  }

  async createPlan(dto: CreatePlanDto) {
    const plan = new this.planModel(dto);
    return plan.save();
  }

  async updatePlan(planId: string, dto: UpdatePlanDto) {
    const plan = await this.planModel.findByIdAndUpdate(planId, dto, { new: true });
    if (!plan) throw new NotFoundException('common.errors.PLAN_NOT_FOUND');
    return plan;
  }

  async deactivatePlan(planId: string) {
    const plan = await this.planModel.findById(planId);
    if (!plan) throw new NotFoundException('common.errors.PLAN_NOT_FOUND');

    plan.isDeleted = true;
    await plan.save();

    return { message: 'common.success.PLAN_DEACTIVATED' };
  }

  async subscribeProviderByAdmin(
    dto: CreateSubscriptionDto,
   
  ) {
      const provider = await this.providerService.getByIdSimple(dto.providerId);
      if (!provider) throw new NotFoundException('common.errors.PROVIDER_NOT_FOUND');

      const activeSubscription = await this.providerSubscriptionModel.findOne({
        providerId: provider._id,
        status: SubscripionStatus.ACTIVE,
      });

      if (activeSubscription) {

        const currentPlan = await this.planModel.findById(activeSubscription.planId);
        const newPlan = await this.planModel.findById(dto.planId);

        if (!currentPlan || !newPlan) {
          throw new NotFoundException('common.errors.PLAN_NOT_FOUND');
        }

        const currentType = currentPlan.type;
        const newType = newPlan.type;

        if (currentType === PlanType.DAYS && newType === PlanType.DAYS) {
          throw new BadRequestException('common.errors.PROVIDER_ALREADY_HAS_ACTIVE_DAYS_SUBSCRIPTION');
        }

        if (currentType === PlanType.DAYS && newType === PlanType.PERCENT) {
          throw new BadRequestException('common.errors.CANNOT_SWITCH_DAYS_TO_PERCENT');
        }

        if (currentType === PlanType.PERCENT && newType === PlanType.DAYS) {
          activeSubscription.status = SubscripionStatus.CANCELLED;
          await activeSubscription.save();
        }

        if (currentType === PlanType.PERCENT && newType === PlanType.PERCENT) {
          activeSubscription.status = SubscripionStatus.CANCELLED;
          await activeSubscription.save();
        }
      }

       const plan = await this.planModel.findOne({ 
        _id: dto.planId,
        isActive: true,
      });
      if (!plan) throw new NotFoundException('common.errors.PLAN_NOT_FOUND');


      const startDate = new Date();
      let endDate: Date | null = null;
      if (plan.durationDays) {
        endDate = new Date();
        endDate.setDate(startDate.getDate() + plan.durationDays);
      }

    const subscription = await this.providerSubscriptionModel.create({
      providerId: provider._id,
      planId: plan._id,

      plan: {
        name: plan.name,
        price: plan.price,
        durationDays: plan.durationDays,
        commissionPercent: plan.commissionPercent,
      },

      startDate,
      endDate,
      status: SubscripionStatus.ACTIVE,
      notes: dto.notes || '',
      paymentMethod: dto.paymentMethod,
    });

    /* ===== Update Provider Status to APPROVED ===== */
    await this.providerModel.findByIdAndUpdate(provider._id, {
      status: ProviderStatus.APPROVED,
    });


    return {
      ...subscription.toObject(),
      plan,
    };
  }

async getProviderSubscription(providerId: string) {
  if (!Types.ObjectId.isValid(providerId)) {
    throw new BadRequestException('common.errors.INVALID_PROVIDER_ID_FORMAT');
  }

  const subscription = await this.providerSubscriptionModel
    .findOne({
      providerId: new Types.ObjectId(providerId),
      status: SubscripionStatus.ACTIVE,
    })
    .sort({ createdAt: -1 }) 

  if (!subscription) return null;

  const remainingDays = this.calculateRemainingDays(subscription.endDate);

  const { planId, ...rest } = subscription.toObject();

  return {
    ...rest,
    planId: planId,
    remainingDays,
  };
}
  async checkProviderActive(providerId: string) {
    if (!Types.ObjectId.isValid(providerId)) {
  throw new BadRequestException('common.errors.INVALID_PROVIDER_ID_FORMAT');
}

   const providerObjectId = new Types.ObjectId(providerId);
    const subscription = await this.providerSubscriptionModel
     .findOne({ providerId: providerObjectId, status: SubscripionStatus.ACTIVE })
      .populate('planId');

    if (!subscription) return false;
    if (subscription.endDate && subscription.endDate < new Date()) return false;

    return true;
  }

  async getProviderSubscriptionByUser(userId: string) {
    const provider = await this.providerService.getByOwnerUserId(userId);
    if (!provider) throw new NotFoundException('common.errors.PROVIDER_NOT_FOUND');

    const subscription = await this.providerSubscriptionModel
      .findOne({ providerId: provider._id })
      .sort({ createdAt: -1 })
    if (subscription && subscription.status === SubscripionStatus.ACTIVE && subscription.endDate && subscription.endDate < new Date()) {
      subscription.status = SubscripionStatus.EXPIRED;
      await subscription.save();
    }

    if (!subscription) throw new NotFoundException('common.errors.NO_ACTIVE_SUBSCRIPTION_FOUND');

    const remainingDays = this.calculateRemainingDays(subscription.endDate);

    const { planId, ...rest } = subscription.toObject();

    return {
      ...subscription.toObject(),
      remainingDays,
    };
  }

  private calculateRemainingDays(endDate: Date | null): number | null {
    if (!endDate) return null;

    const now = new Date();

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async updateExpiredSubscriptions() {
    const now = new Date();

    const expiredSubscriptions = await this.providerSubscriptionModel.find({
      status: SubscripionStatus.ACTIVE,
      endDate: { $lt: now },
    });

    if (expiredSubscriptions.length === 0) return;

    await this.providerSubscriptionModel.updateMany(
      { _id: { $in: expiredSubscriptions.map(s => s._id) } },
      { $set: { status: SubscripionStatus.EXPIRED } },
    );

    const providerIds = expiredSubscriptions.map(s => s.providerId.toString());

    await this.providerService.updateManyStatus(
      providerIds,
      ProviderStatus.UNPAID,
      'Subscription expired'
    );
  }
}