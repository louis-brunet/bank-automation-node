import { singleton } from 'tsyringe';
import { object, string } from 'yup';
import { Env } from './env';

const envSchema = object({
  BANK_AUTOMATION_APP_NAME: string().min(1).default('bank-automation'),
});

@singleton()
export class AppConfig {
  public readonly name: string;

  constructor(env: Env) {
    const validated = env.validate(envSchema);
    this.name = validated.BANK_AUTOMATION_APP_NAME;
  }
}
