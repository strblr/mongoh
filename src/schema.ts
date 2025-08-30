import { ObjectId, Binary } from "mongodb";
import {
  AddQuestionMark,
  AddRecordQuestionMark,
  DeletePolicy,
  UnionToIntersection
} from "./types";
import { isArray, isFunction, isPlainObject } from "./utils";

export interface SchemaOptions {
  title?: string;
  description?: string;
}

export abstract class Schema<
  Kind extends string = string,
  Type = unknown,
  Options extends SchemaOptions = SchemaOptions,
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

  array(): ArraySchema<this> {
    return new ArraySchema(this);
  }

  record(): RecordSchema<StringSchema, this> {
    return new RecordSchema(new StringSchema(), this);
  }

  or<T extends Schema[]>(...types: T): UnionSchema<[this, ...T]> {
    return new UnionSchema([this, ...types]);
  }

  and<T extends Schema[]>(...types: T): IntersectionSchema<[this, ...T]> {
    return new IntersectionSchema([this, ...types]);
  }

  optional(): OptionalSchema<this> {
    return new OptionalSchema(this);
  }

  nullable(): UnionSchema<[this, NullSchema]> {
    return new UnionSchema([this, new NullSchema()]);
  }

  nullish(): OptionalSchema<UnionSchema<[this, NullSchema]>> {
    return this.nullable().optional();
  }

  default(defaultValue: Input | (() => Input)): DefaultSchema<this> {
    return new DefaultSchema(this, defaultValue);
  }

  required() {
    return true;
  }

  fill(input: Input): Type {
    return input as any as Type;
  }

  abstract bsonSchema(): object;
}

// Null

export class NullSchema extends Schema<"null", null> {
  override bsonSchema(): object {
    return { bsonType: "null", ...this.options };
  }
}

function null_() {
  return new NullSchema();
}

export { null_ as null };

// Bool

export class BoolSchema extends Schema<"bool", boolean> {
  override bsonSchema(): object {
    return { bsonType: "bool", ...this.options };
  }
}

export function bool() {
  return new BoolSchema();
}

// Date

export class DateSchema extends Schema<"date", Date> {
  override bsonSchema(): object {
    return { bsonType: "date", ...this.options };
  }
}

export function date() {
  return new DateSchema();
}

// Binary

export class BinarySchema extends Schema<"binary", Binary> {
  override bsonSchema(): object {
    return { bsonType: "binData", ...this.options };
  }
}

export function binary() {
  return new BinarySchema();
}

// ObjectId

export class ObjectIdSchema extends Schema<"objectid", ObjectId> {
  override bsonSchema(): object {
    return { bsonType: "objectId", ...this.options };
  }
}

export function objectId() {
  return new ObjectIdSchema();
}

// Ref

export interface RefSchemaOptions extends SchemaOptions {
  deletePolicy?: DeletePolicy;
}

export class RefSchema<T extends string = string> extends Schema<
  "ref",
  ObjectId,
  RefSchemaOptions
> {
  constructor(public readonly ref: T, options?: RefSchemaOptions) {
    super(options);
  }

  delete(deletePolicy: DeletePolicy) {
    return new RefSchema(this.ref, { ...this.options, deletePolicy });
  }

  override bsonSchema(): object {
    const { deletePolicy, ...options } = this.options ?? {};
    return { bsonType: "objectId", ...options };
  }
}

export function ref<T extends string>(ref: T) {
  return new RefSchema(ref);
}

// Enum

export class EnumSchema<T extends unknown[]> extends Schema<"enum", T[number]> {
  constructor(public readonly values: T) {
    super();
  }

  override required() {
    return this.values.every(value => value !== undefined);
  }

  override bsonSchema(): object {
    return { enum: this.values, ...this.options };
  }
}

function enum_<const T extends unknown[]>(...values: T) {
  return new EnumSchema(values);
}

export { enum_ as enum };

// String

export interface StringSchemaOptions extends SchemaOptions {
  minLength?: number;
  maxLength?: number;
  pattern?: string | RegExp;
}

export class StringSchema extends Schema<
  "string",
  string,
  StringSchemaOptions
