'use client';
import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { processScan } from '../actions/process-scan';
import { MapPin, CheckCircle } from 'lucide-react';

export default function SmartScanner() {
  const webcamRef = useRef<Webcam>(null);
  const [status, setStatus] = useState('מבקש מיקום...');
  const [loc, setLoc] = useState<any>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (p) => { setLoc({lat: p.coords.latitude, lng: p.coords.longitude}); setStatus('הכנס תעודה למסגרת'); },
      () => setStatus('חובה לאשר מיקום!')
    );
  }, []);

  const capture = async () => {
    if (!webcamRef.current || !loc) return;
    setStatus('סורק ושולח...');
    const img = webcamRef.current.getScreenshot();
    const res = await processScan(img!, loc);
    if (res.success) { setDone(true); setStatus('נשלח בהצלחה!'); }
  };

  if (done) return (
    <div className="h-screen bg-black flex flex-col items-center justify-center text-green-500">
      <CheckCircle size={100} />
      <h1 className="text-4xl font-black mt-4">הכל אצל גליה!</h1>
      <button onClick={() => window.location.reload()} className="mt-8 bg-white text-black px-10 py-4 rounded-full font-bold">תעודה הבאה</button>
    </div>
  );

  return (
    <div className="relative h-screen bg-black overflow-hidden">
      <Webcam ref={webcamRef} screenshotFormat="image/jpeg" className="absolute inset-0 h-full w-full object-cover" />
      
      {/* שכבת ההנחיות של סבן */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="bg-black/70 px-8 py-4 rounded-2xl border-2 border-[#C9A227] mb-8">
          <p className="text-[#C9A227] text-2xl font-black animate-pulse">{status}</p>
        </div>
        
        <div className="w-[85%] aspect-[3/4] border-[10px] border-[#C9A227]/50 rounded-[3rem] relative">
            <div className="absolute inset-x-0 h-1 bg-[#C9A227] shadow-[0_0_15px_#C9A227] animate-scan top-0" />
        </div>

        <button onClick={capture} className="mt-12 w-24 h-24 bg-[#C9A227] rounded-full border-8 border-black/30 flex items-center justify-center text-black">
          <MapPin size={40} />
        </button>
      </div>
    </div>
  );
}
