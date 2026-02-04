'use client';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { processScan } from '../actions/process-scan';
import { Camera, RefreshCw, Loader2 } from 'lucide-react';

export default function SabanScanner() {
  const webcamRef = useRef<Webcam>(null);
  const [status, setStatus] = useState('מאתר מיקום ומצלמה...');
  const [isProcessing, setIsProcessing] = useState(false);
  const [location, setLocation] = useState({ lat: 0, lng: 0 });

  // 1. קבלת מיקום ראשוני
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (p) => setLocation({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => console.log("Location access denied")
      );
    }
  }, []);

  // 2. לוגיקת צילום וניתוח
  const runAnalysis = async () => {
    if (isProcessing || !webcamRef.current) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    setIsProcessing(true);
    setStatus('🚀 ג\'ימיני מנתח נתונים...');

    const res = await processScan(imageSrc, location, { invoiceNumber: "6710354" });

    if (res.success) {
      setStatus('✅ נסרק בהצלחה!');
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]); // רטט הצלחה
      setTimeout(() => {
        setIsProcessing(false);
        setStatus('מוכן לסריקה הבאה');
      }, 3000);
    } else {
      setStatus(`❌ ${res.error?.split(':')[0] || 'נסה שוב'}`);
      setTimeout(() => {
        setIsProcessing(false);
        setStatus('נסה לצלם שוב מקרוב');
      }, 2500);
    }
  };

  // 3. מנוע זיהוי אוטומטי (Auto-Trigger)
  useEffect(() => {
    const detector = setInterval(() => {
      if (isProcessing || !webcamRef.current) return;
      
      const canvas = webcamRef.current.getCanvas();
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      const pix = ctx!.getImageData(canvas.width/4, canvas.height/4, canvas.width/2, canvas.height/2).data;
      
      let bright = 0;
      for (let i = 0; i < pix.length; i += 4) {
        bright += (pix[i] + pix[i+1] + pix[i+2]) / 3;
      }
      const avg = bright / (pix.length / 4);

      // אם יש "כתם לבן" משמעותי במרכז - צלם אוטומטית
      if (avg > 190) { 
        runAnalysis();
      }
    }, 1000);

    return () => clearInterval(detector);
  }, [isProcessing, location]);

  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden">
      {/* אזור המצלמה */}
      <div className="relative flex-[3] bg-zinc-900">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={{ 
            facingMode: "environment",
            width: 1280,
            height: 720
          }}
          className="w-full h-full object-cover"
        />
        
        {/* מסגרת זהב סבן */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`w-[85%] h-[65%] border-[3px] rounded-3xl transition-all duration-500 
            ${isProcessing ? 'border-lime-400 scale-105 shadow-[0_0_40px_rgba(163,230,53,0.6)]' : 'border-[#C9A227] shadow-[0_0_20px_rgba(201,162,39,0.3)]'}`}>
            <div className="absolute top-4 left-0 right-0 text-center">
              <span className="bg-black/50 text-white px-3 py-1 rounded-full text-sm animate-pulse">
                מקם תעודה כאן
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* אזור בקרה תחתון */}
      <div className="flex-1 bg-zinc-900 border-t border-white/10 flex flex-col items-center justify-center p-6">
        <p className={`text-lg font-bold mb-6 transition-colors ${isProcessing ? 'text-lime-400' : 'text-[#C9A227]'}`}>
          {status}
        </p>

        <button 
          onClick={runAnalysis}
          disabled={isProcessing}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all active:scale-90
            ${isProcessing ? 'bg-zinc-700' : 'bg-[#C9A227] shadow-[0_0_30px_rgba(201,162,39,0.4)]'}`}
        >
          {isProcessing ? <Loader2 className="text-zinc-400 animate-spin" size={40} /> : <Camera size={40} className="text-black" />}
        </button>
      </div>
    </div>
  );
}
