'use client';
import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
// שימוש בשמות ייחודיים כדי למנוע כפילויות (CameraIcon במקום Camera)
import { Camera as CameraIcon, RefreshCw, Maximize2, CheckCircle2 } from 'lucide-react';

export default function CameraPage() {
  const webcamRef = useRef<Webcam>(null);
  const [img, setImg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const capture = useCallback(async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImg(imageSrc);
      setLoading(true);
      try {
        // שליחה ל-Firestore
        await addDoc(collection(db, 'driver_scans'), {
          driver: 'חכמת',
          image: imageSrc,
          timestamp: serverTimestamp(),
          status: 'pending'
        });
        setSent(true);
      } catch (e) {
        alert("שגיאה בשליחה - בדוק חיבור אינטרנט");
        setImg(null);
      }
      setLoading(false);
    }
  }, [webcamRef]);

  return (
    <div className="min-h-screen bg-[#0b141a] text-white flex flex-col items-center p-6" dir="rtl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-[#C9A227] font-black text-xl uppercase tracking-tighter">Saban AI Scanner</h1>
        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.3em]">Hakmat Edition</p>
      </div>

      {/* Camera Window */}
      <div className="relative w-full max-w-sm aspect-[3/4] rounded-[2.5rem] overflow-hidden border-4 border-[#202c33] shadow-2xl">
        {!img ? (
          <>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "environment" }}
              className="w-full h-full object-cover"
            />
            {/* מסגרת הכוונה חכמה */}
            <div className="absolute inset-0 flex items-center justify-center p-12">
              <div className="w-full h-full border-2 border-[#C9A227]/40 rounded-xl relative">
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-[#C9A227]"></div>
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-[#C9A227]"></div>
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-[#C9A227]"></div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-[#C9A227]"></div>
              </div>
            </div>
          </>
        ) : (
          <img src={img} className="w-full h-full object-cover" alt="captured" />
        )}
      </div>

      {/* Controls */}
      <div className="mt-12 w-full max-w-xs">
        {!img ? (
          <button 
            onClick={capture}
            className="w-24 h-24 bg-[#C9A227] rounded-full mx-auto flex items-center justify-center text-black shadow-2xl active:scale-95 transition-all border-8 border-black/20"
          >
            <CameraIcon size={36} />
          </button>
        ) : (
          <div className="flex flex-col gap-4">
            {sent ? (
              <div className="bg-green-600 p-5 rounded-2xl flex items-center justify-center gap-3 animate-bounce">
                <CheckCircle2 size={24} />
                <span className="font-black uppercase text-xs">נשלח לגליה!</span>
              </div>
            ) : (
              <div className="text-center font-bold text-[#C9A227] animate-pulse">מעבד נתונים...</div>
            )}
            <button 
              onClick={() => {setImg(null); setSent(false);}}
              className="flex items-center justify-center gap-2 text-gray-400 font-bold uppercase text-[10px] tracking-widest"
            >
              <RefreshCw size={14} /> צילום תעודה נוספת
            </button>
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <div className="mt-auto pb-4 opacity-10">
        <div className="text-3xl font-black italic tracking-tighter">SABAN 94</div>
      </div>
    </div>
  );
}
