import { Logger } from 'pino';
import { Lifecycle, scoped } from 'tsyringe';
import { AppConfig } from '../../config';
import { LoggerService } from '../logger';
import { TemporaryFile } from './temporary-file';

export type TemporaryFileServiceFunction<Result> = (
  fileName: string,
) => PromiseLike<Result>;

@scoped(Lifecycle.ContainerScoped)
export class TemporaryFileService {
  private readonly logger: Logger;
  constructor(
    private readonly appConfig: AppConfig,
    private readonly loggerService: LoggerService,
  ) {
    this.logger = this.loggerService.getLogger(TemporaryFileService.name);
  }

  async createTemporaryFile() {
    const tempFile = new TemporaryFile(this.appConfig.name, {
      logger: (fileName) =>
        this.loggerService.getChild(
          this.logger,
          `${TemporaryFile.name}:${fileName}`,
        ),
    });
    await tempFile.init();
    return tempFile;
  }
}
