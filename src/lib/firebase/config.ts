import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** True when the required public Firebase env vars are present. */
export const firebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
);

let app: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let dbInstance: Firestore | undefined;
let storageInstance: FirebaseStorage | undefined;

if (firebaseConfigured) {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  authInstance = getAuth(app);

  // Enable an on-device cache so reads/writes work offline and sync later.
  if (typeof window !== "undefined") {
    try {
      dbInstance = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
    } catch {
      dbInstance = getFirestore(app);
    }
  } else {
    dbInstance = getFirestore(app);
  }

  storageInstance = getStorage(app);
}

// Guarded by the setup gate in AuthProvider; only accessed when configured.
export const auth = authInstance as Auth;
export const db = dbInstance as Firestore;
export const storage = storageInstance as FirebaseStorage;
