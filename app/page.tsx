'use client';

import React, { useState } from 'react';
import { db } from '../lib/firebase'; // נתיב מעודכן לפי מבנה התיקיות
import { ref, push } from 'firebase/database';
import { Database, FileJson, Send, ArrowRight, Layout, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function AIAnalyzerPage() {
  const [jsonInput, setJsonInput] = useState('');
  const [stagedData, setStagedData] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStaging = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setStagedData(Array.isArray(parsed) ? parsed : [parsed]);
    } catch (e) {
      alert('שגיאה בפורמט ה-JSON. וודא שהעתקת את הקוד במלואו.');
    }
  };

  const commitToFirebase = async () => {
    setIsProcessing(true);
    try {
      const historyRef = ref(db, 'delivery_history');
      for (const item of stagedData) {
        await push(historyRef, {
          ...item,
          timestamp: new Date().toISOString()
        });
      }
      alert('הנתונים הוזרקו בהצלחה לארכיון!');
      setStagedData([]);
      setJsonInput('');
    } catch (e) {
      alert('שגיאה בשמירה למאגר הנתונים');
    }
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] p-8 font-sans text-right" dir="rtl">
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-black text-blue-900 flex items-center gap-3 italic">
            <FileJson size={32} /> מעבד נתונים Saban AI
          </h1>
          <p className="text-slate-500 font-bold">שלב הביניים לפני הזרקה לארכיון 365</p>
        </div>
        <Link href="/" className="flex items-center gap-2 font-black text-blue-600 hover:underline">
          חזור ללוח הבקרה <ArrowRight size={20} className="rotate-180" />
        </Link>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[3rem] p-8 shadow-2xl border-b-8 border-blue-900">
          <h2 className="text-xl font-black mb-4 flex items-center gap-2">
            <Database className="text-blue-500" /> הדבק JSON מקופיילוט
          </h2>
          <textarea 
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="w-full h-96 p-6 font-mono text-xs bg-slate-900 text-emerald-400 rounded-[2rem] outline-none border-4 border-slate-100 focus:border-blue-400 transition-all text-left"
            dir="ltr"
            placeholder='[ { "ticketId": "6710..." } ]'
          />
          <button 
            onClick={handleStaging}
            className="w-full mt-6 py-5 bg-blue-900 text-white rounded-[2rem] font-black text-lg hover:bg-black transition-all shadow-xl"
          >
            נתח נתונים לתצוגה מקדימה
          </button>
        </div>

        <div className="bg-white rounded-[3rem] p-8 shadow-2xl border-b-8 border-emerald-500">
          <h2 className="text-xl font-black mb-4 flex items-center gap-2 text-emerald-600">
            <Layout /> תצוגה לפני הזרקה ({stagedData.length})
          </h2>
          
          <div className="h-[400px] overflow-y-auto space-y-4 pr-2">
            {stagedData.length > 0 ? stagedData.map((item, idx) => (
              <div key={idx} className="p-4 rounded-2xl border-2 border-slate-100 bg-slate-50">
                <div className="flex justify-between items-start">
                  <span className="font-black text-blue-900">#{item.ticketId}</span>
                  <span className="px-2 py-1 rounded-lg text-[10px] font-black text-white" style={{ backgroundColor: item.statusColor }}>
                    {item.status}
                  </span>
                </div>
                <p className="text-xs font-bold mt-1">{item.customer}</p>
                <div className="mt-2 text-[10px] text-slate-500 italic border-t pt-2 leading-relaxed">
                  {item.aiAnalysis}
                </div>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300">
                <AlertCircle size={48} />
                <p className="font-bold mt-2">ממתין להזנת נתונים...</p>
              </div>
            )}
          </div>

          <button 
            disabled={stagedData.length === 0 || isProcessing}
            onClick={commitToFirebase}
            className="w-full mt-6 py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-lg hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-xl flex items-center justify-center gap-3"
          >
            {isProcessing ? 'מעבד...' : <><Send size={24} /> אשר והזרק לארכיון הראשי</>}
          </button>
        </div>
      </main>
    </div>
  );
}
