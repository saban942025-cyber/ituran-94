'use client';
import { useEffect, useState, useMemo } from 'react';
import { db } from '../lib/firebase'; 
import { ref, onValue, push, remove, query, orderByChild, equalTo, get, update } from 'firebase/database';
import { 
  Zap, Fuel, Clock, ChevronDown, Activity, AlertTriangle, X, FileText, 
  Database, CheckCircle, MapPin, ExternalLink, Settings, LayoutGrid, Navigation, Microscope, Search, Trash2, AlertCircle, Share
} from 'lucide-react';

export default function SabanEliteFinalV17() {
  const [deliveryHistory, setDeliveryHistory] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState('2026-01-19');
  const [activePopup, setActivePopup] = useState<'inject' | null>(null);
  const [activeDriver, setActiveDriver] = useState<string | null>('חכמת');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  // בדיקה האם האפליקציה כבר מותקנת
  useEffect(() => {
    const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsStandalone(checkStandalone);
  }, []);

  useEffect(() => {
    const historyRef = ref(db, 'delivery_history');
    onValue(historyRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setDeliveryHistory(Object.keys(data).map(k => ({ id: k, ...data[k] })));
      } else { setDeliveryHistory([]); }
    });
  }, []);

  const deleteSelectedDay = async () => {
    if (!window.confirm(`מחיקת כל נתוני ${selectedDate}?`)) return;
    setIsDeleting(true);
    try {
      const historyRef = ref(db, 'delivery_history');
      const dayQuery = query(historyRef, orderByChild('date'), equalTo(selectedDate));
      const snapshot = await get(dayQuery);
      if (snapshot.exists()) {
        const updates: any = {};
        snapshot.forEach((child) => { updates[child.key!] = null; });
        await update(historyRef, updates);
        alert('היום נמחק.');
      }
    } catch (e) { alert('שגיאה'); }
    finally { setIsDeleting(false); }
  };

  const filteredHistory = useMemo(() => {
    return deliveryHistory.filter(t => t.date === selectedDate && (!activeDriver || String(t.dailyAnalysis || t.aiAnalysis || '').includes(activeDriver)));
  }, [deliveryHistory, selectedDate, activeDriver]);

  return (
    <div className="min-h-screen bg-[#F2F4F7] font-sans text-right pb-24" dir="rtl">
      
      {/* באנר חובת התקנה - מופיע רק בדפדפן */}
      {!isStandalone && (
        <div className="fixed inset-x-0 top-0 z-[200] bg-blue-600 p-4 shadow-2xl animate-bounce-subtle">
          <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-white">
              <div className="bg-white/20 p-2 rounded-lg"><Share size={18}/></div>
              <p className="text-[11px] font-black leading-tight">להתקנת המערכת כאפליקציה: לחץ על 'שיתוף' ואז 'הוסף למסך הבית'</p>
            </div>
            <button onClick={() => setIsStandalone(true)} className="text-white/60"><X size={18}/></button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-[#001D3D] p-5 rounded-b-[2.5rem] shadow-xl sticky top-0 z-[100]">
        <div className="max-w-xl mx-auto flex justify-between items-center mb-6 pt-2">
          <div className="flex items-center gap-3 text-white">
            <Microscope className="text-yellow-400" size={24}/>
            <h1 className="text-xl font-black italic tracking-tighter">SABAN X-RAY</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setActivePopup('inject')} className="p-2.5 bg-blue-800 text-white rounded-xl"><Database size={18}/></button>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-blue-900 text-white font-black text-[10px] p-2 rounded-xl border-none outline-none" />
          </div>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          <button onClick={() => setActiveDriver(null)} className={`flex-shrink-0 w-16 h-20 rounded-2xl flex flex-col items-center justify-center ${!activeDriver ? 'bg-white text-blue-900 shadow-xl' : 'bg-blue-900/40 text-blue-200'}`}>
            <span className="text-xl">🌐</span>
            <span className="text-[8px] font-black uppercase">הצי</span>
          </button>
          {['חכמת', 'מוחמד', 'עלי', 'יואב'].map(d => (
            <button key={d} onClick={() => setActiveDriver(d)} className={`flex-shrink-0 w-20 h-20 rounded-2xl flex flex-col items-center justify-center transition-all ${activeDriver === d ? 'bg-white text-blue-900 shadow-xl' : 'bg-blue-900/40 text-blue-100 opacity-60'}`}>
              <span className="text-2xl mb-1">{d === 'חכמת' || d === 'עלי' ? '🏗️' : '🚛'}</span>
              <span className="text-[9px] font-black">{d}</span>
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-xl mx-auto p-4 space-y-4">
        {filteredHistory.sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0)).map((ticket) => (
          <div key={ticket.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 cursor-pointer" onClick={() => setExpandedId(expandedId === ticket.id ? null : ticket.id)}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-white ${ticket.status === 'חריגה' ? 'bg-red-500' : 'bg-green-500'}`}>{ticket.efficiencyScore || '90'}</div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900 leading-none">{String(ticket.ticketId || '').replace('משלוח-', 'תעודה #')}</h4>
                    <p className="text-[10px] font-bold text-slate-400 mt-1">{ticket.customer}</p>
                  </div>
                </div>
                <div className="text-left"><span className="text-[11px] font-black text-blue-900 italic">{ticket.ituranTime}</span></div>
              </div>
              <div className={`p-4 rounded-2xl border-r-4 ${ticket.status === 'חריגה' ? 'bg-red-50 border-red-500' : 'bg-blue-50 border-blue-600'}`}>
                <p className="text-[11px] font-bold text-slate-800 leading-relaxed italic">{ticket.loadingTime || ticket.aiAnalysis}</p>
              </div>
            </div>
            {expandedId === ticket.id && (
              <div className="px-5 pb-5 flex gap-2">
                <a href={ticket.spLink || '#'} target="_blank" className="flex-1 bg-blue-950 text-white py-4 rounded-2xl font-black text-[10px] text-center shadow-lg uppercase"><ExternalLink size={14} className="inline ml-2"/> פתח תעודה</a>
                <button onClick={() => remove(ref(db, `delivery_history/${ticket.id}`))} className="p-4 bg-red-50 text-red-500 rounded-2xl"><Trash2 size={20}/></button>
              </div>
            )}
          </div>
        ))}
      </main>

      {/* Inject & Cleanup Popup */}
      {activePopup === 'inject' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-end justify-center">
          <div className="bg-white w-full max-w-xl rounded-t-[3rem] p-8 shadow-2xl animate-in slide-in-from-bottom-20">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-3"><Database className="text-yellow-500"/> עדכון יום: {selectedDate}</h3>
              <button onClick={() => setActivePopup(null)} className="p-2 bg-slate-100 rounded-full"><X size={20}/></button>
            </div>
            <div className="mb-4 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center justify-between">
              <p className="text-[10px] font-black text-red-700 uppercase">נקה נתוני יום זה לפני הזרקה?</p>
              <button onClick={deleteSelectedDay} disabled={isDeleting} className="px-4 py-2 bg-red-600 text-white rounded-xl font-black text-[10px] shadow-lg">מחק הכל</button>
            </div>
            <textarea value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} placeholder="הדבק JSON כאן..." className="w-full h-40 bg-slate-50 border rounded-2xl p-4 text-[10px] font-mono mb-4 outline-none focus:ring-2 ring-blue-500"/>
            <button onClick={() => {
              try {
                const data = JSON.parse(jsonInput);
                const items = Array.isArray(data) ? data : [data];
                items.forEach((item: any) => push(ref(db, 'delivery_history'), { ...item, date: item.date || selectedDate, timestamp: Date.now() }));
                alert('הוזרק!'); setJsonInput(''); setActivePopup(null);
              } catch (e) { alert('שגיאת JSON'); }
            }} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-xl uppercase text-xs">בצע הזרקה לארכיון</button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t p-3 flex justify-around items-center z-50">
        <button className="flex flex-col items-center gap-1 text-blue-600"><LayoutGrid size={22}/><span className="text-[8px] font-black uppercase tracking-tighter">שליטה</span></button>
        <button onClick={() => setActivePopup('inject')} className="flex flex-col items-center gap-1 text-slate-400"><Database size={22}/><span className="text-[8px] font-black uppercase tracking-tighter">ניהול</span></button>
        <button onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])} className="flex flex-col items-center gap-1 text-slate-400"><Clock size={22}/><span className="text-[8px] font-black uppercase tracking-tighter">היום</span></button>
      </nav>
    </div>
  );
}
