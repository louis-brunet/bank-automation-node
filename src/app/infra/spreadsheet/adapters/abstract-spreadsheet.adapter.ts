import { SpreadsheetUpdateCellRequest } from '../types';

export abstract class AbstractSpreadsheetAdapter {
  // abstract updateRange(): Promise<void>;
  abstract updateCell(request: SpreadsheetUpdateCellRequest): Promise<void>;
}
