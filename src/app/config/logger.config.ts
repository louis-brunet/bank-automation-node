import { Lifecycle, scoped } from 'tsyringe';
import { object, string } from 'yup';
import { Env } from './env';

const logLevels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'] as const;
export type LogLevel = (typeof logLevels)[number];

const envSchema = object({
  LOG_LEVEL: string<LogLevel>().oneOf(logLevels).default('info'),
});

@scoped(Lifecycle.ContainerScoped)
export class LoggerConfig {
  public readonly level: LogLevel;

  constructor(env: Env) {
    const validated = env.validate(envSchema);
    this.level = validated.LOG_LEVEL;
  }
}
