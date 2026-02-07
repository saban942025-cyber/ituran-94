'use client'

// הגדרה קריטית למניעת רינדור סטטי ב-Vercel
export const dynamic = 'force-dynamic';

import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { db } from "../../../lib/firebase";
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
// אנחנו מייבאים את getStorage רק כסוג (Type) כדי לא להקריס את ה-Build
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { 
  Camera, 
  RefreshCw, 
  Check, 
  X, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Maximize 
} from 'lucide-react';

export default function SmartScanner() {
  const webcamRef = useRef<Webcam>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImgSrc(imageSrc);
    }
  }, [webcamRef]);

  const processImage = async () => {
    if (!imgSrc) return;
    setLoading(true);
    
    try {
      // כאן הקסם: אנחנו מאתחלים את ה-Storage רק כשלוחצים על הכפתור (בזמן ריצה בדפדפן)
      // זה מונע מה-Build של Vercel להתרסק
      const storage = getStorage();
      const storageRef = ref(storage, `scans/${Date.now()}.jpg`);
      
      // העלאת התמונה
      await uploadString(storageRef, imgSrc, 'data_url');
      const downloadURL = await getDownloadURL(storageRef);

      // שמירה ב-Firestore
      const docRef = await addDoc(collection(db, "scans"), {
        imageUrl: downloadURL,
        timestamp: serverTimestamp(),
        status: 'pending'
      });
      
      setScannedData({ success: true, id: docRef.id });
    } catch (e) {
      console.error("Error processing image: ", e);
      alert("שגיאה בעיבוד התמונה. נסה שוב.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#F3F2F1] p-4 text-[#323130]">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden border border-[#EDEBE9]">
        <div className="p-4 border-b border-[#EDEBE9] bg-white flex justify-between items-center">
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Camera size={20} className="text-[#0078D4]" />
            סורק חכם - סבן לוגיסטיקה
          </h1>
        </div>

        <div className="relative aspect-[3/4] bg-black flex items-center justify-center">
          {!imgSrc ? (
            <>
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: "environment" }}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 border-2 border-dashed border-white/30 m-8 rounded-xl pointer-events-none" />
            </>
          ) : (
            <img src={imgSrc} alt="Captured" className="w-full h-full object-cover" />
          )}

          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center z-20">
              <Loader2 className="animate-spin text-[#0078D4] mb-2" size={40} />
              <p className="text-sm font-bold">מנתח נתונים ב-AI...</p>
            </div>
          )}
        </div>

        <div className="p-6 flex justify-center gap-4 bg-white">
          {!imgSrc ? (
            <button
              onClick={capture}
              className="bg-[#0078D4] hover:bg-[#106EBE] text-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90"
            >
              <Camera size={32} />
            </button>
          ) : (
            <div className="flex gap-4 w-full">
              <button
                onClick={() => setImgSrc(null)}
                className="flex-1 py-3 px-4 border border-[#EDEBE9] rounded-md flex items-center justify-center gap-2 hover:bg-[#F3F2F1] font-medium"
              >
                <RefreshCw size={18} />
                מחדש
              </button>
              <button
                onClick={processImage}
                className="flex-1 py-3 px-4 bg-[#107C10] hover:bg-[#0B5A0B] text-white rounded-md flex items-center justify-center gap-2 font-medium"
              >
                <Check size={18} />
                אשר ושלח
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
