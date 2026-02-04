'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { 
  LayoutDashboard, 
  Truck, 
  ClipboardCheck, 
  Clock, 
  Package, 
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

function DashboardContent() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // התחברות לאוסף ב-Firestore עם מיון לפי זמן
    const q = query(collection(db, 'delivery_history'), orderBy('timestamp', 'desc'));
    
    // האזנה בזמן אמת (Real-time listener)
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHistory(docs);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Listen Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-[#0b141a] text-white font-sans" dir="rtl">
      {/* Header */}
      <header className="bg-[#202c33] p-6 border-b border-gray-700 shadow-xl">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="bg-[#C9A227] p-3 rounded-2xl shadow-[0_0_15px_rgba(201,162,39,0.4)]">
              <LayoutDashboard className="text-black" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">ח. סבן - מרכז שליטה</h1>
              <p className="text-[10px] text-[#C9A227] font-bold uppercase tracking-widest italic">Intelligence Logistics v1.5</p>
            </div>
          </div>
          <div className="hidden md:flex bg-[#1c272d] px-4 py-2 rounded-full border border-gray-700 items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold uppercase tracking-tighter">מחובר בזמן אמת לארכיון</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6 space-y-8">
        
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'תעודות היום', val: history.length, icon: ClipboardCheck, color: 'text-blue-400' },
            { label: 'בטיפול', val: '2', icon: Clock, color: 'text-yellow-500' },
            { label: 'נהגים בשטח', val: '5', icon: Truck, color: 'text-green-500' },
            { label: 'סופקו', val: history.filter(i => i.status === 'completed').length, icon: CheckCircle2, color: 'text-[#C9A227]' },
          ].map((stat, i) => (
            <div key={i} className="bg-[#202c33] p-4 rounded-2xl border border-gray-700 flex flex-col items-center justify-center space-y-1 shadow-lg">
              <stat.icon size={20} className={stat.color} />
              <div className="text-xl font-black">{stat.val}</div>
              <div className="text-[9px] font-bold text-gray-500 uppercase">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Live History Feed */}
        <div className="space-y-4">
          <h2 className="text-sm font-black flex items-center gap-2 text-gray-400 uppercase tracking-widest">
            <Package size={16} /> עדכונים אחרונים מהשטח
          </h2>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-[#C9A227] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="bg-[#202c33] p-10 rounded-3xl border border-dashed border-gray-700 text-center">
              <AlertCircle className="mx-auto text-gray-600 mb-2" size={40} />
              <p className="text-gray-500 font-bold">אין נתונים להצגה מהיומיים האחרונים</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {history.map((item) => (
                <div key={item.id} className="bg-[#202c33] p-5 rounded-2xl border border-gray-700 hover:border-[#C9A227]/50 transition-all group shadow-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-black/30 rounded-full flex items-center justify-center font-black text-[#C9A227] text-xs">
                        {item.customerName?.charAt(0) || 'ש'}
                      </div>
                      <div>
                        <div className="text-sm font-black">{item.customerName}</div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase">{item.productName}</div>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-[#C9A227] font-black text-lg">{item.quantity}</div>
                      <div className="text-[9px] text-gray-500 font-bold uppercase">{item.unitType}</div>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-gray-800 flex justify-between items-center">
                    <span className="text-[9px] text-gray-600 font-bold flex items-center gap-1 uppercase">
                      <Clock size={10} /> {item.timestamp?.toDate ? new Date(item.timestamp.toDate()).toLocaleTimeString('he-IL') : 'זה עתה'}
                    </span>
                    <span className="px-3 py-1 bg-green-900/30 text-green-500 rounded-full text-[8px] font-black uppercase tracking-widest border border-green-500/20">
                      סופק בהצלחה
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="py-10 opacity-30 flex flex-col items-center space-y-2">
        <div className="text-[40px] font-black italic tracking-tighter text-gray-600">SABAN 94</div>
        <div className="text-[10px] font-bold tracking-[0.3em] uppercase">Built with Intelligence</div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="bg-[#0b141a] h-screen flex items-center justify-center font-black text-[#C9A227] animate-pulse uppercase italic">Saban Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
