import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAXb3Of5uay1-hR9Z7WGyNwzSuUaqa4OvU",
  authDomain: "ituran-9722e.firebaseapp.com",
  databaseURL: "https://ituran-9722e-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ituran-9722e",
  storageBucket: "ituran-9722e.firebasestorage.app",
  messagingSenderId: "18206679990",
  appId: "1:18206679990:web:dc47046a30428152101717"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getDatabase(app);
