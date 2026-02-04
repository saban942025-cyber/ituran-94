'use client';
import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Camera, RefreshCw, Maximize2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SmartCamera() {
  const webcamRef = useRef<Webcam>(null);
  const [img, setImg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'aligning' | 'captured' | 'sent'>('aligning');
  const [hint, setHint] = useState("מזהה תעודה... החזק יציב");

  // אפקט להנחיות משתנות (מדמה זיהוי פינות)
  useEffect(() => {
    if (status === 'aligning') {
      const hints = [
        "מרכז את התעודה למסגרת",
        "התקרב מעט...",
        "יציב... עוד רגע...",
        "מחפש פינות מסמך..."
      ];
      let i = 0;
      const interval = setInterval(() => {
        setHint(hints[i % hints.length]);
        i++;
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [status]);

  const capture = useCallback(async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImg(imageSrc);
      setStatus('captured');
      setHint("תעודה נתפסה! שולח לבדיקה...");
      setLoading(true);
      
      try {
        await addDoc(collection(db, 'driver_scans'), {
          driver: 'חכמת',
          image: imageSrc,
          timestamp: serverTimestamp(),
          status: 'pending'
        });
        setStatus('sent');
        setHint("נשלח בהצלחה לגליה! ✅");
      } catch (e) {
        setHint("שגיאה בשליחה. נסה שוב.");
        setStatus('aligning');
      }
      setLoading(false);
    }
  }, [webcamRef]);

  return (
    <div className="min-h-screen bg-[#0b141a] text-white flex flex-col items-center p-6" dir="rtl">
      {/* Status Bar */}
      <div className="w-full max-w-sm mb-6 flex items-center justify-between bg-[#1c272d] p-3 rounded-2xl border border-gray-800">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${status === 'aligning' ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Saban AI Live</span>
        </div>
        <span className="text-xs font-bold text-[#C9A227]">{hint}</span>
      </div>

      {/* Camera Viewport */}
      <div className="relative w-full max-w-sm aspect-[3/4] rounded-[2.5rem] overflow-hidden border-4 border-[#202c33] shadow-2xl bg-black">
        {!img ? (
          <>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "environment" }}
              className="w-full h-full object-cover opacity-80"
            />
            {/* מסגרת "תפיסת פינות" אקטיבית */}
            <div className="absolute inset-0 flex items-center justify-center p-10">
              <div className="w-full h-full border-2 border-[#C9A227]/30 rounded-xl relative overflow-hidden">
                {/* קו סריקה לייזר (מ globals.css) */}
                <div className="scanner-line"></div>
                
                {/* פינות "תופסות" */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#C9A227] shadow-[0_0_15px_rgba(201,162,39,0.5)]"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#C9A227]"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#C9A227]"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#C9A227]"></div>
              </div>
            </div>
          </>
        ) : (
          <div className="relative h-full w-full">
            <img src={img} className="w-full h-full object-cover" alt="captured" />
            {status === 'sent' && (
               <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                  <CheckCircle2 size={60} className="text-green-500 mb-2" />
                  <span className="font-black">התעודה בארכיון</span>
               </div>
            )}
          </div>
        )}
      </div>

      {/* Control Button */}
      <div className="mt-10">
        {status === 'aligning' ? (
          <button 
            onClick={capture}
            className="w-24 h-24 bg-[#C9A227] rounded-full flex items-center justify-center text-black shadow-[0_0_30px_rgba(201,162,39,0.3)] active:scale-90 transition-all border-8 border-black/20"
          >
            <Camera size={36} />
          </button>
        ) : (
          <button 
            onClick={() => {setImg(null); setStatus('aligning');}}
            className="flex items-center gap-3 bg-[#202c33] px-8 py-4 rounded-2xl border border-gray-700 font-bold text-sm"
          >
            <RefreshCw size={18} /> סרוק תעודה נוספת
          </button>
        )}
      </div>
    </div>
  );
}
