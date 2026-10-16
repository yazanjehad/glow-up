import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Model, Types, Connection, ClientSession } from 'mongoose';
import { Wallet, WalletDocument, WalletTransaction } from './schema/wallet.schema';
import { AddWalletDto, DeductWalletDto } from './dto/wallet.dto';

@Injectable()
export class WalletService {
  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {}


async getOrCreateWallet(userId: string, session?: ClientSession): Promise<WalletDocument> {
  const objectId = new Types.ObjectId(userId);

  const wallet = await this.walletModel.findOneAndUpdate(
    { userId: objectId },
    { $setOnInsert: { balance: 0, transactions: [] } },
    { new: true, upsert: true, session }
  );

  return wallet;
}


  async addCredit(userId: string, dto: AddWalletDto): Promise<WalletDocument> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const wallet = await this.getOrCreateWallet(userId, session);

      wallet.balance += dto.amount;
      wallet.transactions.push({
        amount: dto.amount,
        type: 'CREDIT',
        description: dto.description || 'Wallet top-up',
        userId: new Types.ObjectId(userId),
      } as WalletTransaction);

      await wallet.save({ session });
      await session.commitTransaction();
      return wallet;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

    async deductCredit(userId: string, dto: DeductWalletDto, session?: ClientSession): Promise<WalletDocument> {
        let ownSession: ClientSession | undefined = undefined;

        if (!session) {
        ownSession = await this.connection.startSession();
        ownSession.startTransaction();
        }

        const wallet = await this.getOrCreateWallet(userId, session || ownSession);
        await wallet.save({ session: session || ownSession });

        try {
            const wallet = await this.getOrCreateWallet(userId, session || ownSession);

            if (wallet.balance < dto.amount) {
            throw new BadRequestException(
              'common.errors.INSUFFICIENT_WALLET_BALANCE',
            );
            }

            wallet.balance -= dto.amount;
            wallet.transactions.push({
            amount: dto.amount,
            type: 'DEBIT',
            description: dto.description || 'Service purchase',
            userId: new Types.ObjectId(userId),
            } as WalletTransaction);

            await wallet.save({ session: session || ownSession });

            // لو استخدمنا session داخلي، نسوي commit
            if (ownSession) await ownSession.commitTransaction();

            return wallet;
        } catch (err) {
            if (ownSession) await ownSession.abortTransaction();
            throw err;
        } finally {
            if (ownSession) ownSession.endSession();
        }
        }

  async getWallet(userId: string): Promise<WalletDocument> {
    return this.getOrCreateWallet(userId);
  }
}
