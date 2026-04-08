import { auth } from '../config/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';

export const login = (email, password) => {
  if (!auth) throw new Error("Firebase Auth NOT Initialized - please fix your .env file!");
  return signInWithEmailAndPassword(auth, email, password);
};

export const register = (email, password) => {
  if (!auth) throw new Error("Firebase Auth NOT Initialized - please fix your .env file!");
  return createUserWithEmailAndPassword(auth, email, password);
};

export const logout = () => {
  if (!auth) return;
  return signOut(auth);
};

export const subscribeToAuthChanges = (callback) => {
  if (!auth) {
    console.warn("Auth subscription called but no auth instance exists.");
    callback(null); // Just say no user
    return () => {}; // return empty un-sub function
  }
  return onAuthStateChanged(auth, callback);
};
