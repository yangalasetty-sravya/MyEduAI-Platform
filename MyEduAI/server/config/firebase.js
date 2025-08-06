// server/config/firebase.js
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config(); // ✅ must be first

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(), // ✅ use GOOGLE_APPLICATION_CREDENTIALS path
  });
}

const db = getFirestore();

export { db };
