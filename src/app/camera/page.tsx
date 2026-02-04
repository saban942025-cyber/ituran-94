'use client';
import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { processScan } from '../actions/process-scan';
import { Camera, RefreshCw, CheckCircle } from 'lucide-react';

export default function CameraPage() {
  const webcamRef = useRef<Webcam>(null);
  const [status, setStatus] = useState('מזהה מיקום...');
  const [isScanning, setIsScanning] = useState(false);
  const [loc, setLoc] = useState<any>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (p) => setLoc({lat: p.coords.latitude, lng: p.coords.longitude}),
      () => setStatus('חובה לאשר מיקום!')
    );
  }, []);

  const handleCapture = async () => {
    if (!webcamRef.current || !loc) return;
    setIsScanning(true);
    setStatus('ג\'ימיני מנתח...');
    
    const img = webcamRef.current.getScreenshot();
    // בבדיקה נשלח טיוטה ריקה, במציאות נמשוך מה-Firestore
    const res = await processScan(img!, loc, { invoiceNumber: "6710354" });

    if (res.success) {
      setStatus('נשלח בהצלחה!');
    } else {
      setStatus('נסה שוב');
    }
    setIsScanning(false);
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
        />
        <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none flex items-center justify-center">
          <div className="w-[80%] h-[70%] border-4 border-[#C9A227] rounded-3xl shadow-[0_0_20px_#C9A227] animate-pulse"></div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 w-full bg-zinc-900">
        <p className="text-[#C9A227] font-black text-xl mb-6">{status}</p>
        <button 
          onClick={handleCapture}
          disabled={isScanning || !loc}
          className="w-24 h-24 bg-[#C9A227] rounded-full flex items-center justify-center text-black shadow-2xl active:scale-90 transition-all disabled:opacity-50"
        >
          {isScanning ? <RefreshCw className="animate-spin" size={40}/> : <Camera size={40} />}
        </button>
      </div>
    </div>
  );
}
