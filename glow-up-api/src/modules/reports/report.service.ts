import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ServiceProvider, ServiceProviderDocument } from '../provider/schemas/service-provider.schema';
import { Appointment, AppointmentDocument } from '../appointment/schemas/appointment.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
@Injectable()
export class ReportService {
  constructor(
    @InjectModel(ServiceProvider.name) private providerModel: Model<ServiceProviderDocument>,
    @InjectModel(Appointment.name) private appointmentModel: Model<AppointmentDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

    async getSiteStats() {
    const now = new Date();
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);

    const newUsersLastMonth = await this.userModel.countDocuments({
      createdAt: { $gte: last30Days, $lte: now },
      role: 'CUSTOMER',
    });

    const totalServiceProviders = await this.providerModel.countDocuments({
      status: 'APPROVED',
    });

    const totalAppointments = await this.appointmentModel.countDocuments();

    return {
      newUsersLastMonth,
      totalServiceProviders,
      totalAppointments,
    };
  }

}
