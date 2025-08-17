import { MongoClient, Db, Collection, ObjectId } from "mongodb";
import { PostDoc } from "../types/post";

let client: MongoClient | null = null;
let db: Db | null = null;
let postsCol: Collection<PostDoc> | null = null;

export async function connectMongo(uri: string, dbName: string) {
  if (client) return { db: db!, posts: postsCol! };
  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);
  postsCol = db.collection<PostDoc>("posts");

  // Ensure indexes helpful for queries
  await postsCol.createIndexes([
    { key: { parentId: 1 } },
    { key: { createdAt: 1 } },
  ]);

  return { db, posts: postsCol };
}

export function getDb(): { db: Db; posts: Collection<PostDoc> } {
  if (!db || !postsCol) {
    throw new Error("MongoDB not connected. Call connectMongo first.");
    }
  return { db, posts: postsCol };
}

export function toObjectId(id: string): ObjectId | null {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

export async function closeMongo() {
  if (client) {
    await client.close();
  }
  client = null;
  db = null;
  postsCol = null;
}
