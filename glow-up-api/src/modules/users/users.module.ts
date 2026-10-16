import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';

import { UsersService } from './users.service';

import { User, UserSchema } from './schemas/user.schema';
import { UserController } from './user.controller';
 
 
import { CustomerModule } from '../customer/customer.module';
import { AppointmentModule } from '../appointment/appointment.module';
import { ProviderService } from '../provider/provider.service';
import { ProviderModule } from '../provider/provider.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
    ]),
    forwardRef(() => AuthModule),
    forwardRef(() => CustomerModule),
     forwardRef(() => ProviderModule),
    AppointmentModule
  ],
  controllers: [UserController],
  providers: [UsersService],
  exports: [UsersService, MongooseModule],
})
export class UsersModule {}
