import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

 

import { UsersModule } from '../users/users.module';
import { ProviderModule } from '../provider/provider.module';
import { ProviderSubscription, ProviderSubscriptionSchema } from '../subscription/schemas/provider-subscription.schema';

@Module({
  imports: [
    UsersModule,
    ProviderModule,
    // MongooseModule.forFeature([
    //   {
    //     name: AdminProfile.name,
    //     schema: AdminProfileSchema,
    //   },
    // ]),

    MongooseModule.forFeature([
      {
        name: ProviderSubscription.name,
        schema: ProviderSubscriptionSchema,
      },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