> {
  constructor(options?: StringSchemaOptions) {
    super(options);
  }

  min(minLength: number): StringSchema {
    return new StringSchema({ ...this.options, minLength });
  }

  max(maxLength: number): StringSchema {
    return new StringSchema({ ...this.options, maxLength });
  }

  pattern(pattern: string | RegExp): StringSchema {
    return new StringSchema({ ...this.options, pattern });
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
  return new StringSchema();
}

// Number

export interface NumberSchemaOptions extends SchemaOptions {
  type?: "int" | "long" | "decimal" | "double";
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: boolean;
  exclusiveMaximum?: boolean;
  multipleOf?: number;
}

export class NumberSchema extends Schema<
  "number",
  number,
  NumberSchemaOptions
> {
  constructor(options?: NumberSchemaOptions) {
    super(options);
  }

  int(): NumberSchema {
    return new NumberSchema({ ...this.options, type: "int" });
  }

  long(): NumberSchema {
    return new NumberSchema({ ...this.options, type: "long" });
  }

  decimal(): NumberSchema {
    return new NumberSchema({ ...this.options, type: "decimal" });
  }

  double(): NumberSchema {
    return new NumberSchema({ ...this.options, type: "double" });
  }

  min(minimum: number): NumberSchema {
    return new NumberSchema({ ...this.options, minimum });
  }

  max(maximum: number): NumberSchema {
    return new NumberSchema({ ...this.options, maximum });
  }

  exclusiveMin(exclusiveMinimum: boolean): NumberSchema {
    return new NumberSchema({ ...this.options, exclusiveMinimum });
  }

  exclusiveMax(exclusiveMaximum: boolean): NumberSchema {
    return new NumberSchema({ ...this.options, exclusiveMaximum });
  }

  multipleOf(multipleOf: number): NumberSchema {
    return new NumberSchema({ ...this.options, multipleOf });
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
  return new NumberSchema();
}

export function int() {
  return new NumberSchema().int();
}

export function long() {
  return new NumberSchema().long();
}

export function decimal() {
  return new NumberSchema().decimal();
}

export function double() {
  return new NumberSchema().double();
}

// Array

export interface ArraySchemaOptions extends SchemaOptions {
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
}

export type ArraySchemaType<T extends Schema> = T["_type"][];

export type ArraySchemaInput<T extends Schema> = T["_input"][];

export class ArraySchema<T extends Schema> extends Schema<
  "array",
  ArraySchemaType<T>,
  ArraySchemaOptions,
  ArraySchemaInput<T>
> {
  constructor(public readonly items: T, options?: ArraySchemaOptions) {
    super(options);
  }

  min(minItems: number): ArraySchema<T> {
    return new ArraySchema(this.items, { ...this.options, minItems });
  }

  max(maxItems: number): ArraySchema<T> {
    return new ArraySchema(this.items, { ...this.options, maxItems });
  }

  unique(): ArraySchema<T> {
    return new ArraySchema(this.items, { ...this.options, uniqueItems: true });
  }

  override fill(input: ArraySchemaInput<T>): ArraySchemaType<T> {
    return !isArray(input) ? input : input.map(item => this.items.fill(item));
  }

  override bsonSchema(): object {
    return {
      bsonType: "array",
      ...this.options,
      items: this.items.bsonSchema()
    };
  }
}

export function array<T extends Schema>(items: T) {
  return new ArraySchema(items);
}

// Object

export interface ObjectSchemaOptions extends SchemaOptions {
  additionalProperties?: boolean;
}

export type ObjectSchemaType<T extends Record<string, Schema>> =
  AddQuestionMark<{
    [K in keyof T]: T[K]["_type"];
  }>;

export type ObjectSchemaInput<T extends Record<string, Schema>> =
  AddQuestionMark<{
    [K in keyof T]: T[K]["_input"];
  }>;

export class ObjectSchema<T extends Record<string, Schema>> extends Schema<
  "object",
  ObjectSchemaType<T>,
  ObjectSchemaOptions,
  ObjectSchemaInput<T>
> {
  constructor(public readonly props: T, options?: ObjectSchemaOptions) {
    super(options);
  }

  strict(): ObjectSchema<T> {
    return new ObjectSchema(this.props, {
      ...this.options,
      additionalProperties: false
    });
  }

  override fill(input: ObjectSchemaInput<T>): ObjectSchemaType<T> {
    if (!isPlainObject(input)) {
      return input;
    }
    return {
      ...input,
      ...Object.fromEntries(
        Object.entries(this.props).map(([key, value]) => [
          key,
          value.fill(input[key as keyof typeof input])
        ])
      )
    } as any;
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

export function object<T extends Record<string, Schema>>(properties: T) {
  return new ObjectSchema(properties);
}

// Document

export interface CollectionSchemaOptions extends SchemaOptions {
  additionalProperties?: boolean;
  indexes?: any[];
}

export type CollectionSchemaType<T extends Record<string, Schema>> =
  AddQuestionMark<{
    [K in keyof T]: T[K]["_type"];
  }>;

export type CollectionSchemaInput<T extends Record<string, Schema>> =
  AddQuestionMark<{
    [K in keyof T]: T[K]["_input"];
  }>;

export class CollectionSchema<T extends Record<string, Schema>> extends Schema<
  "document",
  CollectionSchemaType<T>,
  CollectionSchemaOptions,
  CollectionSchemaInput<T>
> {
  constructor(public readonly props: T, options?: CollectionSchemaOptions) {
    super(options);
  }

  strict(): CollectionSchema<T> {
    return new CollectionSchema(this.props, {
      ...this.options,
      additionalProperties: false
    });
  }

  index(index: any) {
    return new CollectionSchema(this.props, {
      ...this.options,
      indexes: [...(this.options?.indexes ?? []), index]
    });
  }

  override fill(input: CollectionSchemaInput<T>): CollectionSchemaType<T> {
    if (!isPlainObject(input)) {
      return input;
    }
    return {
      ...input,
      ...Object.fromEntries(
        Object.entries(this.props).map(([key, value]) => [
          key,
          value.fill(input[key as keyof typeof input])
        ])
      )
    } as any;
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

export function collection<T extends Record<string, Schema>>(properties: T) {
  return new CollectionSchema(properties);
}

// Record

export interface RecordSchemaOptions extends SchemaOptions {
  additionalProperties?: boolean;
  minProperties?: number;
  maxProperties?: number;
}

export type RecordSchemaType<
  K extends StringSchema | EnumSchema<string[]>,
  V extends Schema
> = AddRecordQuestionMark<
  Record<
    K extends EnumSchema<string[]> ? K["values"][number] : string,
    V["_type"]
  >
>;

export type RecordSchemaInput<
  K extends StringSchema | EnumSchema<string[]>,
  V extends Schema
> = AddRecordQuestionMark<
  Record<
    K extends EnumSchema<string[]> ? K["values"][number] : string,
    V["_input"]
  >
>;

export class RecordSchema<
  K extends StringSchema | EnumSchema<string[]>,
  V extends Schema
> extends Schema<
  "record",
  RecordSchemaType<K, V>,
  RecordSchemaOptions,
  RecordSchemaInput<K, V>
> {
  constructor(
    public readonly key: K,
    public readonly value: V,
    options?: RecordSchemaOptions
  ) {
    super(options);
  }

  strict(): RecordSchema<K, V> {
    return new RecordSchema(this.key, this.value, {
      ...this.options,
      additionalProperties: false
    });
  }

  min(minProperties: number): RecordSchema<K, V> {
    return new RecordSchema(this.key, this.value, {
      ...this.options,
      minProperties
    });
  }

  max(maxProperties: number): RecordSchema<K, V> {
    return new RecordSchema(this.key, this.value, {
      ...this.options,
      maxProperties
    });
  }

  override fill(input: RecordSchemaInput<K, V>): RecordSchemaType<K, V> {
    if (!isPlainObject(input)) {
      return input;
    }
    return {
      ...input
      // TODO: recursive fill value
    };
  }

  override bsonSchema(): object {
    const valueSchema = this.value.bsonSchema();
    const required = this.value.required();
    return {
      bsonType: "object",
      ...this.options,
      ...(this.key instanceof EnumSchema
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
  K extends StringSchema | EnumSchema<string[]>,
  V extends Schema
>(key: K, value: V) {
  return new RecordSchema(key, value);
}

// Optional

export type OptionalSchemaType<T extends Schema> = T["_type"] | undefined;

export type OptionalSchemaInput<T extends Schema> = T["_input"] | undefined;

export class OptionalSchema<T extends Schema> extends Schema<
  "optional",
  OptionalSchemaType<T>,
  SchemaOptions,
  OptionalSchemaInput<T>
> {
  constructor(public readonly type: T) {
    super();
  }

  override required() {
    return false;
  }

  override fill(input: OptionalSchemaInput<T>): OptionalSchemaType<T> {
    return input !== undefined ? this.type.fill(input) : undefined;
  }

  override bsonSchema(): object {
    return this.type.bsonSchema();
  }
}

// Default

export type DefaultSchemaType<T extends Schema> = T["_type"];

export type DefaultSchemaInput<T extends Schema> = T["_input"] | undefined;

export class DefaultSchema<T extends Schema> extends Schema<
  "default",
  DefaultSchemaType<T>,
  SchemaOptions,
  DefaultSchemaInput<T>
> {
  constructor(
    public readonly type: T,
    public readonly defaultValue: T["_input"] | (() => T["_input"])
  ) {
    super();
  }

  override fill(input: DefaultSchemaInput<T>): DefaultSchemaType<T> {
    return this.type.fill(
      input !== undefined
        ? input
        : isFunction(this.defaultValue)
        ? this.defaultValue()
        : this.defaultValue
    );
  }

  override bsonSchema(): object {
    return this.type.bsonSchema();
  }
}

// Union

export interface UnionSchemaOptions extends SchemaOptions {
  exclusive?: boolean;
}

export class UnionSchema<T extends Schema[]> extends Schema<
  "union",
  T[number]["_type"],
  UnionSchemaOptions,
  T[number]["_input"]
> {
  constructor(public readonly types: T, options?: UnionSchemaOptions) {
    super(options);
  }

  exclusive(): UnionSchema<T> {
    return new UnionSchema(this.types, { ...this.options, exclusive: true });
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

export function union<T extends Schema[]>(...types: T) {
  return new UnionSchema(types);
}

// Intersection

export class IntersectionSchema<T extends Schema[]> extends Schema<
  "intersection",
  UnionToIntersection<T[number]["_type"]>,
  SchemaOptions,
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

export function intersection<T extends Schema[]>(...types: T) {
  return new IntersectionSchema(types);
}
