import './setup';

import { BrowserEnv, CaisseDEpargneAdapter, CaisseDEpargneEnv } from '../src';
import { createUnitTestSuite } from './shared';
import { describe } from 'node:test';

const processEnv: CaisseDEpargneEnv & BrowserEnv = {
  CAISSE_D_EPARGNE_ACCOUNT_ID: 'x',
  CAISSE_D_EPARGNE_ACCOUNT_PASSWORD: 'xxxxxxxx',
  CAISSE_D_EPARGNE_CHECKING_ACCOUNT: 'x',
  CAISSE_D_EPARGNE_BASE_URL: 'x',
  BROWSER_DEFAULT_TIMEOUT_MILLISECONDS: 0,
  BROWSER_HEADLESS: true,
  BROWSER: 'chrome',
};

void createUnitTestSuite(
  CaisseDEpargneAdapter,
  async (_context) => {
    await describe('should be tested', { todo: true }, () => {});
  },
  { processEnv },
);
