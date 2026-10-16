import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { Coupon, CouponDocument } from './schemas/coupon.schema';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { User, UserDocument } from '../users/schemas/user.schema';
import {
  ServiceProvider,
  ServiceProviderDocument,
} from '../provider/schemas/service-provider.schema';
import { PaymentService } from '../payment/payment.service';
import { PaymentType } from '../appointment/enum/paymenttype.enum';
import { PaymentStatus } from '../appointment/enum/paymentstatus.enum';
import { CouponStatus } from './enum/coupon.status';
import { CouponUsageDto } from './dto/coupon.usage.dto';
import { GetCouponsFilterDto } from './dto/get.coupons.filter.dto';
import { RoleType } from 'src/common/enum/roletype.enum';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class CouponService {
  constructor(
    @InjectModel(Coupon.name)
    private readonly couponModel: Model<CouponDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(ServiceProvider.name)
    private readonly serviceProviderModel: Model<ServiceProviderDocument>,

    private readonly paymentService: PaymentService,
    private readonly walletService: WalletService,
  ) {}

  async purchaseCoupon(
    dto: CreateCouponDto,
    userId: string,
    paymentMethod: PaymentType = PaymentType.VISA,
    session?: ClientSession,
  ): Promise<Coupon> {
    const s = session ?? (await this.userModel.db.startSession());
    let newTransaction = false;

    if (!session) {
      s.startTransaction();
      newTransaction = true;
    }

    try {
      // ======== Verify purchaser exists ========
      const purchaser = await this.userModel.findById(userId).session(s);
      if (!purchaser) throw new NotFoundException('common.errors.PURCHASER_NOT_FOUND');

      // ======== Verify provider exists ========
      const provider = await this.serviceProviderModel
        .findById(dto.providerId)
        .session(s);
      if (!provider) throw new NotFoundException('common.errors.PROVIDER_NOT_FOUND');

      // ======== Calculate total and snapshot ========
      let totalPrice = 0;
      const servicesSnapshot = (dto.services || []).map((srv) => {
        const serviceDef = provider.services
          .flatMap((c) => c.items)
          .find((i) => i._id.toString() === srv.serviceId.toString());

        if (!serviceDef) {
          throw new BadRequestException({
            message: 'common.errors.SERVICE_NOT_FOUND_IN_PROVIDER',
            args: { serviceId: srv.serviceId.toString() },
          });
        }

        totalPrice += serviceDef.price;
        return { serviceId: srv.serviceId };
      });

      // ======== Generate unique coupon code ========
      let couponCode = this.generateCouponCode();
      while (await this.couponModel.findOne({ code: couponCode }).session(s)) {
        couponCode = this.generateCouponCode();
      }

      // ======== Create coupon ========
      const [coupon] = await this.couponModel.create(
        [
          {
            purchaserId: new Types.ObjectId(purchaser._id),
            providerId: new Types.ObjectId(dto.providerId),
            services: servicesSnapshot,
            totalPrice,
            receivesPhone: dto.receivesPhone,
            status: CouponStatus.ACTIVE,
            code: couponCode,
          },
        ],
        newTransaction ? { session: s } : undefined,
      );

      // ======== Determine payment status and method ========
      let paymentStatus = PaymentStatus.PENDING;
      let paymentMethod = dto.paymentMethod ?? PaymentType.VISA;

      if (paymentMethod === PaymentType.WALLET) {
        await this.walletService.deductCredit(
          userId,
          { amount: totalPrice, description: `Purchase coupon ${coupon._id}` },
          s,
        );
        paymentStatus = PaymentStatus.PAID;
      }

      // ======== Create payment ========
      await this.paymentService.create(
        {
          customerId: purchaser._id.toString(),
          couponId: coupon._id.toString(),
          providerId: dto.providerId.toString(),
          items: servicesSnapshot.map((s) => {
            const serviceDef = provider.services
              .flatMap((c) => c.items)
              .find((i) => i._id.toString() === s.serviceId.toString())!;
            return {
              serviceId: s.serviceId.toString(),
              name: serviceDef.name,
              price: serviceDef.price,
              quantity: 1,
              durationMinutes: serviceDef.durationMinutes,
            };
          }),
          amount: {
            subtotal: totalPrice,
            discount: 0,
            tax: 0,
            total: totalPrice,
          },
          method: paymentMethod, // هنا مهم: WALLET أو VISA
          status: paymentStatus,
        },
        s,
      );

      // ======== Commit transaction if started here ========
      if (newTransaction) {
        await s.commitTransaction();
        s.endSession();
      }

      return coupon;
    } catch (error) {
      if (newTransaction) {
        await s.abortTransaction();
        s.endSession();
      }
      throw error;
    }
  }

  async useCoupon(
    providerId: string,
    customerId: string,
    code: string,
    usageDto: CouponUsageDto,
    session?: ClientSession,
  ): Promise<CouponUsageDto> {
    const s = session ?? (await this.userModel.db.startSession());
    let newTransaction = false;

    if (!session) {
      s.startTransaction();
      newTransaction = true;
    }

    try {
      // ======== Find user ========
      const provider = await this.serviceProviderModel
        .findById(providerId)
        .session(s);
      if (!provider) throw new NotFoundException('common.errors.PROVIDER_SALON_NOT_FOUND');

      // ======== Find coupon ========
      const coupon = await this.couponModel.findOne({ code }).session(s);
      if (!coupon) throw new NotFoundException('common.errors.COUPON_NOT_FOUND');

      if (coupon.providerId.toString() !== provider._id.toString()) {
        const correctProvider = await this.serviceProviderModel
          .findById(coupon.providerId)
          .session(s);

        throw new BadRequestException({
          message: 'common.errors.COUPON_VALID_AT_SALON',
          args: { salonName: correctProvider?.name || 'the original salon' },
        });
      }

      const customer = await this.userModel.findById(customerId).session(s);
      if (!customer || customer.phone !== coupon.receivesPhone) {
        throw new BadRequestException('common.errors.COUPON_NOT_BELONG_TO_USER');
      }

      if (coupon.expiredAt && coupon.expiredAt < new Date()) {
        throw new BadRequestException('common.errors.COUPON_EXPIRED');
      }

      const remaining = coupon.totalPrice - (coupon.usedPrice || 0);
      if (remaining <= 0) throw new BadRequestException('common.errors.COUPON_FULLY_USED');

      const usedAmount = Math.min(usageDto.usedAmount, remaining);
      const totalUsed = (coupon.usedPrice || 0) + usedAmount;

      coupon.usedPrice = totalUsed;

      if (totalUsed >= coupon.totalPrice) {
        coupon.status = CouponStatus.USED;
      } else if (totalUsed > 0) {
        coupon.status = CouponStatus.PARTIAL_USED;
      }

      const usageRecord = {
        appointmentId: new Types.ObjectId(usageDto.appointmentId),
        usedAmount,
        usedAt: usageDto.usedAt,
      };

      coupon.usageHistory = [...(coupon.usageHistory || []), usageRecord];
      coupon.remaining = coupon.totalPrice - totalUsed;

      await coupon.save({ session: s });

      if (newTransaction) {
        await s.commitTransaction();
        s.endSession();
      }

      return {
        appointmentId: usageRecord.appointmentId.toString(),
        usedAmount: usageRecord.usedAmount,
        usedAt: usageRecord.usedAt,
      };
    } catch (error) {
      if (newTransaction) {
        await s.abortTransaction();
        s.endSession();
      }
      throw error;
    }
  }

  async getByCode(
    code: string,
    userId: string,
    providerId: string,
    session?: ClientSession,
  ) {
    const user = await this.userModel.findById(userId).session(session ?? null);
    if (!user) throw new NotFoundException('common.errors.USER_NOT_FOUND');

    const coupon = await this.couponModel
      .findOne({ code: code.trim().toUpperCase() })
      .session(session ?? null);

    if (!coupon) {
      throw new NotFoundException('common.errors.COUPON_NOT_FOUND');
    }

    if (coupon.providerId.toString() !== providerId.trim()) {
      throw new BadRequestException('common.errors.COUPON_VALID_AT_ORIGINAL_PROVIDER');
    }

    /* ===== Status Check(Active or Partially Used) ===== */
    if (
      coupon.status !== CouponStatus.ACTIVE &&
      coupon.status !== CouponStatus.PARTIAL_USED
    ) {
      throw new BadRequestException('common.errors.COUPON_NOT_USABLE');
    }

    /* ===== Expiry Check ===== */
    if (coupon.expiredAt < new Date()) {
      throw new BadRequestException('common.errors.COUPON_EXPIRED');
    }

    /* ===== User Phone Check ===== */
    if (user.phone !== coupon.receivesPhone) {
      throw new BadRequestException('common.errors.USER_PHONE_NOT_MATCH_COUPON');
    }
    /* ===== Remaining Check ===== */
    if (coupon.remaining !== undefined && coupon.remaining <= 0) {
      throw new BadRequestException('common.errors.COUPON_FULLY_USED');
    }

    return coupon;
  }

  async getMyCoupons(userId: string, filters: GetCouponsFilterDto) {
    const { status, page = 1, limit = 10 } = filters;

    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('common.errors.USER_NOT_FOUND');

    const query: any = {
      purchaserId: new Types.ObjectId(userId),
    };

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [coupons, total] = await Promise.all([
      this.couponModel
        .find(query)
        .sort({ createdAt: -1 })
        .populate({ path: 'purchaserId', select: 'name' })
        .populate({ path: 'providerId', select: 'name' })
        .skip(skip)
        .limit(limit),

      this.couponModel.countDocuments(query),
    ]);

    /* ===== Response ===== */
    return {
      data: coupons,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  async getAllCoupons(filters: GetCouponsFilterDto, userId: string) {
    const { status, page = 1, limit = 10 } = filters;

    // Only admins can access all coupons if role not admin
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('common.errors.USER_NOT_FOUND');
    if (user.role !== RoleType.ADMIN && user.role !== RoleType.SUPER_ADMIN) {
      throw new BadRequestException('common.errors.ACCESS_DENIED_ADMINS_ONLY');
    }

    const query: any = {};

    if (status) {
      query.status = status;
    }

    const total = await this.couponModel.countDocuments(query);

    // Find coupons with pagination
    const coupons = await this.couponModel
      .find(query)
      .sort({ createdAt: -1 })
      .populate({ path: 'purchaserId', select: 'name' })
      .populate({ path: 'providerId', select: 'name' })
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      data: coupons,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  private generateCouponCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomPart = '';
    for (let i = 0; i < 6; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `GLOW-${randomPart}`;
  }

  async refundCouponUsage(
    appointmentId: string,
    session?: ClientSession,
  ) {
    const coupon = await this.couponModel.findOne({
      'usageHistory.appointmentId': new Types.ObjectId(appointmentId),
    }).session(session ?? null);

    if (!coupon) return null;

    const usageHistory = coupon.usageHistory ?? [];

    const usageIndex = usageHistory.findIndex(
      (u) => u.appointmentId.toString() === appointmentId,
    );

    if (usageIndex === -1) return null;

    const usage = usageHistory[usageIndex];


    coupon.usedPrice = (coupon.usedPrice || 0) - usage.usedAmount;

    if (coupon.usedPrice < 0) coupon.usedPrice = 0;


    usageHistory.splice(usageIndex, 1);


    coupon.usageHistory = usageHistory;


    coupon.remaining = coupon.totalPrice - coupon.usedPrice;


    if (coupon.usedPrice === 0) {
      coupon.status = CouponStatus.ACTIVE;
    } else if (coupon.usedPrice < coupon.totalPrice) {
      coupon.status = CouponStatus.PARTIAL_USED;
    }

    await coupon.save({ session });

    return coupon;
  }
}
