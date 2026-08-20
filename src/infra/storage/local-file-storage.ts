import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { Inject, Injectable } from '@nestjs/common';
import { ID_GENERATOR, type IdGenerator } from '../ids/id-generator';
import { FileStorage, StoredFilePath } from './file-storage';

@Injectable()
export class LocalFileStorage implements FileStorage {
  constructor(
    private readonly rootDir: string,
    @Inject(ID_GENERATOR) private readonly ids: IdGenerator,
  ) {}

  async ensureReady(): Promise<void> {
    await mkdir(this.rootDir, { recursive: true });
  }

  createUniquePath(): StoredFilePath {
    const absolutePath = join(this.rootDir, `${this.ids.generate()}.ndjson`);
    return { absolutePath };
  }

  async delete(absolutePath: string): Promise<void> {
    await rm(absolutePath, { force: true });
  }
}
