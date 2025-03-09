import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Logger } from 'pino';

export class TemporaryFile implements AsyncDisposable {
  public readonly fileName: string;
  private readonly logger: Logger | undefined;

  constructor(
    namePrefix: string,
    options?: { logger?: (fileName: string) => Logger },
  ) {
    this.fileName = join(tmpdir(), `${namePrefix}-${randomUUID()}`);
    this.logger = options?.logger?.(this.fileName);
  }

  async init() {
    const fileHandle = await fs.open(this.fileName, 'w');
    await fileHandle.close();
  }

  async [Symbol.asyncDispose](): Promise<void> {
    await fs.rm(this.fileName, { force: true, maxRetries: 3 });
    this.logger?.debug(`deleted temporary file ${this.fileName}`);
  }
}
