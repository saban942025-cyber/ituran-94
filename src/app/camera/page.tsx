'use client';
import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Camera, CheckCircle, AlertCircle, Maximize2, RefreshCw } from 'lucide-react';

export default function SmartCamera() {
  const webcamRef = useRef<Webcam>(null);
  const [img, setImg] = useState<string | null>(null);
  const [status, setStatus] = useState<'aligning' | 'processing' | 'done'>('aligning');
  const [hint, setHint] = useState("מרכז את התעודה למסגרת");

  // פונקציית צילום
  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImg(imageSrc);
      setStatus('processing');
      setHint("שולח לגליה בשידור חי...");
      saveToFirebase(imageSrc);
    }
  }, [webcamRef]);

  const saveToFirebase = async (imageData: string) => {
    try {
      await addDoc(collection(db, 'driver_scans'), {
        driver: 'חכמת',
        image: imageData,
        timestamp: serverTimestamp(),
        status: 'pending_review'
      });
      setStatus('done');
      setHint("נשלח בהצלחה! ✅");
    } catch (e) {
      setHint("שגיאה בשליחה, נסה שוב");
      setStatus('aligning');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center p-4" dir="rtl">
      {/* הוראות לחכמת */}
      <div className="mb-6 text-center mt-4">
        <div className="flex items-center justify-center gap-2 mb-2">
           <div className={`w-3 h-3 rounded-full ${status === 'aligning' ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
           <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Saban AI Cam</span>
        </div>
        <h2 className="text-xl font-bold">{hint}</h2>
      </div>

      {/* אזור המצלמה עם המסגרת */}
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
            {/* מסגרת הכוונה דיגיטלית */}
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <div className="w-full h-full border-2 border-[#C9A227] opacity-60 rounded-xl flex items-center justify-center relative">
                <Maximize2 size={40} className="text-[#C9A227] opacity-30" />
                {/* פינות מודגשות */}
                <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-[#C9A227] rounded-tl-lg"></div>
                <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-[#C9A227] rounded-tr-lg"></div>
                <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-[#C9A227] rounded-bl-lg"></div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-[#C9A227] rounded-br-lg"></div>
              </div>
            </div>
          </>
        ) : (
          <img src={img} className="w-full h-full object-cover" alt="captured" />
        )}
      </div>

      {/* כפתור הפעלה גדול ונוח */}
      <div className="mt-10 flex flex-col items-center gap-6 w-full">
        {status === 'aligning' && (
          <button 
            onClick={capture}
            className="w-24 h-24 bg-[#C9A227] rounded-full flex items-center justify-center text-black shadow-[0_0_30px_rgba(201,162,39,0.4)] active:scale-90 transition-all border-8 border-black/20"
          >
            <Camera size={40} />
          </button>
        )}

        {status === 'done' && (
          <button 
            onClick={() => { setImg(null); setStatus('aligning'); setHint("מרכז את התעודה למסגרת"); }}
            className="flex items-center gap-2 bg-green-600 px-8 py-4 rounded-2xl font-black uppercase text-sm"
          >
            <RefreshCw size={18} /> תעודה הבאה
          </button>
        )}
      </div>

      {/* מיתוג */}
      <div className="mt-auto pb-4 opacity-20">
        <span className="font-black italic tracking-tighter text-2xl">SABAN 94</span>
      </div>
    </div>
  );
}
