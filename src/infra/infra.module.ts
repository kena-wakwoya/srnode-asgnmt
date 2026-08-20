import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CLOCK } from './clock/clock';
import { SystemClock } from './clock/system.clock';
import { ID_GENERATOR, type IdGenerator } from './ids/id-generator';
import { UuidIdGenerator } from './ids/uuid-id-generator';
import { FILE_STORAGE } from './storage/file-storage';
import { LocalFileStorage } from './storage/local-file-storage';

@Global()
@Module({
  providers: [
    { provide: CLOCK, useClass: SystemClock },
    { provide: ID_GENERATOR, useClass: UuidIdGenerator },
    {
      provide: FILE_STORAGE,
      inject: [ConfigService, ID_GENERATOR],
      useFactory: (config: ConfigService, ids: IdGenerator) => {
        const rootDir = config.getOrThrow<string>('UPLOAD_DIR');
        return new LocalFileStorage(rootDir, ids);
      },
    },
  ],
  exports: [CLOCK, ID_GENERATOR, FILE_STORAGE],
})
export class InfraModule {}
