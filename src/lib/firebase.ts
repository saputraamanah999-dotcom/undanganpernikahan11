/// <reference types="vite/client" />

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  onSnapshot,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  where,
  arrayUnion,
  arrayRemove,
  FieldValue,
  serverTimestamp
} from "firebase/firestore";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User
} from "firebase/auth";

// Default config from firebase-applet-config.json
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDaxcEoKDFH4SgHvxETewWf-GQ0A_sWpOA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "probable-flow-3dpgw.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "probable-flow-3dpgw",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "probable-flow-3dpgw.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "61685513803",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:61685513803:web:c45cf9dbb5df01fbcad7ce"
};

const app = initializeApp(firebaseConfig);

// Use custom firestoreDatabaseId if provided, otherwise default to "ai-studio-dualweddinginvit-01db0593-594d-4f80-b701-a30510ff265a"
const firestoreDbId = import.meta.env.VITE_FIREBASE_DATABASE_ID || "ai-studio-dualweddinginvit-01db0593-594d-4f80-b701-a30510ff265a";
const db = getFirestore(app, firestoreDbId);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export {
  app,
  db,
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  collection,
  doc,
  onSnapshot,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  where,
  arrayUnion,
  arrayRemove,
  serverTimestamp
};
export type { User };
