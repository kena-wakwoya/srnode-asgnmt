import { Module } from '@nestjs/common';
import { ImportProcessor } from './import.processor';

@Module({
  providers: [ImportProcessor],
})
export class ProcessingModule {}
