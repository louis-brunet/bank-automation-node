// export type BrowserServiceFindElementRequestOptions<Mapped> = {
//   // mapper?: (element: Element) => Mapped;
//   // withStyle?: boolean;
// };

export const BrowserServiceFindBy = {
  ID: 'id',
  SELECTOR: 'selector',
} as const;

export type BrowserServiceFindByType =
  (typeof BrowserServiceFindBy)[keyof typeof BrowserServiceFindBy];

type BrowserServiceFindElementRequestBase<CssProperty extends string> = {
  readonly by: BrowserServiceFindByType;
  readonly query: string;
  readonly cssProperties?: CssProperty[];
  // readonly mapper: (element: Element, index: number) => Mapped;
};

export type BrowserServiceFindElementByIdRequest<CssProperty extends string> = {
  readonly by: 'id';
} & BrowserServiceFindElementRequestBase<CssProperty>;

export type BrowserServiceFindElementBySelectorRequest<
  CssProperty extends string,
> = {
  readonly by: 'selector';
} & BrowserServiceFindElementRequestBase<CssProperty>;

export type BrowserServiceFindElementRequest<CssProperty extends string> =
  | BrowserServiceFindElementByIdRequest<CssProperty>
  | BrowserServiceFindElementBySelectorRequest<CssProperty>;

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

export type BrowserServiceFoundElement<CssProperty extends string> = {
  elementIndex: number;
  id?: string;
  style?: Record<CssProperty, string>;
  // style?: { [property: CssProperty]: string };
};

export type RequestedCssProperty<
  Request extends BrowserServiceFindElementRequest<Property>,
  Property extends Request['cssProperties'] extends Array<
    infer Prop extends string
  >
    ? Prop
    : never = Request['cssProperties'] extends Array<infer Prop extends string>
    ? Prop
    : never,
> = Property;

export type BrowserServiceFindElementResponse<
  Request extends BrowserServiceFindElementRequest<CssProperty>,
  CssProperty extends
    RequestedCssProperty<Request> = RequestedCssProperty<Request>,
> = Request['by'] extends 'id'
  ? BrowserServiceFoundElement<CssProperty> | null
  : BrowserServiceFoundElement<CssProperty>[];
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
