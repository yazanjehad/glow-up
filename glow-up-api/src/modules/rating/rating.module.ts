import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { RatingController } from './rating.controller';
import { RatingService } from './rating.service';

import { Rating, RatingSchema } from './schemas/rating.schema';
import {
  Appointment,
  AppointmentSchema,
} from '../appointment/schemas/appointment.schema';
import {
  ServiceProvider,
  ServiceProviderSchema,
} from '../provider/schemas/service-provider.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Rating.name, schema: RatingSchema },
      { name: Appointment.name, schema: AppointmentSchema },
      { name: ServiceProvider.name, schema: ServiceProviderSchema },
    ]),
  ],
  controllers: [RatingController],
  providers: [RatingService],
  exports: [RatingService],
})
export class RatingModule {}
