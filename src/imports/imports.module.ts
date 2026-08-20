import { Module } from '@nestjs/common';
import { DrizzleImportRepository } from './drizzle-import.repository';
import { IMPORT_REPOSITORY } from './import.repository';

@Module({
  providers: [
    { provide: IMPORT_REPOSITORY, useClass: DrizzleImportRepository },
  ],
  exports: [IMPORT_REPOSITORY],
})
export class ImportsModule {}
