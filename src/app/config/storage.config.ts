import { Lifecycle, scoped } from 'tsyringe';
import { object, string } from 'yup';
import { Env } from './env';

const envSchema = object({
  STORAGE_SPREADSHEET_ID: string().required(),

  STORAGE_CHECKING_ACCOUNT_CELL_SHEET: string().required(),
  STORAGE_CHECKING_ACCOUNT_CELL_ROW: string().required(),
  STORAGE_CHECKING_ACCOUNT_CELL_COLUMN: string().required(),

  STORAGE_LIVRET_A_ACCOUNT_CELL_SHEET: string().required(),
  STORAGE_LIVRET_A_ACCOUNT_CELL_ROW: string().required(),
  STORAGE_LIVRET_A_ACCOUNT_CELL_COLUMN: string().required(),

  STORAGE_LIVRET_JEUNE_ACCOUNT_CELL_SHEET: string().required(),
  STORAGE_LIVRET_JEUNE_ACCOUNT_CELL_ROW: string().required(),
  STORAGE_LIVRET_JEUNE_ACCOUNT_CELL_COLUMN: string().required(),
});

@scoped(Lifecycle.ContainerScoped)
export class StorageConfig {
  public readonly spreadsheetId: string;

  public readonly checkingAccountCellSheet: string;
  public readonly checkingAccountCellRow: string;
  public readonly checkingAccountCellColumn: string;

  public readonly livretAAccountCellSheet: string;
  public readonly livretAAccountCellRow: string;
  public readonly livretAAccountCellColumn: string;

  public readonly livretJeuneAccountCellSheet: string;
  public readonly livretJeuneAccountCellRow: string;
  public readonly livretJeuneAccountCellColumn: string;

  constructor(env: Env) {
    const validated = env.validate(envSchema);
    this.spreadsheetId = validated.STORAGE_SPREADSHEET_ID;

    this.checkingAccountCellSheet =
      validated.STORAGE_CHECKING_ACCOUNT_CELL_SHEET;
    this.checkingAccountCellRow = validated.STORAGE_CHECKING_ACCOUNT_CELL_ROW;
    this.checkingAccountCellColumn =
      validated.STORAGE_CHECKING_ACCOUNT_CELL_COLUMN;

    this.livretAAccountCellSheet =
      validated.STORAGE_LIVRET_A_ACCOUNT_CELL_SHEET;
    this.livretAAccountCellRow = validated.STORAGE_LIVRET_A_ACCOUNT_CELL_ROW;
    this.livretAAccountCellColumn =
      validated.STORAGE_LIVRET_A_ACCOUNT_CELL_COLUMN;

    this.livretJeuneAccountCellSheet =
      validated.STORAGE_LIVRET_JEUNE_ACCOUNT_CELL_SHEET;
    this.livretJeuneAccountCellRow =
      validated.STORAGE_LIVRET_JEUNE_ACCOUNT_CELL_ROW;
    this.livretJeuneAccountCellColumn =
      validated.STORAGE_LIVRET_JEUNE_ACCOUNT_CELL_COLUMN;
  }
}
