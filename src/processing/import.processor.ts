import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';

@Injectable()
export class ImportProcessor implements OnApplicationBootstrap {
  private readonly logger = new Logger(ImportProcessor.name);

  onApplicationBootstrap(): void {
    this.logger.log(
      'Worker ready; import job consumption starts in a later commit',
    );
  }
}
