import './setup';

import { BrowserService } from '../src';
import { createUnitTestSuite } from './shared';

void createUnitTestSuite(
  BrowserService,
  (_context) => {
    // beforeEach(() => {
    //   context.container.register(PROCESS_ENV_SYMBOL, {
    //     useValue: { BROWSER: 'chrome' },
    //   });
    // });
    // await describe('TODO', { todo: true }, () => {});
  },
  {
    processEnv: {
      BROWSER: 'chrome',
    },
  },
);
