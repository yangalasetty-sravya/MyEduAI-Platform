// server/services/firestoreService.js

import admin from "firebase-admin";
import { getFirestore, Timestamp } from "firebase-admin/firestore";


// Setup Firebase Admin





if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}


const db = getFirestore();


// --------------------------------------------
// ✅ Save Assessment Results
// --------------------------------------------
export const saveAssessmentResults = async (uid, results) => {
  if (!uid) {
    console.error("❌ Cannot save results without a user UID.");
    return;
  }

  try {
    const userRef = db.collection("users").doc(uid);

    await userRef.set({
      assessmentResults: {
        ...results,
        completedAt: Timestamp.now()
      },
      assessmentCompleted: true,
      assessmentPending: false
    }, { merge: true });

    console.log("✅ Assessment results saved for user:", uid);

    // Award badge if score >= 80
    if (results.score >= 80) {
      const badgeRef = userRef.collection("badges").doc(`high-score-${Date.now()}`);
      await badgeRef.set({
        name: "High Scorer",
        description: "Scored 80%+ in mock assessment",
        earnedAt: Timestamp.now()
      });

      await userRef.set({
        badgesEarned: admin.firestore.FieldValue.increment(1)
      }, { merge: true });

      console.log("🏅 High Scorer badge granted.");
    }

  } catch (error) {
    console.error("❌ Error saving assessment results:", error);
    throw error;
  }
};


// --------------------------------------------
// ✅ Create New Course (with modules & lessons)
// --------------------------------------------
export const createCourse = async (volunteerId, courseData) => {
  if (!volunteerId || !courseData) {
    throw new Error("volunteerId and courseData are required.");
  }

  try {
    const newCourse = {
      ...courseData,
      volunteerId,
      createdAt: Timestamp.now(),
      status: courseData.status || "Draft", // default to Draft
      modules: courseData.modules || []
    };

    const courseRef = await db.collection("courses").add(newCourse);

    console.log("✅ Course created with ID:", courseRef.id);
    return courseRef.id;

  } catch (error) {
    console.error("❌ Error creating course:", error);
    throw error;
  }
};

export default db;
