import { Injectable } from '@nestjs/common';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { DrizzleService } from '../infra/db/drizzle.service';
import { idempotencyKeys, importJobs, imports } from '../infra/db/schema';
import {
  ImportJobRecord,
  ImportProgressDelta,
  ImportRecord,
  ImportRepository,
  ImportStatus,
} from './import.repository';

const cancellableStatuses: ImportStatus[] = [
  'pending',
  'processing',
  'cancelling',
];

@Injectable()
export class DrizzleImportRepository implements ImportRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findById(id: string): Promise<ImportRecord | null> {
    const rows = await this.drizzle.db
      .select()
      .from(imports)
      .where(eq(imports.id, id))
      .limit(1);

    const row = rows[0];
    return row ? this.toImport(row) : null;
  }

  async findByIdempotencyKey(key: string): Promise<{
    importId: string;
    requestFingerprint: string;
  } | null> {
    const rows = await this.drizzle.db
      .select({
        importId: idempotencyKeys.importId,
        requestFingerprint: idempotencyKeys.requestFingerprint,
      })
      .from(idempotencyKeys)
      .where(eq(idempotencyKeys.key, key))
      .limit(1);

    return rows[0] ?? null;
  }

  async updateStatus(
    id: string,
    status: ImportStatus,
    failureReason?: string | null,
  ): Promise<void> {
    const values: Record<string, unknown> = { status };

    if (failureReason !== undefined) {
      values.failureReason = failureReason;
    }
    if (status === 'processing') {
      values.startedAt = sql`coalesce(${imports.startedAt}, now())`;
    }
    if (
      status === 'completed' ||
      status === 'failed' ||
      status === 'cancelled'
    ) {
      values.completedAt = sql`now()`;
    }

    await this.drizzle.db.update(imports).set(values).where(eq(imports.id, id));
  }

  async updateProgress(id: string, delta: ImportProgressDelta): Promise<void> {
    await this.drizzle.db
      .update(imports)
      .set({
        processed: sql`${imports.processed} + ${delta.processed}`,
        accepted: sql`${imports.accepted} + ${delta.accepted}`,
        rejected: sql`${imports.rejected} + ${delta.rejected}`,
        duplicates: sql`${imports.duplicates} + ${delta.duplicates}`,
      })
      .where(eq(imports.id, id));
  }

  async claimJob(
    workerId: string,
    leaseUntil: Date,
  ): Promise<ImportJobRecord | null> {
    const rows = await this.drizzle.db.execute(sql`
      UPDATE import_jobs AS job
      SET
        owner = ${workerId},
        lease_expires_at = ${leaseUntil},
        attempt_count = job.attempt_count + 1,
        updated_at = now()
      FROM (
        SELECT job.id
        FROM import_jobs AS job
        INNER JOIN imports AS imp ON imp.id = job.import_id
        WHERE (job.owner IS NULL OR job.lease_expires_at < now())
          AND imp.status IN ('pending', 'processing')
        ORDER BY job.created_at
        FOR UPDATE OF job SKIP LOCKED
        LIMIT 1
      ) AS picked
      WHERE job.id = picked.id
      RETURNING
        job.id,
        job.import_id AS "importId",
        job.owner,
        job.lease_expires_at AS "leaseExpiresAt",
        job.attempt_count AS "attemptCount"
    `);

    const row = rows[0] as
      | {
          id: string;
          importId: string;
          owner: string | null;
          leaseExpiresAt: Date | string | null;
          attemptCount: number;
        }
      | undefined;

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      importId: row.importId,
      owner: row.owner,
      leaseExpiresAt:
        row.leaseExpiresAt instanceof Date
          ? row.leaseExpiresAt
          : row.leaseExpiresAt
            ? new Date(row.leaseExpiresAt)
            : null,
      attemptCount: Number(row.attemptCount),
    };
  }

  async heartbeatLease(jobId: string, leaseUntil: Date): Promise<void> {
    await this.drizzle.db
      .update(importJobs)
      .set({
        leaseExpiresAt: leaseUntil,
        updatedAt: sql`now()`,
      })
      .where(eq(importJobs.id, jobId));
  }

  async requestCancel(id: string): Promise<ImportRecord | null> {
    const rows = await this.drizzle.db
      .update(imports)
      .set({ status: 'cancelling' })
      .where(
        and(eq(imports.id, id), inArray(imports.status, cancellableStatuses)),
      )
      .returning();

    const row = rows[0];
    return row ? this.toImport(row) : null;
  }

  private toImport(row: typeof imports.$inferSelect): ImportRecord {
    return {
      id: row.id,
      providerId: row.providerId,
      status: row.status,
      processed: row.processed,
      accepted: row.accepted,
      rejected: row.rejected,
      duplicates: row.duplicates,
      failureReason: row.failureReason,
      startedAt: row.startedAt,
      completedAt: row.completedAt,
      createdAt: row.createdAt,
    };
  }
}
