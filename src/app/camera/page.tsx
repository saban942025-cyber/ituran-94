'use client';
import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Camera, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SmartScanner() {
  const webcamRef = useRef<Webcam>(null);
  const [img, setImg] = useState<string | null>(null);
  const [status, setStatus] = useState<'aligning' | 'scanning' | 'success'>('aligning');
  const [guideText, setGuideText] = useState("הכנס את התעודה למסגרת");

  // מנגנון הנחיות אוטומטי לחכמת
  useEffect(() => {
    if (status === 'aligning') {
      const timer = setTimeout(() => setGuideText("יציב... אל תזוז"), 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleCapture = async () => {
    setStatus('scanning');
    setGuideText("סורק נתונים...");
    
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      try {
        await addDoc(collection(db, 'driver_scans'), {
          driver: 'חכמת',
          image: imageSrc,
          timestamp: serverTimestamp(),
          status: 'AI_ANALYSIS_REQUIRED'
        });
        setImg(imageSrc);
        setStatus('success');
        setGuideText("נשלח בהצלחה!");
      } catch (e) {
        setGuideText("תקלה! נסה שוב");
        setStatus('aligning');
      }
    }
  };

  return (
    <div className="relative min-h-screen bg-black overflow-hidden font-sans">
      {/* המצלמה - תופסת את כל המסך */}
      <div className="absolute inset-0 z-0">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={{ facingMode: "environment" }}
          className="w-full h-full object-cover"
        />
      </div>

      {/* שכבת ההנחיות והמסגרת */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 bg-black/20">
        
        {/* טקסט הנחיות מרכזי - בולט בכל תנאי תאורה */}
        <div className="absolute top-1/4 transform -translate-y-1/2 w-full px-4 text-center">
          <div className="inline-block bg-black/60 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 shadow-2xl">
            <p className={`text-xl font-black uppercase tracking-tight ${status === 'success' ? 'text-green-400' : 'text-[#C9A227]'}`}>
              {guideText}
            </p>
          </div>
        </div>

        {/* מסגרת הסריקה - "חכמה" */}
        <div className={`relative w-full aspect-[3/4] max-w-sm rounded-[2rem] border-4 transition-all duration-500 
          ${status === 'success' ? 'border-green-500 shadow-[0_0_40px_rgba(34,197,94,0.6)]' : 'border-[#C9A227]/70 shadow-[0_0_20px_rgba(201,162,39,0.3)]'}`}>
          
          {/* קו לייזר סורק - מופיע רק בזמן "סריקה" */}
          {status === 'scanning' && (
            <div className="absolute inset-x-0 h-1 bg-[#C9A227] shadow-[0_0_15px_#C9A227] animate-scan z-20"></div>
          )}

          {/* פינות המסגרת */}
          <div className="absolute -top-1 -left-1 w-12 h-12 border-t-8 border-l-8 border-[#C9A227] rounded-tl-3xl"></div>
          <div className="absolute -top-1 -right-1 w-12 h-12 border-t-8 border-r-8 border-[#C9A227] rounded-tr-3xl"></div>
          <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-8 border-l-8 border-[#C9A227] rounded-bl-3xl"></div>
          <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-8 border-r-8 border-[#C9A227] rounded-br-3xl"></div>
        </div>

        {/* כפתור צילום גדול למטה */}
        <div className="absolute bottom-12 w-full flex justify-center">
          {status !== 'success' ? (
            <button 
              onClick={handleCapture}
              className="w-20 h-20 bg-[#C9A227] rounded-full border-8 border-black/30 flex items-center justify-center text-black shadow-2xl active:scale-90 transition-transform"
            >
              <Camera size={36} />
            </button>
          ) : (
            <button 
              onClick={() => { setStatus('aligning'); setImg(null); setGuideText("הכנס את התעודה למסגרת"); }}
              className="bg-green-600 px-8 py-4 rounded-2xl font-black text-white flex items-center gap-2 shadow-xl"
            >
              <RefreshCw size={20} /> תעודה הבאה
            </button>
          )}
        </div>
      </div>
      
      {/* לוגו סבן בפינה */}
      <div className="absolute bottom-4 right-6 z-20 opacity-30 text-white font-black italic">SABAN 94</div>
    </div>
  );
}
