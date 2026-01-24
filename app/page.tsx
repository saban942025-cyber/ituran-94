'use client';
import { useEffect, useState, useMemo } from 'react';
import { db } from '../lib/firebase'; 
import { ref, onValue, push, remove, query, orderByChild, equalTo, get } from 'firebase/database';
import { 
  Zap, Fuel, Clock, ChevronDown, Activity, AlertTriangle, X, FileText, 
  Database, CheckCircle, MapPin, ExternalLink, Settings, LayoutGrid, Navigation, Microscope, Search, Trash2, AlertCircle
} from 'lucide-react';

export default function SabanXRayDashboardV14() {
  const [deliveryHistory, setDeliveryHistory] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState('2026-01-19');
  const [activePopup, setActivePopup] = useState<'inject' | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // טעינת נתונים מסונכרנת
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

  // פונקציה למחיקת כל נתוני היום הנבחר
  const deleteSelectedDay = async () => {
    if (!window.confirm(`האם אתה בטוח שברצונך למחוק את כל הנתונים של יום ${selectedDate}? פעולה זו אינה ניתנת לביטול.`)) return;
    
    setIsDeleting(true);
    try {
      const historyRef = ref(db, 'delivery_history');
      const dayQuery = query(historyRef, orderByChild('date'), equalTo(selectedDate));
      const snapshot = await get(dayQuery);
      
      if (snapshot.exists()) {
        const updates: any = {};
        snapshot.forEach((child) => {
          updates[child.key!] = null;
        });
        await remove(dayQuery); // מוחק את כל הרשומות שעונות לשאילתה
        alert(`כל הנתונים של יום ${selectedDate} נמחקו בהצלחה.`);
      } else {
        alert('לא נמצאו נתונים למחיקה ביום זה.');
      }
    } catch (e) {
      alert('שגיאה בתהליך המחיקה.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleInject = () => {
    try {
      const data = JSON.parse(jsonInput);
      const historyRef = ref(db, 'delivery_history');
      
      const dataWithDate = Array.isArray(data) ? data.map(item => ({
        ...item,
        date: item.date || selectedDate,
        timestamp: Date.now()
      })) : [{ ...data, date: data.date || selectedDate, timestamp: Date.now() }];

      dataWithDate.forEach((item: any) => push(historyRef, item));
      
      alert(`הוזרקו ${dataWithDate.length} תעודות חדשות.`);
      setJsonInput('');
      setActivePopup(null);
    } catch (e) {
      alert('שגיאה בפורמט ה-JSON.');
    }
  };

  const filteredHistory = useMemo(() => {
    return deliveryHistory.filter(t => t.date === selectedDate);
  }, [deliveryHistory, selectedDate]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-right flex flex-col md:flex-row" dir="rtl">
      
      {/* Sidebar */}
      <aside className="w-full md:w-80 bg-[#001D3D] text-white p-6 overflow-y-auto hidden md:block border-l border-blue-800">
        <div className="flex items-center gap-2 mb-10">
          <div className="p-2 bg-blue-600 rounded-lg"><Microscope size={20} className="text-white" /></div>
          <h2 className="text-xl font-black tracking-tighter uppercase">X-RAY ASSETS</h2>
        </div>
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-4 italic">ארכיון יום: {selectedDate}</p>
          {filteredHistory.map((t, i) => (
            <div key={i} className={`p-4 rounded-2xl border transition-all ${t.status === 'חריגה' ? 'border-red-500/30 bg-red-500/10' : 'border-blue-700/30 bg-blue-900/30'}`}>
              <p className="text-xs font-black truncate">{t.customer}</p>
              <p className="text-[9px] text-blue-400 mt-1">ID: {t.ticketId}</p>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white p-6 shadow-sm border-b flex flex-col md:flex-row justify-between items-center sticky top-0 z-50 gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-black text-slate-900 italic leading-none">SABAN <span className="text-blue-600">X-RAY</span></h1>
              <p className="text-[10px] font-bold text-slate-400 mt-1">ניהול והצלבת נכסים לוגיסטיים</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button onClick={() => setActivePopup('inject')} className="flex-1 md:flex-none px-6 py-3 bg-blue-950 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-xl">
              <Database size={16} className="text-yellow-400" /> עדכון / הזרקת יום
            </button>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-slate-100 text-slate-700 font-black text-xs p-3 rounded-2xl border-none outline-none focus:ring-2 ring-blue-500" />
          </div>
        </header>

        <main className="p-6 space-y-6 max-w-5xl mx-auto w-full">
          {filteredHistory.sort((a,b) => (a.timestamp || 0) - (b.timestamp || 0)).map((ticket) => (
            <div key={ticket.id} className={`bg-white rounded-[2.5rem] shadow-sm border-2 overflow-hidden ${expandedId === ticket.id ? 'border-blue-200 ring-4 ring-blue-500/5' : 'border-slate-100'}`}>
              <div className="p-6 cursor-pointer" onClick={() => setExpandedId(expandedId === ticket.id ? null : ticket.id)}>
                <div className="flex justify-between items-center mb-6">
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${ticket.status === 'חריגה' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                    {ticket.status || 'תקין'}
                  </span>
                  <button onClick={(e) => { e.stopPropagation(); remove(ref(db, `delivery_history/${ticket.id}`)); }} className="text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 size={18}/>
                  </button>
                </div>
                <div className="flex items-center gap-5">
                   <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl">{String(ticket.aiAnalysis || '').includes('🏗️') ? '🏗️' : '🚛'}</div>
                   <div>
                     <h4 className="text-xl font-black text-slate-900">{String(ticket.ticketId || '').replace('משלוח-', 'תעודה #')}</h4>
                     <p className="text-sm font-bold text-slate-500">{ticket.customer}</p>
                   </div>
                </div>
                <div className="mt-6 p-5 bg-slate-50 rounded-3xl border border-slate-100">
                  <p className="text-sm font-bold text-slate-700 leading-relaxed italic">"{ticket.loadingTime}"</p>
                </div>
              </div>
            </div>
          ))}
        </main>
      </div>

      {/* Modal - הזרקה ומחיקה */}
      {activePopup === 'inject' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[3rem] p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                 <Database className="text-yellow-500" size={28}/> ניהול נתוני יום
              </h3>
              <button onClick={() => setActivePopup(null)} className="p-2 bg-slate-100 rounded-full text-slate-400"><X size={20}/></button>
            </div>

            {/* כפתור המחיקה החדש */}
            <div className="mb-6 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <AlertCircle className="text-red-500" size={24}/>
                  <div>
                    <p className="text-xs font-black text-red-900">ניקוי ארכיון ליום זה</p>
                    <p className="text-[10px] text-red-400 font-bold">מחיקת כל התעודות של {selectedDate}</p>
                  </div>
               </div>
               <button 
                onClick={deleteSelectedDay}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-xl font-black text-[10px] hover:bg-red-700 transition-all flex items-center gap-2 shadow-lg shadow-red-600/20"
               >
                 {isDeleting ? 'מוחק...' : <><Trash2 size={14}/> מחק הכל</>}
               </button>
            </div>

            <textarea 
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="הדבק כאן את ה-JSON החדש..."
              className="w-full h-64 bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-6 text-[11px] font-mono outline-none focus:border-blue-500 transition-all"
            />
            
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
