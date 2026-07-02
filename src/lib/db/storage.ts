import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { storage } from "../firebase/config";

export interface UploadResult {
  url: string;
  path: string;
}

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];

export function validateReceipt(file: File): string | null {
  if (file.size > MAX_BYTES) return "File is too large (max 8MB).";
  if (file.type && !ALLOWED.includes(file.type)) return "Use an image or PDF file.";
  return null;
}

/** Upload a receipt for a household and report progress (0–1). */
export function uploadReceipt(
  hid: string,
  file: File,
  onProgress?: (fraction: number) => void,
): Promise<UploadResult> {
  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `households/${hid}/receipts/${Date.now()}_${safeName}`;
  const storageRef = ref(storage, path);
  const task = uploadBytesResumable(storageRef, file, { contentType: file.type });

  return new Promise((resolve, reject) => {
    task.on(
      "state_changed",
      (snap) => onProgress?.(snap.bytesTransferred / snap.totalBytes),
      (err) => reject(err),
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve({ url, path });
      },
    );
  });
}

export async function deleteReceipt(path: string): Promise<void> {
  if (!path) return;
  try {
    await deleteObject(ref(storage, path));
  } catch {
    // Non-fatal: the file may already be gone.
  }
}
