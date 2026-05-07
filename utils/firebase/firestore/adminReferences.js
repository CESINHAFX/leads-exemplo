
import admin from '../firebaseAdmin';

// Firestore references used for server-side only
// Use in getStaticProps, getStaticPaths, etc. Não use no client!
export const docRef = () =>
  admin.firestore().collection('example').doc('example');
