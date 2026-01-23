'use client';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { ref, onValue, push, set } from 'firebase/database';
import { 
  Truck, FileText, Clock, Package, Database, Search, AlertCircle, X, ExternalLink, Calendar
} from 'lucide-react';

export default function SabanEliteArchiveV5() {
  const [deliveryHistory, setDeliveryHistory] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState('2026-01-19');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);
  const [jsonInput, setJsonInput] = useState('');

  useEffect(() => {
    const historyRef = ref(db, 'delivery_history');
    onValue(historyRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]: any) => ({ id, ...val }));
        setDeliveryHistory(list.filter(item => item.date === selectedDate));
      }
    });
  }, [selectedDate]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 pb-24 font-sans italic-none text-right" dir="rtl">
      {/* Header */}
      <header className="bg-white rounded-[2.5rem] shadow-xl p-6 mb-6 border-b-4 border-blue-900 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-blue-950 flex items-center gap-3">
            <Package className="text-blue-600" /> ארכיון תעודות 365
          </h1>
          <p className="text-slate-500 text-xs font-bold">סגירת מעגל: איתוראן + AI + מיקרוסופט</p>
        </div>
        <input 
          type="date" 
          value={selectedDate} 
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-slate-100 p-2 rounded-2xl font-bold border-none outline-none text-blue-900"
        />
      </header>

      {/* Search & Actions */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 bg-white rounded-3xl shadow-sm flex items-center px-4 border-2 border-slate-100">
          <Search size={20} className="text-slate-400" />
          <input 
            placeholder="חפש תעודה, לקוח או נהג..." 
            className="w-full p-3 bg-transparent outline-none text-sm"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setShowAdmin(true)}
          className="bg-blue-900 text-white p-4 rounded-3xl shadow-lg hover:scale-105 transition-transform"
        >
          <Database size={20} />
        </button>
      </div>

      {/* Archive Grid - Dynamic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {deliveryHistory.filter(item => 
          item.customer?.includes(searchTerm) || item.ticketId?.includes(searchTerm)
        ).map((ticket) => (
          <div 
            key={ticket.id}
            className="bg-white rounded-[2rem] p-5 shadow-md border-r-[10px] relative overflow-hidden transition-all hover:shadow-xl"
            style={{ borderRightColor: ticket.statusColor || '#CBD5E1' }}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 block tracking-widest">מזהה תעודה</span>
                <h3 className="text-xl font-black text-blue-950">#{ticket.ticketId}</h3>
              </div>
              <a 
                href={ticket.spLink} 
                target="_blank"
                className="bg-slate-100 p-3 rounded-2xl text-blue-600 hover:bg-blue-600 hover:text-white transition-colors"
                title="פתח מקור ב-365"
              >
                <ExternalLink size={18} />
              </a>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3 mb-4 border border-slate-100">
              <p className="text-xs font-bold text-slate-600 mb-1 flex items-center gap-1">
                <AlertCircle size={14} className="text-blue-500" /> ניתוח AI (קופיילוט):
              </p>
              <p className="text-[13px] leading-relaxed text-slate-800">{ticket.aiAnalysis}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50/50 p-2 rounded-xl text-center border border-blue-100">
                <span className="text-[9px] font-bold text-blue-400 block">דיווח ידני</span>
                <span className="font-mono font-bold text-blue-900">{ticket.manualTime}</span>
              </div>
              <div className="bg-emerald-50/50 p-2 rounded-xl text-center border border-emerald-100">
                <span className="text-[9px] font-bold text-emerald-400 block">אמת איתוראן</span>
                <span className="font-mono font-bold text-emerald-900">{ticket.ituranTime}</span>
              </div>
            </div>

            {ticket.status === 'חריגה' && (
              <div className="mt-4 flex items-center gap-2 text-red-600 font-bold text-[11px] bg-red-50 p-2 rounded-lg">
                <AlertCircle size={14} /> דרוש בירור מיידי מול נהג
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Admin Modal for JSON Injection */}
      {showAdmin && (
        <div className="fixed inset-0 bg-blue-950/60 backdrop-blur-md z-[5000] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3.5rem] w-full max-w-2xl shadow-2xl p-10 relative">
            <button onClick={() => setShowAdmin(false)} className="absolute top-8 left-8 text-slate-400 hover:text-red-500"><X size={30}/></button>
            <h3 className="text-2xl font-black mb-6 text-blue-900 flex items-center gap-3">
              <Database /> הזרקת דוח קופיילוט
            </h3>
            <textarea 
              value={jsonInput} 
              onChange={(e) => setJsonInput(e.target.value)} 
              className="w-full h-80 p-6 font-mono text-[12px] border-2 rounded-[2.5rem] bg-slate-50 mb-6 outline-none focus:border-blue-500" 
              placeholder="הדבק את ה-JSON שקופיילוט יצר כאן..."
            />
            <button 
              onClick={async () => {
                try {
                  const parsed = JSON.parse(jsonInput);
                  const items = Array.isArray(parsed) ? parsed : [parsed];
                  const historyRef = ref(db, 'delivery_history');
                  for (const item of items) {
                    const newItemRef = push(historyRef);
                    await set(newItemRef, { ...item, date: item.date || selectedDate });
                  }
                  setJsonInput(''); setShowAdmin(false); alert('הארכיון עודכן בהצלחה!');
                } catch (e) { alert('שגיאה בפורמט ה-JSON'); }
              }}
              className="w-full bg-blue-900 text-white font-black py-5 rounded-[2rem] shadow-xl hover:bg-blue-800"
            >
              עדכן ארכיון יומי
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
