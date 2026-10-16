import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import {
  Employee,
  EmployeeSchema,
} from './schemas/employee.schema';
import { ProviderModule } from '../provider/provider.module';
import { UsersModule } from '../users/users.module';
import { Lookup, LookupSchema } from '../lookup/schemas/lookup.schema';
import { LookupService } from '../lookup/lookup.service';
import { Rating, RatingSchema } from '../rating/schemas/rating.schema';
import { ServiceProvider, ServiceProviderSchema } from '../provider/schemas/service-provider.schema';
import { CustomBreak, CustomBreakSchema } from './schemas/custom-breaks.schemas';
import { Appointment, AppointmentSchema } from '../appointment/schemas/appointment.schema';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Employee.name, schema: EmployeeSchema },
      { name: Lookup.name, schema: LookupSchema },
      { name: Rating.name, schema: RatingSchema },
      { name: ServiceProvider.name, schema: ServiceProviderSchema },
      { name: Appointment.name, schema: AppointmentSchema },
      {name: CustomBreak.name, schema:CustomBreakSchema}
    ]),
    forwardRef(() => ProviderModule),
    forwardRef(() => UsersModule),
   
  ],
  controllers: [EmployeeController],
  providers: [EmployeeService, LookupService],
  exports: [EmployeeService],
})
export class EmployeeModule { }
