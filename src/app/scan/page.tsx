"use client";
export const dynamic = 'force-dynamic';

import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { db } from "../../../lib/firebase";
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
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
      /**
       * נשק יום הדין: אנחנו טוענים את ה-Storage רק כאן בפנים.
       * Vercel לא רואה את זה בזמן ה-Build, ולכן הוא לא יקרוס.
       */
      const { getStorage, ref, uploadString, getDownloadURL } = await import('firebase/storage');
      
      const storage = getStorage();
      const storageRef = ref(storage, `scans/img_${Date.now()}.jpg`);
      
      // העלאת התמונה
      await uploadString(storageRef, imgSrc, 'data_url');
      const downloadURL = await getDownloadURL(storageRef);

      // שמירה ב-Firestore (זה בסדר להשאיר בחוץ כי זה לא קורס ב-Build)
      const docRef = await addDoc(collection(db, "scans"), {
        imageUrl: downloadURL,
        timestamp: serverTimestamp(),
        status: 'pending'
      });
      
      setScannedData({ success: true, id: docRef.id });
      alert("הסריקה נשלחה בהצלחה!");
    } catch (e) {
      console.error("Build safe error: ", e);
      alert("שגיאה בחיבור לשרת. נסה שוב.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#F3F2F1] p-4 text-[#323130]">
      <div className="w-full max-w-md bg-white rounded-lg shadow-2xl overflow-hidden border border-[#EDEBE9]">
        <div className="p-4 border-b border-[#EDEBE9] bg-white flex justify-between items-center shadow-sm">
          <h1 className="text-lg font-bold flex items-center gap-2 text-[#0078D4]">
            <Camera size={22} />
            סורק חכם - סבן לוגיסטיקה
          </h1>
        </div>

        <div className="relative aspect-[3/4] bg-black">
          {!imgSrc ? (
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "environment" }}
              className="w-full h-full object-cover"
            />
          ) : (
            <img src={imgSrc} alt="Captured" className="w-full h-full object-cover" />
          )}

          {/* מסגרת עיצובית לסריקה */}
          <div className="absolute inset-0 border-[2px] border-dashed border-white/40 m-10 rounded-xl pointer-events-none flex items-center justify-center">
             {!imgSrc && <div className="bg-black/40 text-white text-[10px] px-2 py-1 rounded">הצב תעודה כאן</div>}
          </div>

          {loading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center z-50">
              <Loader2 className="animate-spin text-[#0078D4] mb-3" size={48} />
              <p className="text-sm font-bold text-[#323130]">מעבד נתונים ב-AI...</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-white flex justify-center gap-4 border-t border-[#EDEBE9]">
          {!imgSrc ? (
            <button
              onClick={capture}
              className="bg-[#0078D4] hover:bg-[#106EBE] text-white w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-95 border-4 border-[#F3F2F1]"
            >
              <Camera size={36} />
            </button>
          ) : (
            <div className="flex gap-4 w-full">
              <button
                onClick={() => setImgSrc(null)}
                className="flex-1 py-4 px-4 border-2 border-[#EDEBE9] rounded-xl flex items-center justify-center gap-2 hover:bg-[#F3F2F1] font-bold text-[#605E5C] transition-colors"
              >
                <RefreshCw size={20} />
                חדש
              </button>
              <button
                onClick={processImage}
                className="flex-1 py-4 px-4 bg-[#107C10] hover:bg-[#0B5A0B] text-white rounded-xl flex items-center justify-center gap-2 shadow-lg font-bold transition-all active:scale-95"
              >
                <Check size={20} />
                אשר ושלח
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-6 flex items-center gap-2 text-[#605E5C] opacity-70">
         <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
         <span className="text-[10px] uppercase tracking-widest font-bold">Saban Logistics AI Active</span>
      </div>
    </div>
  );
}
