export const TRANSACTION_REPOSITORY = Symbol('TRANSACTION_REPOSITORY');

export type RiskLevel = 'low' | 'medium' | 'high';

export type AcceptedTransactionInsert = {
  importId: string;
  providerId: string;
  transactionId: string;
  accountId: string;
  merchantId: string;
  amount: string;
  currency: string;
  occurredAt: Date;
  description: string | null;
  fingerprint: string;
  riskScore: number;
  riskLevel: RiskLevel;
};

export type RejectionInsert = {
  importId: string;
  lineNumber: number;
  reason: string;
  message: string;
  rawValue: Record<string, unknown> | string | null;
};

export type CurrencySummaryDelta = {
  currency: string;
  transactionCount: number;
  totalAmount: string;
};

export type RiskSummaryDelta = {
  riskLevel: RiskLevel;
  transactionCount: number;
};

export type NamedSummaryDelta = {
  id: string;
  transactionCount: number;
  totalAmount: string;
};

export type PersistBatchInput = {
  importId: string;
  accepted: AcceptedTransactionInsert[];
  rejections: RejectionInsert[];
  progress: {
    processed: number;
    accepted: number;
    rejected: number;
    duplicates: number;
  };
  byCurrency: CurrencySummaryDelta[];
  byRisk: RiskSummaryDelta[];
  byMerchant: NamedSummaryDelta[];
  byAccount: NamedSummaryDelta[];
};

export type PersistBatchResult = {
  insertedCount: number;
};

export interface TransactionRepository {
  persistBatch(input: PersistBatchInput): Promise<PersistBatchResult>;
}
