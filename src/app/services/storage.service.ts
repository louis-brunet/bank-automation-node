import { Logger } from 'pino';
import { Lifecycle, scoped } from 'tsyringe';
import { LoggerService, SpreadsheetService } from '../infra';
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
    await this.spreadsheetService.updateCell({
      value: balance,
      provider: 'google-sheets',
      spreadsheetId: this.config.spreadsheetId,
      cell: {
        row: this.config.checkingAccountCellRow,
        column: this.config.checkingAccountCellColumn,
        sheet: this.config.checkingAccountCellSheet,
      },
    });
  }

  async setLivretAAccountBalance(balance: number) {
    const logger = this.loggerService.getChild(
      this.logger,
      this.setLivretAAccountBalance.name,
    );
    logger.trace({ balance });
    await this.spreadsheetService.updateCell({
      value: balance,
      provider: 'google-sheets',
      spreadsheetId: this.config.spreadsheetId,
      cell: {
        row: this.config.livretAAccountCellRow,
        column: this.config.livretAAccountCellColumn,
        sheet: this.config.livretAAccountCellSheet,
      },
    });
  }

  async setLivretJeuneAccountBalance(balance: number) {
    const logger = this.loggerService.getChild(
      this.logger,
      this.setLivretJeuneAccountBalance.name,
    );
    logger.trace({ balance });
    await this.spreadsheetService.updateCell({
      value: balance,
      provider: 'google-sheets',
      spreadsheetId: this.config.spreadsheetId,
      cell: {
        row: this.config.livretJeuneAccountCellRow,
        column: this.config.livretJeuneAccountCellColumn,
        sheet: this.config.livretJeuneAccountCellSheet,
      },
    });
  }
}
