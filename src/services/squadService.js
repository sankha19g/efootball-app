import { db } from '../config/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';

const SQUADS_COLLECTION = 'squads';

export const getSquads = async (userId) => {
  if (!userId) return [];
  try {
    const q = query(
      collection(db, `users/${userId}/${SQUADS_COLLECTION}`),
      orderBy('updatedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id, // ID must come AFTER data spread to prevent being overwritten by null/undefined in doc data
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    });
  } catch (err) {
    console.error('Error fetching squads:', err);
    return [];
  }
};

export const saveSquad = async (userId, squad) => {
  if (!userId) throw new Error('User not authenticated');
  const squadData = { ...squad, updatedAt: serverTimestamp() };

  if (squad.id) {
    const { id, ...data } = squadData;
    const docRef = doc(
      db,
      `users/${userId}/${SQUADS_COLLECTION}`,
      id
    );
    await updateDoc(docRef, data);
    return { id, ...data };
  } else {
    const { id, ...data } = squadData;
    data.createdAt = serverTimestamp();
    const docRef = await addDoc(
      collection(db, `users/${userId}/${SQUADS_COLLECTION}`),
      data
    );
    return { id: docRef.id, ...data };
  }
};

export const deleteSquad = async (userId, squadId) => {
  if (!userId) throw new Error('User not authenticated');
  const docRef = doc(
    db,
    `users/${userId}/${SQUADS_COLLECTION}`,
    squadId
  );
  await deleteDoc(docRef);
};
