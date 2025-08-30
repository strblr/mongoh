import { Ronk } from "./ronk";
import { SchemaLike } from "./types";

// RonkCollection

export class RonkCollection<S extends SchemaLike, K extends keyof S> {
  constructor(public readonly db: Ronk<S>, public readonly name: K) {}

  get schema() {
    return this.db.schema[this.name];
  }
}
