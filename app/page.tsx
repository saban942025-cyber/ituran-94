'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { LayoutDashboard, Truck, ClipboardCheck, Clock, Package, CheckCircle2 } from 'lucide-react';

function Dashboard() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'delivery_history'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-[#0b141a] text-white p-6" dir="rtl">
      <header className="flex items-center gap-4 mb-10 border-b border-gray-800 pb-6">
        <div className="bg-[#C9A227] p-3 rounded-2xl text-black shadow-lg"><LayoutDashboard size={28}/></div>
        <div>
          <h1 className="text-2xl font-black">ח. סבן - מרכז שליטה</h1>
          <p className="text-[10px] text-[#C9A227] font-bold uppercase tracking-widest italic">Intelligence Logistics</p>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'תעודות היום', val: history.length, icon: ClipboardCheck, color: 'text-blue-400' },
          { label: 'נהגים בשטח', val: '5', icon: Truck, color: 'text-green-500' },
        ].map((s, i) => (
          <div key={i} className="bg-[#202c33] p-4 rounded-2xl border border-gray-700 flex flex-col items-center">
            <s.icon size={20} className={s.color} />
            <div className="text-xl font-black mt-2">{s.val}</div>
            <div className="text-[9px] font-bold text-gray-500 uppercase">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-black flex items-center gap-2 text-gray-400 uppercase tracking-widest"><Package size={16}/> עדכונים אחרונים</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {history.map((item) => (
            <div key={item.id} className="bg-[#202c33] p-5 rounded-2xl border border-gray-700 shadow-xl">
              <div className="flex justify-between items-start">
                <div className="font-black text-sm">{item.customerName}</div>
                <div className="text-[#C9A227] font-black text-lg">{item.quantity} {item.unitType}</div>
              </div>
              <div className="text-[10px] text-gray-500 mt-1 uppercase">{item.productName}</div>
              <div className="mt-4 pt-3 border-t border-gray-800 flex justify-between items-center text-[10px]">
                <span className="flex items-center gap-1 text-gray-600"><Clock size={10}/> {item.timestamp?.toDate ? new Date(item.timestamp.toDate()).toLocaleTimeString('he-IL') : 'עכשיו'}</span>
                <span className="text-green-500 font-black uppercase tracking-widest">סופק ✅</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return <Suspense><Dashboard/></Suspense>;
}
