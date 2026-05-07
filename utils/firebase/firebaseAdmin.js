import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const requiredEnv = [
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_PRIVATE_KEY',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    ];

    const missing = requiredEnv.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      console.warn(
        `Skipping firebase-admin init. Missing env vars: ${missing.join(', ')}`
      );
    } else {
      admin.initializeApp({
        credential: admin.credential.cert({
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        }),
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      });
    }
  } catch (e) {
    console.log('Failed to initialize App: ' + e);
  }
}

export default admin;