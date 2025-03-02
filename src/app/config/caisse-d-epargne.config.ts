import { InferType, object, string } from 'yup';
import { Env } from './env';
import { singleton } from 'tsyringe';

const envSchema = object({
  CAISSE_D_EPARGNE_ACCOUNT_ID: string().required(),
  CAISSE_D_EPARGNE_ACCOUNT_PASSWORD: string().required(),
  CAISSE_D_EPARGNE_CHECKING_ACCOUNT: string().required(),
  CAISSE_D_EPARGNE_BASE_URL: string().default('https://www.caisse-epargne.fr'),
});
type CaisseDEpargneEnv = InferType<typeof envSchema>;

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
