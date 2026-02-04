'use client';
import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { processScan } from '../actions/process-scan';

export default function AutoScanner() {
  const webcamRef = useRef<Webcam>(null);
  const [status, setStatus] = useState('מחפש תעודה...');
  const [isProcessing, setIsProcessing] = useState(false);

  // פונקציה לניתוח בהירות ושינוי - מזהה כניסת דף לבן
  const detectDocument = () => {
    if (isProcessing || !webcamRef.current) return;

    const canvas = webcamRef.current.getCanvas();
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // בדיקה פשוטה: האם מרכז המסך הפך להיות בהיר מאוד (דף לבן)
    let brightness = 0;
    for (let i = 0; i < data.length; i += 40) { // דגימה דילוגית למהירות
      brightness += (data[i] + data[i+1] + data[i+2]) / 3;
    }
    const avgBrightness = brightness / (data.length / 40);

    // אם הבהירות גבוהה מ-180 (מתוך 255), כנראה יש דף לבן מול המצלמה
    if (avgBrightness > 180) {
      autoCapture();
    }
  };

  const autoCapture = async () => {
    setIsProcessing(true);
    setStatus('תעודה זוהתה! מנתח...');
    
    const img = webcamRef.current?.getScreenshot();
    const res = await processScan(img!, {lat: 0, lng: 0}, { invoiceNumber: "6710354" });

    if (res.success) {
      setStatus('✅ נשלח בהצלחה!');
      setTimeout(() => setIsProcessing(false), 3000);
    } else {
      setStatus('❌ נסה ליישר את הדף');
      setTimeout(() => setIsProcessing(false), 2000);
    }
  };

  useEffect(() => {
    const interval = setInterval(detectDocument, 600); // בודק כל חצי שנייה
    return () => clearInterval(interval);
  }, [isProcessing]);

  return (
    <div className="h-screen bg-black relative">
      <Webcam
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        videoConstraints={{ facingMode: "environment" }}
        className="h-full w-full object-cover"
      />
      
      {/* מסגרת אינטראקטיבית שמשנה צבע כשמזהה דף */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className={`w-[80%] h-[60%] border-4 transition-colors duration-300 ${isProcessing ? 'border-green-500' : 'border-white/50'} rounded-2xl`}>
            <div className="absolute top-[-40px] left-0 right-0 text-center text-white font-bold text-xl bg-black/50 py-2">
                {status}
            </div>
        </div>
      </div>
    </div>
  );
}
