import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { NotificationsGateway } from './notifications.gateway';
import * as admin from 'firebase-admin';
import {
  Notification,
  NotificationDocument,
  NotificationStatus,
  NotificationType,
} from './schemas/notification.schema';
import { NotificationReadReceipt } from './schemas/notification-read-receipt.schema';

export interface CreateNotificationDto {
  userId: string | string[] | null;
  title: { ar: string; en: string };
  message: { ar: string; en: string };
  type?: NotificationType;
  relatedEntityId?: string;
  link_to?: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(NotificationReadReceipt.name)
    private readReceiptModel: Model<NotificationReadReceipt>,
    private readonly notificationsGateway: NotificationsGateway,
    @Inject('FIREBASE_ADMIN')
    private readonly firebaseAdmin: admin.app.App,
  ) {}

  private async sendBatchPush(tokens: string[], title: string, body: string, data: any) {
    // 1. تنظيف التوكنات الوهمية فوراً
    const invalidFormatTokens = tokens.filter(t => !t || t === 'your_push_token_here');

    if (invalidFormatTokens.length > 0) {
      await this.userModel.updateMany(
        { fcmTokens: { $in: invalidFormatTokens } },
        { $pull: { fcmTokens: { $in: invalidFormatTokens } } }
      );
    }

    const validTokens = tokens.filter(t => t && t !== 'your_push_token_here');
    if (validTokens.length === 0) {
      this.logger.warn('No valid tokens found to send via FCM');
      return;
    }

    const message: admin.messaging.MulticastMessage = {
      tokens: validTokens,
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries({ ...data, click_action: 'FLUTTER_NOTIFICATION_CLICK' })
          .map(([k, v]) => [k, String(v)])
      ),
        android: {
        priority: 'high',
        notification: { channelId: 'high_importance_channel', priority: 'max',sound: 'default' },
      },
      apns: {
        payload: { aps: { sound: 'default', badge: 1, contentAvailable: true } },
      },
    };

    try {
      const response = await this.firebaseAdmin.messaging().sendEachForMulticast(message);

      this.logger.log(`FCM Delivery Result: Success[${response.successCount}], Failure[${response.failureCount}]`);

      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success && resp.error) {
            const code = resp.error.code;
            if (
              code === 'messaging/registration-token-not-registered' ||
              code === 'messaging/invalid-registration-token'
            ) {
              failedTokens.push(validTokens[idx]);
            }
          }
        });

        if (failedTokens.length > 0) {
          await this.userModel.updateMany(
            { fcmTokens: { $in: failedTokens } },
            { $pull: { fcmTokens: { $in: failedTokens } } }
          );
          this.logger.log(`Cleaned up ${failedTokens.length} expired tokens from database.`);
        }
      }
    } catch (error) {
      this.logger.error(`Batch FCM Critical Error: ${error.message}`);
    }
  }

  async create(createNotificationDto: CreateNotificationDto): Promise<any> {
    const { userId, title, message, type, relatedEntityId, link_to, data } = createNotificationDto;
    const notificationType = type || NotificationType.SYSTEM;

    if (!userId) {
      const notification = await new this.notificationModel({
        title,
        message,
        type: notificationType,
        global: true,
        relatedEntityId: relatedEntityId ? new Types.ObjectId(relatedEntityId) : undefined,
        link_to,
        data,
      }).save();

      this.notificationsGateway.broadcast('newNotification', notification);

      const usersCursor = this.userModel
        .find({ fcmTokens: { $exists: true, $not: { $size: 0 } } })
        .select('fcmTokens language')
        .cursor();

      for (let user = await usersCursor.next(); user != null; user = await usersCursor.next()) {
        const userData = user as any;
        const lang = userData.language || 'en';
        await this.sendBatchPush(
          userData.fcmTokens,
          title[lang],
          message[lang],
          { type: notificationType, global: 'true' }
        );
      }
      return { status: 'ok' };
    }

    const userIds = Array.isArray(userId) ? userId : [userId];
    const users = await this.userModel
      .find({ _id: { $in: userIds } })
      .select('_id fcmTokens language')
      .lean();

    const notificationsToSave = users.map((u: any) => ({
      title,
      message,
      type: notificationType,
      userId: u._id,
      global: false,
      relatedEntityId: relatedEntityId ? new Types.ObjectId(relatedEntityId) : undefined,
      link_to,
      data,
    }));

    const savedNotifications = await this.notificationModel.insertMany(notificationsToSave);

    await Promise.allSettled(savedNotifications.map(async (n: any) => {
      const user = users.find((u: any) => u._id.toString() === n.userId.toString()) as any;
      this.notificationsGateway.sendToUser(n.userId.toString(), 'newNotification', n);

      if (user?.fcmTokens?.length) {
        const lang = user.language || 'en';
        await this.sendBatchPush(
          user.fcmTokens,
          title[lang],
          message[lang],
          { type: notificationType, notificationId: n._id.toString() }
        );
      }
    }));

    return Array.isArray(userId) ? { status: 'ok' } : savedNotifications[0];
  }

  async findAllForUser(
    userId: string,
    options: { status?: NotificationStatus; type?: NotificationType; page?: number; limit?: number } = {},
    lang: 'en' | 'ar' = 'en',
  ) {
    const { status, type, page = 1, limit = 20 } = options;
    const query: any = { $or: [{ userId: new Types.ObjectId(userId) }, { global: true }] };
    if (type) query.type = type;

    const [rawNotifications, receipts, total] = await Promise.all([
      this.notificationModel.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      this.readReceiptModel.find({ UserId: userId }).select('NotificationId').lean(),
      this.notificationModel.countDocuments(query)
    ]);

    const readGlobalIds = new Set(receipts.map((r: any) => r.NotificationId.toString()));

    let notifications = rawNotifications.map((notif: any) => {
      const currentStatus = notif.global
        ? readGlobalIds.has(notif._id.toString()) ? NotificationStatus.READ : NotificationStatus.UNREAD
        : notif.status;

      return {
        ...notif,
        title: notif.title[lang] || notif.title['en'],
        message: notif.message[lang] || notif.message['en'],
        status: currentStatus
      };
    });

    if (status) {
      notifications = notifications.filter(n => n.status === status);
    }

    return { notifications, total, page, limit };
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.notificationModel.findById(id);
    if (!notification) throw new NotFoundException('common.errors.NOTIFICATION_NOT_FOUND');

    if (notification.global) {
      return this.readReceiptModel.findOneAndUpdate(
        { NotificationId: id, UserId: userId },
        { Read: true },
        { upsert: true, new: true }
      ).exec();
    }

    return this.notificationModel.findOneAndUpdate(
      { _id: id, userId: new Types.ObjectId(userId) },
      { status: NotificationStatus.READ },
      { new: true }
    ).exec();
  }

  async markAllAsRead(userId: string) {
    await this.notificationModel.updateMany(
      { userId: new Types.ObjectId(userId), status: NotificationStatus.UNREAD },
      { status: NotificationStatus.READ }
    );

    const globalNotifs = await this.notificationModel.find({ global: true }).select('_id').lean();
    const bulkOps = globalNotifs.map((n: any) => ({
      updateOne: {
        filter: { NotificationId: n._id.toString(), UserId: userId },
        update: { Read: true },
        upsert: true,
      },
    }));

    if (bulkOps.length > 0) await this.readReceiptModel.bulkWrite(bulkOps);
    return { success: true };
  }

  async getUnreadCount(userId: string) {
    const [privateCount, totalGlobal, readGlobal] = await Promise.all([
      this.notificationModel.countDocuments({ userId: new Types.ObjectId(userId), status: NotificationStatus.UNREAD }),
      this.notificationModel.countDocuments({ global: true }),
      this.readReceiptModel.countDocuments({ UserId: userId, Read: true })
    ]);

    return { unreadCount: privateCount + Math.max(0, totalGlobal - readGlobal) };
  }

  async notifyUser(
    userId: string,
    title: { ar: string; en: string },
    message: { ar: string; en: string },
    type: NotificationType = NotificationType.SYSTEM,
    relatedEntityId?: string,
    link_to?:string,
    data?: Record<string, unknown>,
  ) {
    return this.create({ userId, title, message, type, relatedEntityId,link_to, data });
  }
}
