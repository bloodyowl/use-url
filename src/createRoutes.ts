import { route, ToPattern, ToSegments } from "./useUrl";

// Fills params with values provided in `Params`
type ToUrl<Segments, Params extends Record<string, string>> = Segments extends [
  infer Head,
  ...infer Tail,
]
  ? Head extends `:${infer Name}`
    ? [Params[Name], ...ToUrl<Tail, Params>]
    : Head extends "*"
      ? never
      : [Head, ...ToUrl<Tail, Params>]
  : [];

// Type for array join
type Join<Segments> = Segments extends [infer Head, ...infer Tail]
  ? Head extends string
    ? Tail extends []
      ? Head
      : `${Head}/${Join<Tail>}`
    : ``
  : ``;

// Extract param type from segments
type ToParams<Segments> = Segments extends [infer Head, ...infer Tail]
  ? Head extends `:${infer Name}`
    ? Record<Name, string> & ToParams<Tail>
    : Head extends "*"
      ? never
      : ToParams<Tail>
  : {};

// Turns a union of records into a record
type SimplifyParams<T> =
  T extends Record<PropertyKey, never>
    ? {} // eslint-disable-line @typescript-eslint/ban-types
    : { [K in keyof T]: T[K] };

type Routes<T extends Record<string, string>> = {
  P: {
    [K in keyof T]: T[K] extends string ? ToPattern<ToSegments<T[K]>> : never;
  };
} & {
  [K in keyof T]: T[K] extends string
    ? T[K] extends `${string}*${string}`
      ? never
      : SimplifyParams<ToParams<ToSegments<T[K]>>> extends Record<
            PropertyKey,
            never
          >
        ? () => T[K]
        : <
            const Params extends Record<string, string> = SimplifyParams<
              ToParams<ToSegments<T[K]>>
            >,
          >(
            params: Params
          ) => `/${Join<ToUrl<ToSegments<T[K]>, Params>>}`
    : never;
};

export const createRoutes = <const T extends Record<string, string>>(
  routes: T
): Routes<T> => {
  const P = Object.fromEntries(
    Object.entries(routes).map(([key, value]) => [key, route(value)])
  ) as {
    [K in keyof T]: T[K] extends string ? ToPattern<ToSegments<T[K]>> : never;
  };

  const urlBuilders = Object.fromEntries(
    Object.entries(routes).map(([key, value]) => [
      key,
      (params) => {
        if (params == undefined) {
          return value;
        }
        return Object.entries(params).reduce(
          (acc, [key, value]) => acc.replace(RegExp(`:${key}`, "g"), value),
          value
        );
      },
    ])
  ) as {
    [K in keyof T]: T[K] extends string
      ? T[K] extends `${string}*${string}`
        ? never
        : SimplifyParams<ToParams<ToSegments<T[K]>>> extends Record<
              PropertyKey,
              never
            >
          ? () => T[K]
          : <
              const Params extends Record<string, string> = SimplifyParams<
                ToParams<ToSegments<T[K]>>
              >,
            >(
              params: Params
            ) => `/${Join<ToUrl<ToSegments<T[K]>, Params>>}`
      : never;
  };

  return {
    P,
    ...urlBuilders,
  };
};
