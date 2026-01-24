'use client';
import { useEffect, useState, useMemo } from 'react';
import { db } from '../lib/firebase'; 
import { ref, onValue, push, query, orderByChild, equalTo, get, update, remove } from 'firebase/database';
import { 
  Zap, Fuel, Clock, ChevronDown, Activity, AlertTriangle, X, FileText, 
  Database, MapPin, ExternalLink, Microscope, Trash2, AlertCircle, Smartphone, Share, LayoutGrid, Search
} from 'lucide-react';

export default function SabanEliteFinalV21() {
  const [deliveryHistory, setDeliveryHistory] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState('2026-01-19');
  const [activePopup, setActivePopup] = useState<'inject' | null>(null);
  const [activeDriver, setActiveDriver] = useState<string | null>('חכמת');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW Error:', err));
    }
    const checkMode = () => {
      const isPWA = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
      setIsStandalone(isPWA);
    };
    checkMode();
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
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

  const deleteDay = async () => {
    if (!window.confirm(`אחי, למחוק את כל נתוני ${selectedDate}?`)) return;
    setIsDeleting(true);
    try {
      const historyRef = ref(db, 'delivery_history');
      const dayQuery = query(historyRef, orderByChild('date'), equalTo(selectedDate));
      const snapshot = await get(dayQuery);
      if (snapshot.exists()) {
        const updates: any = {};
        snapshot.forEach((child) => { updates[child.key!] = null; });
        await update(historyRef, updates);
        alert('היום נמחק בהצלחה.');
      }
    } catch (e) { alert('שגיאה במחיקה'); }
    finally { setIsDeleting(false); }
  };

  const filtered = useMemo(() => {
    return deliveryHistory.filter(t => 
      t.date === selectedDate && (!activeDriver || String(t.customer || '').includes(activeDriver))
    );
  }, [deliveryHistory, selectedDate, activeDriver]);

  if (!isStandalone) {
    return (
      <div className="fixed inset-0 bg-[#001D3D] z-[999] flex flex-col items-center justify-center p-10 text-center text-white" dir="rtl">
        <div className="w-20 h-20 bg-yellow-400 rounded-3xl flex items-center justify-center mb-6 shadow-2xl">
          <Smartphone size={40} className="text-blue-900 animate-pulse" />
        </div>
        <h1 className="text-2xl font-black mb-2 italic tracking-tighter text-white">SABAN ELITE</h1>
        <p className="text-sm font-bold text-blue-200 mb-8 uppercase tracking-widest">חובה להתקין כאפליקציה</p>
        <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 w-full space-y-6 text-right shadow-inner">
          <div>
            <p className="text-yellow-400 text-[10px] font-black mb-2 tracking-widest uppercase">אייפון (Safari):</p>
            <p className="text-xs leading-relaxed font-bold">לחץ על כפתור <span className="bg-white/20 px-2 py-0.5 rounded text-[10px]">שיתוף <Share size={12} className="inline"/></span> ואז בחר ב-<span className="text-yellow-400">"הוסף למסך הבית"</span>.</p>
          </div>
          <div className="border-t border-white/10 pt-4">
            <p className="text-yellow-400 text-[10px] font-black mb-2 tracking-widest uppercase">גלקסי / אנדרואיד (Chrome):</p>
            <p className="text-xs leading-relaxed font-bold">לחץ על <span className="bg-white/20 px-2 py-0.5 rounded text-[10px]">3 נקודות</span> ובחר ב-<span className="text-yellow-400">"התקן אפליקציה"</span>.</p>
          </div>
        </div>
        <button onClick={() => setIsStandalone(true)} className="mt-8 text-[10px] opacity-30 italic underline">דלג (מנהל מערכת)</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] pb-24 select-none" dir="rtl">
      <header className="bg-[#001D3D] p-5 rounded-b-[2.5rem] sticky top-0 z-50 shadow-2xl">
        <div className="flex justify-between items-center mb-6 pt-4">
          <div className="flex items-center gap-2 text-white">
            <div className="bg-yellow-400 p-2 rounded-lg"><Microscope className="text-blue-900" size={18}/></div>
            <span className="font-black italic text-lg tracking-tighter">SABAN X-RAY</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setActivePopup('inject')} className="p-2.5 bg-blue-800 text-white rounded-xl shadow-lg border border-white/10"><Database size={18}/></button>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-blue-900 text-white font-black text-[10px] p-2 rounded-xl outline-none border-none" />
          </div>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {['חכמת', 'מוחמד', 'עלי', 'יואב'].map(d => (
            <button key={d} onClick={() => setActiveDriver(d)} className={`flex-shrink-0 px-6 py-3 rounded-2xl font-black text-[10px] transition-all uppercase ${activeDriver === d ? 'bg-white text-blue-900 scale-105 shadow-xl' : 'bg-blue-900/50 text-blue-200 opacity-60'}`}>{d}</button>
          ))}
        </div>
      </header>

      <main className="p-4 space-y-4 max-w-xl mx-auto">
        {filtered.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 opacity-50">
            <Search className="mx-auto mb-2 text-slate-300" size={32}/>
            <p className="text-xs font-black text-slate-400 uppercase">אין נתונים ליום זה</p>
          </div>
        )}
        
        {filtered.sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0)).map((t) => (
          <div key={t.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden active:scale-[0.98] transition-all">
            <div className="p-5" onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm ${t.status === 'חריגה' ? 'bg-red-500 shadow-lg shadow-red-200' : 'bg-green-500 shadow-lg shadow-green-200'}`}>{t.efficiencyScore || '90'}</div>
                  <div>
                    <h4 className="text-md font-black text-slate-900 leading-none">{String(t.ticketId || '').replace('משלוח-', '#')}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 truncate max-w-[150px]">{t.customer}</p>
                  </div>
                </div>
                <div className="text-[10px] font-black text-blue-900 italic bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">{t.ituranTime}</div>
              </div>
              <div className={`p-4 rounded-2xl border-r-4 ${t.status === 'חריגה' ? 'bg-red-50 border-red-500' : 'bg-blue-50 border-blue-600'}`}>
                <p className="text-[11px] font-bold text-slate-800 leading-relaxed italic">{t.loadingTime || t.aiAnalysis}</p>
              </div>
            </div>
            {expandedId === t.id && (
              <div className="px-5 pb-5 flex gap-2 animate-in slide-in-from-top-2">
                <a href={t.spLink || '#'} target="_blank" className="flex-1 bg-blue-950 text-white py-4 rounded-xl font-black text-[10px] text-center uppercase tracking-widest shadow-lg flex items-center justify-center gap-2"><ExternalLink size={14}/> פתח תעודה</a>
                <button onClick={() => remove(ref(db, `delivery_history/${t.id}`))} className="p-3 bg-red-50 text-red-500 rounded-xl active:bg-red-500 active:text-white"><Trash2 size={20}/></button>
              </div>
            )}
          </div>
        ))}
      </main>

      {activePopup === 'inject' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-end justify-center p-4">
          <div className="bg-white w-full rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-20 max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-slate-900 uppercase text-sm flex items-center gap-2 tracking-tighter"><Database className="text-yellow-500" size={20}/> ניהול ארכיון: {selectedDate}</h3>
              <button onClick={() => setActivePopup(null)} className="p-2 bg-slate-100 rounded-full"><X size={20}/></button>
            </div>
            <button onClick={deleteDay} disabled={isDeleting} className="w-full mb-4 py-4 bg-red-50 text-red-600 rounded-2xl font-black text-[10px] border border-red-100 uppercase tracking-widest shadow-sm">
              {isDeleting ? 'מנקה ארכיון...' : 'מחק נתוני יום זה'}
            </button>
            <textarea value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} placeholder="הדבק JSON מה-Copilot..." className="w-full h-40 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-[10px] font-mono mb-4 outline-none focus:border-blue-500"/>
            <div className="flex gap-2">
               <button onClick={() => setActivePopup(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase">ביטול</button>
               <button onClick={() => {
                try {
                  const data = JSON.parse(jsonInput);
                  const items = Array.isArray(data) ? data : [data];
                  items.forEach((item: any) => push(ref(db, 'delivery_history'), { ...item, date: item.date || selectedDate, timestamp: Date.now() }));
                  alert('הוזרק בהצלחה!'); setJsonInput(''); setActivePopup(null);
                } catch (e) { alert('שגיאת JSON'); }
              }} className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl shadow-blue-600/20">הזרק לארכיון</button>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t p-4 flex justify-around items-center z-50 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col items-center gap-1 text-blue-600 active:scale-90 transition-transform"><LayoutGrid size={22}/><span className="text-[8px] font-black uppercase">שליטה</span></div>
        <div onClick={() => setActivePopup('inject')} className="flex flex-col items-center gap-1 text-slate-300 active:scale-90 transition-transform"><Database size={22}/><span className="text-[8px] font-black uppercase">ניהול</span></div>
        <div onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])} className="flex flex-col items-center gap-1 text-slate-300 active:scale-90 transition-transform"><Clock size={22}/><span className="text-[8px] font-black uppercase">היום</span></div>
      </nav>
    </div>
  );
}
