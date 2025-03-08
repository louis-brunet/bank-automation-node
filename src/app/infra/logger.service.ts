import pino, { Logger } from 'pino';
import pinoPretty from 'pino-pretty';
import { Lifecycle, scoped } from 'tsyringe';
import { LoggerConfig } from '../config';

@scoped(Lifecycle.ContainerScoped)
export class LoggerService {
  private readonly logger: Logger;

  constructor(loggerConfig: LoggerConfig) {
    const prettyPrint = pinoPretty({
      customPrettifiers: {
        name: (names) => {
          if (typeof names === 'string') {
            return names;
          }
          if (Array.isArray(names)) {
            return names.join('.');
          }
          return JSON.stringify(names);
        },
      },
    });
    this.logger = pino(prettyPrint);
    this.logger.level = loggerConfig.level;
  }

  getLogger(name?: string): Logger {
    if (name === undefined) {
      return this.logger;
    }
    return this.getChild(this.logger, name);
  }

  getChild(logger: Logger, name: string): Logger {
    const existingNames: unknown = logger.bindings()['name'];
    const names: string[] = [];
    if (Array.isArray(existingNames)) {
      names.push(...(existingNames as string[]));
    }
    names.push(name);
    return logger.child({
      name: names,
    });
  }
}
