import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD1Rq2wbCffsJPC5dasSj81gajCpfXPI28",
  authDomain: "todolactea-89544.firebaseapp.com",
  projectId: "todolactea-89544",
  storageBucket: "todolactea-89544.firebasestorage.app",
  messagingSenderId: "20681889466",
  appId: "1:20681889466:web:3dd55163652c928f329483"
};

// Initialize Firebase only if it hasn't been initialized already
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export { db };
