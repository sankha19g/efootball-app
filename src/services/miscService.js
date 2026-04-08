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
      collection(db, `users/${userId}/apps`)
    );
    const snap = await getDocs(q);
    const apps = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    // Sort manually to handle missing sortOrder gracefully
    return apps.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  } catch (e) {
    return [];
  }
};

export const addApp = async (userId, appData) => {
  if (!userId) throw new Error('User not authenticated');
  const apps = await getApps(userId);
  const nextOrder = apps.length > 0 ? Math.max(...apps.map(a => a.sortOrder || 0)) + 1 : 0;
  
  const docRef = await addDoc(collection(db, `users/${userId}/apps`), {
    ...appData,
    sortOrder: nextOrder,
    createdAt: new Date().toISOString(),
  });
  return { id: docRef.id, ...appData, sortOrder: nextOrder };
};

export const deleteApp = async (userId, appId) => {
  if (!userId) throw new Error('User not authenticated');
  await deleteDoc(doc(db, `users/${userId}/apps`, appId));
};

export const updateLink = async (userId, linkId, updates) => {
  if (!userId) throw new Error('User not authenticated');
  const linkRef = doc(db, `users/${userId}/links`, linkId);
  await updateDoc(linkRef, updates);
};

export const updateApp = async (userId, appId, updates) => {
  if (!userId) throw new Error('User not authenticated');
  const appRef = doc(db, `users/${userId}/apps`, appId);
  await updateDoc(appRef, updates);
};

export const saveAppsOrder = async (userId, apps) => {
  if (!userId) throw new Error('User not authenticated');
  const batch = [];
  for (let i = 0; i < apps.length; i++) {
    const appRef = doc(db, `users/${userId}/apps`, apps[i].id);
    batch.push(updateDoc(appRef, { sortOrder: i }));
  }
  await Promise.all(batch);
};
