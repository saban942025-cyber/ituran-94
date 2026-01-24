'use client';
import { useEffect, useState, useMemo } from 'react';
import { db } from '../lib/firebase'; 
import { ref, onValue, push, remove, query, orderByChild, equalTo, get, update } from 'firebase/database';
import { 
  Zap, Fuel, Clock, ChevronDown, Activity, AlertTriangle, X, FileText, 
  Database, CheckCircle, MapPin, ExternalLink, Settings, LayoutGrid, Navigation, Microscope, Search, Trash2, AlertCircle, User
} from 'lucide-react';

export default function SabanEliteMobileV16() {
  const [deliveryHistory, setDeliveryHistory] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState('2026-01-19');
  const [activePopup, setActivePopup] = useState<'inject' | 'stats' | null>(null);
  const [activeDriver, setActiveDriver] = useState<string | null>('חכמת'); // חכמת כברירת מחדל
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [fuelPrice, setFuelPrice] = useState(7.29);
  const [isDeleting, setIsDeleting] = useState(false);

  // פרופילי נהגים - עיצוב יוקרתי למובייל
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

  // פונקציית מחיקה בטוחה (תיקון שגיאת Build)
  const deleteSelectedDay = async () => {
    if (!window.confirm(`אחי, אתה מוחק את כל נתוני ה-${selectedDate}. לא ניתן לשחזר. להמשיך?`)) return;
    setIsDeleting(true);
    try {
      const historyRef = ref(db, 'delivery_history');
      const dayQuery = query(historyRef, orderByChild('date'), equalTo(selectedDate));
      const snapshot = await get(dayQuery);
      if (snapshot.exists()) {
        const updates: any = {};
        snapshot.forEach((child) => { updates[child.key!] = null; });
        await update(historyRef, updates);
        alert('היום נמחק. המערכת נקייה להזרקה חדשה.');
      } else {
        alert('אין נתונים למחיקה בתאריך זה.');
      }
    } catch (e) {
      console.error(e);
      alert('שגיאה בתהליך המחיקה.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleInject = () => {
    try {
      const data = JSON.parse(jsonInput);
      const historyRef = ref(db, 'delivery_history');
      const items = Array.isArray(data) ? data : [data];
      items.forEach((item: any) => push(historyRef, { 
        ...item, 
        date: item.date || selectedDate, 
        timestamp: Date.now() 
      }));
      alert(`הזרקת ${items.length} רשומות הצליחה!`);
      setJsonInput('');
      setActivePopup(null);
    } catch (e) {
      alert('שגיאה בפורמט ה-JSON. בדוק את הקוד מה-Copilot.');
    }
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
      totalEvents: today.length
    };
  }, [deliveryHistory, selectedDate, fuelPrice]);

  const filteredHistory = useMemo(() => {
    return deliveryHistory.filter(t => 
      t.date === selectedDate && (!activeDriver || String(t.aiAnalysis || t.customer || '').includes(activeDriver))
    );
  }, [deliveryHistory, selectedDate, activeDriver]);

  return (
    <div className="min-h-screen bg-[#F2F4F7] font-sans text-right pb-20 select-none" dir="rtl">
      
      {/* Header - מותאם מובייל */}
      <header className="bg-[#001D3D] p-5 rounded-b-[2.5rem] shadow-xl sticky top-0 z-[100]">
        <div className="max-w-xl mx-auto flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-400/20">
              <Microscope className="text-blue-900" size={22}/>
            </div>
            <div>
              <h1 className="text-xl font-black text-white italic tracking-tighter">SABAN ELITE</h1>
              <p className="text-[8px] font-bold text-blue-300 uppercase">מערכת חקירה X-RAY</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setActivePopup('inject')} className="p-2.5 bg-blue-800/50 text-white rounded-xl border border-blue-400/20">
              <Database size={18} />
            </button>
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)} 
              className="bg-blue-900 text-white font-black text-[10px] p-2 rounded-xl border-none outline-none" 
            />
          </div>
        </div>

        {/* שורת נהגים רחבה להחלקה */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          <button onClick={() => setActiveDriver(null)} className={`flex-shrink-0 w-16 h-20 rounded-[1.2rem] flex flex-col items-center justify-center transition-all ${!activeDriver ? 'bg-white text-blue-900 scale-105 shadow-xl' : 'bg-blue-900/40 text-blue-200 opacity-60'}`}>
            <span className="text-xl mb-1">🌐</span>
            <span className="text-[9px] font-black uppercase">כל הצי</span>
          </button>
          {driverProfiles.map(d => (
            <button key={d.id} onClick={() => setActiveDriver(d.id)} className={`flex-shrink-0 w-20 h-20 rounded-[1.2rem] flex flex-col items-center justify-center transition-all ${activeDriver === d.id ? 'bg-white text-blue-900 scale-105 shadow-xl' : 'bg-blue-900/40 text-blue-100 opacity-60'}`}>
              <span className="text-2xl mb-0.5">{d.img}</span>
              <span className="text-[9px] font-black">{d.id.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-xl mx-auto p-4 space-y-4">
        
        {/* מדדי הזרקה וביצועים */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-5 rounded-[2rem] shadow-sm border-b-4 border-blue-600">
            <Zap className="text-blue-600 mb-2" size={24}/>
            <h3 className="text-2xl font-black text-slate-900 leading-none">{stats.pto}</h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">פריקות PTO</p>
          </div>
          <div className="bg-white p-5 rounded-[2rem] shadow-sm border-b-4 border-red-500">
            <Fuel className="text-red-500 mb-2" size={24}/>
            <h3 className="text-2xl font-black text-slate-900 leading-none">₪{stats.wasteCost}</h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">בזבוז עמידה</p>
          </div>
        </div>

        {/* יומן חקירה - רנטגן */}
        <div className="flex items-center justify-between mt-6 mb-2 px-2">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Activity size={14} className="text-blue-500"/> יומן חקירה: {activeDriver || 'כל הצי'}
          </h2>
          <span className="text-[9px] font-bold bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full">{filteredHistory.length} רשומות</span>
        </div>

        {filteredHistory.sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0)).map((ticket) => (
          <div key={ticket.id} className={`bg-white rounded-[2rem] shadow-sm border overflow-hidden transition-all ${expandedId === ticket.id ? 'border-blue-400 ring-2 ring-blue-500/5' : 'border-slate-100'}`}>
            <div className="p-5 cursor-pointer" onClick={() => setExpandedId(expandedId === ticket.id ? null : ticket.id)}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-white ${ticket.status === 'חריגה' ? 'bg-red-500 shadow-lg shadow-red-200' : 'bg-green-500 shadow-lg shadow-green-200'}`}>
                    {ticket.efficiencyScore || '90'}
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900 leading-none mb-1">
                      {String(ticket.ticketId || '').replace('משלוח-', 'תעודה #')}
                    </h4>
                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><MapPin size={10}/> {ticket.customer}</p>
                  </div>
                </div>
                <div className="text-left">
                  <span className="text-[8px] font-black text-slate-300 block mb-0.5">איתוראן</span>
                  <span className="text-[11px] font-black text-blue-900">{ticket.ituranTime}</span>
                </div>
              </div>

              {/* הניתוח המעמיק - מוצג תמיד כ"רנטגן" */}
              <div className={`mt-4 p-4 rounded-2xl border-r-4 ${ticket.status === 'חריגה' ? 'bg-red-50 border-red-500' : 'bg-blue-50 border-blue-600'}`}>
                <p className="text-[11px] font-bold text-slate-800 leading-relaxed italic">
                  {ticket.loadingTime || ticket.aiAnalysis}
                </p>
              </div>
            </div>

            {expandedId === ticket.id && (
              <div className="px-5 pb-5 pt-0 animate-in slide-in-from-top-2">
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">מדד נסיעה</p>
                    <p className="text-[10px] font-black text-slate-700">{ticket.travelMetrics || '---'}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">שעת חתימה</p>
                    <p className="text-[10px] font-black text-blue-900">{ticket.dailyAnalysis?.documentExtraction?.documentTime || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a href={ticket.spLink || '#'} target="_blank" className="flex-1 bg-blue-950 text-white py-3.5 rounded-xl font-black text-[10px] flex items-center justify-center gap-2 shadow-lg tracking-tight">
                    <ExternalLink size={14}/> תעודה מקורית
                  </a>
                  <button onClick={() => remove(ref(db, `delivery_history/${ticket.id}`))} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white">
                    <Trash2 size={18}/>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </main>

      {/* Popups: הזרקה / מחיקה */}
      {activePopup === 'inject' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-end justify-center">
          <div className="bg-white w-full max-w-xl rounded-t-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-20">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                 <Database className="text-yellow-500" size={24}/> ניהול יום: {selectedDate}
              </h3>
              <button onClick={() => setActivePopup(null)} className="p-2 bg-slate-100 rounded-full text-slate-400"><X size={20}/></button>
            </div>

            {/* כפתור מחיקת יום - פותר שגיאת Build */}
            <div className="mb-6 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center justify-between">
              <div className="flex items-center gap-3 text-red-700">
                <AlertCircle size={24}/>
                <p className="text-[11px] font-black uppercase">נקה ארכיון לתאריך זה</p>
              </div>
              <button 
                onClick={deleteSelectedDay} 
                disabled={isDeleting} 
                className="px-4 py-2.5 bg-red-600 text-white rounded-xl font-black text-[10px] shadow-lg active:scale-95 disabled:opacity-50"
              >
                {isDeleting ? 'מוחק...' : 'מחק הכל'}
              </button>
            </div>

            <textarea 
              value={jsonInput} 
              onChange={(e) => setJsonInput(e.target.value)} 
              placeholder="הדבק כאן JSON..." 
              className="w-full h-48 bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-[10px] font-mono outline-none focus:border-blue-500"
            />
            
            <div className="flex gap-3 mt-6">
              <button onClick={() => setActivePopup(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase">ביטול</button>
              <button onClick={handleInject} className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase shadow-xl">הזרק נתונים</button>
            </div>
          </div>
        </div>
      )}
      
      {/* תחתית קבועה - תפריט ניווט מהיר למובייל */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 flex justify-around items-center z-50">
        <button className="flex flex-col items-center gap-1 text-blue-600">
          <LayoutGrid size={20}/>
          <span className="text-[8px] font-black uppercase">דשבורד</span>
        </button>
        <button onClick={() => setActivePopup('inject')} className="flex flex-col items-center gap-1 text-slate-400">
          <Database size={20}/>
          <span className="text-[8px] font-black uppercase">הזרקה</span>
        </button>
        <button onClick={() => { setSelectedDate(new Date().toISOString().split('T')[0]); }} className="flex flex-col items-center gap-1 text-slate-400">
          <Clock size={20}/>
          <span className="text-[8px] font-black uppercase">היום</span>
        </button>
      </nav>
    </div>
  );
}
