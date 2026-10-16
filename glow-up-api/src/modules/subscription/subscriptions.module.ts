import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

import { SubscriptionPlan, SubscriptionPlanSchema } from './schemas/subscription-plan.schema';
import { ProviderSubscription, ProviderSubscriptionSchema } from './schemas/provider-subscription.schema';
import { ServiceProvider, ServiceProviderSchema } from '../provider/schemas/service-provider.schema';
import { ProviderService } from '../provider/provider.service';
import { ProviderModule } from '../provider/provider.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([
      { name: SubscriptionPlan.name, schema: SubscriptionPlanSchema },
      { name: ProviderSubscription.name, schema: ProviderSubscriptionSchema },
      { name: ServiceProvider.name, schema: ServiceProviderSchema },
    ]),
    ProviderModule,
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}