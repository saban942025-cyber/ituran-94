'use client';
import { useEffect, useState, useMemo } from 'react';
import { db } from '../lib/firebase'; 
import { ref, onValue, remove, set, push } from 'firebase/database';
import { 
  Zap, Fuel, Gauge, Clock, ChevronDown, Activity, AlertTriangle, X, User, 
  CheckCircle, MapPin, Trash2, ExternalLink, Settings, Bell, Database, PlusCircle
} from 'lucide-react';

export default function SabanEliteControlV10() {
  const [deliveryHistory, setDeliveryHistory] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState('2026-01-22');
  const [activePopup, setActivePopup] = useState<'efficiency' | 'waste' | 'alerts' | 'inject' | null>(null);
  const [activeDriver, setActiveDriver] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [fuelPrice, setFuelPrice] = useState(7.29);
  const [jsonInput, setJsonInput] = useState('');

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
      }
    });
  }, []);

  // פונקציית הזרקת נתונים מהירה מהדשבורד
  const handleInject = () => {
    try {
      const data = JSON.parse(jsonInput);
      const historyRef = ref(db, 'delivery_history');
      data.forEach((item: any) => push(historyRef, item));
      alert('הנתונים הוזרקו בהצלחה לארכיון!');
      setJsonInput('');
      setActivePopup(null);
    } catch (e) {
      alert('שגיאה בפורמט ה-JSON. וודא שהעתקת נכון.');
    }
  };

  const stats = useMemo(() => {
    const today = deliveryHistory.filter(t => t.date === selectedDate);
    let totalMins = 0;
    const idlingMap: any = {};
    today.forEach(t => {
      if (String(t.aiAnalysis || '').includes('🛑')) {
        const mins = parseInt(t.aiAnalysis.match(/(\d+)\s+דקות/)?.[1] || "0");
        totalMins += mins;
        const driver = t.aiAnalysis.split('נהג ')[1]?.split(' ')[0] || 'אחר';
        idlingMap[driver] = (idlingMap[driver] || 0) + mins;
      }
    });

    const totalHours = totalMins / 60;
    const dailyWasteCost = (totalHours * 7.8 * fuelPrice).toFixed(0);

    return {
      totalPTO: today.filter(t => String(t.aiAnalysis || '').includes('🏗️')).length,
      idlingTime: `${Math.floor(totalHours)}:${Math.round((totalHours % 1) * 60).toString().padStart(2, '0')}`,
      wasteCost: dailyWasteCost,
      idlingCount: today.filter(t => String(t.aiAnalysis || '').includes('🛑')).length,
      topIdlers: Object.entries(idlingMap).map(([name, time]: any) => ({
        name, time: `${time} דק׳`, impact: time > 45 ? 'קריטי' : 'בינוני'
      })).sort((a, b) => parseInt(b.time) - parseInt(a.time))
    };
  }, [deliveryHistory, selectedDate, fuelPrice]);

  const filteredHistory = useMemo(() => {
    return deliveryHistory.filter(t => 
      t.date === selectedDate && (!activeDriver || String(t.aiAnalysis || '').includes(activeDriver))
    );
  }, [deliveryHistory, selectedDate, activeDriver]);

  return (
    <div className="min-h-screen bg-[#F2F2F7] font-sans text-right pb-20" dir="rtl">
      
      {/* Header עם כפתור הזרקה מהירה */}
      <header className="bg-[#001D3D] sticky top-0 z-[100] p-5 rounded-b-[2.5rem] shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3 text-white">
            <h1 className="text-2xl font-black italic">SABAN ELITE</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setActivePopup('inject')} className="p-3 bg-yellow-400 text-blue-900 rounded-xl font-black flex items-center gap-2 shadow-lg">
              <Database size={18} /> <span className="hidden md:inline">הזרקת יום</span>
            </button>
            <button 
              onClick={() => {
                const price = prompt("מחיר סולר:", fuelPrice.toString());
                if (price) setFuelPrice(parseFloat(price));
              }}
              className="p-3 bg-blue-800/50 text-white rounded-xl border border-blue-400/30"
            >
              <Settings size={18} />
            </button>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-blue-900 text-white font-black text-xs p-2 rounded-xl border-none" />
          </div>
        </div>

        {/* שורת נהגים */}
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          <button onClick={() => setActiveDriver(null)} className={`flex-shrink-0 w-20 h-24 rounded-[1.5rem] flex flex-col items-center justify-center transition-all ${activeDriver === null ? 'bg-white text-blue-900 scale-105 shadow-xl' : 'bg-blue-900/50 text-blue-200'}`}>
            <span className="text-2xl mb-1">🌐</span>
            <span className="text-[10px] font-black">הצי</span>
          </button>
          {driverProfiles.map(driver => (
            <button key={driver.id} onClick={() => setActiveDriver(driver.id)} className={`flex-shrink-0 w-24 h-24 rounded-[1.5rem] flex flex-col items-center justify-center transition-all ${activeDriver === driver.id ? 'bg-white text-blue-900 scale-105 shadow-xl' : 'bg-blue-900/50 text-blue-100'}`}>
              <span className="text-3xl mb-1">{driver.img}</span>
              <span className="text-[10px] font-black">{driver.id.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </header>

      <main className="p-4 space-y-4 max-w-4xl mx-auto">
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => setActivePopup('waste')} className="bg-white p-6 rounded-[2.5rem] shadow-sm border-b-8 border-red-500 text-right active:scale-95 transition-all">
            <div className="flex justify-between items-start mb-2">
              <Fuel className="text-red-500" size={32} />
              <div className="bg-red-50 text-red-600 text-[10px] font-black px-2 py-1 rounded-lg">-{stats.wasteCost} ₪</div>
            </div>
            <h3 className="text-3xl font-black text-slate-900">{stats.idlingTime}</h3>
            <p className="text-[10px] font-bold text-slate-400">זמן עמידה (בזבוז)</p>
          </button>
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border-b-8 border-blue-600 text-right">
            <Zap className="text-blue-600 mb-2" size={32} />
            <h3 className="text-3xl font-black text-slate-900">{stats.totalPTO}</h3>
            <p className="text-[10px] font-bold text-slate-400 text-right">פריקות מנוף (PTO)</p>
          </div>
        </div>

        {/* יומן האירועים - התיקון לשגיאת ה-Replace */}
        <h2 className="text-sm font-black text-slate-500 mt-6 mb-2 uppercase tracking-widest flex items-center gap-2">
          <Activity size={16}/> ציר זמן אירועי קצה
        </h2>
        {filteredHistory.map((ticket) => (
          <div key={ticket.id} className="bg-white rounded-[2.5rem] shadow-sm overflow-hidden border-r-[12px] mb-3" style={{ borderRightColor: ticket.statusColor || '#0046ad' }}>
            <div className="p-5 flex justify-between items-center cursor-pointer" onClick={() => setExpandedId(expandedId === ticket.id ? null : ticket.id)}>
              <div className="flex items-center gap-4">
                <div className="text-2xl">{String(ticket.aiAnalysis || '').includes('🏗️') ? '🏗️' : '🛑'}</div>
                <div>
                  <h4 className="font-black text-slate-900 leading-none">
                    {/* התיקון: המרה ל-String לפני ה-replace */}
                    {String(ticket.ticketId || '').replace('משלוח-', 'תעודה #')}
                  </h4>
                  <p className="text-xs font-bold text-slate-400 mt-1">{ticket.customer}</p>
                </div>
              </div>
              <ChevronDown className={`text-slate-300 transition-transform ${expandedId === ticket.id ? 'rotate-180' : ''}`} />
            </div>
          </div>
        ))}
      </main>

      {/* Popups (בזבוז + הזרקת נתונים) */}
      {activePopup && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-end justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-[3rem] p-8 shadow-2xl animate-in slide-in-from-bottom-10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-blue-950 flex items-center gap-2">
                {activePopup === 'inject' ? <Database className="text-yellow-500"/> : <AlertTriangle className="text-red-500"/>}
                {activePopup === 'inject' ? 'הזרקת נתוני יום חדש' : 'ניתוח בזבוז סולר'}
              </h3>
              <button onClick={() => setActivePopup(null)} className="p-2 bg-slate-100 rounded-full text-slate-400"><X size={20}/></button>
            </div>

            {activePopup === 'inject' ? (
              <div className="space-y-4 text-right">
                <p className="text-xs font-bold text-slate-500 italic">הדבק כאן את קוד ה-JSON שהופק מהדוח:</p>
                <textarea 
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder='[ { "ticketId": "...", ... } ]'
                  className="w-full h-40 bg-slate-50 border rounded-2xl p-4 text-xs font-mono outline-none focus:ring-2 ring-yellow-400"
                />
                <button onClick={handleInject} className="w-full py-5 bg-blue-950 text-white rounded-[2rem] font-black flex items-center justify-center gap-2">
                  <PlusCircle size={20}/> הזרק עכשיו לארכיון
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.topIdlers.map((driver: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border border-slate-100 text-right">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-blue-900 border">{idx+1}</div>
                      <p className="font-black text-slate-800">{driver.name}</p>
                    </div>
                    <p className="font-black text-red-600">{driver.time}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
