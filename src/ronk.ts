import {
  Collection,
  Db,
  DbOptions,
  MongoClient,
  MongoClientOptions
} from "mongodb";
import type { SchemaLike, ValidateSchema } from "./utils";

export interface RonkOptions extends MongoClientOptions {
  uri?: string;
  dbOptions?: DbOptions;
}

export type RonkDb<S extends SchemaLike> = {
  [K in keyof S]: RonkCollection<S, K>;
} & {
  $schema: S;
  $client: MongoClient;
  $db: Db;
  (collection: string): Collection;
};

export function db<const S extends SchemaLike>(
  schema: ValidateSchema<S> & S,
  { uri = "mongodb://localhost:27017", dbOptions, ...options }: RonkOptions = {}
) {
  const client = new MongoClient(uri, options);
  const db = client.db(undefined, dbOptions);

  return new Proxy((() => {}) as any as RonkDb<S>, {
    get(_, prop) {
      console.log("IN GET", prop);
      if (prop === "$schema") {
        return schema;
      }
      if (prop === "$client") {
        return client;
      }
      if (prop === "$db") {
        return db;
      }
      if (Object.hasOwn(schema, prop)) {
        return new RonkCollection(schema, prop as keyof S);
      }
      throw new Error(`Unknown collection: ${String(prop)}`);
    },
    apply(_, __, [collection]) {
      return db.collection(collection);
    }
  });
}

export class RonkCollection<S extends SchemaLike, Col extends keyof S> {
  constructor(public readonly schema: S, public readonly colName: Col) {}

  bsonSchema() {
    return this.schema[this.colName].bsonSchema();
  }
}
