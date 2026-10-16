import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { AuditInterceptor } from './audit.interceptor';
import { AuditLog, AuditLogSchema } from './schemas/audit-log.schema';
import { ServiceProvider, ServiceProviderSchema } from '../provider/schemas/service-provider.schema';
import { CustomerProfile, CustomerProfileSchema } from '../customer/schemas/customer-profile.schema';
import { Appointment, AppointmentSchema } from '../appointment/schemas/appointment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: ServiceProvider.name, schema: ServiceProviderSchema },
      { name: CustomerProfile.name, schema: CustomerProfileSchema },
      { name: Appointment.name, schema: AppointmentSchema },
      
    ]),
  ],
  providers: [
    AuditService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
  exports: [AuditService],
  controllers: [AuditController],
})
export class AuditModule {}
