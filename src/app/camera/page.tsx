'use client';
import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { processScan } from '../actions/process-scan';
import { Camera, RefreshCw, AlertCircle } from 'lucide-react';

export default function CameraPage() {
  const webcamRef = useRef<Webcam>(null);
  const [status, setStatus] = useState('מזהה מיקום...');
  const [isScanning, setIsScanning] = useState(false);
  const [loc, setLoc] = useState<any>({ lat: 0, lng: 0 }); // ערך ברירת מחדל
  const [locError, setLocError] = useState(false);

  useEffect(() => {
    // פונקציה לקבלת מיקום עם Timeout
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (p) => {
          setLoc({ lat: p.coords.latitude, lng: p.coords.longitude });
          setStatus('הכנס תעודה למסגרת');
          setLocError(false);
        },
        (err) => {
          console.error("Location error:", err);
          setLocError(true);
          setStatus('מיקום לא זמין - ניתן להמשיך בסריקה');
        },
        { enableHighAccuracy: true, timeout: 10000 } // מחכה מקסימום 10 שניות
      );
    } else {
      setLocError(true);
      setStatus('הדפדפן לא תומך במיקום');
    }
  }, []);

  const handleCapture = async () => {
    if (!webcamRef.current) return;
    setIsScanning(true);
    setStatus('ג\'ימיני מנתח...');
    
    try {
      const img = webcamRef.current.getScreenshot();
      if (!img) throw new Error("No image captured");

      const res = await processScan(img, loc, { invoiceNumber: "6710354" });

      if (res.success) {
        setStatus('✅ נשלח בהצלחה!');
      } else {
        setStatus('❌ ' + (res.error || 'נסה שוב'));
      }
    } catch (e) {
      setStatus('❌ תקלה במצלמה');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="h-screen bg-black flex flex-col items-center">
      <div className="relative w-full h-3/4 overflow-hidden">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={{ facingMode: "environment" }}
          className="w-full h-full object-cover"
          onUserMediaError={() => setStatus('שגיאה בגישה למצלמה')}
        />
        
        {/* מסגרת הכוונה */}
        <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none flex items-center justify-center">
          <div className={`w-[85%] h-[70%] border-4 ${locError ? 'border-amber-500' : 'border-[#C9A227]'} rounded-3xl shadow-[0_0_20px_rgba(201,162,39,0.4)] transition-colors`}></div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 w-full bg-zinc-900 border-t border-white/10">
        <div className="flex items-center gap-2 mb-4">
           {locError && <AlertCircle className="text-amber-500" size={20} />}
           <p className={`${locError ? 'text-amber-500' : 'text-[#C9A227]'} font-black text-lg text-center`}>
            {status}
           </p>
        </div>
        
        <button 
          onClick={handleCapture}
          disabled={isScanning}
          className="w-24 h-24 bg-[#C9A227] rounded-full flex items-center justify-center text-black shadow-[0_0_30px_rgba(201,162,39,0.3)] active:scale-90 transition-all disabled:opacity-50 disabled:grayscale"
        >
          {isScanning ? <RefreshCw className="animate-spin" size={40}/> : <Camera size={40} />}
        </button>
      </div>
    </div>
  );
}
