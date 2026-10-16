import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';
import {
  Notification,
  NotificationSchema,
} from './schemas/notification.schema';
import { FirebaseAdminModule } from '../firebase/firebase-admin.module';
import { NotificationReadReceipt, NotificationReadReceiptSchema } from './schemas/notification-read-receipt.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: NotificationReadReceipt.name, schema: NotificationReadReceiptSchema },
      { name: User.name, schema: UserSchema },
    ]),
    FirebaseAdminModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway],
  exports: [NotificationsService],
})
export class NotificationsModule { }
