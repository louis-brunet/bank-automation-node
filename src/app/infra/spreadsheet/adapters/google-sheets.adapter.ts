import { authenticate } from '@google-cloud/local-auth';
import { Credentials, OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import assert from 'node:assert';
import fs from 'node:fs/promises';
import { Logger } from 'pino';
import { delay, inject, Lifecycle, scoped } from 'tsyringe';
import { object, string } from 'yup';
import { GoogleSheetsConfig } from '../../../config';
import { LoggerService } from '../../logger';
import { GoogleSheetsUpdateCellError } from '../errors';
import { SpreadsheetCell, SpreadsheetUpdateCellRequest } from '../types';
import { AbstractSpreadsheetAdapter } from './abstract-spreadsheet.adapter';

@scoped(Lifecycle.ContainerScoped)
export class GoogleSheetsAdapter extends AbstractSpreadsheetAdapter {
  private readonly logger: Logger;
  private client: OAuth2Client | undefined = undefined;

  constructor(
    private readonly loggerService: LoggerService,
    @inject(delay(() => GoogleSheetsConfig))
    private readonly config: GoogleSheetsConfig,
  ) {
    super();
    this.logger = this.loggerService.getLogger(GoogleSheetsAdapter.name);
    this.logger.trace('constructor called');
  }

  override async updateCell(
    request: SpreadsheetUpdateCellRequest,
  ): Promise<void> {
    const sheets = await this._getClient();
    const range = this._mapRequestedCellToRange(request.cell);
    // const previousValue = await sheets.spreadsheets.values.get({
    //   spreadsheetId: request.spreadsheetId,
    //   range,
    // });

    await Promise.reject(new Error('todo'));

    const result = await sheets.spreadsheets.values.update({
      // .....
    });
    const expectedUpdatedCellCount = 1;
    const updatedCells = result.data.updatedCells;
    if (
      updatedCells === null ||
      updatedCells === undefined ||
      updatedCells !== expectedUpdatedCellCount
    ) {
      throw new GoogleSheetsUpdateCellError(range, request.value, updatedCells);
    }
  }

  private async _getClient() {
    await this._authorize();
    assert.ok(this.client);

    const sheets = google.sheets({
      version: this.config.version,
      auth: this.client,
    });
    return sheets;
  }

  private async _authorize() {
    const scopes = this.config.scopes;
    const keyfilePath = this.config.credentialsPath;
    this.client = await authenticate({
      scopes,
      keyfilePath,
    });
    await this._saveCredentials(this.client.credentials);
  }

  /**
   * Serializes credentials to a file compatible with GoogleAuth.fromJSON.
   */
  private async _saveCredentials(clientCredentials: Credentials) {
    const credentials = await this._parseCredentials();
    const key = credentials.installed || credentials.web;
    assert.ok(key);
    const payload = JSON.stringify({
      type: 'authorized_user',
      client_id: key.client_id,
      client_secret: key.client_secret,
      refresh_token: clientCredentials.refresh_token,
    });
    await fs.writeFile(this.config.tokenPath, payload);
  }

  private async _parseCredentials() {
    const content = await fs.readFile(this.config.credentialsPath);
    const keysSchema = object({
      client_id: string().required(),
      client_secret: string().required(),
    });
    const schema = object({
      installed: keysSchema.optional(),
      web: keysSchema.optional(),
    });
    const credentials = schema.validateSync(
      JSON.parse(content.toString('utf-8')),
    );
    assert.ok(credentials.installed || credentials.web);
    return credentials;
  }

  private _mapRequestedCellToRange(cell: SpreadsheetCell) {
    const { row, column } = cell;
    return `${column}${row}`;
  }
}
