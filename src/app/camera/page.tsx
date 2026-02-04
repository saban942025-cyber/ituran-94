'use client';
import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { MapPin, Scan, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function SmartScanner() {
  const webcamRef = useRef<Webcam>(null);
  const [status, setStatus] = useState<'waiting_location' | 'searching' | 'locked' | 'success'>('waiting_location');
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  // 1. בקשת מיקום מאתר הלקוח (חובה)
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setStatus('searching');
        },
        () => alert("חובה לאשר מיקום כדי לתעד את הגעתך ללקוח!")
      );
    }
  }, []);

  // 2. מנגנון "נעילה" על מסמך (רק אם יש מיקום)
  useEffect(() => {
    if (status === 'searching' && location) {
      const timer = setTimeout(() => {
        setStatus('locked');
        setCountdown(3);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, location]);

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
    if (imageSrc && location) {
      setStatus('success');
      try {
        await addDoc(collection(db, 'driver_scans'), {
          driver: 'חכמת',
          image: imageSrc,
          location: location, // תיעוד המיקום של חכמת אצל הלקוח
          timestamp: serverTimestamp(),
          mode: 'PWA_AUTO_SCAN'
        });
      } catch (e) { console.error(e); }
    }
  };

  if (status === 'waiting_location') {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center p-10 text-center">
        <MapPin size={80} className="text-[#C9A227] animate-bounce mb-6" />
        <h1 className="text-3xl font-black text-white">מאשר מיקום מול איתורן...</h1>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden">
      <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" videoConstraints={{ facingMode: "environment" }} className="absolute inset-0 h-full w-full object-cover" />

      {/* הנחיות ענק לחכמת */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
        <div className="mb-10 bg-black/80 backdrop-blur-xl px-12 py-8 rounded-[3rem] border-4 border-[#C9A227] text-center max-w-[90%]">
          <h2 className={`text-4xl md:text-6xl font-black uppercase ${status === 'locked' ? 'text-green-400' : 'text-[#C9A227]'}`}>
            {status === 'searching' ? 'חפש תעודה...' : 'מזהה! אל תזוז'}
          </h2>
          {countdown !== null && countdown > 0 && <div className="text-9xl font-black text-white mt-4">{countdown}</div>}
        </div>

        {/* מסגרת ניאון זהובה/ירוקה */}
        <div className={`relative w-[85%] aspect-[3/4] border-[15px] rounded-[4rem] transition-all duration-700 
          ${status === 'locked' ? 'border-green-500 shadow-[0_0_100px_rgba(34,197,94,0.9)]' : 'border-[#C9A227]/50'}`}>
          <div className="absolute inset-x-0 h-2 bg-green-400 shadow-[0_0_20px_#4ade80] animate-scan top-0" />
        </div>
      </div>

      {status === 'success' && (
        <div className="absolute inset-0 z-50 bg-[#0b141a] flex flex-col items-center justify-center p-8 text-center">
          <CheckCircle2 size={120} className="text-green-500 mb-8" />
          <h1 className="text-5xl font-black text-white">המידע נשלח!</h1>
          <button onClick={() => { setStatus('searching'); setCountdown(null); }} className="mt-10 bg-[#C9A227] text-black px-16 py-8 rounded-full font-black text-3xl uppercase">הבא בתור</button>
        </div>
      )}
    </div>
  );
}
