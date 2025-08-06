import { db } from '../services/firestoreService.js'; // Adjust path if needed

export const getVolunteerById = async (id) => {
  const docRef = db.collection('volunteers').doc(id);
  const docSnap = await docRef.get();
  return docSnap.exists ? docSnap.data() : null;
};

export const saveVolunteerAssessment = async (id, data) => {
  const docRef = db.collection('volunteers').doc(id);
  await docRef.update({
    ...data,
    assessmentCompleted: true,
    assessmentDate: new Date(),
  });
};
