import './setup';

import { BrowserService } from '../src';
import { createUnitTestSuite } from './shared';
import { describe } from 'node:test';

void createUnitTestSuite(
  BrowserService,
  async (_context) => {
    // beforeEach(() => {
    //   context.container.register(PROCESS_ENV_SYMBOL, {
    //     useValue: { BROWSER: 'chrome' },
    //   });
    // });
    await describe('should be tested', { todo: true }, () => {});
  },
  {
    processEnv: {
      BROWSER: 'chrome',
    },
  },
);
