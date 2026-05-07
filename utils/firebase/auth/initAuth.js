import { init } from 'next-firebase-auth';

const initAuth = () => {
  const requiredEnv = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
    'COOKIE_SECRET_CURRENT',
    'COOKIE_SECRET_PREVIOUS',
  ];

  const missing = requiredEnv.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.warn(
      `Skipping next-firebase-auth init. Missing env vars: ${missing.join(', ')}`
    );
    return;
  }

  init({
    authPageURL: '/login',
    appPageURL: '/dashboard',
    loginAPIEndpoint: '/api/login',
    logoutAPIEndpoint: '/api/logout',
    firebaseAdminInitConfig: {
      credential: {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY,
      },
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    },
    firebaseClientInitConfig: {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    },
    cookies: {
      name: 'NextFirebase',
      keys: [process.env.COOKIE_SECRET_CURRENT, process.env.COOKIE_SECRET_PREVIOUS],
      httpOnly: false,
      maxAge: 12 * 60 * 60 * 24 * 1000,
      overwrite: true,
      path: '/',
      sameSite: 'strict',
      secure: process.env.COOKIE_SECURE,
      signed: true,
    },
  });
};

export default initAuth;
