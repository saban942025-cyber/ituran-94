'use client';
import { useEffect, useState, useMemo } from 'react';
import { db } from '../lib/firebase'; 
import { ref, onValue, push, remove } from 'firebase/database';
import { 
  Zap, Fuel, Clock, ChevronDown, Activity, AlertTriangle, X, FileText, 
  Database, CheckCircle, MapPin, ExternalLink, Settings, LayoutGrid, Navigation, Microscope, Search, Trash2
} from 'lucide-react';

export default function SabanXRayDashboardV13() {
  const [deliveryHistory, setDeliveryHistory] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState('2026-01-19');
  const [activePopup, setActivePopup] = useState<'inject' | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [jsonInput, setJsonInput] = useState('');

  // טעינת נתונים
  useEffect(() => {
    const historyRef = ref(db, 'delivery_history');
    onValue(historyRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setDeliveryHistory(Object.keys(data).map(k => ({ id: k, ...data[k] })));
      } else {
        setDeliveryHistory([]);
      }
    });
  }, []);

  // הזרקה חכמה - מוסיפה תאריך אוטומטית
  const handleInject = () => {
    try {
      const data = JSON.parse(jsonInput);
      const historyRef = ref(db, 'delivery_history');
      
      const dataWithDate = Array.isArray(data) ? data.map(item => ({
        ...item,
        date: item.date || selectedDate, // אם אין תאריך, קח את התאריך מהלוח שנה
        timestamp: Date.now()
      })) : [{ ...data, date: data.date || selectedDate, timestamp: Date.now() }];

      dataWithDate.forEach((item: any) => push(historyRef, item));
      
      alert(`הוזרקו ${dataWithDate.length} תעודות ליום ${selectedDate}`);
      setJsonInput('');
      setActivePopup(null);
    } catch (e) {
      alert('שגיאה בפורמט ה-JSON. וודא שהעתקת את כל הקוד מה-Copilot.');
    }
  };

  const filteredHistory = useMemo(() => {
    return deliveryHistory.filter(t => t.date === selectedDate);
  }, [deliveryHistory, selectedDate]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-right flex flex-col md:flex-row" dir="rtl">
      
      {/* Sidebar - נכסי האתר */}
      <aside className="w-full md:w-80 bg-[#001D3D] text-white p-6 overflow-y-auto hidden md:block border-l border-blue-800">
        <div className="flex items-center gap-2 mb-10">
          <div className="p-2 bg-blue-600 rounded-lg"><Microscope size={20} className="text-white" /></div>
          <h2 className="text-xl font-black tracking-tighter">X-RAY ASSETS</h2>
        </div>
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-4">תעודות ביום הנבחר ({filteredHistory.length})</p>
          {filteredHistory.map((t, i) => (
            <div key={i} className={`p-4 rounded-2xl border transition-all cursor-pointer ${t.status === 'חריגה' ? 'border-red-500/50 bg-red-500/10' : 'border-blue-700/50 bg-blue-900/30'}`} onClick={() => setExpandedId(t.id)}>
              <p className="text-xs font-black truncate">{t.customer}</p>
              <div className="flex justify-between items-center mt-2">
                 <span className="text-[9px] text-blue-400 font-bold">#{String(t.ticketId).slice(-4)}</span>
                 <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${t.status === 'חריגה' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                   {t.efficiencyScore}%
                 </span>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white p-6 shadow-sm border-b flex flex-col md:flex-row justify-between items-center sticky top-0 z-50 gap-4">
          <div className="flex items-center gap-3">
            <div className="md:hidden p-2 bg-blue-600 rounded-lg text-white"><Microscope size={20} /></div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 leading-tight">SABAN <span className="text-blue-600 font-black">X-RAY</span></h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase">ניתוח הצלבות איתוראן וכתב יד</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button onClick={() => setActivePopup('inject')} className="flex-1 md:flex-none px-6 py-3 bg-yellow-400 text-blue-900 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg hover:bg-yellow-500 transition-all">
              <Database size={16} /> הזרקת נתוני Copilot
            </button>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-slate-100 text-slate-700 font-black text-xs p-3 rounded-2xl border-none outline-none focus:ring-2 ring-blue-500" />
          </div>
        </header>

        <main className="p-6 space-y-6 max-w-5xl mx-auto w-full">
          {filteredHistory.length === 0 && (
            <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
              <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400"><Search size={32}/></div>
              <h3 className="text-xl font-black text-slate-400">אין נתונים ליום זה</h3>
              <p className="text-sm font-bold text-slate-300">לחץ על "הזרקת נתונים" כדי להוסיף את ניתוח ה-Copilot</p>
            </div>
          )}

          {filteredHistory.sort((a,b) => (a.timestamp || 0) - (b.timestamp || 0)).map((ticket) => (
            <div key={ticket.id} className={`bg-white rounded-[2.5rem] shadow-sm border-2 overflow-hidden transition-all ${expandedId === ticket.id ? 'ring-4 ring-blue-500/10 border-blue-200' : 'border-slate-100 hover:border-blue-100'}`}>
              <div className="p-6 cursor-pointer" onClick={() => setExpandedId(expandedId === ticket.id ? null : ticket.id)}>
                
                {/* Status Bar */}
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full animate-pulse ${ticket.status === 'חריגה' ? 'bg-red-500' : 'bg-green-500'}`}></span>
                    <span className={`text-[11px] font-black uppercase tracking-widest ${ticket.status === 'חריגה' ? 'text-red-500' : 'text-green-500'}`}>
                      {ticket.status === 'חריגה' ? '⚠️ X-RAY ALERT: חריגת זמנים' : '✅ בדיקה תקינה'}
                    </span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); remove(ref(db, `delivery_history/${ticket.id}`)); }} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                  <div className="flex items-center gap-6">
                    <div className={`w-20 h-20 rounded-3xl flex flex-col items-center justify-center border-b-4 ${ticket.status === 'חריגה' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                      <span className="text-2xl font-black">{ticket.efficiencyScore || '0'}</span>
                      <span className="text-[9px] font-bold uppercase">SCORE</span>
                    </div>
                    <div>
                      <h4 className="text-2xl font-black text-slate-900 leading-none mb-2">
                        {String(ticket.ticketId || '').replace('משלוח-', 'תעודה #')}
                      </h4>
                      <p className="text-base font-bold text-slate-500 flex items-center gap-1"><MapPin size={18} className="text-blue-500"/> {ticket.customer}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center min-w-[120px]">
                      <span className="text-[9px] font-black text-slate-400 block uppercase mb-1">שעת תעודה</span>
                      <span className="text-sm font-black text-slate-800">{ticket.dailyAnalysis?.documentExtraction?.documentTime || '---'}</span>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-center min-w-[120px]">
                      <span className="text-[9px] font-black text-blue-400 block uppercase mb-1">חלון PTO</span>
                      <span className="text-sm font-black text-blue-800">{ticket.dailyAnalysis?.ituranMatch?.matchedPTO?.window?.start || '---'} - {ticket.dailyAnalysis?.ituranMatch?.matchedPTO?.window?.end || '---'}</span>
                    </div>
                  </div>
                </div>

                {/* Deep Analysis Text Area */}
                <div className={`mt-8 p-6 rounded-[2rem] border-r-8 transition-all ${ticket.status === 'חריגה' ? 'bg-red-50 border-red-500' : 'bg-blue-50/50 border-blue-600'}`}>
                  <div className="flex items-center gap-2 mb-3 text-blue-900">
                    <Microscope size={18} className={ticket.status === 'חריגה' ? 'text-red-500' : 'text-blue-600'} />
                    <span className="text-xs font-black uppercase italic">ממצאים ומסקנות מהצלבת נתונים:</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800 leading-relaxed mb-4">
                    {ticket.loadingTime}
                  </p>
                  
                  {/* Notes List */}
                  {ticket.dailyAnalysis?.xRayAlert?.notes && (
                    <div className="space-y-2 border-t border-slate-200 pt-4">
                      {ticket.dailyAnalysis.xRayAlert.notes.map((note: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2 text-xs font-bold text-slate-600">
                          <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0"></div>
                          {note}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-center">
                  <ChevronDown className={`text-slate-300 transition-transform ${expandedId === ticket.id ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {expandedId === ticket.id && (
                <div className="px-8 pb-8 pt-0 animate-in fade-in slide-in-from-top-4">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                      <div>
                        <h5 className="text-[10px] font-black text-slate-400 uppercase mb-3 flex items-center gap-2">
                          <Navigation size={14}/> מדדי תנועה ומרחק
                        </h5>
                        <p className="text-sm font-bold text-slate-700 leading-relaxed">{ticket.travelMetrics}</p>
                      </div>
                      <div className="flex flex-col justify-center gap-3">
                         <a href={ticket.spLink || '#'} target="_blank" className="w-full bg-blue-950 text-white py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg">
                           <ExternalLink size={16}/> צפה בנכס המקורי (תעודה סרוקה)
                         </a>
                      </div>
                   </div>
                </div>
              )}
            </div>
          ))}
        </main>
      </div>

      {/* Modal להזרקה */}
      {activePopup === 'inject' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[3rem] p-8 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                 <Database className="text-yellow-500" size={28}/> הזרקת JSON רנטגן
              </h3>
              <button onClick={() => setActivePopup(null)} className="p-2 bg-slate-100 rounded-full text-slate-400"><X size={20}/></button>
            </div>
            <p className="text-xs font-bold text-slate-400 mb-4">הדבק את הקוד שקיבלת מה-Copilot עבור יום {selectedDate}. המערכת תוסיף את התאריך אוטומטית.</p>
            <textarea 
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="הדבק כאן... [ { 'ticketId': ... } ]"
              className="w-full h-80 bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-6 text-[11px] font-mono outline-none focus:border-blue-500 transition-all"
            />
            <div className="flex gap-3 mt-6">
              <button onClick={() => setActivePopup(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-sm">ביטול</button>
              <button onClick={handleInject} className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-600/20">בצע הזרקה לארכיון</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
