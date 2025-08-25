import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";

let bucket = null;

export function getGridFSBucket() {
  const conn = mongoose.connection;
  if (!conn || conn.readyState !== 1) {
    throw new Error("MongoDB is not connected");
  }
  if (!bucket) {
    bucket = new GridFSBucket(conn.db, { bucketName: "submissions" });
  }
  return bucket;
}

export function resetGridFSBucket() {
  bucket = null;
}
