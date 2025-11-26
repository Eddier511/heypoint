import admin from "firebase-admin";
import { env } from "./env";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.fbProjectId,
      clientEmail: env.fbClientEmail,
      privateKey: env.fbPrivateKey,
    } as admin.ServiceAccount),
  });
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();
