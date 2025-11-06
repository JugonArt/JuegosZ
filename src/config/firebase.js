// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyByqlgOeHp5HST3D-h1mn5bxdlJKIPmTqs",
  authDomain: "juegos-z.firebaseapp.com",
  projectId: "juegos-z",
  storageBucket: "juegos-z.firebasestorage.app",
  messagingSenderId: "637777986609",
  appId: "1:637777986609:web:fc77f9ac2bedf3710d0110",
  measurementId: "G-TFRQ1F00J5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firestore
const db = getFirestore(app);

// Enable offline persistence so the client can cache writes while offline
// and sync them when the network is available again. This uses an
// IndexedDB-backed cache managed by Firestore.
enableIndexedDbPersistence(db).catch((err) => {
  // Code references: failed-precondition (multiple tabs), unimplemented (browser doesn't support)
  if (err.code === 'failed-precondition') {
    console.warn('Firestore persistence failed: multiple tabs open. Persistence is only available in one tab at a time.', err);
  } else if (err.code === 'unimplemented') {
    console.warn('Firestore persistence is not available in this browser (possibly unsupported features).', err);
  } else {
    console.warn('Unknown error enabling Firestore persistence:', err);
  }
});

export { db };