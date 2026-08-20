CREATE TYPE "public"."import_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'cancelling', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."risk_level" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TABLE "idempotency_keys" (
	"key" text PRIMARY KEY NOT NULL,
	"import_id" uuid NOT NULL,
	"request_fingerprint" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"import_id" uuid NOT NULL,
	"storage_path" text NOT NULL,
	"byte_size" bigint NOT NULL,
	"checksum" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"import_id" uuid NOT NULL,
	"owner" text,
	"lease_expires_at" timestamp with time zone,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "import_jobs_attempt_count_non_negative" CHECK ("import_jobs"."attempt_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "import_rejections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"import_id" uuid NOT NULL,
	"line_number" integer NOT NULL,
	"reason" text NOT NULL,
	"message" text NOT NULL,
	"raw_value" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "import_rejections_line_number_positive" CHECK ("import_rejections"."line_number" > 0)
);
--> statement-breakpoint
CREATE TABLE "import_summary_by_account" (
	"import_id" uuid NOT NULL,
	"account_id" text NOT NULL,
	"transaction_count" integer DEFAULT 0 NOT NULL,
	"total_amount" numeric(24, 4) DEFAULT '0' NOT NULL,
	CONSTRAINT "import_summary_by_account_pk" UNIQUE("import_id","account_id")
);
--> statement-breakpoint
CREATE TABLE "import_summary_by_currency" (
	"import_id" uuid NOT NULL,
	"currency" char(3) NOT NULL,
	"transaction_count" integer DEFAULT 0 NOT NULL,
	"total_amount" numeric(24, 4) DEFAULT '0' NOT NULL,
	CONSTRAINT "import_summary_by_currency_pk" UNIQUE("import_id","currency")
);
--> statement-breakpoint
CREATE TABLE "import_summary_by_merchant" (
	"import_id" uuid NOT NULL,
	"merchant_id" text NOT NULL,
	"transaction_count" integer DEFAULT 0 NOT NULL,
	"total_amount" numeric(24, 4) DEFAULT '0' NOT NULL,
	CONSTRAINT "import_summary_by_merchant_pk" UNIQUE("import_id","merchant_id")
);
--> statement-breakpoint
CREATE TABLE "import_summary_by_risk" (
	"import_id" uuid NOT NULL,
	"risk_level" "risk_level" NOT NULL,
	"transaction_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "import_summary_by_risk_pk" UNIQUE("import_id","risk_level")
);
--> statement-breakpoint
CREATE TABLE "imports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" text NOT NULL,
	"status" "import_status" DEFAULT 'pending' NOT NULL,
	"processed" integer DEFAULT 0 NOT NULL,
	"accepted" integer DEFAULT 0 NOT NULL,
	"rejected" integer DEFAULT 0 NOT NULL,
	"duplicates" integer DEFAULT 0 NOT NULL,
	"failure_reason" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"import_id" uuid NOT NULL,
	"provider_id" text NOT NULL,
	"transaction_id" text NOT NULL,
	"account_id" text NOT NULL,
	"merchant_id" text NOT NULL,
	"amount" numeric(20, 4) NOT NULL,
	"currency" char(3) NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"description" text,
	"fingerprint" text NOT NULL,
	"risk_score" integer NOT NULL,
	"risk_level" "risk_level" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transactions_amount_positive" CHECK ("transactions"."amount" > 0),
	CONSTRAINT "transactions_risk_score_range" CHECK ("transactions"."risk_score" >= 0 AND "transactions"."risk_score" <= 100)
);
--> statement-breakpoint
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_import_id_imports_id_fk" FOREIGN KEY ("import_id") REFERENCES "public"."imports"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_files" ADD CONSTRAINT "import_files_import_id_imports_id_fk" FOREIGN KEY ("import_id") REFERENCES "public"."imports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_import_id_imports_id_fk" FOREIGN KEY ("import_id") REFERENCES "public"."imports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_rejections" ADD CONSTRAINT "import_rejections_import_id_imports_id_fk" FOREIGN KEY ("import_id") REFERENCES "public"."imports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_summary_by_account" ADD CONSTRAINT "import_summary_by_account_import_id_imports_id_fk" FOREIGN KEY ("import_id") REFERENCES "public"."imports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_summary_by_currency" ADD CONSTRAINT "import_summary_by_currency_import_id_imports_id_fk" FOREIGN KEY ("import_id") REFERENCES "public"."imports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_summary_by_merchant" ADD CONSTRAINT "import_summary_by_merchant_import_id_imports_id_fk" FOREIGN KEY ("import_id") REFERENCES "public"."imports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_summary_by_risk" ADD CONSTRAINT "import_summary_by_risk_import_id_imports_id_fk" FOREIGN KEY ("import_id") REFERENCES "public"."imports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_import_id_imports_id_fk" FOREIGN KEY ("import_id") REFERENCES "public"."imports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idempotency_keys_import_id_uidx" ON "idempotency_keys" USING btree ("import_id");--> statement-breakpoint
CREATE UNIQUE INDEX "import_files_import_id_uidx" ON "import_files" USING btree ("import_id");--> statement-breakpoint
CREATE UNIQUE INDEX "import_files_storage_path_uidx" ON "import_files" USING btree ("storage_path");--> statement-breakpoint
CREATE UNIQUE INDEX "import_jobs_import_id_uidx" ON "import_jobs" USING btree ("import_id");--> statement-breakpoint
CREATE INDEX "import_jobs_claim_idx" ON "import_jobs" USING btree ("owner","lease_expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "import_rejections_import_line_uidx" ON "import_rejections" USING btree ("import_id","line_number");--> statement-breakpoint
CREATE INDEX "import_rejections_cursor_idx" ON "import_rejections" USING btree ("import_id","line_number","id");--> statement-breakpoint
CREATE INDEX "imports_provider_id_idx" ON "imports" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "imports_status_idx" ON "imports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "imports_created_at_idx" ON "imports" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "transactions_provider_txn_uidx" ON "transactions" USING btree ("provider_id","transaction_id");--> statement-breakpoint
CREATE INDEX "transactions_import_id_idx" ON "transactions" USING btree ("import_id");--> statement-breakpoint
CREATE INDEX "transactions_currency_idx" ON "transactions" USING btree ("import_id","currency");--> statement-breakpoint
CREATE INDEX "transactions_risk_level_idx" ON "transactions" USING btree ("import_id","risk_level");