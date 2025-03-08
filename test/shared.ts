import {
  after,
  afterEach,
  beforeEach,
  describe,
  it,
  mock,
  Mock,
  TestContext,
} from 'node:test';
import { container, DependencyContainer } from 'tsyringe';
import { PROCESS_ENV_SYMBOL } from '../src';

type FunctionPropertyNames<T> = {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];

type ExtractFunctions<TInstance> = {
  // // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  // [TKey in keyof TInstance]: TInstance[TKey] extends Function
  // ? TInstance[TKey]
  // : never;
  [TKey in FunctionPropertyNames<TInstance>]: TInstance[TKey];
};
//
// type MockImplementations<TInstance> = Partial<ExtractFunctions<TInstance>>;

// type MockImplementations<TInstance> = Partial<TInstance>;

// type MockImplementations<TInstance> = Partial<{
//   // [TKey in FunctionPropertyNames<TInstance>]: TInstance[TKey];
//   // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
//   [TKey in FunctionPropertyNames<TInstance>]: TInstance[TKey] extends Function
//     ? TInstance[TKey]
//     : never;
// }>;

// type MockedFunctions<
//   TInstance,
//   TMockImplementations extends MockImplementations<TInstance>,
// > = {
//   // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
//   [TMethodName in keyof TMockImplementations]: TMockImplementations[TMethodName] extends Function
//     ? Mock<TMockImplementations[TMethodName]>
//     : never;
// };

export type CreateMockClassResult<
  TInstance,
  // TMockImplementations extends MockImplementations<TInstance>,
> = {
  mockedClass: ExtractFunctions<TInstance>;
  // mockedMethods: MockedFunctions<TInstance, TMockImplementations>;
};

// type FOO = MockImplementations<DependencyContainer>;

// type MockImplementation<TInstance, TMethodName> = Partial<ExtractFunctions<TInstance>>;

// type MockImplementations<TInstance> = Partial<
//   Record<
//     FunctionPropertyNames<TInstance>,
//     TInstance[FunctionPropertyNames<TInstance>]
//   >
// >;

// export function createMock<T extends object>(obj?: T): T {
//   return new Proxy(obj ?? ({} as T), {
//     get(target, property, receiver) {
//       if (target.then && typeof target.then === 'function') {
//         return {
//           then() {
//             throw new Error('mock not implemented');
//           },
//         };
//       }
//       throw new Error('mock not implemented');
//     },
//   });
// }

export function configureTestDependencies(
  container: DependencyContainer,
  processEnv: Record<string, unknown> = {},
) {
  container.register(PROCESS_ENV_SYMBOL, { useValue: processEnv });
  // container.register(DigitRecognitionService, {
  //   useClass: DigitRecognitionService,
  // });
  // // TODO: mock logger here ? should probably refactor logging to recentralize for easier mocking
  // container.register(LoggerService, { useClass: LoggerService });
  // // container.register(LoggerService, {
  // //   useValue: createMock(),
  // // });
  //
  // container.register(TemporaryFileService, { useClass: TemporaryFileService }); //, {lifecycle: Lifecycle.ContainerScoped});
  // container.register(BrowserService, { useClass: BrowserService });
  //
  // // container.registerSingleton
  // // registerMock(container, BrowserService);
  // // container.register(BrowserService, { useClass: BrowserService });
}

export type UnitTestSuiteContext<TestClass> = {
  container: DependencyContainer;
  getTestClass: () => TestClass;
};

// type Class<T> = typeof T;
type Class<T> = {
  new (...args): T;
};

export async function createUnitTestSuite<TestClass>(
  clazz: Class<TestClass>,
  suite: (context: UnitTestSuiteContext<TestClass>) => Promise<void> | void,
  options?: { processEnv?: Record<string, unknown> },
) {
  await describe(clazz.name, {}, async (_context) => {
    const parentContainer = container;

    function initContainer() {
      const childContainer = parentContainer.createChildContainer();
      configureTestDependencies(childContainer, options?.processEnv);
      return childContainer;
    }

    // function initTestClass(container: DependencyContainer) {
    //   return container.resolve(clazz);
    // }

    const initialChildContainer = initContainer();
    const suiteContext: UnitTestSuiteContext<TestClass> = {
      container: initialChildContainer,

      getTestClass() {
        return this.container.resolve(clazz);
      },
    };

    beforeEach((_testContext) => {
      // console.debug(`[${context.name}:beforeEach]`);
      suiteContext.container = initContainer();
      // suiteContext.testClass = initTestClass(suiteContext.container);
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
      t.assert.ok(suiteContext.getTestClass());
    });

    await suite(suiteContext);
  });
}

