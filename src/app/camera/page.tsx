'use client';
import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Camera, CheckCircle2 } from 'lucide-react';

export default function SabanAutoScanner() {
  const webcamRef = useRef<Webcam>(null);
  const [status, setStatus] = useState<'aligning' | 'locking' | 'success'>('aligning');
  const [guide, setGuide] = useState("הכנס תעודה למסגרת");
  const [count, setCount] = useState<number | null>(null);

  // מנגנון זיהוי וצילום אוטומטי
  useEffect(() => {
    if (status === 'aligning') {
      const timer = setTimeout(() => {
        setStatus('locking');
        setGuide("נועל על מסמך... החזק יציב!");
        setCount(3);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [status]);

  useEffect(() => {
    if (count !== null && count > 0) {
      const timer = setTimeout(() => setCount(count - 1), 1000);
      return () => clearTimeout(timer);
    } else if (count === 0) {
      capture();
    }
  }, [count]);

  const capture = async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setStatus('success');
      setGuide("נסרק בהצלחה!");
      try {
        await addDoc(collection(db, 'driver_scans'), {
          driver: 'חכמת',
          image: imageSrc,
          timestamp: serverTimestamp(),
          mode: 'AUTO_SCAN'
        });
      } catch (e) { console.error(e); }
    }
  };

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden font-sans">
      <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" videoConstraints={{ facingMode: "environment" }} className="absolute inset-0 h-full w-full object-cover" />

      {/* שכבת הנחיות ענקית - מתגברת על שמש/חושך */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
        <div className="mb-12 bg-black/80 backdrop-blur-md px-12 py-8 rounded-[2rem] border-4 border-[#C9A227] shadow-[0_0_60px_rgba(0,0,0,0.9)] text-center max-w-[90%]">
          <h2 className={`text-4xl md:text-6xl font-black uppercase tracking-tighter ${status === 'locking' ? 'text-green-400' : 'text-[#C9A227]'}`}>
            {guide}
          </h2>
          {count !== null && count > 0 && <div className="text-8xl font-black text-white mt-4 animate-ping">{count}</div>}
        </div>

        {/* מסגרת "חכמה" שמגיבה לסריקה */}
        <div className={`relative w-[85%] aspect-[3/4] border-[12px] rounded-[3rem] transition-all duration-700 
          ${status === 'locking' ? 'border-green-500 shadow-[0_0_80px_rgba(34,197,94,0.8)]' : 'border-[#C9A227]/60 shadow-[0_0_30px_rgba(201,162,39,0.4)]'}`}>
          <div className="absolute inset-x-0 h-2 bg-[#C9A227] shadow-[0_0_20px_#C9A227] animate-scan top-0"></div>
        </div>
      </div>

      {status === 'success' && (
        <div className="absolute inset-0 z-30 bg-black/95 flex flex-col items-center justify-center p-8 text-center">
          <CheckCircle2 size={120} className="text-green-500 mb-6 animate-bounce" />
          <h1 className="text-5xl font-black text-white mb-12">התעודה אצל גליה!</h1>
          <button onClick={() => { setStatus('aligning'); setCount(null); }} className="bg-[#C9A227] text-black px-16 py-8 rounded-full font-black text-3xl uppercase shadow-2xl active:scale-95">הבא בתור</button>
        </div>
      )}
    </div>
  );
}
