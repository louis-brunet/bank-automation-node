// eslint-disable-next-line  @typescript-eslint/no-explicit-any
export type ClassConstructor<TInstance, TArgs = any> = {
  new (...args: TArgs[]): TInstance;
};
