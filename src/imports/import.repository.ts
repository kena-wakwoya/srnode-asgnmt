export const IMPORT_REPOSITORY = Symbol('IMPORT_REPOSITORY');

export type ImportStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelling'
  | 'cancelled';

export type ImportRecord = {
  id: string;
  providerId: string;
  status: ImportStatus;
  processed: number;
  accepted: number;
  rejected: number;
  duplicates: number;
  failureReason: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
};

export type ImportJobRecord = {
  id: string;
  importId: string;
  owner: string | null;
  leaseExpiresAt: Date | null;
  attemptCount: number;
};

export type ImportProgressDelta = {
  processed: number;
  accepted: number;
  rejected: number;
  duplicates: number;
};

export interface ImportRepository {
  findById(id: string): Promise<ImportRecord | null>;
  findByIdempotencyKey(key: string): Promise<{
    importId: string;
    requestFingerprint: string;
  } | null>;
  updateStatus(
    id: string,
    status: ImportStatus,
    failureReason?: string | null,
  ): Promise<void>;
  updateProgress(id: string, delta: ImportProgressDelta): Promise<void>;
  claimJob(workerId: string, leaseUntil: Date): Promise<ImportJobRecord | null>;
  heartbeatLease(jobId: string, leaseUntil: Date): Promise<void>;
  requestCancel(id: string): Promise<ImportRecord | null>;
}
