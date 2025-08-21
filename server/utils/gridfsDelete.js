import { getGridFSBucket } from "./gridfs.js";
import mongoose from "mongoose";

/**
 * Delete a file from GridFS by its id (hex string or ObjectId)
 * @param {string|ObjectId} fileId
 * @returns {Promise<void>}
 */
export async function deleteGridFSFile(fileId) {
  if (!fileId) return;
  const bucket = getGridFSBucket();
  let _id;
  try {
    _id =
      typeof fileId === "string" ? new mongoose.Types.ObjectId(fileId) : fileId;
  } catch (e) {
    console.warn("Invalid GridFS file id for deletion:", fileId);
    return;
  }
  try {
    await bucket.delete(_id);
    console.log("[GridFS] Deleted file:", fileId);
  } catch (err) {
    if (err.code === "ENOENT" || err.message?.includes("FileNotFound")) {
      // Already deleted or not found
      console.warn("[GridFS] File not found for deletion:", fileId);
    } else {
      console.error("[GridFS] Error deleting file:", fileId, err);
    }
  }
}
