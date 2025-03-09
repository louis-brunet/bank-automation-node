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
    // TODO: how/where to get the precide spreadsheet id+location?
    // private readonly storageConfig: StorageConfig,
  ) {
    this.logger = this.loggerService.getLogger(StorageService.name);
    this.logger.trace('constructor called');
  }

  async setCheckingAccountBalance(balance: number) {
    const logger = this.loggerService.getChild(
      this.logger,
      this.setCheckingAccountBalance.name,
    );
    logger.trace({ balance });

    await Promise.reject(new Error('todo'));

    const request: SpreadsheetUpdateCellRequest = {
      provider: 'google-sheets',
      spreadsheetId: '',
      cell: { row: '', column: '' },
      value: balance,
    };
    await this.spreadsheetService.updateCell(request);
    await Promise.reject(new Error('todo'));
  }
}
