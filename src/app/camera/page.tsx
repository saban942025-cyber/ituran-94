'use client';
import React, { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { processScan } from '../actions/process-scan';
import { Camera, CheckCircle, RefreshCw } from 'lucide-react';

export default function HakmatScanner() {
  const webcamRef = useRef<Webcam>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState('ממתין לסריקה...');

  // הגדרות למצלמה אחורית בלבד
  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "environment" // זה מה שמונע סלפי!
  };

  const onCapture = async () => {
    if (!webcamRef.current) return;
    setIsScanning(true);
    setStatus('סורק תעודה...');
    
    // קבלת מיקום
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const img = webcamRef.current?.getScreenshot();
      const res = await processScan(img!, {
        lat: pos.coords.latitude, 
        lng: pos.coords.longitude
      });

      if (res.success) {
        setStatus('נשלח בהצלחה!');
        setIsScanning(false);
      } else {
        setStatus(res.error || 'טעות, נסה שוב');
        setIsScanning(false);
      }
    });
  };

  return (
    <div className="h-screen bg-black flex flex-col items-center">
      <div className="relative w-full h-3/4">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          className="w-full h-full object-cover"
        />
        {/* מסגרת "כוונת" על המסך */}
        <div className="absolute inset-0 border-[40px] border-black/50 pointer-events-none flex items-center justify-center">
          <div className="w-full h-full border-2 border-[#C9A227] rounded-lg shadow-[0_0_15px_#C9A227]"></div>
        </div>
      </div>

      <div className="p-6 text-center">
        <p className="text-[#C9A227] font-bold mb-4">{status}</p>
        <button 
          onClick={onCapture}
          disabled={isScanning}
          className="w-20 h-20 bg-[#C9A227] rounded-full flex items-center justify-center text-black shadow-xl active:scale-95 transition-transform"
        >
          {isScanning ? <RefreshCw className="animate-spin" /> : <Camera size={32} />}
        </button>
      </div>
    </div>
  );
}
