import { ObjectId, Binary } from "mongodb";
import {
  AddQuestionMark,
  AddRecordQuestionMark,
  DeletePolicy,
  UnionToIntersection
} from "./utils";

export interface RonkTypeOptions {
  title?: string;
  description?: string;
}

export abstract class RonkType<
  Kind extends string = string,
  Type = unknown,
  Options extends RonkTypeOptions = RonkTypeOptions,
  Input = Type
> {
  _kind!: Kind;
  _type!: Type;
  _input!: Input;

  constructor(public readonly options?: Options) {}

  title(title: string): this {
    const clone = Object.create(Object.getPrototypeOf(this));
    Object.assign(clone, this, { options: { ...this.options, title } });
    return clone;
  }

  description(description: string): this {
    const clone = Object.create(Object.getPrototypeOf(this));
    Object.assign(clone, this, { options: { ...this.options, description } });
    return clone;
  }

  array(): RonkArray<this> {
    return new RonkArray(this);
  }

  record(): RonkRecord<RonkString, this> {
    return new RonkRecord(new RonkString(), this);
  }

  or<T extends RonkType[]>(...types: T): RonkUnion<[this, ...T]> {
    return new RonkUnion([this, ...types]);
  }

  and<T extends RonkType[]>(...types: T): RonkIntersection<[this, ...T]> {
    return new RonkIntersection([this, ...types]);
  }

  optional(): RonkOptional<this> {
    return new RonkOptional(this);
  }

  nullable(): RonkUnion<[this, RonkNull]> {
    return new RonkUnion([this, new RonkNull()]);
  }

  default(defaultValue: Input | (() => Input)): RonkDefault<this> {
    return new RonkDefault(this, defaultValue);
  }

  abstract bsonSchema(): object;

  required() {
    return true;
  }
}

// Null

export class RonkNull extends RonkType<"null", null> {
  override bsonSchema(): object {
    return { bsonType: "null", ...this.options };
  }
}

function null_() {
  return new RonkNull();
}

export { null_ as null };

// Bool

export class RonkBool extends RonkType<"bool", boolean> {
  override bsonSchema(): object {
    return { bsonType: "bool", ...this.options };
  }
}

export function bool() {
  return new RonkBool();
}

// Date

export class RonkDate extends RonkType<"date", Date> {
  override bsonSchema(): object {
    return { bsonType: "date", ...this.options };
  }
}

export function date() {
  return new RonkDate();
}

// Binary

export class RonkBinary extends RonkType<"binary", Binary> {
  override bsonSchema(): object {
    return { bsonType: "binData", ...this.options };
  }
}

export function binary() {
  return new RonkBinary();
}

// ObjectId

export class RonkObjectId extends RonkType<"objectid", ObjectId> {
  override bsonSchema(): object {
    return { bsonType: "objectId", ...this.options };
  }
}

export function objectId() {
  return new RonkObjectId();
}

// Ref

export interface RonkRefOptions extends RonkTypeOptions {
  deletePolicy?: DeletePolicy;
}

export class RonkRef<T extends string = string> extends RonkType<
  "ref",
  ObjectId,
  RonkRefOptions
> {
  constructor(public readonly ref: T, options?: RonkRefOptions) {
    super(options);
  }

  delete(deletePolicy: DeletePolicy) {
    return new RonkRef(this.ref, { ...this.options, deletePolicy });
  }

  override bsonSchema(): object {
    return { bsonType: "objectId", ...this.options };
  }
}

export function ref<T extends string>(ref: T) {
  return new RonkRef(ref);
}

// Enum

export class RonkEnum<T extends unknown[]> extends RonkType<"enum", T[number]> {
  constructor(public readonly values: T) {
    super();
  }

  override bsonSchema(): object {
    return { enum: this.values, ...this.options };
  }

  override required() {
    return this.values.every(value => value !== undefined);
  }
}

function enum_<const T extends unknown[]>(...values: T) {
  return new RonkEnum(values);
}

export { enum_ as enum };

// String

export interface RonkStringOptions extends RonkTypeOptions {
  minLength?: number;
  maxLength?: number;
  pattern?: string | RegExp;
}

export class RonkString extends RonkType<"string", string, RonkStringOptions> {
  constructor(options?: RonkStringOptions) {
    super(options);
  }

  min(minLength: number): RonkString {
    return new RonkString({ ...this.options, minLength });
  }

  max(maxLength: number): RonkString {
    return new RonkString({ ...this.options, maxLength });
  }

  pattern(pattern: string | RegExp): RonkString {
    return new RonkString({ ...this.options, pattern });
  }

  override bsonSchema(): object {
    const { pattern, ...options } = this.options ?? {};
    return {
      bsonType: "string",
      ...options,
      ...(pattern && {
        pattern: pattern instanceof RegExp ? pattern.source : pattern
      })
    };
  }
}

