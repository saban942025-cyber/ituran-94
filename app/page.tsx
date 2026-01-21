'use client';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase'; // יוצאים מ-app ונכנסים ל-lib
import { ref, onValue } from 'firebase/database';

export default function SabanDashboard() {
  const [drivers, setDrivers] = useState<any>({});
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    // האזנה חיה לצוות
    const teamRef = ref(db, 'team');
    onValue(teamRef, (snapshot) => {
      setDrivers(snapshot.val() || {});
    });

    // האזנה להודעות אחרונות
    const msgRef = ref(db, 'internal_messages');
    onValue(msgRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setAlerts(Object.values(data).reverse().slice(0, 5));
      }
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 dir-rtl text-right">
      <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border-r-4 border-blue-600">
        <div>
          <h1 className="text-2xl font-black text-slate-800">ח.סבן - ניהול צי חכם</h1>
          <p className="text-slate-500 text-sm">סטטוס צוות בזמן אמת</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(drivers).map(([name, data]: any) => (
          <div key={name} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
               <span className={`px-3 py-1 rounded-full text-xs font-bold ${data.status === 'עבודת מנוף' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                {data.status}
              </span>
              <h2 className="text-xl font-bold text-slate-800">{name}</h2>
            </div>
            <p className="text-slate-600 text-sm mb-1">📍 {data.last_seen}</p>
            <p className="text-slate-400 text-xs">מהירות: {data.speed} קמ"ש</p>
          </div>
        ))}
      </div>

      <section className="mt-12 bg-slate-800 text-white p-6 rounded-2xl shadow-lg">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          התראות אחרונות
        </h3>
        <div className="space-y-3">
          {alerts.map((alert, i) => (
            <div key={i} className="text-sm border-b border-slate-700 pb-2 last:border-0 opacity-90">
              {alert.message}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
