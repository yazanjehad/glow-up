import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PaymentTransaction,
  PaymentTransactionSchema,
} from './schemas/PaymentTransaction.schema';
import { PaymentTransactionsService } from './PaymentTransaction.service';
import { ProviderModule } from '../provider/provider.module';
import { PaymentTransactionsController } from './PaymentTransaction.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: PaymentTransaction.name,
        schema: PaymentTransactionSchema,
      },
    ]),
    ProviderModule,
  ],
  providers: [PaymentTransactionsService],
  controllers: [PaymentTransactionsController],
  exports: [PaymentTransactionsService],
})
export class PaymentTransactionsModule {}