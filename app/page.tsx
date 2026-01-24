'use client';
import { useEffect, useState, useMemo } from 'react';
import { db } from '../lib/firebase'; 
import { ref, onValue, push, remove, query, orderByChild, equalTo, get, update } from 'firebase/database';
import { 
  Zap, Fuel, Clock, ChevronDown, Activity, AlertTriangle, X, FileText, 
  Database, CheckCircle, MapPin, ExternalLink, Settings, LayoutGrid, Navigation, Microscope, Search, Trash2, AlertCircle, User
} from 'lucide-react';

export default function SabanUltimateDashboard() {
  const [deliveryHistory, setDeliveryHistory] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState('2026-01-19');
  const [activePopup, setActivePopup] = useState<'inject' | 'efficiency' | 'waste' | null>(null);
  const [activeDriver, setActiveDriver] = useState<string | null>('חכמת'); // ברירת מחדל לחכמת
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [fuelPrice, setFuelPrice] = useState(7.29);
  const [isDeleting, setIsDeleting] = useState(false);

  const driverProfiles = [
    { id: 'חכמת', img: '🏗️', role: 'מנוף' },
    { id: 'מוחמד אכבריה', img: '🚚', role: 'סמי' },
    { id: 'עלי', img: '🏗️', role: 'מנוף' },
    { id: 'יואב', img: '🚐', role: 'מנהל' },
    { id: 'בורהאן', img: '🚛', role: 'נהג' }
  ];

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

  // מחיקת יום שלם בצורה בטוחה (Multi-path Update)
  const deleteSelectedDay = async () => {
    if (!window.confirm(`אחי, בטוח? זה ימחק את כל התעודות של ה-${selectedDate}`)) return;
    setIsDeleting(true);
    try {
      const historyRef = ref(db, 'delivery_history');
      const dayQuery = query(historyRef, orderByChild('date'), equalTo(selectedDate));
      const snapshot = await get(dayQuery);
      if (snapshot.exists()) {
        const updates: any = {};
        snapshot.forEach((child) => { updates[child.key!] = null; });
        await update(historyRef, updates);
        alert('היום נמחק, השטח נקי להזרקה חדשה.');
      }
    } catch (e) { alert('שגיאה במחיקה'); }
    finally { setIsDeleting(false); }
  };

  const handleInject = () => {
    try {
      const data = JSON.parse(jsonInput);
      const historyRef = ref(db, 'delivery_history');
      const items = Array.isArray(data) ? data : [data];
      items.forEach((item: any) => push(historyRef, { ...item, date: item.date || selectedDate, timestamp: Date.now() }));
      alert('הנתונים הוזרקו בהצלחה!');
      setJsonInput('');
      setActivePopup(null);
    } catch (e) { alert('JSON לא תקין'); }
  };

  const stats = useMemo(() => {
    const today = deliveryHistory.filter(t => t.date === selectedDate);
    const ptoCount = today.filter(t => String(t.aiAnalysis || '').includes('🏗️')).length;
    let idlingMins = 0;
    today.forEach(t => {
      const match = String(t.aiAnalysis || '').match(/(\d+)\s+דקות/);
      if (String(t.aiAnalysis || '').includes('🛑') && match) idlingMins += parseInt(match[1]);
    });
    return {
      pto: ptoCount,
      wasteCost: (idlingMins / 60 * 7.8 * fuelPrice).toFixed(0),
      efficiency: ptoCount > 5 ? 'מצוין' : 'בבדיקה'
    };
  }, [deliveryHistory, selectedDate, fuelPrice]);

  const filteredHistory = useMemo(() => {
    return deliveryHistory.filter(t => 
      t.date === selectedDate && (!activeDriver || String(t.dailyAnalysis || t.aiAnalysis || '').includes(activeDriver))
    );
  }, [deliveryHistory, selectedDate, activeDriver]);

  return (
    <div className="min-h-screen bg-[#F0F2F5] font-sans text-right pb-10" dir="rtl">
      
      {/* Header יוקרתי */}
      <header className="bg-[#001D3D] p-6 rounded-b-[3rem] shadow-2xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20"><Microscope className="text-white" size={24}/></div>
              <div>
                <h1 className="text-2xl font-black text-white italic tracking-tighter leading-none">SABAN X-RAY</h1>
                <p className="text-[10px] font-bold text-blue-400 uppercase mt-1">מערכת בקרת תעודות ו-GPS</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setActivePopup('inject')} className="p-3 bg-yellow-400 text-blue-900 rounded-xl font-black text-xs flex items-center gap-2 shadow-lg"><Database size={16}/> הזרקת נתונים</button>
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-blue-900 text-white font-black text-xs p-2 rounded-xl border-none outline-none" />
            </div>
          </div>

          {/* כפתורי נהגים (Driver Selector) */}
          <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
            <button onClick={() => setActiveDriver(null)} className={`flex-shrink-0 w-20 h-24 rounded-[1.8rem] flex flex-col items-center justify-center transition-all ${!activeDriver ? 'bg-white text-blue-900 scale-105 shadow-xl' : 'bg-blue-900/50 text-blue-200 opacity-60'}`}>
              <span className="text-2xl mb-1">🌐</span>
              <span className="text-[10px] font-black uppercase">הצי</span>
            </button>
            {driverProfiles.map(d => (
              <button key={d.id} onClick={() => setActiveDriver(d.id)} className={`flex-shrink-0 w-24 h-24 rounded-[1.8rem] flex flex-col items-center justify-center transition-all ${activeDriver === d.id ? 'bg-white text-blue-900 scale-105 shadow-xl' : 'bg-blue-900/50 text-blue-100 opacity-60'}`}>
                <span className="text-3xl mb-1">{d.img}</span>
                <span className="text-[10px] font-black">{d.id.split(' ')[0]}</span>
                <span className="text-[8px] font-bold opacity-50">{d.role}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-4 -mt-4">
        
        {/* כפתורי מדדי יעילות (Efficiency Cards) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border-b-8 border-blue-600 flex justify-between items-center">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">יעילות PTO</p>
              <h3 className="text-3xl font-black text-slate-900 leading-none">{stats.pto} <span className="text-sm">פריקות</span></h3>
            </div>
            <Zap className="text-blue-600 fill-blue-600" size={32}/>
          </div>
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border-b-8 border-red-500 flex justify-between items-center">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">בזבוז סולר</p>
              <h3 className="text-3xl font-black text-slate-900 leading-none">₪{stats.wasteCost}</h3>
            </div>
            <Fuel className="text-red-500" size={32}/>
          </div>
        </div>

        {/* רשימת תעודות - פנימי לחכמת / נהג נבחר */}
        <div className="flex items-center gap-2 mt-8 mb-4">
           <Activity className="text-blue-600" size={18} />
           <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest">ניתוח תעודות פנימי: {activeDriver || 'כל הצי'}</h2>
        </div>

        {filteredHistory.map((ticket) => (
          <div key={ticket.id} className={`bg-white rounded-[2.5rem] shadow-sm border-2 transition-all overflow-hidden ${expandedId === ticket.id ? 'border-blue-500' : 'border-slate-100 hover:border-blue-200'}`}>
            <div className="p-6 cursor-pointer" onClick={() => setExpandedId(expandedId === ticket.id ? null : ticket.id)}>
              <div className="flex justify-between items-start mb-6">
                 <div className="flex items-center gap-4">
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-lg ${ticket.status === 'חריגה' ? 'bg-red-500 shadow-lg shadow-red-500/20' : 'bg-green-500 shadow-lg shadow-green-500/20'}`}>
                     {ticket.efficiencyScore || '90'}
                   </div>
                   <div>
                     <h4 className="text-xl font-black text-slate-900 leading-none">{String(ticket.ticketId || '').replace('משלוח-', 'תעודה #')}</h4>
                     <p className="text-xs font-bold text-slate-400 mt-2 flex items-center gap-1"><MapPin size={12}/> {ticket.customer}</p>
                   </div>
                 </div>
                 <div className="text-left">
                   <span className="text-[10px] font-black text-slate-300 block mb-1">חלון איתוראן</span>
                   <span className="text-sm font-black text-blue-900">{ticket.ituranTime}</span>
                 </div>
              </div>

              {/* גוף הניתוח המפורט */}
              <div className={`p-5 rounded-[2rem] border-r-8 ${ticket.status === 'חריגה' ? 'bg-red-50 border-red-500' : 'bg-blue-50 border-blue-600'}`}>
                <div className="flex items-center gap-2 mb-2 text-slate-400">
                  <Search size={14}/>
                  <span className="text-[10px] font-black uppercase tracking-tighter">ממצאים מהשטח (Copilot X-Ray)</span>
                </div>
                <p className="text-sm font-bold text-slate-800 leading-relaxed italic">
                  {ticket.loadingTime || ticket.aiAnalysis}
                </p>
                {ticket.dailyAnalysis?.xRayAlert?.notes && (
                  <div className="mt-3 pt-3 border-t border-slate-200 space-y-1">
                    {ticket.dailyAnalysis.xRayAlert.notes.map((n: string, i: number) => (
                      <div key={i} className="text-[10px] font-bold text-slate-500 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> {n}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {expandedId === ticket.id && (
              <div className="px-6 pb-6 pt-0 animate-in slide-in-from-top-2">
                <div className="grid grid-cols-2 gap-3 mb-4">
                   <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                     <p className="text-[9px] font-black text-slate-400 block uppercase">מרחק וזמן נסיעה</p>
                     <p className="text-xs font-black text-slate-800">{ticket.travelMetrics || 'נתון לא זמין'}</p>
                   </div>
                   <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                     <p className="text-[9px] font-black text-slate-400 block uppercase">שעת הגעה חתומה</p>
                     <p className="text-xs font-black text-blue-900">{ticket.dailyAnalysis?.documentExtraction?.documentTime || 'N/A'}</p>
                   </div>
                </div>
                <div className="flex gap-2">
                  <a href={ticket.spLink || '#'} target="_blank" className="flex-1 bg-blue-950 text-white py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-xl"><ExternalLink size={16}/> צפה בתעודה מקורית</a>
                  <button onClick={() => remove(ref(db, `delivery_history/${ticket.id}`))} className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={20}/></button>
                </div>
              </div>
            )}
          </div>
        ))}
      </main>

      {/* Popups: הזרקה / מחיקה */}
      {activePopup === 'inject' && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[3rem] p-8 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3"><Database className="text-yellow-500" size={28}/> ניהול נתוני יום</h3>
              <button onClick={() => setActivePopup(null)} className="p-2 bg-slate-100 rounded-full text-slate-400"><X size={20}/></button>
            </div>

            {/* כפתור מחיקת יום - מתוקן */}
            <div className="mb-6 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="text-red-500" size={24}/>
                <div>
                  <p className="text-xs font-black text-red-900 uppercase leading-none">ניקוי יום בארכיון</p>
                  <p className="text-[10px] text-red-400 font-bold mt-1">מחיקת יום {selectedDate}</p>
                </div>
              </div>
              <button onClick={deleteSelectedDay} disabled={isDeleting} className="px-5 py-2.5 bg-red-600 text-white rounded-xl font-black text-xs shadow-lg shadow-red-600/20 active:scale-95 transition-all">
                {isDeleting ? 'מוחק...' : 'מחק הכל'}
              </button>
            </div>

            <textarea value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} placeholder="הדבק כאן את ה-JSON שקיבלת מ-Copilot..." className="w-full h-64 bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-6 text-[11px] font-mono outline-none focus:border-blue-500 transition-all"/>
            
            <div className="flex gap-3 mt-6">
              <button onClick={() => setActivePopup(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-sm">ביטול</button>
              <button onClick={handleInject} className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-600/20">הזרק נתונים חדשים</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
