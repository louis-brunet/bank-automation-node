import './setup';

import { beforeEach, describe } from 'node:test';
import {
  BrowserEnv,
  BrowserService,
  CaisseDEpargneAdapter,
  CaisseDEpargneEnv,
} from '../src';
import { createUnitTestSuite, registerMock } from './shared';

const processEnv: CaisseDEpargneEnv & BrowserEnv = {
  CAISSE_D_EPARGNE_ACCOUNT_ID: 'fake_account_id',
  CAISSE_D_EPARGNE_ACCOUNT_PASSWORD: '00000000',
  CAISSE_D_EPARGNE_CHECKING_ACCOUNT: 'fake_checking_account',
  CAISSE_D_EPARGNE_BASE_URL: 'fake_base_url',
  CAISSE_D_EPARGNE_MFA_WAIT_TIMEOUT_MS: 1,
  BROWSER_DEFAULT_TIMEOUT_MILLISECONDS: 0,
  BROWSER_DEFAULT_NAVIGATION_TIMEOUT_MILLISECONDS: 0,
  BROWSER_HEADLESS: true,
  BROWSER: 'chrome',
};

void createUnitTestSuite(
  CaisseDEpargneAdapter,
  async (context) => {
    beforeEach(() => {
      registerMock(context.container, BrowserService);
      // , {
      //   get() {
      //     return Promise.resolve(null);
      //   },
      //   clickElementById(_id) {
      //     return Promise.resolve();
      //   },
      //   fillInput(_id, _content) {
      //     return Promise.resolve();
      //   },
      //   findElements(request) {
      //     if (request.by === 'id') {
      //       return Promise.resolve(
      //         createMockClass(BrowserServiceFoundElement, {
      //           async [Symbol.asyncDispose]() {},
      //         }) as BrowserServiceFindElementResponse<typeof request>,
      //       );
      //     }
      //     return Promise.resolve(
      //       createMockClass(BrowserServiceFoundElements, {
      //         async [Symbol.asyncDispose]() {},
      //       }) as BrowserServiceFindElementResponse<typeof request>,
      //     );
      //   },
      // });
    });
    await describe('getCheckingAccountBalance', async () => {
      // await it('returns checking account balance', async (t: TestContext) => {
      //   // // eslint-disable-next-line @typescript-eslint/unbound-method
      //   // const getMock = BrowserService.prototype.get as Mock<
      //   //   typeof BrowserService.prototype.get
      //   // >;
      //   // // eslint-disable-next-line @typescript-eslint/unbound-method
      //   // const clickElementByIdMock = BrowserService.prototype
      //   //   .clickElementById as Mock<
      //   //   typeof BrowserService.prototype.clickElementById
      //   // >;
      //   // // eslint-disable-next-line @typescript-eslint/unbound-method
      //   // const fillInputMock = BrowserService.prototype.fillInput as Mock<
      //   //   typeof BrowserService.prototype.fillInput
      //   // >;
      //   // // eslint-disable-next-line @typescript-eslint/unbound-method
      //   // const findElementsMock = BrowserService.prototype.findElements as Mock<
      //   //   typeof BrowserService.prototype.findElements
      //   // >;
      //
      //   const getMock = mockMethod(BrowserService, 'get', () =>
      //     Promise.resolve(null),
      //   );
      //   const clickElementByIdMock = mockMethod(
      //     BrowserService,
      //     'clickElementById',
      //     (_id) => Promise.resolve(),
      //   );
      //   const fillInputMock = mockMethod(BrowserService, 'fillInput', () =>
      //     Promise.resolve(),
      //   );
      //   const findElementsMock = mockMethod(
      //     BrowserService,
      //     'findElements',
      //     (request) => {
      //       if (request.by === 'id') {
      //         const mocked = createMockClass(BrowserServiceFoundElement)
      //           .mockedClass as BrowserServiceFindElementResponse<
      //           typeof request
      //         >;
      //         t.assert.ok(mocked !== null);
      //         // mocked.elements = [];
      //         // const elementsMock = mock.method(mocked, 'elements' as never, {
      //         //   getter: true,
      //         // }); //, () => {});
      //         // elementsMock.mock.mockImplementation(() => []);
      //         // await BrowserServiceFoundElement.prototype[Symbol.asyncDispose]();
      //         // mockMethod(BrowserServiceFoundElement, Symbol.asyncDispose)
      //         // const disposeMock = mock.method(
      //         //   BrowserServiceFoundElements.prototype,
      //         //   // String(Symbol.asyncDispose),
      //         //   Symbol.asyncDispose,
      //         // );
      //         // disposeMock.mock.mockImplementation(() => Promise.resolve());
      //         return Promise.resolve(
      //           mocked,
      //           // , {
      //           //   async [Symbol.asyncDispose]() {},
      //           // }) as BrowserServiceFindElementResponse<typeof request>,
      //         );
      //       }
      //       return Promise.resolve(
      //         createMockClass(BrowserServiceFoundElements)
      //           .mockedClass as BrowserServiceFindElementResponse<
      //           typeof request
      //         >,
      //         // {
      //         //   async [Symbol.asyncDispose]() {},
      //         // }) as BrowserServiceFindElementResponse<typeof request>,
      //       );
      //     },
      //     // Promise.resolve({
      //     //   elements: [],
      //     // } as BrowserServiceFindElementResponse<typeof request>),
      //   );
      //   // const getSpy = mock.method(BrowserService.prototype, 'get');
      //   // getSpy.mock.mockImplementation(async (_url) => {
      //   //   return await Promise.resolve(null);
      //   // });
      //
      //   // const clickSpy = mock.method(
      //   //   BrowserService.prototype,
      //   //   'clickElementById',
      //   // );
      //   // clickSpy.mock.mockImplementation(async (_id) => {});
      //   //
      //   // const fillInputSpy = mock.method(BrowserService.prototype, 'fillInput');
      //   // fillInputSpy.mock.mockImplementation(async (_id, _text) => {});
      //   //
      //   // const findElementsSpy = mock.method(
      //   //   BrowserService.prototype,
      //   //   'findElements',
      //   // );
      //   // findElementsSpy.mock.mockImplementation(async (_req) => {
      //   //   return [];
      //   // });
      //   //
      //   const adapter = context.getTestClass();
      //   await adapter.getCheckingAccountBalance();
      //
      //   t.assert.strictEqual(getMock.mock.callCount(), 1);
      //   t.assert.strictEqual(clickElementByIdMock.mock.callCount(), 1);
      //   t.assert.strictEqual(fillInputMock.mock.callCount(), 1);
      //   t.assert.strictEqual(findElementsMock.mock.callCount(), 1);
      //   fail();
      // });
      // await it.todo('calls login', () => {});
      // await it.todo('throws error if password is not an integer', () => {});
    });
    await describe.todo('should be tested further', () => {});
  },
  { processEnv },
);
