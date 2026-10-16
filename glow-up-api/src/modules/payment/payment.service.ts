import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from './schemas/payment.schema';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
  ) {}

  async create(createPaymentDto: CreatePaymentDto, session?: any): Promise<PaymentDocument> {
    const createdPayment = new this.paymentModel(createPaymentDto);
    return createdPayment.save({ session });
  }

  async updateStatus(appointmentId: string, status: 'PAID' | 'FAILED' | 'REFUNDED') {
    return this.paymentModel.findOneAndUpdate(
      { appointmentId },
      { status },
      { new: true },
    );
  }

  async findByAppointment(appointmentId: string) {
    return this.paymentModel.findOne({ appointmentId }).exec();
  }
}