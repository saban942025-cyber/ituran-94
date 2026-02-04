'use client';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { processScan } from '../actions/process-scan';

export default function AutoScanner() {
  const webcamRef = useRef<Webcam>(null);
  const [status, setStatus] = useState('מנסה להתחבר למצלמה...');
  const [isProcessing, setIsProcessing] = useState(false);
  const [debugBrightness, setDebugBrightness] = useState(0);

  // פונקציית צילום
  const autoCapture = useCallback(async (imageSrc: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setStatus('🚀 תעודה זוהתה! ג\'ימיני מנתח...');

    try {
      // שליחה לשרת (נ"צ מאופס כברירת מחדל לבדיקה)
      const res = await processScan(imageSrc, { lat: 32.1, lng: 34.8 }, { invoiceNumber: "6710354" });
      
      if (res.success) {
        setStatus('✅ נשלח בהצלחה!');
        // רטט בטלפון לאישור (עובד באנדרואיד)
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(200);
      } else {
        setStatus('❌ ג\'ימיני לא זיהה, נסה שוב');
      }
    } catch (e) {
      setStatus('❌ תקלה בתקשורת');
    } finally {
      // מאפשר סריקה חוזרת אחרי 3 שניות
      setTimeout(() => {
        setIsProcessing(false);
        setStatus('מחפש תעודה...');
      }, 3000);
    }
  }, [isProcessing]);

  // לוגיקה לזיהוי דף לבן/תנועה
  useEffect(() => {
    const interval = setInterval(() => {
      if (isProcessing || !webcamRef.current) return;

      const video = webcamRef.current.video;
      if (!video || video.readyState !== 4) return;

      // יצירת קנבס זמני לניתוח התמונה
      const canvas = document.createElement('canvas');
      canvas.width = 100; // רזולוציה נמוכה לניתוח מהיר
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, 100, 100);
      const imageData = ctx.getImageData(0, 0, 100, 100);
      const data = imageData.data;

      let totalBrightness = 0;
      let whitePixels = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i+1], b = data[i+2];
        const brightness = (r + g + b) / 3;
        totalBrightness += brightness;
        if (brightness > 150) whitePixels++; // סופר כמה פיקסלים "בהירים" יש
      }

      const avgBrightness = totalBrightness / (imageData.width * imageData.height);
      const whitePercentage = (whitePixels / (imageData.width * imageData.height)) * 100;

      // תנאי זיהוי: אם יותר מ-40% מהמסך לבן ובהיר - תצלם
      if (whitePercentage > 40 && avgBrightness > 130) {
        const screenshot = webcamRef.current.getScreenshot();
        if (screenshot) autoCapture(screenshot);
      }
    }, 400); // בודק 2.5 פעמים בשנייה

    return () => clearInterval(interval);
  }, [isProcessing, autoCapture]);

  return (
    <div className="h-screen bg-black relative overflow-hidden flex flex-col">
      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        videoConstraints={{ facingMode: "environment", width: 1280, height: 720 }}
        className="absolute inset-0 w-full h-full object-cover"
        onUserMedia={() => setStatus('מחפש תעודה...')}
      />
      
      {/* מסגרת סריקה */}
      <div className="relative flex-1 flex items-center justify-center pointer-events-none">
        <div className={`w-[85%] h-[60%] border-2 transition-all duration-500 rounded-lg
          ${isProcessing ? 'border-lime-500 scale-105 shadow-[0_0_30px_lime]' : 'border-white/40 shadow-[0_0_15px_rgba(255,255,255,0.2)]'}`}>
          
          {/* פינות המסגרת */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#C9A227]"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#C9A227]"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#C9A227]"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#C9A227]"></div>
        </div>
      </div>

      {/* בר סטטוס תחתון */}
      <div className="h-32 bg-zinc-900/90 backdrop-blur-md flex items-center justify-center p-4 border-t border-white/10 z-10">
        <p className={`text-xl font-bold ${isProcessing ? 'text-lime-400 animate-pulse' : 'text-[#C9A227]'}`}>
          {status}
        </p>
      </div>
    </div>
  );
}
