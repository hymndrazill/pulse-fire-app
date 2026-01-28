import { MongoClient, Db } from "mongodb";

let db: Db;
let client: MongoClient;

export async function connectDatabase(uri: string): Promise<Db> {
  if (db) {
    return db;
  }

  try {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db();

    console.log("Connected to MongoDB");

    // indexing db 
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    await db.collection("users").createIndex({ username: 1 }, { unique: true });
    await db.collection("posts").createIndex({ createdAt: -1 });
    await db.collection("posts").createIndex({ userId: 1 });
    await db.collection("comments").createIndex({ postId: 1, createdAt: -1 });

    return db;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

export function getDatabase(): Db {
  if (!db) {
    throw new Error("Database not initialized. Call connectDatabase first.");
  }
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close();
    console.log("MongoDB connection closed");
  }
}
