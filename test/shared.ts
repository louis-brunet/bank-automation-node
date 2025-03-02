import assert from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { container, DependencyContainer } from 'tsyringe';
import { PROCESS_ENV_SYMBOL } from '../src';

export function configureTestDependencies(container: DependencyContainer) {
  container.register(PROCESS_ENV_SYMBOL, { useValue: {} });
}

export type UnitTestSuiteContext<TestClass> = {
  container: DependencyContainer;
  testClass: TestClass;
};

// type Class<T> = typeof T;
type Class<T> = {
  new (...args): T;
};
// type Class<T> = {
//   new(...args: ConstructorParameters<T>): T;
// };
// type Class<T, TArgs, TArgsArray extends Array<TArgs> = Array<TArgs>> = {
//   new(...args: TArgsArray): T;
// };

// class MockContainer {
//   container: DependencyContainer;
//
//   resolve<T>(token: any): T {
//     if (!this.container.isRegistered(token)) {
//       return new Proxy(
//         {},
//         {
//           get: () => {
//             throw new Error(`Not implemented: ${token.name || token}`);
//           },
//         },
//       ) as T;
//     }
//     return this.container.resolve<T>(token);
//   }
// }

export async function createUnitTestSuite<TestClass>(
  clazz: Class<TestClass>,
  // name: string,
  suite: (context: UnitTestSuiteContext<TestClass>) => Promise<unknown>,
) {
  await describe(clazz.name, {}, async () => {
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
    // let childContainer: DependencyContainer;

    beforeEach((_testContext) => {
      suiteContext.container = initContainer();
      suiteContext.testClass = initTestClass(suiteContext.container);
    });

    afterEach(async () => {
      await suiteContext.container.dispose();
    });

    await it('is defined', () => {
      assert.ok(suiteContext.testClass);
    });

    await suite(suiteContext);
  });
}
