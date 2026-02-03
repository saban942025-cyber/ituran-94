'use client';

import React, { useState } from 'react';
import { db } from '@/lib/firebase'; // וודא שהקובץ הזה מייצא את ה-Firestore instance
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
  FileText, 
  Save, 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  Package,
  User,
  Hash
} from 'lucide-react';

// נתוני דוגמה לניתוח (במציאות זה מגיע מהסריקה)
const stagedData = [
  { id: 1, customer: "שחר שאול", product: "טיח 710", qty: 20, unit: "שק" },
  { id: 2, customer: "שחר שאול", product: "חול מילוי", qty: 2, unit: "בלה" }
];

export default function AnalyzerPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSaveToHistory = async () => {
    setIsProcessing(true);
    try {
      // יצירת התייחסות לאוסף ב-Firestore - התיקון שפתר את השגיאה
      const historyCollection = collection(db, 'delivery_history');

      for (const item of stagedData) {
        // הוספת מסמך ל-Firestore (תואם ל-Type ש-Vercel מצפה לו)
        await addDoc(historyCollection, {
          customerName: item.customer,
          productName: item.product,
          quantity: item.qty,
          unitType: item.unit,
          timestamp: serverTimestamp(),
          status: 'completed',
          source: 'Hachmat Scanner'
        });
      }

      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
      console.log("נתונים נשמרו בהצלחה בארכיון הדיגיטלי");
    } catch (error) {
      console.error("Error saving to Firestore:", error);
      alert("שגיאה בשמירת הנתונים. וודא ש-Firestore מוגדר כהלכה.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b141a] text-white p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 border-b border-gray-800 pb-6">
        <div className="p-3 bg-[#C9A227] rounded-xl text-black">
          <FileText size={28} />
        </div>
        <div>
          <h1 className="text-xl font-black">מנתח תעודות וארכיון</h1>
          <p className="text-xs text-gray-400">ניהול נתוני שטח - ח. סבן</p>
        </div>
      </div>

      {/* Review Section */}
      <div className="bg-[#202c33] rounded-2xl p-6 border border-gray-700 shadow-2xl mb-6">
        <h2 className="text-[#C9A227] font-bold text-sm mb-4 flex items-center gap-2">
          <AlertTriangle size={16} /> סקירת נתונים לפני שמירה
        </h2>
        
        <div className="space-y-4">
          {stagedData.map((item) => (
            <div key={item.id} className="bg-[#1c272d] p-4 rounded-xl border border-gray-800 flex justify-between items-center">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <User size={12} className="text-gray-500" /> {item.customer}
                </div>
                <div className="flex items-center gap-2 text-sm text-white">
                  <Package size={14} className="text-[#C9A227]" /> {item.product}
                </div>
              </div>
              <div className="text-left">
                <div className="text-lg font-black">{item.qty}</div>
                <div className="text-[10px] text-gray-500 uppercase font-bold">{item.unit}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleSaveToHistory}
        disabled={isProcessing || isSuccess}
        className={`w-full py-5 rounded-2xl font-black uppercase text-sm flex items-center justify-center gap-3 transition-all ${
          isSuccess 
            ? 'bg-green-600 text-white shadow-[0_0_20px_rgba(22,163,74,0.4)]' 
            : 'bg-[#C9A227] text-black hover:bg-[#e0b52d] active:scale-95'
        }`}
      >
        {isProcessing ? (
          <Loader2 className="animate-spin" />
        ) : isSuccess ? (
          <CheckCircle />
        ) : (
          <Save size={20} />
        )}
        {isProcessing ? "שומר נתונים..." : isSuccess ? "נשמר בהצלחה!" : "אשר ושמור בארכיון"}
      </button>

      {/* Footer Info */}
      <p className="text-center text-[10px] text-gray-500 mt-8 uppercase tracking-widest font-bold">
        Saban Logistics Intelligence • v1.2
      </p>
    </div>
  );
}
