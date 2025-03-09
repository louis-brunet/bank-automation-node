import { authenticate } from '@google-cloud/local-auth';
import { Credentials, OAuth2Client } from 'google-auth-library';
import { google, sheets_v4 } from 'googleapis';
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
  private sheets: sheets_v4.Sheets | undefined = undefined;

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
    const logger = this.loggerService.getChild(
      this.logger,
      this.updateCell.name,
    );
    logger.trace({ request });
    const sheets = await this._getClient();
    const range = this._mapRequestedCellToRange(request.cell);
    const spreadsheetId = request.spreadsheetId;
    const values = [[request.value]];
    // const previousValue = await sheets.spreadsheets.values.get({
    //   spreadsheetId: request.spreadsheetId,
    //   range,
    // });
    // NOTE: see docs https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/update
    const result = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED', // either USER_ENTERED or RAW - https://developers.google.com/sheets/api/reference/rest/v4/ValueInputOption
      requestBody: {
        range,
        values,
      },
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
    logger.debug(
      `successfully wrote value '${request.value.toString(10)}' to spreadsheet '${spreadsheetId}' at '${range}'`,
    );
  }

  private async _getClient() {
    if (!this.sheets) {
      if (!this.client) {
        await this._authorize();
        assert.ok(this.client);
      }
      this.sheets = google.sheets({
        version: this.config.version,
        auth: this.client,
      });
    }

    return this.sheets;
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
    const client_id =
      credentials.installed?.client_id ?? credentials.web?.client_id;
    const client_secret =
      credentials.installed?.client_secret ?? credentials.web?.client_secret;
    // const key = credentials.installed || credentials.web;
    // assert.ok(key);
    const payload = JSON.stringify({
      type: 'authorized_user',
      client_id,
      client_secret,
      refresh_token: clientCredentials.refresh_token,
    });
    await fs.writeFile(this.config.tokenPath, payload);
  }

  private async _parseCredentials() {
    const content = await fs.readFile(this.config.credentialsPath);
    const keysSchema = object({
      client_id: string().optional(),
      client_secret: string().optional(),
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
    const { row, column, sheet } = cell;
    return `'${sheet}'!${column}${row}`;
  }
}
