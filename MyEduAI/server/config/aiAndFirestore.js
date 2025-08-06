// File: src/config/aiAndFirestore.js

import admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

// --- 1. Firebase Initialization ---
// This uses the standard "applicationDefault" method. It automatically
// looks for the GOOGLE_APPLICATION_CREDENTIALS environment variable,
// which you will set in Render.
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    console.log("✅ Firebase Admin SDK initialized successfully.");
  } catch (error) {
    console.error("❌ Failed to initialize Firebase Admin SDK:", error.message);
    // If it fails here, the application cannot run correctly.
    process.exit(1);
  }
}

// --- 2. Firestore and Gemini AI Initialization ---
const db = admin.firestore();

const geminiApiKey = process.env.GEMINI_MOCK_KEY;
if (!geminiApiKey) {
  console.error("❌ GEMINI_MOCK_KEY environment variable not found.");
  process.exit(1);
}
const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// --- 3. Export the ready-to-use services ---
// Other files in your application will import these.
export { db, model };