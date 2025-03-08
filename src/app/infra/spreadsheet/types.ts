export const spreadsheetProviderArray = ['google-sheets'] as const;
export type SpreadsheetProvider = (typeof spreadsheetProviderArray)[number];

export const googleSheetsScopeArray = [
  'https://www.googleapis.com/auth/spreadsheets.readonly',
] as const;
export type GoogleSheetsScope = (typeof googleSheetsScopeArray)[number];

export const googleSheetsVersionArray = ['v4'] as const;
export type GoogleSheetsVersion = (typeof googleSheetsVersionArray)[number];

export type SpreadsheetCell = {
  readonly row: string;
  readonly column: string;
};
export type SpreadsheetRange = {
  readonly start: SpreadsheetCell;
  readonly end: SpreadsheetCell;
};

// export type SpreadsheetLocation = SpreadsheetCell | SpreadsheetRange;

export type SpreadsheetUpdateCellRequest = {
  readonly provider: SpreadsheetProvider;
  readonly spreadsheetId: string;
  readonly cell: SpreadsheetCell;
  readonly value: string | number;
};

// export type SpreadsheetLocation = {
//   host: SpreadsheetProvider;
//   spreadsheetId: string;
//   range: SpreadsheetRange;
// };
