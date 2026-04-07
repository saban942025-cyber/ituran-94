"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
// הסר את הייבוא הישיר של db ושל ה-firestore functions מכאן
import { 
  Camera, 
  RefreshCw, 
  Check, 
  Loader2 
} from 'lucide-react';

export default function SmartScanner() {
  const webcamRef = useRef<Webcam>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) setImgSrc(imageSrc);
  }, [webcamRef]);

  const processImage = async () => {
    if (!imgSrc) return;
    setLoading(true);
    
    try {
      // טעינה דינמית רק בזמן לחיצה (צד לקוח בלבד)
      const { db } = await import("../../../lib/firebase");
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      const { getStorage, ref, uploadString, getDownloadURL } = await import('firebase/storage');
      
      const storage = getStorage();
      const storageRef = ref(storage, `scans/img_${Date.now()}.jpg`);
      
      await uploadString(storageRef, imgSrc, 'data_url');
      const downloadURL = await getDownloadURL(storageRef);

      await addDoc(collection(db, "scans"), {
        imageUrl: downloadURL,
        timestamp: serverTimestamp(),
        status: 'pending'
      });
      
      alert("הסריקה נשלחה בהצלחה!");
    } catch (e) {
      alert("שגיאה בחיבור לשרת.");
    } finally {
      setLoading(false);
    }
  };

  // ... שאר ה-JSX של ה-Return נשאר ללא שינוי
  return (
      // JSX הקיים שלך
  );
}
