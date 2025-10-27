// src/lib/mongodb.ts
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;
if (!MONGODB_URI) throw new Error("Missing MONGODB_URI");

let cached = (global as any)._mongoose;
if (!cached) cached = (global as any)._mongoose = { conn: null, promise: null };

export async function dbConnect() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        maxPoolSize: 10,
      })
      .then((m) => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
