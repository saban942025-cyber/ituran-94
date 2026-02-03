'use client';

import React, { useState } from 'react';
import { db } from '@/lib/firebase'; 
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

// נתוני דוגמה לניתוח (במציאות זה יגיע מהסריקה של חכמת)
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
      // יצירת התייחסות לאוסף ב-Firestore (זה התיקון שמונע את שגיאת ה-Type)
      const historyCollection = collection(db, 'delivery_history');

      for (const item of stagedData) {
        // הוספת מסמך ל-Firestore
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
      console.log("נתונים נשמרו בהצלחה ב-Firestore");
    } catch (error) {
      console.error("Error saving to Firestore:", error);
      alert("שגיאה בשמירה. וודא שקובץ ה-Firebase מוגדר כ-Firestore.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b141a] text-white p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 border-b border-gray-800 pb-6">
        <div className="p-3 bg-[#C9A227] rounded-xl text-black shadow-[0_0_15px_rgba(201,162,39,0.3)]">
          <FileText size={28} />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tighter">מנתח תעודות וארכיון</h1>
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Saban Logistics Intelligence</p>
        </div>
      </div>

      {/* Review Section */}
      <div className="bg-[#202c33] rounded-2xl p-6 border border-gray-700 shadow-2xl mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1 h-full bg-[#C9A227]"></div>
        <h2 className="text-[#C9A227] font-bold text-sm mb-4 flex items-center gap-2">
          <AlertTriangle size={16} /> סקירת נתונים לפני שמירה בארכיון
        </h2>
        
        <div className="space-y-4">
          {stagedData.map((item) => (
            <div key={item.id} className="bg-[#1c272d] p-4 rounded-xl border border-gray-800 flex justify-between items-center hover:border-gray-600 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase">
                  <User size={12} /> {item.customer}
                </div>
                <div className="flex items-center gap-2 text-sm text-white font-bold">
                  <Package size={14} className="text-[#C9A227]" /> {item.product}
                </div>
              </div>
              <div className="text-left">
                <div className="text-xl font-black text-white">{item.qty}</div>
                <div className="text-[9px] text-gray-500 uppercase font-black">{item.unit}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <div className="fixed bottom-8 left-6 right-6">
        <button
          onClick={handleSaveToHistory}
          disabled={isProcessing || isSuccess}
          className={`w-full py-5 rounded-2xl font-black uppercase text-sm flex items-center justify-center gap-3 transition-all shadow-2xl ${
            isSuccess 
              ? 'bg-green-600 text-white' 
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
          {isProcessing ? "מעבד ושומר..." : isSuccess ? "נשמר בארכיון!" : "אשר ושמור נתונים"}
        </button>
      </div>

      {/* Footer Branding */}
      <div className="mt-12 opacity-20 flex justify-center">
        <div className="text-[40px] font-black italic tracking-tighter text-gray-500">SABAN 94</div>
      </div>
    </div>
  );
}
