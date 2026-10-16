import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserPackage, UserPackageDocument, UserPackageItem } from './schemas/user-package.schema';
import { Payment, PaymentDocument, PaymentItem, PaymentAmount } from '../payment/schemas/payment.schema';
import { ServiceProvider, ServiceProviderDocument, Package } from '../provider/schemas/service-provider.schema';
import { UserPackageStatus } from '../../common/enum/userpackegestatus.enum';
import { PaymentType } from '../appointment/enum/paymenttype.enum';
import { PaymentStatus } from '../appointment/enum/paymentstatus.enum';
import { PaymentService } from '../payment/payment.service';
import { I18nService } from 'nestjs-i18n';
import { CreateUserPackageDto } from './dto/create-user-package.dto';
import { UserPackageResponseDto } from './dto/user-package.response.dto';
import { WalletService } from '../wallet/wallet.service';
import { PreviewPackageDto } from './dto/preview-package.dto';
 
@Injectable()
export class UserPackageService {
  constructor(
    @InjectModel(UserPackage.name) private userPackageModel: Model<UserPackageDocument>,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(ServiceProvider.name) private providerModel: Model<ServiceProviderDocument>,
    private readonly paymentService: PaymentService,
    private readonly i18n: I18nService,
    private readonly walletService: WalletService,
  ) {}

async purchasePackage(
  dto: CreateUserPackageDto,
  userId: string,
  paymentMethod: PaymentType = PaymentType.VISA,
): Promise<UserPackageResponseDto> {
  const session = await this.userPackageModel.db.startSession();
  session.startTransaction();

  try {
    const { providerId, packageId } = dto;

    // ===== Load Provider =====
    const provider = await this.providerModel.findById(providerId).session(session).exec();
    if (!provider)
      throw new NotFoundException('common.errors.PROVIDER_NOT_FOUND');


    // ===== Find Selected Package =====
    const selectedPackage = provider.packages?.find(
      (pkg) => (pkg as any)._id.toString() === packageId
    );
    if (!selectedPackage)
      throw new NotFoundException('common.errors.PACKAGE_NOT_FOUND');

    // ===== Prevent Purchase If Package Not Active =====
    if (!selectedPackage.isActive) {
      throw new ForbiddenException('common.errors.PACKAGE_DISABLED');
    }
    

    // ===== Check for Existing Active Package =====
    const existingPackage = await this.userPackageModel.findOne({
      userId,
      packageId,
      status:  UserPackageStatus.ACTIVE ,
    }).session(session).exec();
    if (existingPackage) {
      throw new BadRequestException('common.errors.YOU_ALREADY_HAVE_ACTIVE_PACKAGE');
    }

    const totalAmount = selectedPackage.price;
    let paymentStatus = PaymentStatus.PENDING;

    // ===== Deduct from Wallet if paymentMethod is WALLET =====
const paymentMethodToUse = dto.paymentMethod || PaymentType.VISA;

if (paymentMethodToUse === PaymentType.WALLET) {
  await this.walletService.deductCredit(
    userId,
    {
      amount: totalAmount,
      description: `Purchase package ${packageId}`,
    },
    session,
  );
  paymentStatus = PaymentStatus.PAID;
}

const payment = await this.paymentService.create(
  {
    customerId: userId,
    providerId,
    packageId,
    items: selectedPackage.items.map(item => ({
      serviceId: item.serviceItemId.toString(),
      name: 'Service Item',
      price: selectedPackage.price / selectedPackage.items.length,
      quantity: item.quantity,
      durationMinutes: 30,
    })),
    amount: {
      subtotal: totalAmount,
      discount: 0,
      tax: 0,
      total: totalAmount,
    },
    method: paymentMethodToUse,
    status: paymentStatus,
    transactionRef: `TXN-${Date.now()}`,
  },
  session
) as PaymentDocument;


    // ===== Create User Package =====
    const userPackage = new this.userPackageModel({
      userId,
      providerId,
      packageId,
      packageName: selectedPackage.name,
      price: selectedPackage.price,
      items: selectedPackage.items.map(item => ({
        serviceItemId: item.serviceItemId,
        total: item.quantity,
        remaining: item.quantity,
      })),
      paymentId: payment._id,
      status: UserPackageStatus.ACTIVE,
      purchasedAt: new Date(),
    });

    const saved = await userPackage.save({ session });
    await session.commitTransaction();
    session.endSession();

    return this.mapToDetailedResponse(saved, provider);

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
}

  async findAll(userId: string): Promise<UserPackageResponseDto[]> {
    const packages = await this.userPackageModel.find({ userId }).exec();
    const results = await Promise.all(
      packages.map(async (pkg) => {
        const provider = await this.providerModel.findById(pkg.providerId).exec();
        if (!provider) throw new NotFoundException('common.errors.PROVIDER_NOT_FOUND');
        return this.mapToDetailedResponse(pkg, provider);
      }),
    );

    return results;
  }




  async findById(id: string, userId: string): Promise<UserPackageResponseDto> {
    const pkg = await this.userPackageModel.findOne({
      _id: id,
      userId });

    if (!pkg) {
      throw new NotFoundException('common.errors.PACKAGE_NOT_FOUND_OR_NOT_YOURS');
    }
    const provider = await this.providerModel.findById(pkg.providerId).exec();
    if (!provider) throw new NotFoundException('common.errors.PROVIDER_NOT_FOUND');
    return this.mapToDetailedResponse(pkg, provider);
 
  }

  async findByServiceItemId(
    serviceItemId: string,
    userId: string,
  ): Promise<UserPackageResponseDto[]> {

    const idsArray = serviceItemId.split(',').map(id => new Types.ObjectId(id.trim()));      

    const packages = await this.userPackageModel.find({
      userId,
      status: 'ACTIVE',

      items: {
        $elemMatch: {
          serviceItemId: { $in: idsArray },
          remaining: { $gt: 0 },
        },
      },
    }).exec();

    const results = await Promise.all(
      packages.map(async (pkg) => {
        const provider = await this.providerModel.findById(pkg.providerId).exec();
        if (!provider) throw new NotFoundException('common.errors.PROVIDER_NOT_FOUND');
        return this.mapToDetailedResponse(pkg, provider);
      }),
    );

    return results;
  }

private mapToDetailedResponse(pkg: UserPackageDocument, provider: ServiceProviderDocument): UserPackageResponseDto {
  // build service item map from provider
  const serviceItemMap = new Map<string, any>();
  for (const category of provider.services ?? []) {
    for (const item of category.items ?? []) {
      serviceItemMap.set(item._id.toString(), item);
    }
  }

  return {
    _id: pkg._id.toString(),
    userId: pkg.userId.toString(),
    providerId: pkg.providerId.toString(),
    packageId: pkg.packageId.toString(),
    packageName: pkg.packageName,
    price: pkg.price,
    items: pkg.items
      .map(i => {
        const serviceItem = serviceItemMap.get(i.serviceItemId.toString());
        if (!serviceItem) return null;
        return {
          serviceItemId: serviceItem._id.toString(),
          name: serviceItem.name,
          type: serviceItem.type.toString(),
          description: serviceItem.description,
          durationMinutes: serviceItem.durationMinutes,
          total: i.total,
          remaining: i.remaining,
        };
      })
      .filter((i): i is NonNullable<typeof i> => i !== null),

    paymentId: pkg.paymentId.toString(),
    status: pkg.status,
    purchasedAt: pkg.purchasedAt,
  };
}

async checkPackage(
  dto: PreviewPackageDto,
  userId: string,
) {

  const userPackage = await this.userPackageModel.findOne({
    userId:  userId,
    packageId: dto.packageId,
    status: UserPackageStatus.ACTIVE,
  }).lean();

  if (!userPackage) {
    throw new NotFoundException('common.errors.PACKAGE_NOT_FOUND');
  }

  // Map package items
  const packageMap = new Map<string, any>();
  userPackage.items.forEach(item => {
    packageMap.set(item.serviceItemId.toString(), item);
  });

  // Count requested services
  const requestedCount = new Map<string, number>();
  dto.serviceItemIds.forEach(id => {
    requestedCount.set(id, (requestedCount.get(id) || 0) + 1);
  });

  const services: any[] = [];

  for (const [serviceId, requestedTotal] of requestedCount.entries()) {

    const packageItem = packageMap.get(serviceId);

    const totalFromDb = packageItem?.total ?? 0;
    const remaining = packageItem?.remaining ?? 0;

    const inPackage =
      !!packageItem && remaining >= requestedTotal;

    services.push({
      serviceItemId: serviceId,
      total: totalFromDb,  
      inPackage,
      remaining,
    });
  }

  const allServicesInPackage =
    services.length > 0 &&
    services.every(s => s.inPackage);

  return {
    allServicesInPackage,
    services,
  };
}
}