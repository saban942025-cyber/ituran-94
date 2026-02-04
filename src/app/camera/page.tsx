'use client';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { processScan } from '../actions/process-scan';

export default function SabanScanner() {
  const webcamRef = useRef<Webcam>(null);
  const [status, setStatus] = useState('מתחבר למצלמה...');
  const [isProcessing, setIsProcessing] = useState(false);

  const runAnalysis = useCallback(async () => {
    if (isProcessing || !webcamRef.current) return;

    const imageSrc = webcamRef.current.getScreenshot({ width: 1024, height: 768 });
    if (!imageSrc) return;

    setIsProcessing(true);
    setStatus('🚀 ג\'ימיני מנתח...');

    try {
      const res = await processScan(imageSrc, { lat: 0, lng: 0 }, { invoiceNumber: "6710354" });
      
      // התיקון הקריטי: בדיקה ש-res קיים לפני גישה ל-success
      if (res && res.success) {
        setStatus('✅ נסרק בהצלחה!');
        if (navigator.vibrate) navigator.vibrate(200);
        setTimeout(() => {
          setIsProcessing(false);
          setStatus('מוכן לסריקה הבאה');
        }, 3000);
      } else {
        // שימוש ב-Optional Chaining למניעת קריסה
        setStatus(`❌ ${res?.error || 'נסה שוב'}`);
        setTimeout(() => setIsProcessing(false), 3000);
      }
    } catch (e) {
      setStatus('❌ תקלה בתקשורת');
      setIsProcessing(false);
    }
  }, [isProcessing]);

  // זיהוי אוטומטי לפי בהירות
  useEffect(() => {
    const timer = setInterval(() => {
      if (isProcessing) return;
      runAnalysis();
    }, 2000);
    return () => clearInterval(timer);
  }, [isProcessing, runAnalysis]);

  return (
    <div className="h-screen bg-black flex flex-col items-center justify-center overflow-hidden">
      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        videoConstraints={{ facingMode: "environment" }}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className={`z-10 w-[85%] h-[60%] border-4 rounded-3xl transition-all duration-500 
        ${isProcessing ? 'border-lime-500 shadow-[0_0_50px_lime]' : 'border-[#C9A227]'}`}>
        <p className="bg-black/70 text-[#C9A227] text-center p-2 rounded-t-lg font-bold">{status}</p>
      </div>
      <button 
        onClick={runAnalysis}
        disabled={isProcessing}
        className="absolute bottom-10 bg-[#C9A227] text-black px-8 py-4 rounded-full font-bold text-xl active:scale-95 disabled:bg-gray-600"
      >
        צילום ידני
      </button>
    </div>
  );
}
