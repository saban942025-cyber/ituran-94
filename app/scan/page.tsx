'use client';

import React, { useState, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Camera, Upload, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

export default function DriverScanner() {
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // פתיחת המצלמה בנייד
  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setStatus('idle');
      };
      reader.readAsDataURL(file);
    }
  };

  // שליחה לגליה (ל-Firebase)
  const uploadToSaban = async () => {
    if (!image) return;
    setUploading(true);
    
    try {
      // שמירת הנתונים ב-Firestore
      // הערה: במערכת מלאה נעלה קודם ל-Storage, כאן אנחנו שומרים את התיעוד
      await addDoc(collection(db, 'driver_scans'), {
        driverName: 'חכמת',
        timestamp: serverTimestamp(),
        status: 'pending_review',
        // כאן אנחנו מדמים שמירת כתובת תמונה
        imageUrl: "pending_upload_to_storage" 
      });

      setStatus('success');
      setImage(null);
    } catch (error) {
      console.error(error);
      setStatus('error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b141a] text-white p-6 flex flex-col items-center" dir="rtl">
      {/* Header */}
      <div className="w-full max-w-md flex items-center gap-3 mb-8">
        <div className="bg-[#C9A227] p-3 rounded-full text-black">
          <Camera size={24} />
        </div>
        <div>
          <h1 className="text-xl font-black text-white">ח. סבן - צילום תעודה</h1>
          <p className="text-[10px] text-[#C9A227] font-bold uppercase tracking-widest">Driver: Hakmat #3</p>
        </div>
      </div>

      {/* Main Scanner Area */}
      <div className="w-full max-w-md bg-[#202c33] rounded-3xl border-2 border-dashed border-gray-700 p-4 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden">
        {image ? (
          <div className="relative w-full h-full">
            <img src={image} alt="Preview" className="rounded-2xl w-full h-64 object-cover border-2 border-[#C9A227]" />
            <button 
              onClick={() => setImage(null)}
              className="absolute top-2 right-2 bg-red-600 p-2 rounded-full shadow-lg"
            >
              <AlertCircle size={20} />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-4 text-gray-500 hover:text-[#C9A227] transition-colors"
          >
            <div className="w-20 h-20 rounded-full bg-[#1c272d] flex items-center justify-center">
              <Camera size={40} />
            </div>
            <span className="font-bold text-sm">לחץ לצילום תעודת משלוח</span>
          </button>
        )}

        {/* Hidden File Input for Mobile Camera */}
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleCapture}
        />
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-md mt-8 space-y-4">
        {image && (
          <button 
            onClick={uploadToSaban}
            disabled={uploading}
            className="w-full py-5 rounded-2xl bg-[#C9A227] text-black font-black uppercase flex items-center justify-center gap-3 shadow-[0_10px_20px_rgba(201,162,39,0.2)]"
          >
            {uploading ? <Loader2 className="animate-spin" /> : <Upload size={20} />}
            {uploading ? "שולח לגליה..." : "שלח תעודה לאישור"}
          </button>
        )}

        {status === 'success' && (
          <div className="bg-green-900/30 border border-green-500 p-4 rounded-2xl flex items-center gap-3 text-green-400">
            <CheckCircle2 size={24} />
            <span className="text-sm font-bold">התעודה נשלחה בהצלחה! חכמת, סע בזהירות.</span>
          </div>
        )}
      </div>

      {/* Footer Instructions */}
      <div className="mt-auto pt-10 text-center opacity-40">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
          ודא שהתמונה ברורה וכל הפריטים נראים לעין
        </p>
      </div>
    </div>
  );
}
