'use client';
import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Camera, RefreshCw, Maximize2 } from 'lucide-react';

export default function CameraPage() {
  const webcamRef = useRef<Webcam>(null);
  const [img, setImg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const capture = useCallback(async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImg(imageSrc);
      setLoading(true);
      try {
        await addDoc(collection(db, 'driver_scans'), {
          driver: 'חכמת',
          image: imageSrc,
          timestamp: serverTimestamp(),
          status: 'pending'
        });
        alert("התעודה נשלחה בהצלחה לגליה!");
      } catch (e) {
        alert("שגיאה בשליחה");
      }
      setLoading(false);
    }
  }, [webcamRef]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center p-4" dir="rtl">
      <h1 className="text-[#C9A227] font-black my-4">מצלמה חכמה - ח. סבן</h1>
      
      <div className="relative w-full max-w-sm aspect-[3/4] rounded-3xl overflow-hidden border-2 border-[#C9A227]">
        {!img ? (
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: "environment" }}
            className="w-full h-full object-cover"
          />
        ) : (
          <img src={img} className="w-full h-full object-cover" alt="captured" />
        )}
        
        <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
            <div className="w-full h-full border-2 border-[#C9A227] rounded-lg"></div>
        </div>
      </div>

      <div className="mt-8">
        {!img ? (
          <button onClick={capture} className="bg-[#C9A227] text-black p-6 rounded-full shadow-xl active:scale-90">
            <Camera size={32} />
          </button>
        ) : (
          <button onClick={() => setImg(null)} className="bg-blue-600 p-4 rounded-xl flex items-center gap-2">
            <RefreshCw size={20} /> צילום מחדש
          </button>
        )}
      </div>
    </div>
  );
}
