'use client';
import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { CheckCircle2, Scan } from 'lucide-react';

export default function SabanLaserScanner() {
  const webcamRef = useRef<Webcam>(null);
  const [status, setStatus] = useState<'searching' | 'locked' | 'success'>('searching');
  const [countdown, setCountdown] = useState<number | null>(null);

  // מנגנון זיהוי "דמה" מתקדם - מדמה נעילה על מסמך לאחר 3 שניות של יציבות
  useEffect(() => {
    if (status === 'searching') {
      const timer = setTimeout(() => {
        setStatus('locked');
        setCountdown(3);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [status]);

  // ספירה לאחור לצילום ללא מגע
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      autoCapture();
    }
  }, [countdown]);

  const autoCapture = async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setStatus('success');
      try {
        await addDoc(collection(db, 'driver_scans'), {
          driver: 'חכמת',
          image: imageSrc,
          timestamp: serverTimestamp(),
          mode: 'AUTO_LASER_SCAN'
        });
      } catch (e) { console.error(e); }
    }
  };

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden">
      {/* המצלמה תופסת את כל המסך */}
      <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" videoConstraints={{ facingMode: "environment" }} className="absolute inset-0 h-full w-full object-cover" />

      {/* שכבת הנחיות ענקית במרכז */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
        
        {/* הנחיה קולנית במרכז המסך */}
        <div className="mb-10 bg-black/70 backdrop-blur-md px-12 py-8 rounded-[2.5rem] border-4 border-[#C9A227] shadow-[0_0_50px_rgba(0,0,0,0.9)] text-center">
          <h2 className={`text-4xl md:text-6xl font-black uppercase italic ${status === 'locked' ? 'text-green-400' : 'text-[#C9A227]'}`}>
            {status === 'searching' ? 'מחפש תעודה...' : 'מזהה מסמך! החזק יציב'}
          </h2>
          {countdown !== null && countdown > 0 && (
            <div className="text-9xl font-black text-white mt-4 animate-bounce">{countdown}</div>
          )}
        </div>

        {/* מסגרת ניאון זוהרת */}
        <div className={`relative w-[85%] aspect-[3/4] border-[12px] rounded-[3rem] transition-all duration-700 
          ${status === 'locked' ? 'border-green-500 shadow-[0_0_80px_rgba(34,197,94,0.8)]' : 'border-[#C9A227]/40 shadow-[0_0_20px_rgba(201,162,39,0.2)]'}`}>
          
          {/* פס לייזר אקטיבי */}
          <div className="absolute inset-x-0 h-2 bg-green-400 shadow-[0_0_25px_#4ade80] animate-scan top-0 opacity-80"></div>
          
          {/* פינות סריקה מודגשות */}
          <div className="absolute -top-3 -left-3 w-20 h-20 border-t-[16px] border-l-[16px] border-[#C9A227] rounded-tl-3xl"></div>
          <div className="absolute -top-3 -right-3 w-20 h-20 border-t-[16px] border-r-[16px] border-[#C9A227] rounded-tr-3xl"></div>
          <div className="absolute -bottom-3 -left-3 w-20 h-20 border-b-[16px] border-l-[16px] border-[#C9A227] rounded-bl-3xl"></div>
          <div className="absolute -bottom-3 -right-3 w-20 h-20 border-b-[16px] border-r-[16px] border-[#C9A227] rounded-br-3xl"></div>
        </div>
      </div>

      {/* מסך הצלחה - מונע כפילויות */}
      {status === 'success' && (
        <div className="absolute inset-0 z-50 bg-[#0b141a] flex flex-col items-center justify-center p-8 text-center">
          <CheckCircle2 size={150} className="text-green-500 mb-8 animate-pulse" />
          <h1 className="text-6xl font-black text-white mb-10">נסרק ונשלח!</h1>
          <button onClick={() => { setStatus('searching'); setCountdown(null); }} className="bg-[#C9A227] text-black px-20 py-10 rounded-full font-black text-4xl uppercase shadow-2xl active:scale-95">סרוק עוד תעודה</button>
        </div>
      )}
    </div>
  );
}
