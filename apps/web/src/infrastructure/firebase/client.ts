import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim();

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  ...(storageBucket ? { storageBucket } : {}),
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId,
);

let firebaseApp: FirebaseApp | null = null;
if (isFirebaseConfigured) firebaseApp = getApps()[0] ?? initializeApp(firebaseConfig);

export const app = firebaseApp;
export const auth: Auth | null = firebaseApp ? getAuth(firebaseApp) : null;
export const db: Firestore | null = firebaseApp ? getFirestore(firebaseApp) : null;
// Storage is optional for demo/catalog-only deployments. Upload actions fail with
// a clear message until VITE_FIREBASE_STORAGE_BUCKET is configured.
export const storage: FirebaseStorage | null = firebaseApp && storageBucket ? getStorage(firebaseApp) : null;
