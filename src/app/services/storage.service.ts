import { Logger } from 'pino';
import { Lifecycle, scoped } from 'tsyringe';
import {
  LoggerService,
  SpreadsheetService,
  SpreadsheetUpdateCellRequest,
} from '../infra';

@scoped(Lifecycle.ContainerScoped)
export class StorageService {
  private readonly logger: Logger;

  constructor(
    private readonly loggerService: LoggerService,
    private readonly spreadsheetService: SpreadsheetService,
  ) {
    this.logger = this.loggerService.getLogger(StorageService.name);
    this.logger.trace('constructor called');
  }

  async setCheckingAccountBalance(_balance: number) {
    const request: SpreadsheetUpdateCellRequest = {
      provider: 'google-sheets',
      spreadsheetId: ...,
      value: ...,
      cell: ...,
    };
    await this.spreadsheetService.updateCell(request);
    await Promise.reject(new Error('todo'));
  }
}
