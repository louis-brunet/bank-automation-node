// export type BrowserServiceFindElementRequestOptions<Mapped> = {
//   // mapper?: (element: Element) => Mapped;
//   // withStyle?: boolean;
// };

import { ElementHandle } from 'puppeteer';

// export namespace BrowserServiceFindBy {
//   export const ID = 'id';
//   export const SELECTOR = 'selector';
// }
// export type BrowserServiceFindByType =
//   | typeof BrowserServiceFindBy.ID
//   | typeof BrowserServiceFindBy.SELECTOR;
export const BrowserServiceFindBy = {
  ID: 'id',
  SELECTOR: 'selector',
} as const;

export type BrowserServiceFindByType =
  (typeof BrowserServiceFindBy)[keyof typeof BrowserServiceFindBy];

type BrowserServiceFindElementRequestBase<
  CssProperty extends string,
  Query extends string,
> = {
  readonly by: BrowserServiceFindByType;
  readonly query: Query;
  readonly cssProperties?: CssProperty[];
  // readonly mapper: (element: Element, index: number) => Mapped;
};

export type BrowserServiceFindElementByIdRequest<
  CssProperty extends string,
  Query extends string,
> = {
  readonly by: typeof BrowserServiceFindBy.ID;
} & BrowserServiceFindElementRequestBase<CssProperty, Query>;

export type BrowserServiceFindElementBySelectorRequest<
  CssProperty extends string,
  Query extends string,
> = {
  readonly by: typeof BrowserServiceFindBy.SELECTOR;
} & BrowserServiceFindElementRequestBase<CssProperty, Query>;

export type BrowserServiceFindElementRequest<
  CssProperty extends string,
  Query extends string,
> =
  | BrowserServiceFindElementByIdRequest<CssProperty, Query>
  | BrowserServiceFindElementBySelectorRequest<CssProperty, Query>;

// export interface BrowserServiceFindElementRequest {
//   by: BrowserServiceFindByType;
//   query: string;
//   options?: BrowserServiceFindElementRequestOptions;
// }
//
// export interface BrowserServiceFindElementByIdRequest
//   extends BrowserServiceFindElementRequest {
//   by: 'id';
// }
//
// export interface BrowserServiceFindElementBySelectorRequest
//   extends BrowserServiceFindElementRequest {
//   by: 'selector';
// }

// export type BrowserServiceFoundById = {
//   by: typeof BrowserServiceFindBy.ID;
//   id: string;
// };
//
// export type BrowserServiceFoundBySelector = {
//   by: typeof BrowserServiceFindBy.SELECTOR;
//   selector: string;
//   index: number;
//   id?: string;
// };

export class BrowserServiceFoundElement<CssProperty extends string = string>
  implements AsyncDisposable
{
  static from(properties: ClassProperties<BrowserServiceFoundElement>) {
    return new BrowserServiceFoundElement(properties.handle, properties.style);
  }

  constructor(
    public readonly handle: ElementHandle,
    public style?: Record<CssProperty, string>,
  ) {}
  async [Symbol.asyncDispose]() {
    await this.handle.dispose();
  }
  // foundBy: BrowserServiceFoundById | BrowserServiceFoundBySelector;
  // handle: ElementHandle;
  // style?: Record<CssProperty, string>;
}

export class BrowserServiceFoundElements<CssProperty extends string = string>
  implements AsyncDisposable
{
  constructor(readonly elements: BrowserServiceFoundElement<CssProperty>[]) {}
  async [Symbol.asyncDispose]() {
    for (await using _element of this.elements);
  }
}

export type RequestedCssProperty<
  Request extends BrowserServiceFindElementRequest<Property, Query>,
  Property extends Request['cssProperties'] extends Array<
    infer Prop extends string
  >
    ? Prop
    : never = Request['cssProperties'] extends Array<infer Prop extends string>
    ? Prop
    : never,
  Query extends string = Request['query'],
> = Property;

export type BrowserServiceFindElementResponse<
  Request extends BrowserServiceFindElementRequest<CssProperty, Query>,
  CssProperty extends
    RequestedCssProperty<Request> = RequestedCssProperty<Request>,
  Query extends string = Request['query'],
> = Request['by'] extends 'id'
  ? BrowserServiceFoundElement<CssProperty> | null
  : BrowserServiceFoundElements<CssProperty>;
// export type BrowserServiceFindElementResponse<
//   Request extends BrowserServiceFindElementRequest,
// > = Request extends BrowserServiceFindElementByIdRequest
//   ? BrowserServiceFoundElement | null
//   : BrowserServiceFoundElement[];
// > = Request extends BrowserServiceFindElementByIdRequest
//   ? BrowserServiceFoundElement | null
//   : Request extends BrowserServiceFindElementBySelectorRequest
//     ? BrowserServiceFoundElement[]
//     : never;

type Function<Args = unknown, Return = unknown> = (...args: Args[]) => Return;
export type ClassProperties<T> = {
  [K in keyof T as T[K] extends Function ? never : K]: T[K];
};
