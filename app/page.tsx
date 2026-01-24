'use client';
import { useEffect, useState, useMemo } from 'react';
import { db } from '../lib/firebase'; 
import { ref, onValue, remove } from 'firebase/database';
import { 
  Zap, Fuel, Gauge, Clock, ChevronDown, Activity, AlertTriangle, X, User, 
  CheckCircle, MapPin, Trash2, ExternalLink, Settings, Bell, TrendingDown
} from 'lucide-react';

export default function SabanUltimateControlV9() {
  const [deliveryHistory, setDeliveryHistory] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState('2026-01-22');
  const [activePopup, setActivePopup] = useState<'efficiency' | 'waste' | 'alerts' | null>(null);
  const [activeDriver, setActiveDriver] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [fuelPrice, setFuelPrice] = useState(7.29); // מחיר סולר ברירת מחדל

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

  // לוגיקת "המוח" - חישובי יעילות, בזבוז ועלויות סולר
  const stats = useMemo(() => {
    const today = deliveryHistory.filter(t => t.date === selectedDate);
    const ptoEvents = today.filter(t => t.aiAnalysis?.includes('🏗️'));
    
    // חישוב שעות עמידה
    let totalMins = 0;
    const idlingMap: any = {};
    today.forEach(t => {
      if (t.aiAnalysis?.includes('🛑')) {
        const mins = parseInt(t.aiAnalysis.match(/(\d+)\s+דקות/)?.[1] || "0");
        totalMins += mins;
        const driver = t.aiAnalysis.split('נהג ')[1]?.split(' ')[0] || 'אחר';
        idlingMap[driver] = (idlingMap[driver] || 0) + mins;
      }
    });

    const totalHours = totalMins / 60;
    // חישוב עלות: שעות * 7.8 ליטר לשעה (ממוצע משאית) * מחיר סולר
    const dailyWasteCost = (totalHours * 7.8 * fuelPrice).toFixed(0);

    return {
      totalPTO: ptoEvents.length,
      idlingTime: `${Math.floor(totalHours)}:${Math.round((totalHours % 1) * 60).toString().padStart(2, '0')}`,
      wasteCost: dailyWasteCost,
      idlingCount: today.filter(t => t.aiAnalysis?.includes('🛑')).length,
      topIdlers: Object.entries(idlingMap).map(([name, time]: any) => ({
        name, time: `${time} דק׳`, impact: time > 45 ? 'קריטי' : 'בינוני'
      })).sort((a, b) => parseInt(b.time) - parseInt(a.time)),
      alerts: [
        { title: 'פתיחות PTO', count: ptoEvents.length, icon: '🏗️' },
        { title: 'עצירות חריגות', count: today.filter(t => t.status !== 'תקין').length, icon: '⚠️' },
        { title: 'רכבים מונעים בעמידה', count: new Set(today.filter(t => t.aiAnalysis?.includes('🛑')).map(t => t.aiAnalysis.split('נהג ')[1]?.split(' ')[0])).size, icon: '🛑' }
      ]
    };
  }, [deliveryHistory, selectedDate, fuelPrice]);

  const filteredHistory = useMemo(() => {
    return deliveryHistory.filter(t => 
      t.date === selectedDate && (!activeDriver || t.aiAnalysis?.includes(activeDriver))
    );
  }, [deliveryHistory, selectedDate, activeDriver]);

  return (
    <div className="min-h-screen bg-[#F2F2F7] font-sans text-right pb-20" dir="rtl">
      
      {/* Header & Navigation */}
      <header className="bg-[#001D3D] sticky top-0 z-[100] p-5 rounded-b-[2.5rem] shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-400 rounded-2xl shadow-lg shadow-yellow-400/20"><TrendingDown className="text-blue-900" size={24}/></div>
            <div>
              <h1 className="text-2xl font-black text-white italic">SABAN ELITE</h1>
              <p className="text-[9px] font-bold text-blue-300 uppercase">מערכת בקרת אנרגיה ועלויות</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                const price = prompt("הזן מחיר סולר עדכני (למשל 7.29):", fuelPrice.toString());
                if (price) setFuelPrice(parseFloat(price));
              }}
              className="p-3 bg-blue-800/50 text-white rounded-xl border border-blue-400/30"
            >
              <Settings size={18} />
            </button>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-blue-900 text-white font-black text-xs p-2 rounded-xl border-none" />
          </div>
        </div>

        {/* שורת נהגים רחבה */}
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          <button onClick={() => setActiveDriver(null)} className={`flex-shrink-0 w-20 h-24 rounded-[1.5rem] flex flex-col items-center justify-center transition-all ${activeDriver === null ? 'bg-white text-blue-900 scale-105 shadow-xl' : 'bg-blue-900/50 text-blue-200'}`}>
            <span className="text-2xl mb-1">🌐</span>
            <span className="text-[10px] font-black">כל הצי</span>
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
        
        {/* מדדים ראשיים וחישובי עלות */}
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => setActivePopup('waste')} className="bg-white p-6 rounded-[2.5rem] shadow-sm border-b-8 border-red-500 text-right group active:scale-95 transition-all">
            <div className="flex justify-between items-start mb-2">
              <Fuel className="text-red-500" size={32} />
              <div className="bg-red-50 text-red-600 text-[10px] font-black px-2 py-1 rounded-lg">-{stats.wasteCost} ₪</div>
            </div>
            <h3 className="text-3xl font-black text-slate-900">{stats.idlingTime}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">זמן עמידה מונע (בזבוז סולר)</p>
          </button>

          <button onClick={() => setActivePopup('alerts')} className="bg-white p-6 rounded-[2.5rem] shadow-sm border-b-8 border-yellow-400 text-right active:scale-95 transition-all">
            <Bell className="text-yellow-500 mb-2" size={32} />
            <h3 className="text-3xl font-black text-slate-900">{stats.idlingCount + stats.totalPTO}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">התראות ופיפסים להיום</p>
          </button>
        </div>

        {/* יומן אירועים נפתח */}
        <h2 className="text-sm font-black text-slate-500 mt-6 mb-2 uppercase tracking-widest flex items-center gap-2">
          <Activity size={16}/> ציר זמן אירועי קצה
        </h2>
        {filteredHistory.map((ticket) => (
          <div key={ticket.id} className="bg-white rounded-[2.5rem] shadow-sm overflow-hidden border-r-[12px] mb-3" style={{ borderRightColor: ticket.statusColor || '#0046ad' }}>
            <div className="p-5 flex justify-between items-center cursor-pointer" onClick={() => setExpandedId(expandedId === ticket.id ? null : ticket.id)}>
              <div className="flex items-center gap-4">
                <div className="text-2xl">{ticket.aiAnalysis?.includes('🏗️') ? '🏗️' : '🛑'}</div>
                <div>
                  <h4 className="font-black text-slate-900 leading-none">{(ticket.ticketId || '').replace('משלוח-', 'תעודה #')}</h4>
                  <p className="text-xs font-bold text-slate-400 mt-1">{ticket.customer}</p>
                </div>
              </div>
              <ChevronDown className={`text-slate-300 transition-transform ${expandedId === ticket.id ? 'rotate-180' : ''}`} />
            </div>

            {expandedId === ticket.id && (
              <div className="p-6 pt-0 animate-in slide-in-from-top-2">
                <div className="bg-blue-50/50 rounded-2xl p-4 mb-4 border border-blue-100">
                  <p className="text-[11px] font-black text-blue-700 mb-1 flex items-center gap-1 uppercase italic">ניתוח מערכת:</p>
                  <p className="text-sm font-black text-slate-800 leading-relaxed italic">"{ticket.aiAnalysis}"</p>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-50 p-3 rounded-2xl text-center border">
                    <span className="text-[9px] font-black text-slate-400 block uppercase">זמן איתוראן</span>
                    <span className="text-sm font-black text-blue-900">{ticket.ituranTime}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl text-center border">
                    <span className="text-[9px] font-black text-slate-400 block uppercase">סטטוס</span>
                    <span className={`text-sm font-black ${ticket.status === 'תקין' ? 'text-green-600' : 'text-amber-600'}`}>{ticket.status}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a href={ticket.spLink} target="_blank" className="flex-1 bg-blue-900 text-white py-4 rounded-2xl font-black text-xs text-center shadow-lg">צפייה בתעודה סרוקה</a>
                  <button onClick={() => remove(ref(db, `delivery_history/${ticket.id}`))} className="p-4 bg-red-50 text-red-500 rounded-2xl"><Trash2 size={20}/></button>
                </div>
              </div>
            )}
          </div>
        ))}
      </main>

      {/* Popups / Bottom Sheets */}
      {activePopup && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-end justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-[3rem] p-8 shadow-2xl animate-in slide-in-from-bottom-10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-blue-950 flex items-center gap-2">
                {activePopup === 'waste' ? <AlertTriangle className="text-red-500"/> : <Bell className="text-yellow-500"/>}
                {activePopup === 'waste' ? 'ניתוח בזבוז ועלויות' : 'סיכום התראות מצב'}
              </h3>
              <button onClick={() => setActivePopup(null)} className="p-2 bg-slate-100 rounded-full text-slate-400"><X size={20}/></button>
            </div>

            <div className="space-y-3">
              {activePopup === 'waste' ? (
                stats.topIdlers.map((driver: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-blue-900 border">{idx+1}</div>
                      <div>
                        <p className="font-black text-slate-800">{driver.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 italic">זמן מנוע דולק ללא תנועה</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="font-black text-red-600">{driver.time}</p>
                      <span className="text-[9px] font-black uppercase text-red-400 italic tracking-widest">{driver.impact}</span>
                    </div>
                  </div>
                ))
              ) : (
                stats.alerts.map((alert: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-5 bg-yellow-50/50 rounded-2xl border border-yellow-100">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">{alert.icon}</div>
                      <p className="font-black text-slate-800">{alert.title}</p>
                    </div>
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center font-black text-blue-900 border-2 border-yellow-400">{alert.count}</div>
                  </div>
                ))
              )}
            </div>
            
            {activePopup === 'waste' && (
              <div className="mt-6 p-4 bg-red-50 rounded-2xl border border-red-100">
                <p className="text-xs font-black text-red-800 flex justify-between">
                  <span>עלות סולר יומית לעמידה (לפי {fuelPrice} ₪):</span>
                  <span>{stats.wasteCost} ₪</span>
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
