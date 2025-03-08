import { Logger } from 'pino';
import { Lifecycle, scoped } from 'tsyringe';
import { LoggerService } from '../../logger';
import { AbstractSpreadsheetAdapter, GoogleSheetsAdapter } from '../adapters';
import { SpreadsheetProvider, SpreadsheetUpdateCellRequest } from '../types';

@scoped(Lifecycle.ContainerScoped)
export class SpreadsheetService {
  private readonly logger: Logger;

  constructor(
    private readonly loggerService: LoggerService,
    private readonly googleSheetsAdapter: GoogleSheetsAdapter,
  ) {
    this.logger = this.loggerService.getLogger(SpreadsheetService.name);
    this.logger.trace('constructor called');
  }

  async updateCell(request: SpreadsheetUpdateCellRequest) {
    const adapter = this._getAdapter(request.provider);
    await adapter.updateCell(request);
    // await adapter.updateRange(numberToWrite, location);
  }

  private _getAdapter(
    spreadsheetProvider: SpreadsheetProvider,
  ): AbstractSpreadsheetAdapter {
    switch (spreadsheetProvider) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      case 'google-sheets':
        return this.googleSheetsAdapter;
    }
  }
}
