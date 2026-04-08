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
  arrayUnion,
  setDoc,
  getDoc,
  where,
  limit as firestoreLimit,
  startAfter,
} from 'firebase/firestore';

const PLAYERS_COLLECTION = 'players';
const GLOBAL_DB_COLLECTION = 'global_database';
const IMGBB_API_KEY = process.env.EXPO_PUBLIC_IMGBB_API_KEY;
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001';

console.log('📡 Engine initialized with API_URL:', API_URL);

export const getPlayers = async (userId) => {
  if (!userId) return [];
  try {
    const q = query(
      collection(db, `users/${userId}/${PLAYERS_COLLECTION}`)
    );
    const querySnapshot = await getDocs(q);
    const players = querySnapshot.docs.map((doc) => ({
      _id: doc.id,
      ...doc.data(),
    }));
    
    // Sort locally to ensure legacy players (missing createdAt) are included
    return players.sort((a, b) => {
      const dateA = a.createdAt || a.created_at || 0;
      const dateB = b.createdAt || b.created_at || 0;
      return dateB.toString().localeCompare(dateA.toString());
    });
  } catch (err) {
    console.error("Error fetching players:", err);
    return [];
  }
};

export const addPlayer = async (userId, player) => {
  if (!userId) throw new Error('User not authenticated');
  const cleanPlayer = JSON.parse(JSON.stringify(player));
  const createdAt = new Date().toISOString();
  const docRef = await addDoc(
    collection(db, `users/${userId}/${PLAYERS_COLLECTION}`),
    { ...cleanPlayer, createdAt }
  );
  return { _id: docRef.id, ...cleanPlayer, createdAt };
};

export const addPlayersBulk = async (userId, playersList) => {
  if (!userId) throw new Error('User not authenticated');
  const promises = playersList.map(async (player) => {
    const cleanPlayer = JSON.parse(JSON.stringify(player));
    const createdAt = new Date().toISOString();
    const docRef = await addDoc(
      collection(db, `users/${userId}/${PLAYERS_COLLECTION}`),
      { ...cleanPlayer, createdAt }
    );
    return { _id: docRef.id, ...cleanPlayer, createdAt };
  });
  return await Promise.all(promises);
};

export const updatePlayer = async (userId, playerId, updates) => {
  if (!userId) throw new Error('User not authenticated');
  const playerRef = doc(
    db,
    `users/${userId}/${PLAYERS_COLLECTION}`,
    playerId
  );
  await updateDoc(playerRef, updates);
  return { _id: playerId, ...updates };
};

export const updatePlayersBulk = async (userId, playerIds, updates) => {
  if (!userId) throw new Error('User not authenticated');
  const finalUpdates = { ...updates };
  if (updates.tags && Array.isArray(updates.tags)) {
    finalUpdates.tags = arrayUnion(...updates.tags);
  }
  const promises = playerIds.map(async (id) => {
    const playerRef = doc(
      db,
      `users/${userId}/${PLAYERS_COLLECTION}`,
      id
    );
    await updateDoc(playerRef, finalUpdates);
  });
  await Promise.all(promises);
};

export const deletePlayer = async (userId, playerId) => {
  if (!userId) throw new Error('User not authenticated');
  const playerRef = doc(
    db,
    `users/${userId}/${PLAYERS_COLLECTION}`,
    playerId
  );
  await deleteDoc(playerRef);
};

