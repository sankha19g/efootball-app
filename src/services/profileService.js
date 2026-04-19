import { db } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export const getProfile = async (userId) => {
  if (!userId) return null;
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().profile || null;
    }
    return null;
  } catch (err) {
    console.error("Error fetching profile:", err);
    return null;
  }
};

export const saveProfile = async (userId, profile) => {
  if (!userId) return;
  try {
    const docRef = doc(db, 'users', userId);
    await setDoc(docRef, { profile }, { merge: true });
  } catch (err) {
    console.error("Error saving profile:", err);
    throw err;
  }
};
