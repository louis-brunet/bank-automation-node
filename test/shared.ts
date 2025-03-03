import {
  after,
  afterEach,
  beforeEach,
  describe,
  it,
  TestContext,
} from 'node:test';
import { container, DependencyContainer } from 'tsyringe';
import {
  BrowserService,
  DigitRecognitionService,
  LoggerService,
  PROCESS_ENV_SYMBOL,
  TemporaryFileService,
} from '../src';

export function configureTestDependencies(container: DependencyContainer) {
  container.register(PROCESS_ENV_SYMBOL, { useValue: {} });
  container.register(DigitRecognitionService, {
    useClass: DigitRecognitionService,
  });
  container.register(LoggerService, { useClass: LoggerService });
  container.register(TemporaryFileService, { useClass: TemporaryFileService });
  container.register(BrowserService, { useClass: BrowserService });
}

export type UnitTestSuiteContext<TestClass> = {
  container: DependencyContainer;
  testClass: TestClass;
};

// type Class<T> = typeof T;
type Class<T> = {
  new (...args): T;
};

export async function createUnitTestSuite<TestClass>(
  clazz: Class<TestClass>,
  suite: (context: UnitTestSuiteContext<TestClass>) => Promise<unknown>,
) {
  await describe(clazz.name, {}, async (_context) => {
    const parentContainer = container;

    function initContainer() {
      const childContainer = parentContainer.createChildContainer();
      configureTestDependencies(childContainer);
      return childContainer;
    }

    function initTestClass(container: DependencyContainer) {
      return container.resolve(clazz);
    }

    const initialChildContainer = initContainer();
    const suiteContext: UnitTestSuiteContext<TestClass> = {
      container: initialChildContainer,
      testClass: initTestClass(initialChildContainer),
    };

    beforeEach((_testContext) => {
      // console.debug(`[${context.name}:beforeEach]`);
      suiteContext.container = initContainer();
      suiteContext.testClass = initTestClass(suiteContext.container);
    });

    afterEach(async () => {
      await suiteContext.container.dispose();
      // console.debug(`[${clazz.name}:afterEach] finished disposal`);
    });

    after(async () => {
      // TODO: this might cause failures when there are multiple test suites
      await parentContainer.dispose();
    });

    await it('is defined', { plan: 1 }, (t: TestContext) => {
      t.assert.ok(suiteContext.testClass);
    });

    await suite(suiteContext);
  });
}
