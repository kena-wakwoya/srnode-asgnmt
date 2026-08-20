import { Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { DrizzleService } from '../infra/db/drizzle.service';
import {
  importSummaryByAccount,
  importSummaryByCurrency,
  importSummaryByMerchant,
  importSummaryByRisk,
  importRejections,
  imports,
  transactions,
} from '../infra/db/schema';
import {
  PersistBatchInput,
  PersistBatchResult,
  TransactionRepository,
} from './transaction.repository';

@Injectable()
export class DrizzleTransactionRepository implements TransactionRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async persistBatch(input: PersistBatchInput): Promise<PersistBatchResult> {
    return this.drizzle.db.transaction(async (tx) => {
      let insertedCount = 0;

      if (input.accepted.length > 0) {
        const inserted = await tx
          .insert(transactions)
          .values(input.accepted)
          .onConflictDoNothing({
            target: [transactions.providerId, transactions.transactionId],
          })
          .returning({ id: transactions.id });
        insertedCount = inserted.length;
      }

      if (input.rejections.length > 0) {
        await tx
          .insert(importRejections)
          .values(input.rejections)
          .onConflictDoNothing({
            target: [importRejections.importId, importRejections.lineNumber],
          });
      }

      await tx
        .update(imports)
        .set({
          processed: sql`${imports.processed} + ${input.progress.processed}`,
          accepted: sql`${imports.accepted} + ${input.progress.accepted}`,
          rejected: sql`${imports.rejected} + ${input.progress.rejected}`,
          duplicates: sql`${imports.duplicates} + ${input.progress.duplicates}`,
        })
        .where(eq(imports.id, input.importId));

      if (input.byCurrency.length > 0) {
        await tx
          .insert(importSummaryByCurrency)
          .values(
            input.byCurrency.map((row) => ({
              importId: input.importId,
              currency: row.currency,
              transactionCount: row.transactionCount,
              totalAmount: row.totalAmount,
            })),
          )
          .onConflictDoUpdate({
            target: [
              importSummaryByCurrency.importId,
              importSummaryByCurrency.currency,
            ],
            set: {
              transactionCount: sql`${importSummaryByCurrency.transactionCount} + excluded.transaction_count`,
              totalAmount: sql`${importSummaryByCurrency.totalAmount} + excluded.total_amount`,
            },
          });
      }

      if (input.byRisk.length > 0) {
        await tx
          .insert(importSummaryByRisk)
          .values(
            input.byRisk.map((row) => ({
              importId: input.importId,
              riskLevel: row.riskLevel,
              transactionCount: row.transactionCount,
            })),
          )
          .onConflictDoUpdate({
            target: [
              importSummaryByRisk.importId,
              importSummaryByRisk.riskLevel,
            ],
            set: {
              transactionCount: sql`${importSummaryByRisk.transactionCount} + excluded.transaction_count`,
            },
          });
      }

      if (input.byMerchant.length > 0) {
        await tx
          .insert(importSummaryByMerchant)
          .values(
            input.byMerchant.map((row) => ({
              importId: input.importId,
              merchantId: row.id,
              transactionCount: row.transactionCount,
              totalAmount: row.totalAmount,
            })),
          )
          .onConflictDoUpdate({
            target: [
              importSummaryByMerchant.importId,
              importSummaryByMerchant.merchantId,
            ],
            set: {
              transactionCount: sql`${importSummaryByMerchant.transactionCount} + excluded.transaction_count`,
              totalAmount: sql`${importSummaryByMerchant.totalAmount} + excluded.total_amount`,
            },
          });
      }

      if (input.byAccount.length > 0) {
        await tx
          .insert(importSummaryByAccount)
          .values(
            input.byAccount.map((row) => ({
              importId: input.importId,
              accountId: row.id,
              transactionCount: row.transactionCount,
              totalAmount: row.totalAmount,
            })),
          )
          .onConflictDoUpdate({
            target: [
              importSummaryByAccount.importId,
              importSummaryByAccount.accountId,
            ],
            set: {
              transactionCount: sql`${importSummaryByAccount.transactionCount} + excluded.transaction_count`,
              totalAmount: sql`${importSummaryByAccount.totalAmount} + excluded.total_amount`,
            },
          });
      }

      return { insertedCount };
    });
  }
}
