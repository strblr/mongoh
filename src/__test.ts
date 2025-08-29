import { r } from "./index";

const schema = {
  users: r.document({
    _id: r.string(),
    name: r.string().pattern(/^[a-z]+$/),
    email: r.string(),
    role: r.enum("admin", "user").default("user"),
    createdAt: r.union(r.date(), r.number())
  }),

  posts: r.document({
    _id: r.string(),
    title: r.string(),
    content: r.string(),
    createdAt: r.date(),
    updatedAt: r.date(),
    authorId: r.ref("users").delete("cascade")
  }),

  comments: r.document({
    _id: r.string(),
    content: r.string(),
    authorId: r.ref("users"),
    postId: r.ref("posts"),
    createdAt: r.date()
  })
};

export const db = r.db(schema, { uri: "mongodb://localhost:27017/testronk" });

export type User = r.type<typeof schema.users>;
export type UserInput = r.input<typeof schema.users>;

console.log(Bun.inspect(db.users.bsonSchema(), { depth: Infinity }));
