'use client';
import { useEffect, useState, useMemo } from 'react';
// ייבוא בסיס הנתונים מתוך lib/firebase
import { db } from '../lib/firebase'; 
import { ref, onValue, remove } from 'firebase/database';
// ייבוא האייקונים הנדרשים - כולל CheckCircle שגרם לשגיאה ב-Build
import { 
  Zap, Fuel, Gauge, Clock, ChevronDown, Activity, AlertTriangle, X, User, CheckCircle, MapPin, Trash2, ExternalLink 
} from 'lucide-react';

export default function SabanEliteDashboardV8() {
  const [deliveryHistory, setDeliveryHistory] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState('2026-01-22');
  const [activePopup, setActivePopup] = useState<'efficiency' | 'waste' | null>(null);
  const [activeDriver, setActiveDriver] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // פרופילי נהגים לכפתורים בראש הדף
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

  // חישוב מדדי צי וניתוח "פיפסים"
  const stats = useMemo(() => {
    const today = deliveryHistory.filter(t => t.date === selectedDate);
    return {
      totalPTO: today.filter(t => t.aiAnalysis.includes('🏗️')).length,
      idlingHours: "1.4", 
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

  // סינון היסטוריה לפי נהג נבחר ואירועי קצה
  const filteredHistory = useMemo(() => {
    return deliveryHistory.filter(t => 
      t.date === selectedDate && 
      (!activeDriver || t.aiAnalysis.includes(activeDriver))
    );
  }, [deliveryHistory, selectedDate, activeDriver]);

  return (
    <div className="min-h-screen bg-[#F2F2F7] font-sans text-right pb-10" dir="rtl">
      
      {/* Header - תואם מובייל עם כפתורי נהגים רחבים */}
      <header className="bg-[#001D3D] sticky top-0 z-[100] p-5 rounded-b-[2.5rem] shadow-xl">
        <div className="flex justify-between items-center mb-6 text-white">
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter">SABAN AI ELITE</h1>
            <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">ניהול אנרגיה וצי רכב</p>
          </div>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-blue-900 text-white font-black text-xs p-2 rounded-xl border-none outline-none" />
        </div>

        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
           <button 
            onClick={() => setActiveDriver(null)}
            className={`flex-shrink-0 w-20 h-24 rounded-[1.5rem] flex flex-col items-center justify-center transition-all ${{activeDriver === null ? 'bg-white text-blue-900 scale-105' : 'bg-blue-900/50 text-blue-200 opacity-60'}}`}
          >
            <span className="text-2xl mb-1">🌐</span>
            <span className="text-[10px] font-black">כל הצי</span>
          </button>
          {driverProfiles.map(driver => (
            <button 
              key={driver.id}
              onClick={() => setActiveDriver(driver.id)}
              className={`flex-shrink-0 w-24 h-24 rounded-[1.5rem] flex flex-col items-center justify-center transition-all ${{activeDriver === driver.id ? 'bg-white text-blue-900 scale-105 shadow-lg' : 'bg-blue-900/50 text-blue-100 opacity-60'}}`}
            >
              <span className="text-3xl mb-1">{driver.img}</span>
              <span className="text-[10px] font-black">{driver.id.split(' ')[0]}</span>
              <span className="text-[8px] font-bold opacity-60">{driver.role}</span>
            </button>
          ))}
        </div>
      </header>

      <main className="p-4 space-y-4 max-w-4xl mx-auto">
        
        {/* מדדי יעילות לחיצים */}
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => setActivePopup('efficiency')} className="bg-white p-5 rounded-[2rem] shadow-sm border-b-8 border-blue-500 text-right active:scale-95 transition-transform">
            <Zap className="text-blue-500 mb-2" size={28} />
            <h3 className="text-2xl font-black">{stats.efficiency}</h3>
            <p className="text-[10px] font-bold text-slate-400">יעילות צי (PTO)</p>
          </button>
          <button onClick={() => setActivePopup('waste')} className="bg-white p-5 rounded-[2rem] shadow-sm border-b-8 border-red-500 text-right active:scale-95 transition-transform">
            <Fuel className="text-red-500 mb-2" size={28} />
            <h3 className="text-2xl font-black">{stats.idlingHours} ש׳</h3>
            <p className="text-[10px] font-bold text-slate-400">בזבוז (עומד מונע)</p>
          </button>
        </div>

        {/* רשימת נסיעות נפתחת (המבורגר) */}
        <h2 className="text-sm font-black text-slate-500 mt-6 mb-2 uppercase tracking-widest">יומן אירועים ותפיסת פיפסים</h2>
        {filteredHistory.map((ticket) => (
          <div key={ticket.id} className="bg-white rounded-[2rem] shadow-sm overflow-hidden border-r-[10px]" style={{ borderRightColor: ticket.statusColor }}>
            <div 
              className="p-5 flex justify-between items-center cursor-pointer hover:bg-slate-50"
              onClick={() => setExpandedId(expandedId === ticket.id ? null : ticket.id)}
            >
              <div className="flex items-center gap-4">
                <div className="bg-slate-100 p-3 rounded-2xl text-2xl">
                  {ticket.aiAnalysis.includes('🏗️') ? '🏗️' : '🛑'}
                </div>
                <div>
                  <h4 className="font-black text-slate-900">{ticket.ticketId.replace('משלוח-', 'תעודה #')}</h4>
                  <p className="text-xs font-bold text-slate-400">{ticket.customer}</p>
                </div>
              </div>
              <ChevronDown className={`text-slate-300 transition-transform ${expandedId === ticket.id ? 'rotate-180' : ''}`} />
            </div>

            {expandedId === ticket.id && (
              <div className="p-6 pt-0 border-t border-slate-50 animate-in slide-in-from-top-2">
                <div className="bg-blue-50/50 rounded-2xl p-4 mb-4 border border-blue-100">
                  <p className="text-[11px] font-black text-blue-700 mb-1 flex items-center gap-1 uppercase">
                    <Activity size={14}/> ניתוח AI דינמי:
                  </p>
                  <p className="text-sm font-black text-slate-800 italic leading-relaxed">"{ticket.aiAnalysis}"</p>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4 text-center">
                  <div className="bg-white border p-3 rounded-2xl">
                    <span className="text-[9px] font-black text-slate-400 block uppercase">זמן איתוראן</span>
                    <span className="text-sm font-black text-blue-900">{ticket.ituranTime}</span>
                  </div>
                  <div className="bg-white border p-3 rounded-2xl">
                    <span className="text-[9px] font-black text-slate-400 block uppercase">סטטוס</span>
                    <span className={`text-sm font-black ${ticket.status === 'תקין' ? 'text-green-600' : 'text-amber-600'}`}>{ticket.status}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a href={ticket.spLink} target="_blank" className="flex-1 bg-blue-900 text-white py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg">
                    <ExternalLink size={16}/> כרטיס לקוח ותעודה
                  </a>
                  <button onClick={() => remove(ref(db, `delivery_history/${ticket.id}`))} className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all">
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </main>

      {/* Popups - תיקון שגיאת TypeScript על ידי שימוש ב-any */}
      {activePopup && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-end justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-[3rem] p-8 shadow-2xl animate-in slide-in-from-bottom-10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black flex items-center gap-2 text-blue-900">
                {activePopup === 'waste' ? <AlertTriangle className="text-red-500"/> : <CheckCircle className="text-blue-500"/>}
                {activePopup === 'waste' ? 'מדד בזבוז אנרגיה (Top Idling)' : 'מדד יעילות מצטיינת'}
              </h3>
              <button onClick={() => setActivePopup(null)} className="p-2 bg-slate-100 rounded-full text-slate-400"><X size={20}/></button>
            </div>

            <div className="space-y-4">
              {(activePopup === 'waste' ? stats.topIdlers : stats.topEfficient).map((driver: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-blue-900 border">{idx+1}</div>
                    <div>
                      <p className="font-black text-slate-800">{driver.name}</p>
                      <p className="text-[10px] font-bold text-slate-400">{activePopup === 'waste' ? 'מנוע דולק בעמידה' : 'ביצועי פריקה ותנועה'}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className={`font-black ${activePopup === 'waste' ? 'text-red-500' : 'text-blue-600'}`}>
                      {activePopup === 'waste' ? driver.time : `${driver.score}/100`}
                    </p>
                    <span className="text-[9px] font-black uppercase text-slate-300">
                      {activePopup === 'waste' ? 'אימפקט' : 'ציון סופי'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
