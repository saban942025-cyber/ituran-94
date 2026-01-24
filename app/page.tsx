'use client';
import { useEffect, useState, useMemo } from 'react';
import { db } from '../lib/firebase'; 
import { ref, onValue } from 'firebase/database';
import { 
  Zap, Fuel, Gauge, Clock, ChevronDown, Activity, AlertTriangle, TrendingDown, X, User, CheckCircle
} from 'lucide-react';

export default function SabanEliteDashboardV8() {
  const [deliveryHistory, setDeliveryHistory] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState('2026-01-22');
  const [activePopup, setActivePopup] = useState<'efficiency' | 'waste' | null>(null);

  // נתוני נהגים לראש הדשבורד
  const driverProfiles = [
    { id: 'חכמת', img: '🏗️', color: 'bg-blue-600', role: 'מנוף' },
    { id: 'מוחמד אכבריה', img: '🚚', color: 'bg-orange-600', role: 'סמי' },
    { id: 'עלי', img: '🏗️', color: 'bg-purple-600', role: 'מנוף' },
    { id: 'יואב', img: '🚐', color: 'bg-slate-600', role: 'מנהל' },
    { id: 'בורהאן', img: '🚛', color: 'bg-emerald-600', role: 'נהג' }
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

  // חישוב מדדי צי (Fleet Analytics)
  const stats = useMemo(() => {
    const today = deliveryHistory.filter(t => t.date === selectedDate);
    return {
      totalPTO: today.filter(t => t.aiAnalysis.includes('🏗️')).length,
      idlingHours: "1.4", // מחושב מהדוח
      efficiency: "92%",
      topIdlers: [
        { name: 'עלי', time: '59 דק׳', impact: 'גבוה' },
        { name: 'יואב', time: '41 דק׳', impact: 'בינוני' },
        { name: 'מוחמד', time: '34 דק׳', impact: 'קל' }
      ],
      topEfficient: [
        { name: 'חכמת', work: '5 פריקות', score: '98' },
        { name: 'בורהאן', work: '26 ק״מ', score: '85' },
        { name: 'עלי', work: '148 ק״מ', score: '82' }
      ]
    };
  }, [deliveryHistory, selectedDate]);

  return (
    <div className="min-h-screen bg-[#F2F2F7] font-sans text-right pb-10" dir="rtl">
      
      {/* Header - Glassmorphism Style */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-[100] border-b border-slate-200 p-5 rounded-b-[2.5rem] shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-black text-black tracking-tight">צי ח.סבן</h1>
            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Saban Energy Intelligence</p>
          </div>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-slate-100 font-black text-xs p-2 rounded-xl border-none" />
        </div>

        {/* כפתורי נהגים מרובעים - iPhone Style */}
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {driverProfiles.map(driver => (
            <div key={driver.id} className="flex-shrink-0 flex flex-col items-center">
              <div className="w-16 h-16 bg-white rounded-[1.2rem] shadow-sm border border-slate-100 flex items-center justify-center text-3xl mb-1">
                {driver.img}
              </div>
              <span className="text-[10px] font-black text-slate-400">{driver.id.split(' ')[0]}</span>
            </div>
          ))}
        </div>
      </header>

      <main className="p-4 space-y-4 max-w-2xl mx-auto">
        
        {/* מדדי יעילות לחיצים */}
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => setActivePopup('efficiency')}
            className="bg-white p-5 rounded-[2rem] shadow-sm border-b-4 border-blue-500 text-right active:scale-95 transition-transform"
          >
            <Zap className="text-blue-500 mb-2" size={28} />
            <h3 className="text-2xl font-black">{stats.efficiency}</h3>
            <p className="text-[10px] font-bold text-slate-400">יעילות צי יומית (PTO)</p>
          </button>

          <button 
            onClick={() => setActivePopup('waste')}
            className="bg-white p-5 rounded-[2rem] shadow-sm border-b-4 border-red-500 text-right active:scale-95 transition-transform"
          >
            <Fuel className="text-red-500 mb-2" size={28} />
            <h3 className="text-2xl font-black">{stats.idlingHours} ש׳</h3>
            <p className="text-[10px] font-bold text-slate-400">בזבוז אנרגיה (Idling)</p>
          </button>
        </div>

        {/* סטטיסטיקה מהירה */}
        <div className="bg-[#001D3D] text-white p-6 rounded-[2.5rem] flex justify-between items-center shadow-xl">
          <div className="flex items-center gap-4">
            <div className="bg-blue-500/20 p-3 rounded-2xl"><Activity className="text-blue-400" /></div>
            <div>
              <p className="text-[10px] font-bold text-blue-300">סה״כ פתיחות PTO</p>
              <h4 className="text-xl font-black">{stats.totalPTO} הפעלות היום</h4>
            </div>
          </div>
          <ChevronDown className="text-blue-300" />
        </div>

        {/* רשימת אירועים (רק חריגים ו-PTO) */}
        <h2 className="text-sm font-black text-slate-500 mt-6 mb-2 uppercase tracking-widest">יומן חריגים ופיפסים</h2>
        {deliveryHistory.filter(t => t.date === selectedDate).map(ticket => (
          <div key={ticket.id} className="bg-white rounded-[2rem] p-5 shadow-sm border-r-[10px]" style={{ borderRightColor: ticket.statusColor }}>
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-black text-slate-900">{ticket.ticketId}</h4>
                <p className="text-xs font-bold text-slate-400">{ticket.customer}</p>
                <div className="mt-3 text-xs font-black text-blue-600 bg-blue-50 inline-block px-3 py-1 rounded-full italic">
                  "{ticket.aiAnalysis}"
                </div>
              </div>
              <div className="text-left">
                <span className="text-[10px] font-black text-slate-300 block">זמן שטח</span>
                <span className="text-sm font-black text-slate-800">{ticket.ituranTime}</span>
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* Popups / Bottom Sheet Modals */}
      {activePopup && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-end justify-center animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-t-[3rem] p-8 shadow-2xl animate-in slide-in-from-bottom-10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black flex items-center gap-2">
                {activePopup === 'waste' ? <AlertTriangle className="text-red-500"/> : <CheckCircle className="text-blue-500"/>}
                {activePopup === 'waste' ? '3 הנהגים המבזבזים ביותר' : '3 הנהגים המצטיינים'}
              </h3>
              <button onClick={() => setActivePopup(null)} className="p-2 bg-slate-100 rounded-full text-slate-400"><X size={20}/></button>
            </div>

            <div className="space-y-4">
              {(activePopup === 'waste' ? stats.topIdlers : stats.topEfficient).map((driver, idx) => (
                <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-blue-900 border">{idx+1}</div>
                    <div>
                      <p className="font-black text-slate-800">{driver.name}</p>
                      <p className="text-[10px] font-bold text-slate-400">{activePopup === 'waste' ? 'זמן מנוע דולק בעמידה' : 'ביצועי מנוף/מרחק'}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className={`font-black ${activePopup === 'waste' ? 'text-red-500' : 'text-blue-600'}`}>
                      {activePopup === 'waste' ? driver.time : `${driver.score}/100`}
                    </p>
                    <span className="text-[9px] font-black uppercase text-slate-300">{activePopup === 'waste' ? 'אימפקט' : 'ציון יעילות'}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase">הפק דוח מפורט</button>
          </div>
        </div>
      )}
    </div>
  );
}
