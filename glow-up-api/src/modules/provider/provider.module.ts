import { forwardRef, Module } from '@nestjs/common';


import { MongooseModule } from '@nestjs/mongoose';
 import { ServiceProvider, ServiceProviderSchema } from './schemas/service-provider.schema';
import { ProviderService } from './provider.service';
import { ProviderController } from './provider.controller';
import { Appointment, AppointmentSchema } from '../appointment/schemas/appointment.schema';
import { Employee, EmployeeSchema } from '../employee/schemas/employee.schema';
import { CustomerModule } from '../customer/customer.module';
import { CustomerProfile, CustomerProfileSchema } from '../customer/schemas/customer-profile.schema';
import { Rating, RatingSchema } from '../rating/schemas/rating.schema';
import { RatingService } from '../rating/rating.service';
import { Lookup, LookupSchema } from '../lookup/schemas/lookup.schema';
import { LookupService } from '../lookup/lookup.service';
 
import { UsersModule } from '../users/users.module';
import { CustomBreak, CustomBreakSchema } from '../employee/schemas/custom-breaks.schemas';
import { ProviderSubscription, ProviderSubscriptionSchema } from '../subscription/schemas/provider-subscription.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ServiceProvider.name, schema: ServiceProviderSchema },
      { name: Appointment.name, schema: AppointmentSchema },
      { name: Employee.name, schema: EmployeeSchema },
      { name: CustomerProfile.name, schema: CustomerProfileSchema },
      { name: Rating.name, schema: RatingSchema },
      {name: Lookup.name, schema: LookupSchema},
      { name: CustomBreak.name, schema: CustomBreakSchema },
      { name: ProviderSubscription.name, schema: ProviderSubscriptionSchema },
    ]),
    CustomerModule,
    forwardRef(() => UsersModule),
  ],
  controllers: [ProviderController],
  providers: [ProviderService,RatingService, LookupService],
  exports: [ProviderService],
})
export class ProviderModule {}
