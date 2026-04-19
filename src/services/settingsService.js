import { db } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const SETTINGS_DOC = 'settings';

export const getSettings = async (userId) => {
  if (!userId) return null;
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().settings) {
      return docSnap.data().settings;
    }
    return null;
  } catch (err) {
    console.error("Error fetching settings:", err);
    return null;
  }
};

export const saveSettings = async (userId, settings) => {
  if (!userId) return;
  try {
    const docRef = doc(db, 'users', userId);
    // Use setDoc with merge: true to avoid overwriting other user data if any
    await setDoc(docRef, { settings }, { merge: true });
  } catch (err) {
    console.error("Error saving settings:", err);
  }
};
