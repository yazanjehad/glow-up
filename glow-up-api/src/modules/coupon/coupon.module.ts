import { Module } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { CouponController } from './coupon.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Coupon, CouponSchema } from './schemas/coupon.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { ServiceProvider, ServiceProviderSchema } from '../provider/schemas/service-provider.schema';

import { PaymentModule } from '../payment/payment.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Coupon.name, schema: CouponSchema },
        { name: User.name, schema: UserSchema },
    { name: ServiceProvider.name, schema: ServiceProviderSchema },
    ]),
    PaymentModule,
    WalletModule,
  ],
  controllers: [CouponController],
  providers: [CouponService],
  exports: [CouponService], 
})
export class CouponModule {}