export function string() {
  return new RonkString();
}

// Number

export interface RonkNumberOptions extends RonkTypeOptions {
  type?: "int" | "long" | "decimal" | "double";
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: boolean;
  exclusiveMaximum?: boolean;
  multipleOf?: number;
}

export class RonkNumber extends RonkType<"number", number, RonkNumberOptions> {
  constructor(options?: RonkNumberOptions) {
    super(options);
  }

  int(): RonkNumber {
    return new RonkNumber({ ...this.options, type: "int" });
  }

  long(): RonkNumber {
    return new RonkNumber({ ...this.options, type: "long" });
  }

  decimal(): RonkNumber {
    return new RonkNumber({ ...this.options, type: "decimal" });
  }

  double(): RonkNumber {
    return new RonkNumber({ ...this.options, type: "double" });
  }

  min(minimum: number): RonkNumber {
    return new RonkNumber({ ...this.options, minimum });
  }

  max(maximum: number): RonkNumber {
    return new RonkNumber({ ...this.options, maximum });
  }

  exclusiveMin(exclusiveMinimum: boolean): RonkNumber {
    return new RonkNumber({ ...this.options, exclusiveMinimum });
  }

  exclusiveMax(exclusiveMaximum: boolean): RonkNumber {
    return new RonkNumber({ ...this.options, exclusiveMaximum });
  }

  multipleOf(multipleOf: number): RonkNumber {
    return new RonkNumber({ ...this.options, multipleOf });
  }

  override bsonSchema(): object {
    const { type, ...options } = this.options ?? {};
    return {
      bsonType: type ?? "number",
      ...options
    };
  }
}

export function number() {
  return new RonkNumber();
}

export function int() {
  return new RonkNumber().int();
}

export function long() {
  return new RonkNumber().long();
}

export function decimal() {
  return new RonkNumber().decimal();
}

export function double() {
  return new RonkNumber().double();
}

// Array

export interface RonkArrayOptions extends RonkTypeOptions {
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
}

export class RonkArray<T extends RonkType> extends RonkType<
  "array",
  T["_type"][],
  RonkArrayOptions,
  T["_input"][]
> {
  constructor(public readonly items: T, options?: RonkArrayOptions) {
    super(options);
  }

  min(minItems: number): RonkArray<T> {
    return new RonkArray(this.items, { ...this.options, minItems });
  }

  max(maxItems: number): RonkArray<T> {
    return new RonkArray(this.items, { ...this.options, maxItems });
  }

  unique(): RonkArray<T> {
    return new RonkArray(this.items, { ...this.options, uniqueItems: true });
  }

  override bsonSchema(): object {
    return {
      bsonType: "array",
      ...this.options,
      items: this.items.bsonSchema()
    };
  }
}

export function array<T extends RonkType>(items: T) {
  return new RonkArray(items);
}

// Object

export interface RonkObjectOptions extends RonkTypeOptions {
  additionalProperties?: boolean;
}

export class RonkObject<T extends Record<string, RonkType>> extends RonkType<
  "object",
  AddQuestionMark<{ [K in keyof T]: T[K]["_type"] }>,
  RonkObjectOptions,
  AddQuestionMark<{ [K in keyof T]: T[K]["_input"] }>
> {
  constructor(public readonly props: T, options?: RonkObjectOptions) {
    super(options);
  }

  strict(): RonkObject<T> {
    return new RonkObject(this.props, {
      ...this.options,
      additionalProperties: false
    });
  }

  override bsonSchema(): object {
    return {
      bsonType: "object",
      ...this.options,
      required: Object.entries(this.props)
        .filter(([, value]) => value.required())
        .map(([key]) => key),
      properties: Object.fromEntries(
        Object.entries(this.props).map(([key, value]) => [
          key,
          value.bsonSchema()
        ])
      )
    };
  }
}

export function object<T extends Record<string, RonkType>>(properties: T) {
  return new RonkObject(properties);
}

// Document

export interface RonkDocumentOptions extends RonkTypeOptions {
  additionalProperties?: boolean;
  indexes?: any[];
}

export class RonkDocument<T extends Record<string, RonkType>> extends RonkType<
  "document",
  AddQuestionMark<{ [K in keyof T]: T[K]["_type"] }>,
  RonkDocumentOptions,
  AddQuestionMark<{ [K in keyof T]: T[K]["_input"] }>
> {
  constructor(public readonly props: T, options?: RonkDocumentOptions) {
    super(options);
  }

  strict(): RonkDocument<T> {
    return new RonkDocument(this.props, {
      ...this.options,
      additionalProperties: false
    });
  }

  index(index: any) {
    return new RonkDocument(this.props, {
      ...this.options,
      indexes: [...(this.options?.indexes ?? []), index]
    });
  }

  override bsonSchema(): object {
    return {
      bsonType: "object",
      ...this.options,
      required: Object.entries(this.props)
        .filter(([, value]) => value.required())
        .map(([key]) => key),
      properties: Object.fromEntries(
        Object.entries(this.props).map(([key, value]) => [
          key,
          value.bsonSchema()
        ])
      )
    };
  }
}

