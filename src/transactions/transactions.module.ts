import { Module } from '@nestjs/common';
import { DrizzleTransactionRepository } from './drizzle-transaction.repository';
import { TRANSACTION_REPOSITORY } from './transaction.repository';

@Module({
  providers: [
    {
      provide: TRANSACTION_REPOSITORY,
      useClass: DrizzleTransactionRepository,
    },
  ],
  exports: [TRANSACTION_REPOSITORY],
})
export class TransactionsModule {}
