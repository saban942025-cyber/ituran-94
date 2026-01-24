'use client';
import { useEffect, useState, useMemo } from 'react';
import { db } from '../lib/firebase'; 
import { ref, onValue } from 'firebase/database';
import { 
  Zap, Fuel, Gauge, Clock, MapPin, ChevronRight, AlertTriangle, CheckCircle, Info
} from 'lucide-react';

export default function SabanControlCenterV7() {
  const [deliveryHistory, setDeliveryHistory] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState('2026-01-22');
  const [activeDriver, setActiveDriver] = useState<string | null>(null);
  const [showTicketModal, setShowTicketModal] = useState<any>(null);

  // נתונים מדומים לפרופיל נהגים (ניתן להעביר ל-DB בעתיד)
  const driversProfiles = [
    { id: 'חכמת', image: '🏗️', color: 'bg-blue-600' },
    { id: 'בורהאן', image: '🚛', color: 'bg-emerald-600' },
    { id: 'מוחמד אכבריה', image: '🚚', color: 'bg-orange-600' },
    { id: 'עלי', image: '🏗️', color: 'bg-purple-600' },
    { id: 'יואב', image: '🚐', color: 'bg-slate-600' }
  ];

  useEffect(() => {
    const historyRef = ref(db, 'delivery_history');
    onValue(historyRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.keys(data).map(k => ({ id: k, ...data[k] }));
        setDeliveryHistory(list);
      }
    });
  }, []);

  const filteredHistory = useMemo(() => 
    deliveryHistory.filter(t => t.date === selectedDate && (!activeDriver || t.aiAnalysis.includes(activeDriver)))
  , [deliveryHistory, selectedDate, activeDriver]);

  // חישוב מדד יעילות (פיפס תנועה)
  const calculateEfficiency = (ticket: any) => {
    if (ticket.aiAnalysis.includes('PTO')) return { score: 'גבוהה', icon: <Zap className="text-yellow-500" />, label: 'ניצול אנרגיה למנוף' };
    if (ticket.aiAnalysis.includes('עצירה')) return { score: 'נמוכה', icon: <Fuel className="text-red-500" />, label: 'בזבוז דלק (עמידה)' };
    return { score: 'בינונית', icon: <Gauge className="text-blue-500" />, label: 'תנועה רציפה' };
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-right pb-20" dir="rtl">
      {/* Header & Driver Selection */}
      <header className="bg-blue-950 p-6 rounded-b-[3rem] shadow-2xl sticky top-0 z-50">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-white text-2xl font-black italic tracking-tighter">SABAN CONTROL CENTER</h1>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-blue-900 text-white font-bold p-2 rounded-xl border-none outline-none" />
        </div>

        {/* כפתורי נהגים מרובעים */}
        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
          <button 
            onClick={() => setActiveDriver(null)}
            className={`flex-shrink-0 w-20 h-20 rounded-2xl flex flex-col items-center justify-center font-black text-[10px] transition-all ${!activeDriver ? 'bg-white text-blue-900 scale-110 shadow-lg' : 'bg-blue-900 text-blue-200 opacity-60'}`}
          >
            <span>🌐</span>
            <span className="mt-1">כל הצי</span>
          </button>
          {driversProfiles.map(driver => (
            <button 
              key={driver.id}
              onClick={() => setActiveDriver(driver.id)}
              className={`flex-shrink-0 w-20 h-20 rounded-2xl flex flex-col items-center justify-center font-black text-[10px] transition-all ${activeDriver === driver.id ? 'bg-white text-blue-900 scale-110 shadow-lg' : 'bg-blue-900 text-blue-200 opacity-60'}`}
            >
              <span className="text-2xl">{driver.image}</span>
              <span className="mt-1">{driver.id.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-8">
        <h2 className="text-slate-500 font-black text-xs mb-4 uppercase tracking-widest">ציר זמן וניתוח פיפסים</h2>
        
        <div className="space-y-4">
          {filteredHistory.map((ticket) => {
            const efficiency = calculateEfficiency(ticket);
            return (
              <div key={ticket.id} className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-200">
                <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${ticket.statusColor.replace('#', 'bg-[#') + ']' || 'bg-blue-100'}`}>
                      {ticket.aiAnalysis.includes('🏗️') ? '🏗️' : '🛑'}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900">{ticket.ticketId.replace('משלוח-', 'תעודה #')}</h4>
                      <p className="text-xs font-bold text-slate-400">{ticket.customer}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] font-black text-slate-400 block uppercase">זמן איתוראן</span>
                    <span className="text-sm font-black text-blue-900">{ticket.ituranTime}</span>
                  </div>
                </div>

                {/* מדד פיפס תנועה ויעילות */}
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center gap-3">
                    {efficiency.icon}
                    <div>
                      <span className="text-[9px] font-black text-slate-400 block uppercase">יעילות אנרגטית</span>
                      <span className="text-xs font-black">{efficiency.score} - {efficiency.label}</span>
                    </div>
                  </div>
                  
                  {/* כפתור הצלבה חכם - מוצג רק אם יש שעה רלוונטית */}
                  <button 
                    onClick={() => setShowTicketModal(ticket)}
                    className="bg-blue-50 p-3 rounded-2xl border border-blue-100 flex items-center justify-between group hover:bg-blue-600 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="text-blue-600 group-hover:text-white" size={18} />
                      <div className="text-right">
                        <span className="text-[9px] font-black text-blue-400 group-hover:text-blue-200 block uppercase">הצלבת כתובת</span>
                        <span className="text-xs font-black group-hover:text-white text-blue-900">כרטיס לקוח</span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-blue-300 group-hover:text-white" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Modal כרטיס לקוח / תעודה */}
      {showTicketModal && (
        <div className="fixed inset-0 bg-blue-950/80 backdrop-blur-sm z-[100] flex items-end justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-[3rem] p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-blue-900">כרטיס לקוח ותעודה</h3>
              <button onClick={() => setShowTicketModal(null)} className="p-2 bg-slate-100 rounded-full text-slate-400">✕</button>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl">
                <div className="p-4 bg-white shadow-sm rounded-2xl"><MapPin className="text-blue-600"/></div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">לקוח</p>
                  <p className="font-black text-lg">{showTicketModal.customer}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-3xl">
                  <p className="text-[10px] font-bold text-slate-400">זמן ידני (תעודה)</p>
                  <p className="font-black text-blue-900">{showTicketModal.manualTime}</p>
                </div>
                <div className="p-4 border rounded-3xl">
                  <p className="text-[10px] font-bold text-slate-400">זמן איתוראן (GPS)</p>
                  <p className="font-black text-blue-900">{showTicketModal.ituranTime.split('-')[0]}</p>
                </div>
              </div>

              <a 
                href={showTicketModal.spLink} 
                target="_blank"
                className="w-full py-5 bg-blue-900 text-white rounded-[2rem] font-black text-center block shadow-xl hover:bg-black transition-all"
              >
                צפייה בתעודה סרוקה
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
