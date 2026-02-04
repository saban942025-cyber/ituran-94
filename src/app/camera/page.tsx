'use client';
import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { processScan } from '../actions/process-scan';

export default function SabanScanner() {
  const webcamRef = useRef<Webcam>(null);
  const [status, setStatus] = useState('מכין מצלמה...');
  const [isProcessing, setIsProcessing] = useState(false);

  const runAnalysis = async () => {
    if (isProcessing || !webcamRef.current) return;

    // הקטנת רזולוציה למינימום הנדרש ל-OCR (חוסך נפח ושגיאות)
    const imageSrc = webcamRef.current.getScreenshot({width: 1024, height: 768});
    if (!imageSrc) return;

    setIsProcessing(true);
    setStatus('🚀 שולח לג\'ימיני...');

    try {
      const res = await processScan(imageSrc, {lat: 0, lng: 0}, { invoiceNumber: "6710354" });
      if (res.success) {
        setStatus('✅ הצלחה!');
        setTimeout(() => setIsProcessing(false), 3000);
      } else {
        setStatus(`❌ ${res.error || 'נסה שוב'}`);
        setTimeout(() => setIsProcessing(false), 4000);
      }
    } catch (e) {
      setStatus('❌ תקלה ברשת');
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    const detector = setInterval(() => {
      if (isProcessing || !webcamRef.current) return;
      const canvas = webcamRef.current.getCanvas();
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const pix = ctx!.getImageData(canvas.width/3, canvas.height/3, canvas.width/3, canvas.height/3).data;
      let b = 0;
      for (let i = 0; i < pix.length; i += 40) b += (pix[i]+pix[i+1]+pix[i+2])/3;
      if ((b/(pix.length/40)) > 180) runAnalysis();
    }, 1000);
    return () => clearInterval(detector);
  }, [isProcessing]);

  return (
    <div className="h-screen bg-black flex flex-col items-center justify-center overflow-hidden">
      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        screenshotQuality={0.6} // איכות נמוכה יותר = שליחה מהירה יותר
        videoConstraints={{ facingMode: "environment" }}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className={`z-10 w-[85%] h-[60%] border-4 rounded-3xl transition-all duration-500 
        ${isProcessing ? 'border-lime-500 shadow-[0_0_50px_lime]' : 'border-[#C9A227]'}`}>
        <p className="bg-black/70 text-[#C9A227] text-center p-2 rounded-t-lg font-bold">{status}</p>
      </div>
    </div>
  );
}
