import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Logger } from 'pino';
import { Lifecycle, scoped } from 'tsyringe';
import { AppConfig } from '../../config';
import { LoggerService } from '../logger';

export type TemporaryFileServiceFunction<Result> = (
  fileName: string,
) => PromiseLike<Result>;

class TemporaryFile implements AsyncDisposable {
  public readonly fileName: string;
  private readonly logger: Logger | undefined;

  constructor(namePrefix: string, options?: { logger?: Logger }) {
    this.fileName = join(tmpdir(), `${namePrefix}-${randomUUID()}`);
    this.logger = options?.logger;
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

@scoped(Lifecycle.ContainerScoped)
export class TemporaryFileService {
  private readonly logger: Logger;
  constructor(
    private readonly appConfig: AppConfig,
    private readonly loggerService: LoggerService,
  ) {
    this.logger = this.loggerService.getLogger(TemporaryFileService.name);
  }

  async useTemporaryFile<Result>(
    fileFunction: TemporaryFileServiceFunction<Result>,
  ) {
    const logger = this.loggerService.getChild(
      this.logger,
      this.useTemporaryFile.name,
    );
    logger.trace('called');

    await using tempFile = new TemporaryFile(this.appConfig.name, {
      logger: this.loggerService.getChild(this.logger, TemporaryFile.name),
    });
    return await fileFunction(tempFile.fileName);
  }
}
