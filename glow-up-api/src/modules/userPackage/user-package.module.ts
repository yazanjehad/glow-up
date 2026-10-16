import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserPackageService } from './user-package.service';
import { UserPackageController } from './user-package.controller';
import { UserPackage, UserPackageSchema } from './schemas/user-package.schema';
import { Payment, PaymentSchema } from '../payment/schemas/payment.schema';
import { ServiceProvider, ServiceProviderSchema } from '../provider/schemas/service-provider.schema';
import { PaymentService } from '../payment/payment.service';
import { WalletModule } from '../wallet/wallet.module';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserPackage.name, schema: UserPackageSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: ServiceProvider.name, schema: ServiceProviderSchema },

    ]),
    WalletModule,
  ],
  controllers: [UserPackageController],
  providers: [UserPackageService, PaymentService],
})
export class UserPackageModule {}
