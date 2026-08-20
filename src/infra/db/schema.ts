import { sql } from 'drizzle-orm';
import {
  bigint,
  char,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const importStatusEnum = pgEnum('import_status', [
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelling',
  'cancelled',
]);

export const riskLevelEnum = pgEnum('risk_level', ['low', 'medium', 'high']);

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow(),
};

export const imports = pgTable(
  'imports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    providerId: text('provider_id').notNull(),
    status: importStatusEnum('status').notNull().default('pending'),
    processed: integer('processed').notNull().default(0),
    accepted: integer('accepted').notNull().default(0),
    rejected: integer('rejected').notNull().default(0),
    duplicates: integer('duplicates').notNull().default(0),
    failureReason: text('failure_reason'),
    startedAt: timestamp('started_at', { withTimezone: true, mode: 'date' }),
    completedAt: timestamp('completed_at', {
      withTimezone: true,
      mode: 'date',
    }),
    ...timestamps,
  },
  (table) => [
    index('imports_provider_id_idx').on(table.providerId),
    index('imports_status_idx').on(table.status),
    index('imports_created_at_idx').on(table.createdAt),
  ],
);

export const idempotencyKeys = pgTable(
  'idempotency_keys',
  {
    key: text('key').primaryKey(),
    importId: uuid('import_id')
      .notNull()
      .references(() => imports.id, { onDelete: 'restrict' }),
    requestFingerprint: text('request_fingerprint').notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('idempotency_keys_import_id_uidx').on(table.importId),
  ],
);

export const importFiles = pgTable(
  'import_files',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    importId: uuid('import_id')
      .notNull()
      .references(() => imports.id, { onDelete: 'cascade' }),
    storagePath: text('storage_path').notNull(),
    byteSize: bigint('byte_size', { mode: 'number' }).notNull(),
    checksum: text('checksum'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('import_files_import_id_uidx').on(table.importId),
    uniqueIndex('import_files_storage_path_uidx').on(table.storagePath),
  ],
);

export const importJobs = pgTable(
  'import_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    importId: uuid('import_id')
      .notNull()
      .references(() => imports.id, { onDelete: 'cascade' }),
    owner: text('owner'),
    leaseExpiresAt: timestamp('lease_expires_at', {
      withTimezone: true,
      mode: 'date',
    }),
    attemptCount: integer('attempt_count').notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('import_jobs_import_id_uidx').on(table.importId),
    index('import_jobs_claim_idx').on(table.owner, table.leaseExpiresAt),
    check(
      'import_jobs_attempt_count_non_negative',
      sql`${table.attemptCount} >= 0`,
    ),
  ],
);

export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    importId: uuid('import_id')
      .notNull()
      .references(() => imports.id, { onDelete: 'cascade' }),
    providerId: text('provider_id').notNull(),
    transactionId: text('transaction_id').notNull(),
    accountId: text('account_id').notNull(),
    merchantId: text('merchant_id').notNull(),
    amount: numeric('amount', { precision: 20, scale: 4 }).notNull(),
    currency: char('currency', { length: 3 }).notNull(),
    occurredAt: timestamp('occurred_at', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),
    description: text('description'),
    fingerprint: text('fingerprint').notNull(),
    riskScore: integer('risk_score').notNull(),
    riskLevel: riskLevelEnum('risk_level').notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('transactions_provider_txn_uidx').on(
      table.providerId,
      table.transactionId,
    ),
    index('transactions_import_id_idx').on(table.importId),
    index('transactions_currency_idx').on(table.importId, table.currency),
    index('transactions_risk_level_idx').on(table.importId, table.riskLevel),
    check('transactions_amount_positive', sql`${table.amount} > 0`),
    check(
      'transactions_risk_score_range',
      sql`${table.riskScore} >= 0 AND ${table.riskScore} <= 100`,
    ),
  ],
);

export const importRejections = pgTable(
  'import_rejections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    importId: uuid('import_id')
      .notNull()
      .references(() => imports.id, { onDelete: 'cascade' }),
    lineNumber: integer('line_number').notNull(),
    reason: text('reason').notNull(),
    message: text('message').notNull(),
    rawValue: jsonb('raw_value').$type<
      Record<string, unknown> | string | null
    >(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('import_rejections_import_line_uidx').on(
      table.importId,
      table.lineNumber,
    ),
    index('import_rejections_cursor_idx').on(
      table.importId,
      table.lineNumber,
      table.id,
    ),
    check(
      'import_rejections_line_number_positive',
      sql`${table.lineNumber} > 0`,
    ),
  ],
);

export const importSummaryByCurrency = pgTable(
  'import_summary_by_currency',
  {
    importId: uuid('import_id')
      .notNull()
      .references(() => imports.id, { onDelete: 'cascade' }),
    currency: char('currency', { length: 3 }).notNull(),
    transactionCount: integer('transaction_count').notNull().default(0),
    totalAmount: numeric('total_amount', { precision: 24, scale: 4 })
      .notNull()
      .default('0'),
  },
  (table) => [
    unique('import_summary_by_currency_pk').on(table.importId, table.currency),
  ],
);

export const importSummaryByRisk = pgTable(
  'import_summary_by_risk',
  {
    importId: uuid('import_id')
      .notNull()
      .references(() => imports.id, { onDelete: 'cascade' }),
    riskLevel: riskLevelEnum('risk_level').notNull(),
    transactionCount: integer('transaction_count').notNull().default(0),
  },
  (table) => [
    unique('import_summary_by_risk_pk').on(table.importId, table.riskLevel),
  ],
);

export const importSummaryByMerchant = pgTable(
  'import_summary_by_merchant',
  {
    importId: uuid('import_id')
      .notNull()
      .references(() => imports.id, { onDelete: 'cascade' }),
    merchantId: text('merchant_id').notNull(),
    transactionCount: integer('transaction_count').notNull().default(0),
    totalAmount: numeric('total_amount', { precision: 24, scale: 4 })
      .notNull()
      .default('0'),
  },
  (table) => [
    unique('import_summary_by_merchant_pk').on(
      table.importId,
      table.merchantId,
    ),
  ],
);

export const importSummaryByAccount = pgTable(
  'import_summary_by_account',
  {
    importId: uuid('import_id')
      .notNull()
      .references(() => imports.id, { onDelete: 'cascade' }),
    accountId: text('account_id').notNull(),
    transactionCount: integer('transaction_count').notNull().default(0),
    totalAmount: numeric('total_amount', { precision: 24, scale: 4 })
      .notNull()
      .default('0'),
  },
  (table) => [
    unique('import_summary_by_account_pk').on(table.importId, table.accountId),
  ],
);

export type ImportRow = typeof imports.$inferSelect;
export type ImportJobRow = typeof importJobs.$inferSelect;
export type TransactionRow = typeof transactions.$inferSelect;
export type ImportRejectionRow = typeof importRejections.$inferSelect;
