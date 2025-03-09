import { inject, Lifecycle, scoped } from 'tsyringe';
import { ObjectSchema } from 'yup';

export const PROCESS_ENV_SYMBOL = Symbol('process.env');

@scoped(Lifecycle.ContainerScoped)
export class Env {
  private readonly _env: Record<string, unknown>;

  constructor(@inject(PROCESS_ENV_SYMBOL) env: Record<string, unknown>) {
    this._env = env;
  }

  public validate<
    ExpectedEnv extends Record<string, unknown>,
    T extends ObjectSchema<ExpectedEnv> = ObjectSchema<ExpectedEnv>,
  >(schema: T) {
    return schema.validateSync(this._env, {
      stripUnknown: true,
    });
  }
}
