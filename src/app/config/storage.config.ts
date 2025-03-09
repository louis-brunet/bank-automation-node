import { Lifecycle, scoped } from 'tsyringe';
import { object, string } from 'yup';
import { Env } from './env';

const envSchema = object({
  STORAGE_SPREADSHEET_ID: string().required(),
  STORAGE_CHECKING_ACCOUNT_CELL_SHEET: string().required(),
  STORAGE_CHECKING_ACCOUNT_CELL_ROW: string().required(),
  STORAGE_CHECKING_ACCOUNT_CELL_COLUMN: string().required(),
});

@scoped(Lifecycle.ContainerScoped)
export class StorageConfig {
  public readonly spreadsheetId: string;
  public readonly checkingAccountCellSheet: string;
  public readonly checkingAccountCellRow: string;
  public readonly checkingAccountCellColumn: string;

  constructor(env: Env) {
    const validated = env.validate(envSchema);
    this.spreadsheetId = validated.STORAGE_SPREADSHEET_ID;
    this.checkingAccountCellSheet =
      validated.STORAGE_CHECKING_ACCOUNT_CELL_SHEET;
    this.checkingAccountCellRow = validated.STORAGE_CHECKING_ACCOUNT_CELL_ROW;
    this.checkingAccountCellColumn =
      validated.STORAGE_CHECKING_ACCOUNT_CELL_COLUMN;
  }
}
