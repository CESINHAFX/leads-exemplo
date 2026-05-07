
import admin from "../firebaseAdmin";
import { docRef } from "./adminReferences";

// Não use essas referências no client! Apenas em getStaticProps/getStaticPaths/etc.
export const getDoc = async () => {
  try {
    if (!admin.apps.length) {
      return null;
    }

    const doc = await docRef().get();
    if (doc.exists) {
      return doc.data();
    }
    return null;
  } catch (error) {
    console.error("Error getting document:", error);
    return null;
  }
};