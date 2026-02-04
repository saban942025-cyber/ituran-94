'use client';
import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { processScan } from '../actions/process-scan';

export default function SabanScanner() {
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // רפרנס לכפתור ההעלאה
  const [status, setStatus] = useState('מוכן לסריקה');
  const [isProcessing, setIsProcessing] = useState(false);

  // פונקציית עזר להמרת קובץ ל-Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleCapture = async (imageSrc: string) => {
    setIsProcessing(true);
    setStatus('🚀 ג\'ימיני מנתח קובץ...');
    try {
      const res = await processScan(imageSrc, { lat: 0, lng: 0 }, { invoiceNumber: "UPLOAD" });
      if (res && res.success) {
        setStatus('✅ הקובץ עובד בהצלחה!');
        setTimeout(() => { setIsProcessing(false); setStatus('מוכן לסריקה'); }, 3000);
      } else {
        setStatus(`❌ ${res?.error || 'שגיאה בניתוח'}`);
        setTimeout(() => setIsProcessing(false), 3000);
      }
    } catch (e) {
      setStatus('❌ תקלה בתקשורת');
      setIsProcessing(false);
    }
  };

  // פונקציה לטיפול בבחירת קובץ (תמונה או PDF)
  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus('📂 טוען קובץ...');
    const base64 = await fileToBase64(file);
    handleCapture(base64);
  };

  return (
    <div className="h-screen bg-black flex flex-col items-center justify-center overflow-hidden">
      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        videoConstraints={{ facingMode: "environment" }}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* אזור הסטטוס */}
      <div className={`z-10 w-[85%] h-[60%] border-4 rounded-3xl transition-all duration-500 
        ${isProcessing ? 'border-lime-500 shadow-[0_0_50px_lime]' : 'border-[#C9A227]'}`}>
        <p className="bg-black/70 text-[#C9A227] text-center p-2 rounded-t-lg font-bold">{status}</p>
      </div>

      {/* כפתורי שליטה */}
      <div className="absolute bottom-10 flex gap-4 z-20">
        {/* כפתור צילום ידני */}
        <button 
          onClick={() => {
            const img = webcamRef.current?.getScreenshot();
            if (img) handleCapture(img);
          }}
          disabled={isProcessing}
          className="bg-[#C9A227] text-black px-6 py-4 rounded-full font-bold active:scale-95 disabled:bg-gray-600"
        >
          📷 צלם עכשיו
        </button>

        {/* כפתור העלאת קובץ */}
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="bg-white text-black px-6 py-4 rounded-full font-bold active:scale-95 disabled:bg-gray-300"
        >
          📁 העלה תמונה/PDF
        </button>
      </div>

      {/* Input נסתר לבחירת קבצים */}
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={onFileChange}
        accept="image/*,application/pdf"
        className="hidden"
      />
    </div>
  );
}
