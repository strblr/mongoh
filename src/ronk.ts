import {
  Collection,
  Db,
  DbOptions,
  MongoClient,
  MongoClientOptions
} from "mongodb";
import { RonkCollection } from "./collection";
import type { SchemaLike, ValidateSchema } from "./types";

export interface RonkOptions extends MongoClientOptions {
  uri?: string;
  dbOptions?: DbOptions & { dbName?: string };
}

export type RonkCollections<S extends SchemaLike> = {
  [K in keyof S]: RonkCollection<S, K>;
} & {
  (collection: string): Collection;
};

export class Ronk<S extends SchemaLike> {
  readonly client: MongoClient;
  readonly db: Db;
  readonly collections: RonkCollections<S>;

  constructor(
    public readonly schema: S,
    {
      uri = "mongodb://localhost:27017",
      dbOptions: { dbName, ...dbOptions } = {},
      ...options
    }: RonkOptions = {}
  ) {
    this.client = new MongoClient(uri, options);
    this.db = this.client.db(dbName, dbOptions);

    const collections = Object.fromEntries(
      Object.keys(schema).map(name => [name, new RonkCollection(this, name)])
    );

    this.collections = new Proxy((() => {}) as any, {
      get: (_, prop) => {
        if (Object.hasOwn(collections, prop)) {
          return collections[prop as string];
        }
        throw new Error(`Unknown collection: ${String(prop)}`);
      },
      apply: (_, __, [collection]) => {
        return this.db.collection(collection);
      }
    });
  }
}

export function db<const S extends SchemaLike>(
  schema: ValidateSchema<S> & S,
  options: RonkOptions = {}
) {
  return new Ronk<S>(schema, options);
}
