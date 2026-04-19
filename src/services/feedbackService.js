import { db } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const FEEDBACK_COLLECTION = 'feedback';

export const getFeedback = async (userId) => {
  if (!userId) return [];
  try {
    const docRef = doc(db, 'users', userId, 'data', FEEDBACK_COLLECTION);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().items || [];
    }
    return [];
  } catch (err) {
    console.error("Error fetching feedback:", err);
    return [];
  }
};

export const saveFeedback = async (userId, items) => {
  if (!userId) return;
  try {
    const docRef = doc(db, 'users', userId, 'data', FEEDBACK_COLLECTION);
    await setDoc(docRef, { items }, { merge: true });
  } catch (err) {
    console.error("Error saving feedback:", err);
  }
};