export function document<T extends Record<string, RonkType>>(properties: T) {
  return new RonkDocument(properties);
}

// Record

export interface RonkRecordOptions extends RonkTypeOptions {
  additionalProperties?: boolean;
  minProperties?: number;
  maxProperties?: number;
}

export class RonkRecord<
  K extends RonkString | RonkEnum<string[]>,
  V extends RonkType
> extends RonkType<
  "record",
  AddRecordQuestionMark<
    Record<
      K extends RonkEnum<string[]> ? K["values"][number] : string,
      V["_type"]
    >
  >,
  RonkRecordOptions,
  AddRecordQuestionMark<
    Record<
      K extends RonkEnum<string[]> ? K["values"][number] : string,
      V["_input"]
    >
  >
> {
  constructor(
    public readonly key: K,
    public readonly value: V,
    options?: RonkRecordOptions
  ) {
    super(options);
  }

  strict(): RonkRecord<K, V> {
    return new RonkRecord(this.key, this.value, {
      ...this.options,
      additionalProperties: false
    });
  }

  min(minProperties: number): RonkRecord<K, V> {
    return new RonkRecord(this.key, this.value, {
      ...this.options,
      minProperties
    });
  }

  max(maxProperties: number): RonkRecord<K, V> {
    return new RonkRecord(this.key, this.value, {
      ...this.options,
      maxProperties
    });
  }

  override bsonSchema(): object {
    const valueSchema = this.value.bsonSchema();
    const required = this.value.required();
    return {
      bsonType: "object",
      ...this.options,
      ...(this.key instanceof RonkEnum
        ? {
            ...(required && { required: this.key.values }),
            properties: Object.fromEntries(
              this.key.values.map(value => [value, valueSchema])
            )
          }
        : {
            patternProperties: {
              [!this.key.options?.pattern
                ? "^.*$"
                : this.key.options.pattern instanceof RegExp
                ? this.key.options.pattern.source
                : this.key.options.pattern]: valueSchema
            }
          })
    };
  }
}

export function record<
  K extends RonkString | RonkEnum<string[]>,
  V extends RonkType
>(key: K, value: V) {
  return new RonkRecord(key, value);
}

// Optional

export class RonkOptional<T extends RonkType> extends RonkType<
  "optional",
  T["_type"] | undefined,
  RonkTypeOptions,
  T["_input"] | undefined
> {
  constructor(public readonly type: T) {
    super();
  }

  override required() {
    return false;
  }

  override bsonSchema(): object {
    return this.type.bsonSchema();
  }
}

// Default

export class RonkDefault<T extends RonkType> extends RonkType<
  "default",
  T["_type"],
  RonkTypeOptions,
  T["_input"] | undefined
> {
  constructor(
    public readonly type: T,
    public readonly defaultValue: T["_input"] | (() => T["_input"])
  ) {
    super();
  }

  override bsonSchema(): object {
    return this.type.bsonSchema();
  }
}

// Union

export interface RonkUnionOptions extends RonkTypeOptions {
  exclusive?: boolean;
}

export class RonkUnion<T extends RonkType[]> extends RonkType<
  "union",
  T[number]["_type"],
  RonkUnionOptions,
  T[number]["_input"]
> {
  constructor(public readonly types: T, options?: RonkUnionOptions) {
    super(options);
  }

  exclusive(): RonkUnion<T> {
    return new RonkUnion(this.types, { ...this.options, exclusive: true });
  }

  override required() {
    return this.types.every(type => type.required());
  }

  override bsonSchema(): object {
    const { exclusive, ...options } = this.options ?? {};
    return {
      ...options,
      [exclusive ? "oneOf" : "anyOf"]: this.types.map(type => type.bsonSchema())
    };
  }
}

export function union<T extends RonkType[]>(...types: T) {
  return new RonkUnion(types);
}

// Intersection

export class RonkIntersection<T extends RonkType[]> extends RonkType<
  "intersection",
  UnionToIntersection<T[number]["_type"]>,
  RonkTypeOptions,
  UnionToIntersection<T[number]["_input"]>
> {
  constructor(public readonly types: T) {
    super();
  }

  override required() {
    return this.types.some(type => type.required());
  }

  override bsonSchema(): object {
    return {
      ...this.options,
      allOf: this.types.map(type => type.bsonSchema())
    };
  }
}

export function intersection<T extends RonkType[]>(...types: T) {
  return new RonkIntersection(types);
}
