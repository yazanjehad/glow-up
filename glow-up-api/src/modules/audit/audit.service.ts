import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';
import { ServiceProvider } from '../provider/schemas/service-provider.schema';
import { CustomerProfile } from '../customer/schemas/customer-profile.schema';
import { Appointment } from '../appointment/schemas/appointment.schema';
@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name)
    private auditModel: Model<AuditLogDocument>,
    @InjectModel(ServiceProvider.name)
    private providerModel: Model<ServiceProvider>,
    @InjectModel(CustomerProfile.name)
    private customerModel: Model<CustomerProfile>,
    @InjectModel(Appointment.name)
    private appointmentModel: Model<Appointment>,
  ) {}

  /// Logs an audit entry to the database
  async log(data: Partial<AuditLog>) {
    try {
      await this.auditModel.create(data);
    } catch (err) {
      console.error('Audit log failed', err);
    }
  }

  // Retrieves audit logs based on provided filters
  async getFilteredLogs(filters: { userId?: string; appointmentId?: string; action?: string; oldField?: string }) {
    const query: any = {};

    if (filters.userId) {
      query.userId = filters.userId;
    }

    if (filters.appointmentId) {
      const appointmentObjectId = new Types.ObjectId(filters.appointmentId);

      query.$or = [
        { 'requestBody._id': appointmentObjectId },
        { 'response._id': appointmentObjectId },
      ];
    }

    if (filters.action) {
      query.action = filters.action;
    }

    if (filters.oldField) {
      query['oldData'] = { $regex: filters.oldField, $options: 'i' };
    }

    return this.auditModel.find(query).sort({ createdAt: 1 });
  }


  getModelForCollection(collectionName: string) {
  switch (collectionName) {
    case 'providers':
      return this.providerModel;
    case 'customers':
      return this.customerModel;
    case 'appointments':
      return this.appointmentModel;
    default:
      return null;
  }
}

}
