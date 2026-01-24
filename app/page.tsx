'use client';
import { useEffect, useState, useMemo } from 'react';
import { db } from '../lib/firebase'; 
import { ref, onValue, push, remove, query, orderByChild, equalTo, get, update } from 'firebase/database';
import { 
  Zap, Fuel, Clock, ChevronDown, Activity, AlertTriangle, X, FileText, 
  Database, CheckCircle, MapPin, ExternalLink, Settings, LayoutGrid, Navigation, Microscope, Search, Trash2, AlertCircle, Share, Smartphone
} from 'lucide-react';

export default function SabanEliteForceV18() {
  const [deliveryHistory, setDeliveryHistory] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState('2026-01-19');
  const [activePopup, setActivePopup] = useState<'inject' | null>(null);
  const [activeDriver, setActiveDriver] = useState<string | null>('חכמת');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true); // ברירת מחדל אמת כדי למנוע קפיצה בטעינה

  // בדיקת מצב התקנה ובקשת הרשאות
  useEffect(() => {
    const checkMode = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
      setIsStandalone(standalone);
    };
    
    checkMode();
    
    // בקשת הרשאה להתראות (Push Notifications) מיד עם העלייה
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

  const deleteSelectedDay = async () => {
    if (!window.confirm(`למחוק את כל נתוני ${selectedDate}?`)) return;
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
    } catch (e) { console.error(e); }
    finally { setIsDeleting(false); }
  };

  const filteredHistory = useMemo(() => {
    return deliveryHistory.filter(t => t.date === selectedDate && (!activeDriver || String(t.dailyAnalysis || t.aiAnalysis || '').includes(activeDriver)));
  }, [deliveryHistory, selectedDate, activeDriver]);

  // אם לא מותקן - מציג מסך התקנה בלבד
  if (!isStandalone) {
    return (
      <div className="fixed inset-0 bg-[#001D3D] z-[1000] flex flex-col items-center justify-center p-8 text-center text-white" dir="rtl">
        <div className="w-24 h-24 bg-yellow-400 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl shadow-yellow-400/20">
          <Smartphone size={48} className="text-blue-900 animate-pulse" />
        </div>
        <h1 className="text-3xl font-black mb-4 italic">SABAN ELITE</h1>
        <p className="text-lg font-bold text-blue-200 mb-8 leading-relaxed">אחי, כדי להשתמש במערכת חובה להתקין אותה כאפליקציה במסך הבית.</p>
        
        <div className="bg-white/10 p-6 rounded-[2rem] border border-white/10 w-full max-w-sm">
          <h2 className="text-sm font-black uppercase tracking-widest mb-4 text-yellow-400">איך מתקינים?</h2>
          <ol className="text-right space-y-4 text-sm font-bold">
            <li className="flex items-center gap-3"><span className="w-6 h-6 bg-yellow-400 text-blue-900 rounded-full flex items-center justify-center text-xs">1</span> לחץ על כפתור ה-Share (שיתוף) בתחתית הדפדפן.</li>
            <li className="flex items-center gap-3"><span className="w-6 h-6 bg-yellow-400 text-blue-900 rounded-full flex items-center justify-center text-xs">2</span> גלול מטה ובחר באופציה "הוסף למסך הבית".</li>
            <li className="flex items-center gap-3"><span className="w-6 h-6 bg-yellow-400 text-blue-900 rounded-full flex items-center justify-center text-xs">3</span> פתח את האפליקציה מהאייקון החדש שנוצר.</li>
          </ol>
        </div>
        <button onClick={() => setIsStandalone(true)} className="mt-8 text-xs text-white/40 underline italic">המשך בכל זאת (למנהלים בלבד)</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F4F7] font-sans text-right pb-24" dir="rtl">
      <header className="bg-[#001D3D] p-5 rounded-b-[2.5rem] shadow-xl sticky top-0 z-[100]">
        <div className="max-w-xl mx-auto flex justify-between items-center mb-6 pt-2">
          <div className="flex items-center gap-3 text-white">
            <Microscope className="text-yellow-400" size={24}/>
            <h1 className="text-xl font-black italic tracking-tighter uppercase">X-RAY CONTROL</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setActivePopup('inject')} className="p-2.5 bg-blue-800 text-white rounded-xl active:scale-90 transition-all"><Database size={18}/></button>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-blue-900 text-white font-black text-[10px] p-2 rounded-xl border-none outline-none" />
          </div>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          <button onClick={() => setActiveDriver(null)} className={`flex-shrink-0 w-16 h-20 rounded-2xl flex flex-col items-center justify-center ${!activeDriver ? 'bg-white text-blue-900' : 'bg-blue-900/40 text-blue-200'}`}>
            <span className="text-xl">🌐</span>
            <span className="text-[8px] font-black uppercase">כל הצי</span>
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
          <div key={ticket.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden active:scale-[0.98] transition-transform">
            <div className="p-5 cursor-pointer" onClick={() => setExpandedId(expandedId === ticket.id ? null : ticket.id)}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-white ${ticket.status === 'חריגה' ? 'bg-red-500 shadow-lg shadow-red-200' : 'bg-green-500 shadow-lg shadow-green-200'}`}>{ticket.efficiencyScore || '90'}</div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900 leading-none">{String(ticket.ticketId || '').replace('משלוח-', 'תעודה #')}</h4>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase italic tracking-tighter">{ticket.customer}</p>
                  </div>
                </div>
                <div className="text-left"><span className="text-[11px] font-black text-blue-900 italic">{ticket.ituranTime}</span></div>
              </div>
              <div className={`p-4 rounded-2xl border-r-8 ${ticket.status === 'חריגה' ? 'bg-red-50 border-red-500' : 'bg-blue-50 border-blue-600'}`}>
                <p className="text-[11px] font-bold text-slate-800 leading-relaxed italic">{ticket.loadingTime || ticket.aiAnalysis}</p>
              </div>
            </div>
            {expandedId === ticket.id && (
              <div className="px-5 pb-5 flex gap-2 animate-in slide-in-from-top-2">
                <a href={ticket.spLink || '#'} target="_blank" className="flex-1 bg-blue-950 text-white py-4 rounded-2xl font-black text-[10px] text-center shadow-lg"><ExternalLink size={14} className="inline ml-2"/> פתח תעודה</a>
                <button onClick={() => remove(ref(db, `delivery_history/${ticket.id}`))} className="p-4 bg-red-50 text-red-500 rounded-2xl active:bg-red-500 active:text-white transition-colors"><Trash2 size={20}/></button>
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
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-3"><Database className="text-yellow-500"/> הזרקת נתונים: {selectedDate}</h3>
              <button onClick={() => setActivePopup(null)} className="p-2 bg-slate-100 rounded-full"><X size={20}/></button>
            </div>
            <div className="mb-4 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-red-700 uppercase">מחיקת נתוני יום זה</p>
                <p className="text-[8px] font-bold text-red-400">מומלץ לפני הזרקה חדשה</p>
              </div>
              <button onClick={deleteSelectedDay} disabled={isDeleting} className="px-4 py-2 bg-red-600 text-white rounded-xl font-black text-[10px] shadow-lg">מחק הכל</button>
            </div>
            <textarea value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} placeholder="הדבק JSON כאן..." className="w-full h-40 bg-slate-50 border rounded-2xl p-4 text-[10px] font-mono mb-4 outline-none focus:ring-2 ring-blue-500"/>
            <button onClick={() => {
              try {
                const data = JSON.parse(jsonInput);
                const items = Array.isArray(data) ? data : [data];
                items.forEach((item: any) => push(ref(db, 'delivery_history'), { ...item, date: item.date || selectedDate, timestamp: Date.now() }));
                alert('הוזרק בהצלחה!'); setJsonInput(''); setActivePopup(null);
              } catch (e) { alert('שגיאה ב-JSON'); }
            }} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-xl uppercase text-xs">בצע הזרקה לארכיון</button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t p-3 flex justify-around items-center z-50">
        <button className="flex flex-col items-center gap-1 text-blue-600"><LayoutGrid size={22}/><span className="text-[8px] font-black uppercase">דשבורד</span></button>
        <button onClick={() => setActivePopup('inject')} className="flex flex-col items-center gap-1 text-slate-400"><Database size={22}/><span className="text-[8px] font-black uppercase">הזרקה</span></button>
        <button onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])} className="flex flex-col items-center gap-1 text-slate-400"><Clock size={22}/><span className="text-[8px] font-black uppercase">היום</span></button>
      </nav>
    </div>
  );
}
