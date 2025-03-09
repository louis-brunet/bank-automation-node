import { Lifecycle, scoped } from 'tsyringe';
import { array, object, string } from 'yup';
import {
  GoogleSheetsScope,
  googleSheetsScopeArray,
  GoogleSheetsVersion,
  googleSheetsVersionArray,
} from '../infra';
import { Env } from './env';

const envSchema = object({
  GOOGLE_SHEETS_SCOPES: array(
    string<GoogleSheetsScope>().url().required().oneOf(googleSheetsScopeArray),
  )
    .required()
    .min(1)
    .default(['https://www.googleapis.com/auth/spreadsheets']),
  GOOGLE_SHEETS_CREDENTIALS_PATH: string().required(),
  GOOGLE_SHEETS_TOKEN_PATH: string().required(),
  GOOGLE_SHEETS_VERSION: string<GoogleSheetsVersion>()
    .optional()
    .oneOf(googleSheetsVersionArray)
    .default('v4'),
});

@scoped(Lifecycle.ContainerScoped)
export class GoogleSheetsConfig {
  public readonly scopes: GoogleSheetsScope[];
  public readonly credentialsPath: string;
  public readonly tokenPath: string;
  public readonly version: GoogleSheetsVersion;

  constructor(env: Env) {
    const validated = env.validate(envSchema);
    this.scopes = validated.GOOGLE_SHEETS_SCOPES;
    this.credentialsPath = validated.GOOGLE_SHEETS_CREDENTIALS_PATH;
    this.tokenPath = validated.GOOGLE_SHEETS_TOKEN_PATH;
    this.version = validated.GOOGLE_SHEETS_VERSION;
  }
}
