import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database"; // 1. ייבוא השירות

const firebaseConfig = {
  apiKey: "AIzaSyBGYsZylsIyeWudp8_SlnLBelkgoNXjU60",
  authDomain: "app-saban94-57361.firebaseapp.com",
  databaseURL: "https://app-saban94-57361-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "app-saban94-57361",
  storageBucket: "app-saban94-57361.firebasestorage.app",
  messagingSenderId: "275366913167",
  appId: "1:275366913167:web:f0c6f808e12f2aeb58fcfa",
  measurementId: "G-E297QYKZKQ"
};

// אתחול Singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// ייצוא השירותים
const db = getFirestore(app); // Firestore הרגיל
const database = getDatabase(app); // ה-Realtime שדף הדיווחים צריך

export { db, database }; // 2. הייצוא הקריטי שחסר לך
