import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';

const clientCredentials = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
const missingKeys = requiredKeys.filter((key) => !clientCredentials[key]);

let app = null;
let analytics = null;

if (missingKeys.length === 0) {
  app = getApps().length > 0 ? getApp() : initializeApp(clientCredentials);

  if (typeof window !== 'undefined' && clientCredentials.measurementId) {
    try {
      analytics = getAnalytics(app);
    } catch (error) {
      console.warn('Firebase Analytics is unavailable in this environment.', error);
    }
  }
} else if (typeof window !== 'undefined') {
  console.warn(
    `Firebase client init skipped. Missing config keys: ${missingKeys.join(', ')}`
  );
}

export { app, analytics };
export default app;