import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import {
  PaymentTransaction,
  PaymentTransactionDocument,
} from './schemas/PaymentTransaction.schema';
import { PaymentTransactionStatus } from 'src/common/enum/PaymentTransactionStatus.enum';
import { RoleType } from 'src/common/enum/roletype.enum';
import { ProviderService } from '../provider/provider.service';
import { PermissionType } from 'src/common/enum/permission.enum';

@Injectable()
export class PaymentTransactionsService {
  constructor(
    @InjectModel(PaymentTransaction.name)
    private readonly paymentTxModel: Model<PaymentTransactionDocument>,
    private readonly providerService: ProviderService,
  ) {}

  // Create transaction (main function)
  async createTransaction(
    data: {
      appointmentId: Types.ObjectId;
      paymentId?: Types.ObjectId;
      providerId: Types.ObjectId;
      totalAmount: number;
      paidAmount: number;
      commissionPercent: number;
      paymentSource?: string;
    },
    session?: ClientSession,
  ) {
    const commissionAmount =
      (data.totalAmount * data.commissionPercent) / 100;

    const providerAmount = Math.max(
      data.paidAmount - commissionAmount,
      0,
    );

    return this.paymentTxModel.create(
      [
        {
          ...data,
          commissionAmount,
          providerAmount,
          status: PaymentTransactionStatus.PENDING,
        },
      ],
      { session },
    );
  }

async updateStatusByAppointment(
appointmentId: string, status: PaymentTransactionStatus, session: unknown,
) {
  const result = await this.paymentTxModel.updateOne(
    { appointmentId: new Types.ObjectId(appointmentId) },
    { status },
  );


  if (result.matchedCount === 0) {
    throw new Error('common.errors.PaymentTransactions_NOT_FOUND');
  }

  return result;
}

  // Get by appointment
  async findByAppointment(appointmentId: string) {
    return this.paymentTxModel.findOne({ appointmentId });
  }

  async getTransactionsForUser(user: any, providerId?: string, page = 1, limit = 10, sortOrder: 'asc' | 'desc' = 'desc',) {
    // PROVIDER FLOW
    if (user.role === RoleType.PROVIDER) {
      const provider =
        await this.providerService.getByOwnerUserId(user.sub);

      if (!provider) {
        throw new NotFoundException('common.errors.PROVIDER_NOT_FOUND');
      }

      return this.getByProvider(provider._id.toString(), page, limit, sortOrder);
    }

    // ADMIN / SUPER_ADMIN FLOW
    if (
      user.role === RoleType.ADMIN ||
      user.role === RoleType.SUPER_ADMIN
    ) {
      if (!providerId) {
        throw new BadRequestException(
          'common.errors.PROVIDER_ID_REQUIRED',
        );
      }

      // permission check for ADMIN only
      if (user.role === RoleType.ADMIN) {
        const hasPermission =
          user.permissions?.includes(PermissionType.PAYMENT_TRANSACTION_VIEW);

        if (!hasPermission) {
          throw new ForbiddenException(
            'common.errors.FORBIDDEN',
          );
        }
      }

      return this.getByProvider(providerId, page, limit, sortOrder);
    }

    throw new ForbiddenException('Invalid role');
  }

  async getByProvider(
    providerId: string,
    page = 1,
    limit = 10,
    sortOrder: 'asc' | 'desc' = 'desc',
  ) {
    const skip = (page - 1) * limit;
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    const result = await this.paymentTxModel.aggregate([
      {
        $match: {
          providerId: new Types.ObjectId(providerId),
          status: PaymentTransactionStatus.COMPLETED,
        },
      },

      {
        $sort: {
          createdAt: sortDirection,
        },
      },

      {
        $facet: {
          transactions: [
            { $skip: skip },
            { $limit: limit },
          ],

          meta: [
            {
              $group: {
                _id: null,
                totalCommission: { $sum: '$commissionAmount' },
                totalProvider: { $sum: '$providerAmount' },
                totalCount: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]);

    const data = result[0];

    return {
      _id: providerId,
      totalCommission: data.meta[0]?.totalCommission || 0,
      totalProvider: data.meta[0]?.totalProvider || 0,
      totalCount: data.meta[0]?.totalCount || 0,
      page,
      limit,
      transactions: data.transactions,
    };
  }
}