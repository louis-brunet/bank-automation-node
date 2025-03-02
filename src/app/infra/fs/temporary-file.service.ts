import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Logger } from 'pino';
import { singleton } from 'tsyringe';
import { AppConfig } from '../../config';
import { LoggerService } from '../logger.service';

export type TemporaryFileServiceFunction<Result> = (
  fileName: string,
) => PromiseLike<Result>;

@singleton()
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

    let tempDir: string;
    try {
      tempDir = await fs.mkdtemp(join(tmpdir(), this.appConfig.name));
      logger.debug(`created temp dir ${tempDir}`);
    } catch (e) {
      logger.error({ error: e }, 'could not create temp dir');
      return undefined;
    }
    const tempFile = join(tempDir, randomUUID());

    try {
      logger.debug(`calling given function for temporary file ${tempFile}`);
      return await fileFunction(tempFile);
    } finally {
      try {
        await fs.rm(tempDir, { recursive: true });
        logger.debug(`deleted temporary file ${tempFile}`);
      } catch (e) {
        logger.error({ error: e }, `could not delete temp dir ${tempDir}`);
      }
    }
  }
}
