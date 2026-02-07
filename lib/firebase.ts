import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database"; // לצורך דף הדיווחים/מפה

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL // וודא שזה קיים ב-Vercel
};

// אתחול Singleton בטיחותי
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// הגדרת השירותים פעם אחת בלבד
const db = getFirestore(app);           // Firestore
const storage = getStorage(app);         // Storage לקבצים
const database = getDatabase(app);       // Realtime DB למפה ודיווחים

// ייצוא מסודר של כולם
export { app, db, storage, database };
