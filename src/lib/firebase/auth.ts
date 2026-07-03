import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getRedirectResult,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth } from "./config";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

/**
 * Error codes that mean the popup itself couldn't run to completion — the
 * browser blocked it, closed it immediately, or the environment (an installed
 * PWA / in-app webview) doesn't support popups at all. In every one of these
 * cases a full-page redirect is the reliable way to finish sign-in.
 */
const POPUP_FALLBACK_CODES = new Set([
  "auth/popup-blocked",
  "auth/popup-closed-by-user",
  "auth/cancelled-popup-request",
  "auth/operation-not-supported-in-this-environment",
  "auth/web-storage-unsupported",
  "auth/internal-error",
]);

/**
 * Sign in with Google. Tries a popup first (fast, keeps the user on the page)
 * and transparently falls back to a redirect when the popup can't complete —
 * which is the norm on mobile Safari/Chrome and inside installed PWAs.
 *
 * When the redirect path is taken the browser navigates away, so this call
 * never resolves; `completeRedirectSignIn` picks the result up on return.
 */
export async function signInWithGoogle(): Promise<User> {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    return cred.user;
  } catch (err) {
    if (err instanceof FirebaseError && POPUP_FALLBACK_CODES.has(err.code)) {
      await signInWithRedirect(auth, googleProvider);
      // Redirect navigates away; keep the promise pending until the page unloads.
      return new Promise<User>(() => {});
    }
    throw err;
  }
}

/**
 * Completes a redirect-based Google sign-in after the browser navigates back.
 * Safe to call unconditionally on load; resolves to `null` when there was no
 * pending redirect. `onAuthStateChanged` still drives the app state — this is
 * mainly here so any redirect error surfaces instead of being swallowed.
 */
export async function completeRedirectSignIn(): Promise<User | null> {
  const result = await getRedirectResult(auth);
  return result?.user ?? null;
}

export async function signUpWithEmail(
  name: string,
  email: string,
  password: string,
): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (name) await updateProfile(cred.user, { displayName: name });
  return cred.user;
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

/** Human-friendly messages for the common Firebase auth error codes. */
export function authErrorMessage(code: string): string {
  const map: Record<string, string> = {
    "auth/invalid-email": "That email address doesn't look right.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/user-not-found": "No account found with that email.",
    "auth/wrong-password": "Incorrect email or password.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/email-already-in-use": "An account already exists with that email.",
    "auth/weak-password": "Choose a password with at least 6 characters.",
    "auth/popup-closed-by-user": "Sign-in was cancelled.",
    "auth/popup-blocked": "Your browser blocked the sign-in popup.",
    "auth/network-request-failed": "Network error. Check your connection.",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
  };
  return map[code] ?? "Something went wrong. Please try again.";
}
