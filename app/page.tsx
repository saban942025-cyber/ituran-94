'use client';
import { useEffect, useState, useMemo } from 'react';
import { db } from '../lib/firebase';
import { ref, onValue, push, set, remove } from 'firebase/database';
import dynamic from 'next/dynamic';
import { 
  Package, Database, Search, AlertCircle, X, ExternalLink, Calendar, CheckCircle2, Trash2
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
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.keys(data).map(k => ({ id: k, ...data[k] }));
        setDeliveryHistory(list);
      } else {
        setDeliveryHistory([]);
      }
    });
  }, []);

  const filteredHistory = useMemo(() => 
    deliveryHistory
      .filter(t => t.date === selectedDate)
      .filter(t => {
        const id = String(t.ticketId || "");
        const cust = String(t.customer || "").toLowerCase();
        return id.includes(searchTerm) || cust.includes(searchTerm.toLowerCase());
      }), 
  [deliveryHistory, selectedDate, searchTerm]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-right" dir="rtl">
      {/* Header המעוצב */}
      <header className="bg-white border-b-4 border-blue-900 shadow-xl sticky top-0 z-[1000] p-6 flex justify-between items-center rounded-b-[2rem]">
        <div className="flex items-center gap-6">
          <div className="border-l-4 pl-4 border-blue-900">
            <h1 className="text-2xl font-black text-blue-900 italic">ח.סבן | ארכיון 365</h1>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Management Elite 5.0</span>
          </div>
          <div className="flex bg-slate-100 rounded-2xl p-1 gap-2 border border-slate-200">
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent font-black text-sm p-1 outline-none text-blue-900 cursor-pointer" />
            <div className="relative">
              <Search size={14} className="absolute right-3 top-2.5 text-slate-400" />
              <input type="text" placeholder="חיפוש בארכיון..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pr-9 py-1.5 rounded-xl border-none bg-white text-xs font-bold w-48 shadow-sm focus:ring-2 focus:ring-blue-200" />
            </div>
          </div>
        </div>
        <button onClick={() => setShowAdmin(true)} className="flex items-center gap-2 px-6 py-2 bg-blue-900 text-white rounded-full font-black text-xs shadow-lg hover:scale-105 transition-all">
          <Database size={16}/> הזרקת ניתוח קופיילוט
        </button>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* תצוגת כרטיסיות דינמית */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHistory.map((ticket) => (
            <div key={ticket.id} className="bg-white rounded-[2.5rem] p-6 shadow-xl border-t-[12px] transition-all hover:scale-[1.02]" style={{ borderTopColor: ticket.statusColor }}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[10px] font-black text-slate-400 block tracking-tighter">תעודת משלוח</span>
                  <h4 className="font-black text-blue-950 text-xl">#{ticket.ticketId}</h4>
                </div>
                <a href={ticket.spLink} target="_blank" className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-colors shadow-sm">
                  <ExternalLink size={20} />
                </a>
              </div>

              <h2 className="font-black text-slate-800 mb-4">{ticket.customer}</h2>

              <div className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
                <p className="text-[11px] font-black text-blue-700 mb-1 flex items-center gap-1 uppercase">
                  <AlertCircle size={14}/> ניתוח AI דינמי:
                </p>
                <p className="text-xs font-bold leading-relaxed text-slate-600 italic">"{ticket.aiAnalysis}"</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                  <span className="text-[9px] font-black text-slate-400 block">דיווח ידני</span>
                  <span className="text-sm font-black text-slate-700">{ticket.manualTime}</span>
                </div>
                <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100 text-center">
                  <span className="text-[9px] font-black text-blue-400 block">אמת איתוראן</span>
                  <span className="text-sm font-black text-blue-900">{ticket.ituranTime}</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className={`flex items-center gap-1 text-[10px] font-black px-3 py-1 rounded-full ${ticket.status === 'תקין' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {ticket.status === 'תקין' ? <CheckCircle2 size={12}/> : <AlertCircle size={12}/>}
                  {ticket.status}
                </div>
                <button onClick={() => remove(ref(db, `delivery_history/${ticket.id}`))} className="text-slate-300 hover:text-red-500 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Admin Modal */}
      {showAdmin && (
        <div className="fixed inset-0 bg-blue-950/40 backdrop-blur-md z-[2000] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3.5rem] w-full max-w-2xl shadow-2xl p-10 border-t-[12px] border-blue-900 relative">
            <button onClick={() => setShowAdmin(false)} className="absolute top-6 left-6 text-slate-400 hover:text-red-500 transition-colors"><X size={28}/></button>
            <h3 className="text-2xl font-black mb-6 flex items-center gap-3 text-blue-900"><Database size={26}/> הזרקת דוח קופיילוט לארכיון</h3>
            <textarea value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} className="w-full h-80 p-6 font-mono text-[11px] border-2 rounded-[3rem] bg-slate-50 mb-6 outline-none focus:border-blue-500 shadow-inner" placeholder="הדבק JSON מקופיילוט כאן..." />
            <button onClick={async () => {
              try {
                const parsed = JSON.parse(jsonInput);
                const items = Array.isArray(parsed) ? parsed : [parsed];
                for (const item of items) { await push(ref(db, 'delivery_history'), { ...item, date: item.date || selectedDate }); }
                setJsonInput(''); setShowAdmin(false); alert('הארכיון עודכן בהצלחה!');
              } catch { alert('JSON לא תקין'); }
            }} className="w-full py-5 bg-blue-900 text-white rounded-[2rem] font-black text-lg shadow-xl hover:bg-black transition-all">בצע עדכון ארכיון</button>
          </div>
        </div>
      )}
    </div>
  );
}
