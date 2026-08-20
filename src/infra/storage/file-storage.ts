export const FILE_STORAGE = Symbol('FILE_STORAGE');

export interface StoredFilePath {
  absolutePath: string;
}

export interface FileStorage {
  createUniquePath(): StoredFilePath;
  ensureReady(): Promise<void>;
  delete(absolutePath: string): Promise<void>;
}
