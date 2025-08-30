import { ObjectId } from "mongodb";
import { k } from ".";

const schema = {
  users: k.collection({
    _id: k.objectId().default(() => new ObjectId()),
    name: k.string().pattern(/^[a-z]+$/),
    email: k.string(),
    role: k.enum("admin", "user").default("user"),
    createdAt: k.union(k.date(), k.number())
  }),

  posts: k.collection({
    _id: k.objectId(),
    title: k.string(),
    content: k.string(),
    createdAt: k.date(),
    updatedAt: k.date(),
    authorId: k.ref("users").delete("cascade")
  }),

  comments: k.collection({
    _id: k.objectId(),
    content: k.string(),
    authorId: k.ref("users"),
    postId: k.ref("posts"),
    createdAt: k.date()
  })
};

export const db = k.db(schema, { uri: "mongodb://localhost:27017/testronk" });

const { users } = db.collections;

export type User = k.document<typeof users>;
export type UserInput = k.documentInput<typeof users>;

console.log(Bun.inspect(users.schema.bsonSchema(), { depth: Infinity }));
