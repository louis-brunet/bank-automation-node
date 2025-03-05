import { InferType, object, string } from 'yup';
import { Env } from './env';
import { singleton } from 'tsyringe';

export const CAISSE_D_EPARGNE_PASSWORD_MIN_LENGTH = 8;
export const CAISSE_D_EPARGNE_PASSWORD_MAX_LENGTH = 8;

const envSchema = object({
  CAISSE_D_EPARGNE_ACCOUNT_ID: string().required(),
  CAISSE_D_EPARGNE_ACCOUNT_PASSWORD: string()
    .required()
    .min(CAISSE_D_EPARGNE_PASSWORD_MIN_LENGTH)
    .max(CAISSE_D_EPARGNE_PASSWORD_MAX_LENGTH),
  CAISSE_D_EPARGNE_CHECKING_ACCOUNT: string().required(),
  CAISSE_D_EPARGNE_BASE_URL: string()
    .optional()
    .min(1)
    .default('https://www.caisse-epargne.fr'),
});
export type CaisseDEpargneEnv = InferType<typeof envSchema>;

@singleton()
export class CaisseDEpargneConfig {
  public readonly accountId: string;
  public readonly accountPassword: string;
  public readonly checkingAccount: string;
  public readonly baseUrl: string;

  constructor(env: Env) {
    const validated: CaisseDEpargneEnv = env.validate(envSchema);
    this.accountId = validated.CAISSE_D_EPARGNE_ACCOUNT_ID;
    this.accountPassword = validated.CAISSE_D_EPARGNE_ACCOUNT_PASSWORD;
    this.checkingAccount = validated.CAISSE_D_EPARGNE_CHECKING_ACCOUNT;
    this.baseUrl = validated.CAISSE_D_EPARGNE_BASE_URL;
  }
}
