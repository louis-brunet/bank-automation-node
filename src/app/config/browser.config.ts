import { singleton } from 'tsyringe';
import { boolean, InferType, number, object, string } from 'yup';
import { Env } from './env';
import { SupportedBrowser } from 'puppeteer';

const envSchema = object({
  BROWSER_DEFAULT_TIMEOUT_MILLISECONDS: number()
    .optional()
    .integer()
    .min(0)
    .default(5_000),
  BROWSER: string<SupportedBrowser>()
    .optional()
    .oneOf(['chrome', 'firefox'])
    .default('chrome'),
  BROWSER_HEADLESS: boolean().optional().default(true),
  BROWSER_SLOW_MO_MILLISECONDS: number()
    .optional()
    .integer()
    .min(0)
    .transform((value: unknown, originalValue: unknown) =>
      originalValue === '' ? undefined : value,
    ),
});
export type BrowserEnv = InferType<typeof envSchema>;

@singleton()
export class BrowserConfig {
  public readonly defaultTimeoutMilliseconds: number;
  public readonly browser: SupportedBrowser;
  public readonly headless: boolean;
  public readonly slowMoMilliseconds: number | undefined;

  constructor(env: Env) {
    const validated = env.validate(envSchema);
    this.defaultTimeoutMilliseconds =
      validated.BROWSER_DEFAULT_TIMEOUT_MILLISECONDS;
    this.browser = validated.BROWSER;
    this.headless = validated.BROWSER_HEADLESS;
    this.slowMoMilliseconds = validated.BROWSER_SLOW_MO_MILLISECONDS;
  }
}
