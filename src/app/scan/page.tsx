'use client';
import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { db, storage } from '../../../lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Camera, CheckCircle, AlertCircle, Maximize } from 'lucide-react';

export default function SmartScanner() {
  const webcamRef = useRef<Webcam>(null);
  const [processed, setProcessed] = useState(false);
  const [hint, setHint] = useState("מרכז את התעודה למסגרת");

  // פונקציית הצילום האוטומטית כשהתמונה יציבה
  const capture = async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setProcessed(true);
      setHint("סורק נתונים עם ג'ימיני...");
      
      try {
        await addDoc(collection(db, 'driver_scans'), {
          driver: 'חכמת',
          image: imageSrc,
          timestamp: serverTimestamp(),
          status: 'AI_ANALYZING'
        });
        setHint("נשלח בהצלחה לגליה! ✅");
      } catch (e) {
        setHint("שגיאה בשליחה, נסה שוב");
        setProcessed(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 flex flex-col items-center" dir="rtl">
      <div className="mb-4 text-center">
        <h2 className="text-[#C9A227] font-black uppercase text-xs tracking-widest">Saban Smart Scan</h2>
        <p className="text-lg font-bold">{hint}</p>
      </div>

      <div className="relative w-full max-w-sm aspect-[3/4] overflow-hidden rounded-3xl border-4 border-gray-800">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={{ facingMode: "environment" }}
          className="w-full h-full object-cover"
        />
        
        {/* מסגרת הכוונה דיגיטלית */}
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className={`w-full h-full border-2 ${processed ? 'border-green-500 shadow-[0_0_20px_green]' : 'border-[#C9A227] opacity-50'} rounded-lg transition-all`}>
            {/* פינות המסגרת */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#C9A227]"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#C9A227]"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#C9A227]"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#C9A227]"></div>
          </div>
        </div>
      </div>

      <button 
        onClick={capture}
        disabled={processed}
        className="mt-8 w-20 h-20 bg-[#C9A227] rounded-full flex items-center justify-center text-black shadow-2xl active:scale-90 transition-transform"
      >
        <Camera size={32} />
      </button>
    </div>
  );
}
