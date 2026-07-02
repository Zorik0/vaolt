import { getDoc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import type { AppUser } from "../types";
import { userDoc } from "./converters";

/** Create the `/users/{uid}` profile if it does not already exist. */
export async function ensureUserDoc(user: User): Promise<void> {
  const ref = userDoc(user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  await setDoc(ref, {
    uid: user.uid,
    displayName: user.displayName ?? user.email?.split("@")[0] ?? "Member",
    email: user.email ?? "",
    photoURL: user.photoURL ?? null,
    householdId: null,
    role: null,
    createdAt: serverTimestamp(),
  });
}

export function subscribeUserDoc(
  uid: string,
  cb: (user: AppUser | null) => void,
  onError?: (e: Error) => void,
) {
  return onSnapshot(
    userDoc(uid),
    (snap) => cb(snap.exists() ? (snap.data() as AppUser) : null),
    (err) => onError?.(err),
  );
}
