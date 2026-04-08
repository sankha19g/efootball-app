import { initializeApp, getApps } from 'firebase/app';
import { 
  initializeAuth, 
  getAuth, 
  getReactNativePersistence 
} from 'firebase/auth'; 
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDpvjE8VgKVHH_OaPcgj6shiBomJm-oSnc",
  authDomain: "efootball-8c9c5.firebaseapp.com",
  projectId: "efootball-8c9c5",
  storageBucket: "efootball-8c9c5.firebasestorage.app",
  messagingSenderId: "218547227716",
  appId: "1:218547227716:web:a80b27553493e8d8af0011",
};

// Safe singleton check
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Secure React Native Persistence for Auth
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (e) {
  // Handle if already initialized (hot reload)
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
export const storage = getStorage(app);
