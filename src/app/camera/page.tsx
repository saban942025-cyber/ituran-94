'use client';
import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { processScan } from '../actions/process-scan';
import { Camera, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';

export default function SmartScanner() {
  const webcamRef = useRef<Webcam>(null);
  const [status, setStatus] = useState('מזהה מיקום...');
  const [loc, setLoc] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (p) => { 
        setLoc({lat: p.coords.latitude, lng: p.coords.longitude}); 
        setStatus('קרב את התעודה למסגרת'); 
      },
      () => setStatus('חובה לאשר מיקום!')
    );
  }, []);

  const handleCapture = async () => {
    if (!webcamRef.current || !loc) return;
    setIsScanning(true);
    setError(null);
    setStatus('ג\'ימיני מנתח את התעודה...');

    const img = webcamRef.current.getScreenshot();
    const res = await processScan(img!, loc);

    if (res.success) {
      setDone(true);
    } else {
      setError(res.error || 'נסה שוב');
      setIsScanning(false);
      setStatus('משהו השתבש, נסה שוב');
    }
  };

  if (done) return (
    <div className="h-screen bg-black flex flex-col items-center justify-center text-green-500 p-6 text-center">
      <CheckCircle size={100} className="animate-bounce" />
      <h1 className="text-4xl font-black mt-4">נסרק בהצלחה!</h1>
      <p className="text-white mt-2">הנתונים הועברו לגליה</p>
      <button onClick={() => window.location.reload()} className="mt-10 bg-[#C9A227] text-black px-12 py-5 rounded-full font-black text-xl shadow-2xl">לתעודה הבאה</button>
    </div>
  );

  return (
    <div className="relative h-screen bg-black overflow-hidden flex flex-col items-center">
      {/* מצלמה - facingMode environment מבטיח מצלמה אחורית */}
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        videoConstraints={{ facingMode: "environment" }}
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* שכבת הנחיות (המוח של ג'ימיני) */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-between py-12 px-6 bg-black/20">
        
        {/* בועת הנחיות עליונה */}
        <div className="bg-black/80 backdrop-blur-md px-6 py-4 rounded-3xl border-2 border-[#C9A227] w-full max-w-xs text-center shadow-2xl">
          {error ? (
            <div className="flex items-center justify-center gap-2 text-red-400 font-bold">
              <AlertTriangle size={20} />
              <span>{error}</span>
            </div>
          ) : (
            <p className="text-[#C9A227] text-lg font-black">{status}</p>
          )}
        </div>

        {/* מסגרת סריקה אקטיבית */}
        <div className={`relative w-full aspect-[3/4] max-w-sm border-8 rounded-[3rem] transition-all duration-500 
          ${isScanning ? 'border-green-500 shadow-[0_0_40px_rgba(34,197,94,0.6)]' : 'border-[#C9A227]/60 shadow-[0_0_20px_rgba(201,162,39,0.3)]'}`}>
          
          {/* קו לייזר סורק */}
          <div className="absolute inset-x-0 h-1 bg-[#C9A227] shadow-[0_0_15px_#C9A227] animate-scan z-20"></div>

          {/* פינות מודגשות */}
          <div className="absolute -top-2 -left-2 w-12 h-12 border-t-8 border-l-8 border-[#C9A227] rounded-tl-3xl"></div>
          <div className="absolute -top-2 -right-2 w-12 h-12 border-t-8 border-r-8 border-[#C9A227] rounded-tr-3xl"></div>
          <div className="absolute -bottom-2 -left-2 w-12 h-12 border-b-8 border-l-8 border-[#C9A227] rounded-bl-3xl"></div>
          <div className="absolute -bottom-2 -right-2 w-12 h-12 border-b-8 border-r-8 border-[#C9A227] rounded-br-3xl"></div>
        </div>

        {/* כפתור הפעלה */}
        <button 
          onClick={handleCapture}
          disabled={isScanning || !loc}
          className={`w-24 h-24 rounded-full border-8 border-black/30 flex items-center justify-center shadow-2xl transition-transform active:scale-90
            ${isScanning ? 'bg-gray-600' : 'bg-[#C9A227]'}`}
        >
          {isScanning ? <RefreshCw className="animate-spin text-black" size={40} /> : <Camera size={40} className="text-black" />}
        </button>
      </div>

      <div className="absolute bottom-4 text-white/30 font-black italic tracking-tighter z-20">SABAN 94 LOGISTICS</div>
    </div>
  );
}
