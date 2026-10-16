import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Appointment, AppointmentDocument } from './schemas/appointment.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { ServiceProvider } from '../provider/schemas/service-provider.schema';

@Injectable()
export class AppointmentsCronService {
  private readonly logger = new Logger(AppointmentsCronService.name);

  constructor(
    @InjectModel(Appointment.name) private appointmentModel: Model<AppointmentDocument>,
    @InjectModel(ServiceProvider.name) private providerModel: Model<any>,
    private notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkReminders() {
    this.logger.log('Searching for upcoming appointments to send reminders...');

    const now = new Date();
    const afterOneHour = new Date(now.getTime() + 60 * 60 * 1000);

    const upcoming = await this.appointmentModel.find({
      status: 'CONFIRMED',
      reminderSent: false,
      'services.date': { $gte: new Date(new Date().setHours(0, 0, 0, 0)), $lte: afterOneHour },
    });

    for (const app of upcoming) {
      try {
        const updated = await this.appointmentModel.findOneAndUpdate(
          { _id: app._id, reminderSent: false },
          { $set: { reminderSent: true } },
          { new: true },
        );
        if (!updated) continue;
        await this.notificationsService.notifyUser(
          app.customerId?.toString() || '',
          { ar: 'تذكير بموعدك 📅', en: 'Your appointment reminder 📅' },
          { ar: 'الصالون في انتظارك خلال أقل من ساعة!', en: 'Your salon appointment is in less than an hour!' },
          'appointment' as any,
          app._id.toString(),
          `/my-booking`,
          { appointmentId: app._id.toString() }
        );
        const providerProfile = await this.providerModel
          .findById(app.providerId)
          .select('userId')
          .lean();

        if (providerProfile?.userId) {
          await this.notificationsService.notifyUser(
            providerProfile.userId.toString(),
            { ar: 'موعد قريب ⏰', en: 'Upcoming appointment ⏰' },
            { ar: 'لديك زبون سيصل خلال أقل من ساعة.', en: 'A customer will arrive in less than an hour.' },
            'appointment' as any,
            app._id.toString(),
            `admin-dashboard/orders`,
            { appointmentId: app._id.toString() }
          );
        }

        this.logger.log(` Reminder sent for appointment ID: ${app._id}`);
      } catch (error) {
        this.logger.error(`❌ Failed to send reminder for appointment ID ${app._id}: ${error.message}`);
      }
    }
  }
}
