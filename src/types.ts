import type { Schema, RefSchema, CollectionSchema } from "./schema";
import type { RonkCollection } from "./collection";

export type Infer<T extends Schema> = T["_type"];

export type InferInput<T extends Schema> = T["_input"];

export type InferDocument<
  T extends CollectionSchema<any> | RonkCollection<any, any>
> = T extends CollectionSchema<any>
  ? Infer<T>
  : T extends RonkCollection<any, any>
  ? Infer<T["schema"]>
  : never;

export type InferDocumentInput<
  T extends CollectionSchema<any> | RonkCollection<any, any>
> = T extends CollectionSchema<any>
  ? InferInput<T>
  : T extends RonkCollection<any, any>
  ? InferInput<T["schema"]>
  : never;

export {
  Infer as type,
  InferInput as input,
  InferDocument as document,
  InferDocumentInput as documentInput
};

export type SchemaLike = Record<string, CollectionSchema<any>>;

export type DeletePolicy =
  | "bypass"
  | "reject"
  | "cascade"
  | "nullify"
  | "unset";

export type AddQuestionMark<T extends object> = Prettify<
  { [K in keyof T as undefined extends T[K] ? never : K]: T[K] } & {
    [K in keyof T as undefined extends T[K] ? K : never]?: T[K];
  }
>;

export type AddRecordQuestionMark<T extends Record<string, unknown>> =
  T extends Record<string, infer V>
    ? undefined extends V
      ? Partial<T>
      : T
    : never;

export type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type ValidateSchema<S extends Record<string, unknown>> = {
  [P in keyof S]: ValidateValue<S[P], keyof S & string>;
};

type ValidateValue<V, K extends string> = V extends RefSchema
  ? V["ref"] extends K
    ? V
    : { __INVALID_REF__: V["ref"] }
  : { [P in keyof V]: ValidateValue<V[P], K> };
