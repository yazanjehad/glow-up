import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import {
  CustomerProfile,
  CustomerProfileSchema,
} from './schemas/customer-profile.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { ServiceProvider, ServiceProviderSchema } from '../provider/schemas/service-provider.schema';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: CustomerProfile.name,
        schema: CustomerProfileSchema,
      },
      { name: User.name, schema: UserSchema },
      { name: ServiceProvider.name, schema: ServiceProviderSchema },
    ]),
    forwardRef(() => UsersModule),
  ],
  controllers: [CustomerController],
  providers: [CustomerService],
  exports: [CustomerService],
})
export class CustomerModule {}
