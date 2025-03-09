import { Logger } from 'pino';
import { Lifecycle, scoped } from 'tsyringe';
import {
  LoggerService,
  SpreadsheetService,
  SpreadsheetUpdateCellRequest,
} from '../infra';
import { StorageConfig } from '../config/storage.config';

@scoped(Lifecycle.ContainerScoped)
export class StorageService {
  private readonly logger: Logger;

  constructor(
    private readonly loggerService: LoggerService,
    private readonly spreadsheetService: SpreadsheetService,
    private readonly config: StorageConfig,
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

    const request: SpreadsheetUpdateCellRequest = {
      value: balance,
      provider: 'google-sheets',
      spreadsheetId: this.config.spreadsheetId,
      cell: {
        row: this.config.checkingAccountCellRow,
        column: this.config.checkingAccountCellColumn,
        sheet: this.config.checkingAccountCellSheet,
      },
    };
    await this.spreadsheetService.updateCell(request);
  }
}