export function createMockClass<
  TInstance extends object,
  // TMockImplementations extends MockImplementations<TInstance>,
>(
  clazz: Class<TInstance>,
  // mockImplementations: TMockImplementations,
  // mockImplementations: MockImplementations<TInstance>,
): CreateMockClassResult<TInstance> {
  const className = clazz.name;
  const target = clazz.prototype as ExtractFunctions<TInstance>;
  const getErrorMessage = (prop: string | symbol) =>
    `mocked ${className} does not implement '${String(prop)}')`;

  // let key: keyof typeof mockImplementations;
  // for (key in mockImplementations) {
  //   const keyOfFunction = key as FunctionPropertyNames<TInstance>;
  //   if (typeof target[keyOfFunction] === 'function') {
  //     const implementation = mockImplementations[keyOfFunction];
  //     // const implementation = mockImplementations[key];
  //     // const implementation = mockImplementations[key];
  //     // mockMethod<TInstance, FunctionPropertyNames<TInstance>>(
  //     mockMethod(
  //       clazz,
  //       keyOfFunction,
  //       // mockImplementations[key] as TInstance[FunctionPropertyNames<TInstance>],
  //       implementation,
  //     );
  //   }
  // }

  const handler: ProxyHandler<ExtractFunctions<TInstance>> = {
    get: (target, prop) => {
      // Return mocked function if it exists
      if (target[prop] && typeof target[prop] === 'function') {
        const asMock = target[prop] as Partial<
          Mock<(...args: unknown[]) => unknown>
        >;
        if (
          asMock.mock?.mockImplementation &&
          typeof asMock.mock.mockImplementation === 'function'
        ) {
          return asMock;
        }
        // if (prop in mockImplementations) {
        //   return mockImplementations[prop as keyof typeof mockImplementations];
        // }
      }

      const error = new Error(getErrorMessage(prop));

      // Special case for Symbol.toStringTag and other built-in symbols
      if (typeof prop === 'symbol') {
        if (prop === Symbol.toStringTag) {
          return className;
        }
        // if (prop === Symbol.dispose) {
        //   return;
        // }
        // if (prop === Symbol.asyncDispose) {
        //   return async () => {};
        // }
        throw error;
      }

      // Special case for toString() to show a meaningful representation
      if (prop === 'toString') {
        return () => `[Unavailable ${className}]`;
      }

      // For promises and async methods, we need to return a function that returns a rejected promise
      if (prop === 'then' || prop === 'catch' || prop === 'finally') {
        if (prop in target) {
          if (typeof target[prop] === 'function') {
            return () => Promise.reject(error);
          }
          throw error;
        }
        return target[prop] as unknown;
      }

      // For everything else, throw an error
      throw error;
    },

    // // Handle property setting
    // set: (_target, _prop) => {
    //   throw new Error(errorMessage);
    // },
    //
    // // Handle additional proxy traps
    // apply: (_target, _thisArg, _args) => {
    //   throw new Error(errorMessage);
    // },
    //
    // construct: (_target, _args) => {
    //   throw new Error(errorMessage);
    // },
  };

  return { mockedClass: new Proxy(target, handler) };
}

export function registerMock<TInstance extends object>(
  container: DependencyContainer,
  clazz: Class<TInstance>,
  // implementations: MockImplementations<TInstance>,
) {
  container.register(clazz, {
    useValue: createMockClass(clazz).mockedClass,
  });
}

// type Function<TArgs = unknown, TResult = unknown> = (
//   ...args: TArgs[]
// ) => TResult;

export function mockMethod<
  TInstance extends object,
  TMethodName extends
    FunctionPropertyNames<TInstance> = FunctionPropertyNames<TInstance>,
>(
  clazz: Class<TInstance>,
  methodName: TMethodName,
  implementation?: TInstance[TMethodName],
) {
  const mocked = mock.method(clazz.prototype as TInstance, methodName);
  if (implementation !== undefined) {
    mocked.mock.mockImplementation(implementation);
  }
  return mocked;
}
