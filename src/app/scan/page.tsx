'use client';
import React, { useRef, useState, useCallback, Suspense } from 'react';
import Webcam from 'react-webcam';
import { Camera, RefreshCw, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

function HachmatScanner() {
  const webcamRef = useRef<Webcam>(null);
  const [instruction, setInstruction] = useState("כוון לתעודה בתוך המסגרת");
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [capturedImg, setCapturedImg] = useState<string | null>(null);

  // פונקציה ששולחת לג'ימיני לבדיקת איכות (Vision API)
  const processImage = async (imageSrc: string) => {
    setStatus('scanning');
    setInstruction("ג'ימיני בודק את האיכות...");

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageSrc }),
      });
      
      const data = await response.json();

      if (data.isGood) {
        setStatus('success');
        setInstruction("צילום מעולה! הועלה לארכיון");
        setCapturedImg(imageSrc);
      } else {
        setStatus('error');
        setInstruction(data.advice || "התמונה מטושטשת, נסה שוב");
        setTimeout(() => setStatus('idle'), 3000);
      }
    } catch (err) {
      setInstruction("שגיאה בחיבור, נסה שוב");
      setStatus('error');
    }
  };

  const handleCapture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) processImage(imageSrc);
  }, [webcamRef]);

  return (
    <div className="fixed inset-0 bg-black flex flex-col font-sans" dir="rtl">
      {/* Header */}
      <div className="bg-[#202c33] p-4 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#C9A227] rounded-full flex items-center justify-center font-bold text-black text-xs">ח</div>
          <span className="text-white font-black text-sm uppercase">סורק חכמת</span>
        </div>
        <div className={`px-3 py-1 rounded-full text-[10px] font-bold ${status === 'success' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black animate-pulse'}`}>
          {status === 'success' ? 'הסריקה אושרה' : 'ממתין לסריקה'}
        </div>
      </div>

      {/* Camera View */}
      <div className="relative flex-1 flex items-center justify-center bg-[#0b141a]">
        {status === 'success' ? (
          <img src={capturedImg!} className="w-[80%] h-[60%] object-cover rounded-xl border-4 border-green-500 shadow-2xl" />
        ) : (
          <>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "environment" }}
              className="h-full w-full object-cover"
            />
            {/* מסגרת הכוונה לחכמת - גדולה וברורה */}
            <div className="absolute border-4 border-dashed border-[#C9A227]/50 w-[85%] h-[65%] rounded-2xl shadow-[0_0_0_2000px_rgba(0,0,0,0.6)]">
              <div className="absolute -top-10 left-0 right-0 text-center">
                 <span className="bg-[#C9A227] text-black px-4 py-1 rounded-full text-xs font-black uppercase shadow-lg">יישר את הדף כאן</span>
              </div>
            </div>
          </>
        )}

        {/* הודעת הדרכה צפה */}
        <div className={`absolute bottom-10 left-4 right-4 p-4 rounded-2xl flex items-center gap-3 shadow-2xl border transition-all ${
          status === 'error' ? 'bg-red-900/90 border-red-500' : 'bg-[#202c33]/90 border-gray-700'
        }`}>
          {status === 'error' ? <AlertCircle className="text-white" /> : <CheckCircle className="text-[#C9A227]" />}
          <p className="text-white text-sm font-bold flex-1">{instruction}</p>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="h-28 bg-[#202c33] flex items-center justify-around px-8 border-t border-gray-700">
        {status === 'success' ? (
          <button onClick={() => window.location.reload()} className="flex items-center gap-2 text-[#C9A227] font-black uppercase text-xs">
            <RefreshCw size={20} /> סרוק תעודה נוספת
          </button>
        ) : (
          <button 
            onClick={handleCapture}
            disabled={status === 'scanning'}
            className="w-20 h-20 bg-[#C9A227] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(201,162,39,0.4)] active:scale-90 transition-all border-4 border-[#e0b52d]"
          >
            <Camera size={36} className="text-black" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="bg-black h-screen flex items-center justify-center text-[#C9A227] font-black italic">טוען מצלמה חכמה...</div>}>
      <HachmatScanner />
    </Suspense>
  );
}
