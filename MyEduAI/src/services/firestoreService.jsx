import { doc, setDoc } from "firebase/firestore"; // 💡 Changed from updateDoc to setDoc
import { db } from "../firebase";

export const saveAssessmentResults = async (uid, results) => {
  if (!uid) {
    console.error("❌ Cannot save results without a user UID.");
    return;
  }
  try {
    const userRef = doc(db, "learners", uid);

    // 💡 Use setDoc with { merge: true }
    // This will create the document if it doesn't exist,
    // or update the fields if it does, without overwriting other data.
    await setDoc(userRef, {
      assessmentResults: {
        ...results,
        completedAt: new Date().toISOString()
      },
      assessmentCompleted: true
    }, { merge: true }); // 💡 The magic is here!

    console.log("✅ Assessment results saved successfully for user:", uid);
  } catch (error) {
    console.error("❌ Error saving assessment results:", error);
    // It's good to re-throw the error so the calling function knows something went wrong
    throw error;
  }
};