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
import { getAnalytics, isSupported } from "firebase/analytics";

// ============================================================
// FIREBASE CONFIG — project: undanganpernikahan-6d3b5
// Uses the DEFAULT Firestore database (no custom database ID).
// ------------------------------------------------------------
// Config can be changed in 4 locations (kept in sync):
//   1. .env.local                         (Vite env vars — primary)
//   2. .env.example                       (template)
//   3. firebase-applet-config.json        (reference JSON)
//   4. src/lib/firebase.ts (this file)    (hardcoded fallbacks below)
// ============================================================
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDSuJKQI2-Ghf-6wXW4cOSo8Fyo-RsaF8o",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "undanganpernikahan-6d3b5.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "undanganpernikahan-6d3b5",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "undanganpernikahan-6d3b5.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "632942121838",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:632942121838:web:68364589819840cd6ee77f",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-SQF71JRCMK"
};

const app = initializeApp(firebaseConfig);

// ============================================================
// DEFAULT FIRESTORE DATABASE
// ------------------------------------------------------------
// The new project (undanganpernikahan-6d3b5) only has the default
// Firestore database — no custom database ID is used. This is the
// FIX for the cross-device sync bug: previously the app targeted a
// custom database that didn't exist on the new project, so admin
// edits never propagated to other browsers/devices. Now every
// browser reads/writes the same default database.
// ============================================================
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// ============================================================
// GOOGLE ANALYTICS (production only, lazy + safe)
// ------------------------------------------------------------
// Initialized only in production builds when the browser supports
// analytics. Not exported — purely for page-view tracking.
// ============================================================
if (import.meta.env.PROD) {
  isSupported()
    .then((ok) => {
      if (ok) {
        try {
          getAnalytics(app);
        } catch (e) {
          // Silent — analytics is best-effort.
        }
      }
    })
    .catch(() => {});
}

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
