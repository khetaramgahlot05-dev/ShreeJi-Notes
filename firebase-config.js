// ==========================================================================
// ShreeJi Notes — Firebase Configuration & Initialization
// This file is shared (imported) by every page. Edit ONLY the config
// values below if you ever recreate the Firebase project.
// ==========================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getFirestore,
  collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, serverTimestamp, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import {
  getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAmHZqQwcFJEoSTLUww-zjsT42-8F19qCU",
  authDomain: "shreejinotes.firebaseapp.com",
  projectId: "shreejinotes",
  storageBucket: "shreejinotes.firebasestorage.app",
  messagingSenderId: "324031808978",
  appId: "1:324031808978:web:3dccc6865566747b06f40b",
  measurementId: "G-PXS21FT9TY"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Re-export everything other pages need, so every page only imports
// from this ONE file instead of repeating long gstatic URLs everywhere.
export {
  app, db, auth,
  collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, serverTimestamp, onSnapshot,
  signInWithEmailAndPassword, onAuthStateChanged, signOut
};
