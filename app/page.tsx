'use client';
import { useEffect, useState, useMemo } from 'react';
import { db } from '../lib/firebase'; 
import { ref, onValue, push } from 'firebase/database';
import { 
  Zap, Fuel, Clock, ChevronDown, Activity, AlertTriangle, X, FileText, 
  Database, CheckCircle, MapPin, ExternalLink, Settings, LayoutGrid, Navigation, Microscope
} from 'lucide-react';

export default function SabanXRayDashboard() {
  const [deliveryHistory, setDeliveryHistory] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState('2026-01-19');
  const [activePopup, setActivePopup] = useState<'inject' | null>(null);
  const [jsonInput, setJsonInput] = useState('');

  useEffect(() => {
    const historyRef = ref(db, 'delivery_history');
    onValue(historyRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setDeliveryHistory(Object.keys(data).map(k => ({ id: k, ...data[k] })));
      }
    });
  }, []);

  const filteredHistory = useMemo(() => {
    return deliveryHistory.filter(t => t.date === selectedDate);
  }, [deliveryHistory, selectedDate]);

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-sans text-right flex flex-col md:flex-row" dir="rtl">
      
      {/* Sidebar - נכסי האתר */}
      <aside className="w-full md:w-72 bg-[#001D3D] text-white p-6 overflow-y-auto hidden md:block border-l border-blue-800">
        <div className="flex items-center gap-2 mb-10 opacity-80">
          <Microscope size={22} className="text-yellow-400" />
          <h2 className="text-lg font-black tracking-tighter uppercase">X-RAY ASSETS</h2>
        </div>
        <div className="space-y-4">
          <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">תעודות משלוח (19-01)</p>
          {filteredHistory.map((t, i) => (
            <div key={i} className="p-3 bg-blue-900/40 rounded-xl border border-blue-700/50 hover:bg-blue-800 transition-all cursor-pointer">
              <p className="text-xs font-black truncate">{t.customer}</p>
              <p className="text-[9px] text-blue-400 mt-1">ID: {t.ticketId}</p>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white p-6 shadow-sm border-b flex justify-between items-center sticky top-0 z-50">
          <div>
            <h1 className="text-2xl font-black text-slate-900 italic">SABAN <span className="text-blue-600">X-RAY</span> AI</h1>
            <p className="text-[10px] font-bold text-slate-400">הצלבת נתוני כתב יד ו-GPS בזמן אמת</p>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => setActivePopup('inject')} className="px-4 py-2 bg-yellow-400 text-blue-900 rounded-xl font-black text-xs flex items-center gap-2">
                <Database size={14} /> הזרקת ניתוח Copilot
              </button>
             <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-slate-100 text-slate-700 font-black text-xs p-2 rounded-xl border-none outline-none" />
          </div>
        </header>

        <main className="p-6 space-y-6 max-w-5xl mx-auto w-full">
          {filteredHistory.map((ticket) => (
            <div key={ticket.id} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6">
                {/* Header: Ticket & Customer */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black">
                      {ticket.efficiencyScore || '92'}%
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-slate-900">{String(ticket.ticketId || '').replace('משלוח-', 'תעודה #')}</h4>
                      <div className="flex items-center gap-2 text-slate-400 text-sm font-bold">
                        <MapPin size={14} /> {ticket.customer}
                      </div>
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase ${ticket.status === 'חריגה' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                    {ticket.status || 'תקין'}
                  </div>
                </div>

                {/* X-Ray Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                      <Clock size={14} /> <span className="text-[10px] font-black uppercase">זמני העמסה (תעודה)</span>
                    </div>
                    <p className="text-sm font-black text-slate-800">{ticket.loadingTime || 'לא צוין'}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                      <Zap size={14} /> <span className="text-[10px] font-black uppercase">פעילות PTO איתוראן</span>
                    </div>
                    <p className="text-sm font-black text-blue-600">{ticket.ituranTime}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                      <Navigation size={14} /> <span className="text-[10px] font-black uppercase">מרחק וזמן נסיעה</span>
                    </div>
                    <p className="text-sm font-black text-slate-800">{ticket.travelMetrics || 'בחישוב...'}</p>
                  </div>
                </div>

                {/* Deep Analysis Text Area */}
                <div className="bg-blue-50/30 rounded-[2rem] p-6 border-r-8 border-blue-600">
                  <h5 className="text-[11px] font-black text-blue-800 uppercase italic mb-2 flex items-center gap-2">
                    <Microscope size={14} /> ניתוח רנטגן - הצלבת כתב יד ו-GPS:
                  </h5>
                  <p className="text-sm font-bold text-slate-700 leading-relaxed italic">
                    {ticket.dailyAnalysis || 'ממתין להזרקת נתונים מ-Copilot...'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </main>
      </div>

      {/* Inject Modal */}
      {activePopup === 'inject' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[3rem] p-8 shadow-2xl">
            <h3 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-2">
               <Database className="text-yellow-500"/> הזרקת X-RAY JSON
            </h3>
            <textarea 
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="הדבק כאן את ה-JSON מ-Copilot..."
              className="w-full h-80 bg-slate-50 border rounded-3xl p-6 text-xs font-mono outline-none"
            />
            <button onClick={() => {
              try {
                const data = JSON.parse(jsonInput);
                const historyRef = ref(db, 'delivery_history');
                data.forEach((item: any) => push(historyRef, item));
                alert('הניתוח הוזרק בהצלחה!');
                setJsonInput('');
                setActivePopup(null);
              } catch (e) { alert('שגיאה ב-JSON'); }
            }} className="w-full mt-4 py-5 bg-blue-600 text-white rounded-3xl font-black shadow-lg">הזרק לארכיון</button>
          </div>
        </div>
      )}
    </div>
  );
}
