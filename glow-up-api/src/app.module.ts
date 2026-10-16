// app module
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import appConfig from './config/app.config';
import { mongoConfig } from './config/database.config';

// Import feature modules
import { AdminModule } from './modules/admin/admin.module';

import { CustomerModule } from './modules/customer/customer.module';
import { AppointmentModule } from './modules/appointment/appointment.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ProviderModule } from './modules/provider/provider.module';
import { UsersModule } from './modules/users/users.module';
import { EmployeeModule } from './modules/employee/employee.module';
import { AuthModule } from './modules/auth/auth.module';
import { RatingModule } from './modules/rating/rating.module';
import { PaymentModule } from './modules/payment/payment.module';
import { TicketModule } from './modules/ticket/ticket.module';
import { LookupModule } from './modules/lookup/lookup.module';
import { AdsModule } from './modules/ads/ads.module';
import { AcceptLanguageResolver, HeaderResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import path from 'path';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { I18nValidationFilter } from './common/filters/i18n-exception.filter';
import { I18nResponseInterceptor } from './common/interceptors/i18n-response.interceptor';
import { CouponModule } from './modules/coupon/coupon.module';
import { UserPackageModule } from './modules/userPackage/user-package.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { FileModule } from './modules/file/file.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AuditModule } from './modules/audit/audit.module';
import { ErrorLogModule } from './modules/error-log/error-log.module';
import { ChatModule } from './modules/chat/chat.module';
import { ReportModule } from './modules/reports/report.module';
import { SubscriptionsModule } from './modules/subscription/subscriptions.module'
import { PaymentTransactionsModule } from './modules/PaymentTransaction/PaymentTransaction.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: mongoConfig,
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'ar',
      loaderOptions: {
        path: path.join(process.cwd(), 'src/i18n/'),
        watch: true,
      },  resolvers: [
    { use: QueryResolver, options: ['lang'] },
    { use: HeaderResolver, options: ['accept-language'] },
    AcceptLanguageResolver,
  ],
 
    }),
    AuthModule,
    AdminModule,
    UsersModule,
    ProviderModule,
    CustomerModule,
    EmployeeModule,
    RatingModule,
    AppointmentModule,
    PaymentModule,
    TicketModule,
    LookupModule,
    AdsModule,
    CouponModule,
    UserPackageModule,
    WalletModule,
    FileModule,
    NotificationsModule,
    AuditModule,
    ErrorLogModule,
    ChatModule,
    ReportModule,
    SubscriptionsModule,
    PaymentTransactionsModule
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: I18nValidationFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: I18nResponseInterceptor,
    },
  ],
})
export class AppModule  {
  
}
