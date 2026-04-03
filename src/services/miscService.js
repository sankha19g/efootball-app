import { db } from '../config/firebase';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore';

export const getLinks = async (userId) => {
  if (!userId) return [];
  const q = query(
    collection(db, `users/${userId}/links`),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const addLink = async (userId, linkData) => {
  if (!userId) throw new Error('User not authenticated');
  const docRef = await addDoc(collection(db, `users/${userId}/links`), {
    ...linkData,
    createdAt: new Date().toISOString(),
  });
  return { id: docRef.id, ...linkData };
};

export const deleteLink = async (userId, linkId) => {
  if (!userId) throw new Error('User not authenticated');
  await deleteDoc(doc(db, `users/${userId}/links`, linkId));
};

export const getApps = async (userId) => {
  if (!userId) return [];
  try {
    const q = query(
      collection(db, `users/${userId}/apps`),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    return [];
  }
};

export const addApp = async (userId, appData) => {
  if (!userId) throw new Error('User not authenticated');
  const docRef = await addDoc(collection(db, `users/${userId}/apps`), {
    ...appData,
    createdAt: new Date().toISOString(),
  });
  return { id: docRef.id, ...appData };
};

export const deleteApp = async (userId, appId) => {
  if (!userId) throw new Error('User not authenticated');
  await deleteDoc(doc(db, `users/${userId}/apps`, appId));
};
