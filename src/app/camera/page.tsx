'use client';
import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Camera, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SmartAutoScanner() {
  const webcamRef = useRef<Webcam>(null);
  const [img, setImg] = useState<string | null>(null);
  const [status, setStatus] = useState<'aligning' | 'locking' | 'captured'>('aligning');
  const [guide, setGuide] = useState("הכנס תעודה למסגרת");
  const [countdown, setCountdown] = useState<number | null>(null);

  // מנגנון צילום אוטומטי ללא מגע
  useEffect(() => {
    if (status === 'aligning') {
      const lockTimer = setTimeout(() => {
        setStatus('locking');
        setGuide("יציב! נועל על המסמך...");
        setCountdown(3);
      }, 4000); // אחרי 4 שניות של ייצוב מתחיל "נעילה"
      return () => clearTimeout(lockTimer);
    }
  }, [status]);

  // טיימר צילום
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      capture();
    }
  }, [countdown]);

  const capture = async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImg(imageSrc);
      setStatus('captured');
      setGuide("נשלח בהצלחה!");
      
      try {
        await addDoc(collection(db, 'driver_scans'), {
          driver: 'חכמת',
          image: imageSrc,
          timestamp: serverTimestamp(),
          status: 'AUTO_CAPTURED'
        });
      } catch (e) {
        setGuide("תקלה בשמירה");
      }
    }
  };

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden font-sans">
      {/* 1. מצלמה במסך מלא */}
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        videoConstraints={{ facingMode: "environment" }}
        className="absolute inset-0 h-full w-full object-cover z-0"
      />

      {/* 2. שכבת ההנחיות - ענקיות ובמרכז */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
        
        {/* הנחיות טקסט - שחור על זהב לניגודיות מקסימלית */}
        <div className="mb-12 bg-black/80 backdrop-blur-xl px-10 py-6 rounded-3xl border-2 border-[#C9A227] shadow-[0_0_50px_rgba(0,0,0,0.8)]">
          <p className={`text-3xl md:text-5xl font-black text-center uppercase tracking-tighter ${status === 'locking' ? 'text-green-400' : 'text-[#C9A227]'}`}>
            {guide}
          </p>
          {countdown !== null && countdown > 0 && (
            <div className="text-7xl font-black text-white text-center mt-4 animate-ping">
              {countdown}
            </div>
          )}
        </div>

        {/* 3. מסגרת סריקה אקטיבית */}
        <div className={`relative w-[85%] aspect-[3/4] max-w-sm border-8 rounded-[3rem] transition-all duration-700
          ${status === 'locking' ? 'border-green-500 shadow-[0_0_60px_rgba(34,197,94,0.8)]' : 'border-[#C9A227]/50 shadow-[0_0_30px_rgba(201,162,39,0.4)]'}`}>
          
          {/* אפקט לייזר סורק */}
          <div className="absolute inset-x-0 h-2 bg-gradient-to-r from-transparent via-[#C9A227] to-transparent shadow-[0_0_20px_#C9A227] animate-scan top-0"></div>

          {/* פינות "סורק" */}
          <div className="absolute -top-2 -left-2 w-16 h-16 border-t-[12px] border-l-[12px] border-[#C9A227] rounded-tl-3xl"></div>
          <div className="absolute -top-2 -right-2 w-16 h-16 border-t-[12px] border-r-[12px] border-[#C9A227] rounded-tr-3xl"></div>
          <div className="absolute -bottom-2 -left-2 w-16 h-16 border-b-[12px] border-l-[12px] border-[#C9A227] rounded-bl-3xl"></div>
          <div className="absolute -bottom-2 -right-2 w-16 h-16 border-b-[12px] border-r-[12px] border-[#C9A227] rounded-br-3xl"></div>
        </div>
      </div>

      {/* לוגו סבן בפינה - לביטחון המותג */}
      <div className="absolute bottom-6 right-8 z-20 bg-black/50 px-4 py-2 rounded-xl border border-white/10">
        <span className="text-2xl font-black italic tracking-tighter text-white/50">SABAN 94</span>
      </div>

      {/* כפתור איפוס (רק אם נשלח) */}
      {status === 'captured' && (
        <div className="absolute inset-0 z-30 bg-black/90 flex flex-col items-center justify-center p-6 text-center">
          <CheckCircle2 size={100} className="text-green-500 mb-6 animate-bounce" />
          <h2 className="text-4xl font-black mb-10">התעודה נסרקה בהצלחה!</h2>
          <button 
            onClick={() => { setStatus('aligning'); setCountdown(null); setGuide("הכנס תעודה למסגרת"); }}
            className="bg-[#C9A227] text-black px-12 py-6 rounded-3xl font-black text-2xl uppercase shadow-2xl active:scale-95"
          >
            לסריקה הבאה
          </button>
        </div>
      )}
    </div>
  );
}
