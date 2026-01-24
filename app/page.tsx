'use client';
import { useEffect, useState, useMemo } from 'react';
import { db } from '../lib/firebase'; 
import { ref, onValue, push, query, orderByChild, equalTo, get, update, remove } from 'firebase/database';
import { 
  Zap, Fuel, Clock, ChevronDown, Activity, AlertTriangle, X, FileText, 
  Database, MapPin, ExternalLink, Microscope, Trash2, AlertCircle, Smartphone, Share
} from 'lucide-react';

export default function SabanEliteFinalV19() {
  const [deliveryHistory, setDeliveryHistory] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState('2026-01-19');
  const [activePopup, setActivePopup] = useState<'inject' | null>(null);
  const [activeDriver, setActiveDriver] = useState<string | null>('חכמת');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true);

  useEffect(() => {
    // 1. רישום Service Worker לאנדרואיד
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => console.log(err));
    }

    // 2. בדיקת מצב אפליקציה (iOS + Android)
    const checkMode = () => {
      const isPWA = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
      setIsStandalone(isPWA);
    };
    checkMode();

    // 3. בקשת התראות
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    onValue(ref(db, 'delivery_history'), (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setDeliveryHistory(Object.keys(data).map(k => ({ id: k, ...data[k] })));
      } else { setDeliveryHistory([]); }
    });
  }, []);

  const deleteDay = async () => {
    if (!window.confirm(`למחוק את יום ${selectedDate}?`)) return;
    setIsDeleting(true);
    const dayQuery = query(ref(db, 'delivery_history'), orderByChild('date'), equalTo(selectedDate));
    const snap = await get(dayQuery);
    if (snap.exists()) {
      const updates: any = {};
      snap.forEach(c => { updates[c.key!] = null; });
      await update(ref(db, 'delivery_history'), updates);
      alert('נמחק.');
    }
    setIsDeleting(false);
  };

  const filtered = useMemo(() => {
    return deliveryHistory.filter(t => t.date === selectedDate && (!activeDriver || String(t.customer || '').includes(activeDriver)));
  }, [deliveryHistory, selectedDate, activeDriver]);

  // מסך חסימה למשתמשים בדפדפן
  if (!isStandalone) {
    return (
      <div className="fixed inset-0 bg-[#001D3D] z-[999] flex flex-col items-center justify-center p-10 text-center text-white" dir="rtl">
        <div className="w-20 h-20 bg-yellow-400 rounded-3xl flex items-center justify-center mb-6 shadow-2xl">
          <Smartphone size={40} className="text-blue-900 animate-pulse" />
        </div>
        <h1 className="text-2xl font-black mb-2 italic">SABAN ELITE</h1>
        <p className="text-sm font-bold text-blue-200 mb-8">חובה להתקין כאפליקציה כדי להמשיך</p>
        
        <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 w-full space-y-6 text-right">
          <div>
            <p className="text-yellow-400 text-xs font-black mb-2">אייפון (Safari):</p>
            <p className="text-[11px] leading-relaxed">לחץ על כפתור <span className="bg-white/20 px-1 rounded">שיתוף (Share)</span> ואז בחר ב-<span className="text-white underline">"הוסף למסך הבית"</span>.</p>
          </div>
          <div className="border-t border-white/10 pt-4">
            <p className="text-yellow-400 text-xs font-black mb-2">גלקסי / אנדרואיד (Chrome):</p>
            <p className="text-[11px] leading-relaxed">לחץ על <span className="bg-white/20 px-1 rounded">3 נקודות</span> ובחר ב-<span className="text-white underline">"התקן אפליקציה"</span>.</p>
          </div>
        </div>
        <button onClick={() => setIsStandalone(true)} className="mt-8 text-[10px] opacity-30 italic underline">דלג (מנהל)</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] pb-24" dir="rtl">
      <header className="bg-[#001D3D] p-5 rounded-b-[2.5rem] sticky top-0 z-50">
        <div className="flex justify-between items-center mb-6 pt-4">
          <div className="flex items-center gap-2 text-white">
            <Microscope className="text-yellow-400" size={20}/>
            <span className="font-black italic text-lg">SABAN X-RAY</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setActivePopup('inject')} className="p-2.5 bg-blue-800 text-white rounded-xl"><Database size={18}/></button>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-blue-900 text-white font-black text-[10px] p-2 rounded-xl outline-none border-none" />
          </div>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar">
          {['חכמת', 'מוחמד', 'עלי', 'יואב'].map(d => (
            <button key={d} onClick={() => setActiveDriver(d)} className={`flex-shrink-0 px-6 py-3 rounded-2xl font-black text-xs transition-all ${activeDriver === d ? 'bg-white text-blue-900 scale-105' : 'bg-blue-900/50 text-blue-200 opacity-60'}`}>{d}</button>
          ))}
        </div>
      </header>

      <main className="p-4 space-y-4 max-w-xl mx-auto">
        {filtered.map((t) => (
          <div key={t.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5" onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm ${t.status === 'חריגה' ? 'bg-red-500' : 'bg-green-500'}`}>{t.efficiencyScore || '90'}</div>
                  <div>
                    <h4 className="text-md font-black text-slate-900">{String(t.ticketId || '').replace('משלוח-', '#')}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{t.customer}</p>
                  </div>
                </div>
                <div className="text-[10px] font-black text-blue-900 italic">{t.ituranTime}</div>
              </div>
              <div className={`p-4 rounded-2xl border-r-4 ${t.status === 'חריגה' ? 'bg-red-50 border-red-500' : 'bg-blue-50 border-blue-600'}`}>
                <p className="text-[11px] font-bold text-slate-800 leading-relaxed italic">{t.loadingTime || t.aiAnalysis}</p>
              </div>
            </div>
            {expandedId === t.id && (
              <div className="px-5 pb-5 flex gap-2">
                <a href={t.spLink || '#'} target="_blank" className="flex-1 bg-blue-950 text-white py-3 rounded-xl font-black text-[10px] text-center uppercase tracking-tighter shadow-lg">פתח תעודה</a>
                <button onClick={() => remove(ref(db, `delivery_history/${t.id}`))} className="p-3 bg-red-50 text-red-500 rounded-xl"><Trash2 size={18}/></button>
              </div>
            )}
          </div>
        ))}
      </main>

      {activePopup === 'inject' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-end justify-center p-4">
          <div className="bg-white w-full rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-20">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-slate-900 uppercase text-sm flex items-center gap-2"><Database className="text-yellow-500"/> עדכון יום: {selectedDate}</h3>
              <button onClick={() => setActivePopup(null)}><X size={20}/></button>
            </div>
            <button onClick={deleteDay} disabled={isDeleting} className="w-full mb-4 py-3 bg-red-50 text-red-600 rounded-xl font-black text-[10px] border border-red-100 uppercase">
              {isDeleting ? 'מוחק...' : 'מחק נתוני יום זה'}
            </button>
            <textarea value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} placeholder="הדבק JSON..." className="w-full h-40 bg-slate-50 border rounded-2xl p-4 text-[10px] font-mono mb-4 outline-none border-slate-100 focus:border-blue-500"/>
            <button onClick={() => {
              try {
                const data = JSON.parse(jsonInput);
                const items = Array.isArray(data) ? data : [data];
                items.forEach((item: any) => push(ref(db, 'delivery_history'), { ...item, date: item.date || selectedDate, timestamp: Date.now() }));
                alert('הוזרק!'); setJsonInput(''); setActivePopup(null);
              } catch (e) { alert('שגיאת JSON'); }
            }} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs">הזרק לארכיון</button>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t p-4 flex justify-around items-center z-50">
        <div className="flex flex-col items-center gap-1 text-blue-600"><LayoutGrid size={22}/><span className="text-[8px] font-black uppercase">שליטה</span></div>
        <div onClick={() => setActivePopup('inject')} className="flex flex-col items-center gap-1 text-slate-300"><Database size={22}/><span className="text-[8px] font-black uppercase">ניהול</span></div>
        <div onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])} className="flex flex-col items-center gap-1 text-slate-300"><Clock size={22}/><span className="text-[8px] font-black uppercase">היום</span></div>
      </nav>
    </div>
  );
}
