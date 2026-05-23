import { initializeApp, getApps } from "firebase/app";
import { getFirestore, enableMultiTabIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCv_3pp1XOjEbsOFOrsyBMxOuqMgKCRt94",
  authDomain: "todolactea-46704.firebaseapp.com",
  projectId: "todolactea-46704",
  storageBucket: "todolactea-46704.firebasestorage.app",
  messagingSenderId: "431508924891",
  appId: "1:431508924891:web:d10cddf47046aba6ec1ffe"
};

// Initialize Firebase only if it hasn't been initialized already
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// Enable persistence for offline support
if (typeof window !== "undefined") {
  enableMultiTabIndexedDbPersistence(db).catch((err: any) => {
    if (err.code === 'failed-precondition') {
      console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.");
    } else if (err.code === 'unimplemented') {
      console.warn("The current browser does not support all of the features required to enable persistence.");
    }
  });
}

export { db };
