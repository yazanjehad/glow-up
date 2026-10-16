import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';
import {
  Appointment,
  AppointmentSchema,
} from './schemas/appointment.schema';
import { ProviderService } from '../provider/provider.service';
import { ServiceProvider, ServiceProviderSchema } from '../provider/schemas/service-provider.schema';
import { Employee, EmployeeSchema } from '../employee/schemas/employee.schema';
import { PaymentModule } from '../payment/payment.module';
import { CouponModule } from '../coupon/coupon.module';
import { UserPackage, UserPackageSchema } from '../userPackage/schemas/user-package.schema';
import { WalletModule } from '../wallet/wallet.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AppointmentsCronService } from './appointments-cron.service';
import { PaymentTransactionsModule } from '../PaymentTransaction/PaymentTransaction.module';
import { ProviderSubscription, ProviderSubscriptionSchema } from '../subscription/schemas/provider-subscription.schema';


@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Appointment.name,
        schema: AppointmentSchema,
      },
      {
        name: Employee.name,
        schema: EmployeeSchema,
      },
      {
        name: ServiceProvider.name,
        schema: ServiceProviderSchema,
      },
      {
        name: UserPackage.name,
        schema: UserPackageSchema,
      }, 
      {
        name: ProviderSubscription.name,
        schema: ProviderSubscriptionSchema,
      },

    ]),
    PaymentModule,
    CouponModule,
    WalletModule,
    NotificationsModule,
    CouponModule,
    PaymentTransactionsModule,
  ],
  controllers: [AppointmentController],
  providers: [AppointmentService, AppointmentsCronService],
  exports: [AppointmentService],
})
export class AppointmentModule {}
