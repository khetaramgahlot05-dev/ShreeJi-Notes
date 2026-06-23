import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-storage.js';

const firebaseConfig = {
  apiKey: "AIzaSyAmHZqQwcFJEoSTLUww-zjsT42-8F19qCU",
  authDomain: "shreejinotes.firebaseapp.com",
  projectId: "shreejinotes",
  storageBucket: "shreejinotes.firebasestorage.app",
  messagingSenderId: "324031808978",
  appId: "1:324031808978:web:3dccc6865566747b06f40b"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;
