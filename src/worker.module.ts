import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from './infra/db/drizzle.module';
import { InfraModule } from './infra/infra.module';
import { validateEnv } from './infra/config/env';
import { ImportsModule } from './imports/imports.module';
import { TransactionsModule } from './transactions/transactions.module';
import { ProcessingModule } from './processing/processing.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      validate: validateEnv,
    }),
    DrizzleModule,
    InfraModule,
    ImportsModule,
    TransactionsModule,
    ProcessingModule,
  ],
})
export class WorkerModule {}