export const uploadBase64Image = async (userId, base64String) => {
  if (!userId) throw new Error('User not authenticated');
  if (!IMGBB_API_KEY) throw new Error('ImgBB API Key is missing!');

  try {
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
    const formData = new FormData();
    formData.append('image', base64Data);

    const response = await fetch(
      `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
      { method: 'POST', body: formData }
    );
    const data = await response.json();

    if (data.success) {
      return data.data.url;
    } else {
      throw new Error(data.error?.message || 'ImgBB Upload Failed');
    }
  } catch (err) {
    console.error('Error uploading to ImgBB:', err);
    throw err;
  }
};

export const searchGlobalFirestore = async (nameQuery, startAfterDoc = null) => {
  if (!nameQuery || nameQuery.length < 2) return { players: [], lastDoc: null };

  try {
    const queryText = nameQuery.toLowerCase();

    // 1. Direct ID Lookup (Strongest match for manual/specific players)
    if (/^\d{5,}/.test(nameQuery)) {
        const docRef = doc(db, GLOBAL_DB_COLLECTION, nameQuery);
        const d = await getDoc(docRef);
        if (d.exists()) {
            return { players: [{ id: d.id, ...d.data() }], lastDoc: null };
        }
    }

    // 2. Optimized Search by 'search_name'
    let q = query(
      collection(db, GLOBAL_DB_COLLECTION),
      where('search_name', '>=', queryText),
      where('search_name', '<=', queryText + '\uf8ff'),
      firestoreLimit(20)
    );

    if (startAfterDoc) {
      q = query(q, startAfter(startAfterDoc));
    }

    const snapshot = await getDocs(q);
    let players = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    let lastDoc = snapshot.docs[snapshot.docs.length - 1];

    // 3. Fallback to 'name' field if search_name search yielded nothing (for legacy/manual docs)
    if (players.length === 0 && !startAfterDoc) {
        const qFallback = query(
            collection(db, GLOBAL_DB_COLLECTION),
            where('name', '>=', nameQuery),
            where('name', '<=', nameQuery + '\uf8ff'),
            firestoreLimit(20)
        );
        const snapFallback = await getDocs(qFallback);
        players = snapFallback.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        lastDoc = snapFallback.docs[snapFallback.docs.length - 1];
    }

    return { players, lastDoc };
  } catch (err) {
    console.error("Global Firestore search error:", err);
    return { players: [], lastDoc: null };
  }
};

export const getRecentGlobalPlayers = async (limitNum = 20, startAfterDoc = null) => {
  try {
    let q = query(
      collection(db, GLOBAL_DB_COLLECTION),
      orderBy('lastUpdated', 'desc'),
      firestoreLimit(limitNum)
    );

    if (startAfterDoc) {
      q = query(q, startAfter(startAfterDoc));
    }

    const snapshot = await getDocs(q);
    const lastDoc = snapshot.docs[snapshot.docs.length - 1];
    const players = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return { players, lastDoc };
  } catch (err) {
    console.error("Error fetching recent global players:", err);
    // If there's an index error, fallback to no ordering temporarily
    if (err.message?.includes('index')) {
        let fallbackQuery = query(
            collection(db, GLOBAL_DB_COLLECTION),
            firestoreLimit(limitNum)
        );
        if (startAfterDoc) fallbackQuery = query(fallbackQuery, startAfter(startAfterDoc));
        const fallbackSnapshot = await getDocs(fallbackQuery);
        return { 
            players: fallbackSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })), 
            lastDoc: fallbackSnapshot.docs[fallbackSnapshot.docs.length - 1] 
        };
    }
    return { players: [], lastDoc: null };
  }
};

export const lookupPlaystyles = async (players) => {
  try {
      const url = `${API_URL}/api/maintenance/lookup-playstyles`;
      console.log('📡 Fetching playstyles from:', url);
      const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ players })
      });
      if (!response.ok) {
          console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`);
          throw new Error('Failed to lookup playstyles');
      }
      return await response.json();
  } catch (err) {
      console.error('❌ Network lookup error:', err);
      // Detailed error for fetch failed
      if (err instanceof TypeError && err.message === 'Network request failed') {
          console.warn('💡 Device cannot reach server. Check Wi-Fi and IP address in .env');
      }
      return [];
  }
};

export const updatePlayerPlaystyle = async (userId, playerId, playstyle) => {
  if (!userId || !playerId) return;
  const playerRef = doc(db, `users/${userId}/${PLAYERS_COLLECTION}`, playerId);
  await updateDoc(playerRef, { playstyle });
};
