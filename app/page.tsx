'use client';
import { useEffect, useState, useMemo } from 'react';
import { db } from '../lib/firebase'; 
import { ref, onValue } from 'firebase/database';
import { 
  Zap, Fuel, Gauge, Clock, MapPin, ChevronLeft, AlertCircle, CheckCircle2, User, Truck
} from 'lucide-react';

export default function SabanUltimateDashboard() {
  const [deliveryHistory, setDeliveryHistory] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState('2026-01-22');
  const [activeDriver, setActiveDriver] = useState<string | null>(null);

  // פרופילי נהגים - כפתורי "המבורגר" רחבים בראש הדף
  const drivers = [
    { id: 'חכמת', role: 'מנוף', img: '🏗️' },
    { id: 'בורהאן', role: 'נהג', img: '🚛' },
    { id: 'מוחמד אכבריה', role: 'סמיטריילר', img: '🚚' },
    { id: 'עלי', role: 'מנוף', img: '🏗️' },
    { id: 'יואב', role: 'מנהל/נהג', img: '🚐' }
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

  // סינון חכם: רק הנהג הנבחר ורק אירועים עם התראות/PTO
  const filteredData = useMemo(() => {
    return deliveryHistory.filter(t => 
      t.date === selectedDate && 
      (!activeDriver || t.aiAnalysis.includes(activeDriver)) &&
      (t.aiAnalysis.includes('🏗️') || t.aiAnalysis.includes('🛑') || t.status !== 'תקין')
    );
  }, [deliveryHistory, selectedDate, activeDriver]);

  return (
    <div className="min-h-screen bg-[#F0F2F5] font-sans text-right" dir="rtl">
      {/* Header - Mobile Responsive & Professional */}
      <header className="bg-[#001D3D] p-4 md:p-8 rounded-b-[2rem] md:rounded-b-[4rem] shadow-2xl sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter italic">SABAN AI ELITE</h1>
              <p className="text-blue-300 font-bold text-xs md:text-sm uppercase tracking-[0.2em]">מערכת ניהול אנרגיה וצי רכב</p>
            </div>
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-blue-800/50 text-white font-black px-4 py-2 rounded-2xl border-2 border-blue-400/30 outline-none focus:ring-2 ring-yellow-400"
            />
          </div>

          {/* שורת נהגים רחבה - כפתורים מרובעים גדולים */}
          <div className="flex gap-3 md:gap-6 overflow-x-auto pb-4 no-scrollbar">
            <button 
              onClick={() => setActiveDriver(null)}
              className={`flex-shrink-0 w-20 h-24 md:w-32 md:h-32 rounded-[2rem] flex flex-col items-center justify-center transition-all ${!activeDriver ? 'bg-yellow-400 text-blue-900 scale-105 shadow-[0_0_20px_rgba(250,204,21,0.4)]' : 'bg-blue-900/50 text-blue-200 border border-blue-700/50'}`}
            >
              <div className="text-2xl md:text-4xl mb-2">🌐</div>
              <span className="font-black text-[10px] md:text-xs">כל הצי</span>
            </button>
            {drivers.map(driver => (
              <button 
                key={driver.id}
                onClick={() => setActiveDriver(driver.id)}
                className={`flex-shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-[2rem] flex flex-col items-center justify-center transition-all border-b-4 ${activeDriver === driver.id ? 'bg-white text-blue-900 border-yellow-400 scale-105 shadow-xl' : 'bg-blue-900/50 text-blue-100 border-transparent opacity-70'}`}
              >
                <div className="text-3xl md:text-5xl mb-1">{driver.img}</div>
                <span className="font-black text-[10px] md:text-sm">{driver.id.split(' ')[0]}</span>
                <span className="text-[8px] md:text-[10px] opacity-60 font-bold">{driver.role}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* תפיסת פיפס תנועה ומדדי יעילות */}
        <section className="mb-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm flex items-center gap-4 border-b-8 border-yellow-400">
            <div className="p-4 bg-yellow-50 rounded-2xl"><Zap className="text-yellow-600" size={32}/></div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase">ניצול אנרגיה</p>
              <h3 className="text-2xl font-black text-slate-800">92% יעילות</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm flex items-center gap-4 border-b-8 border-red-500">
            <div className="p-4 bg-red-50 rounded-2xl"><Fuel className="text-red-600" size={32}/></div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase">בזבוז (עומד מונע)</p>
              <h3 className="text-2xl font-black text-slate-800">1.4 שעות</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm flex items-center gap-4 border-b-8 border-blue-600">
            <div className="p-4 bg-blue-50 rounded-2xl"><CheckCircle2 className="text-blue-600" size={32}/></div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase">משימות שהושלמו</p>
              <h3 className="text-2xl font-black text-slate-800">{filteredData.length} הצלבות</h3>
            </div>
          </div>
        </section>

        {/* רשימת נסיעות מעוצבת - רק התראות ו-PTO */}
        <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
          <Clock className="text-blue-900" /> יומן אירועי קצה (פיפסים)
        </h2>

        <div className="grid grid-cols-1 gap-4">
          {filteredData.map((item) => (
            <div key={item.id} className="bg-white rounded-[2rem] p-6 shadow-md hover:shadow-xl transition-all border-r-[12px]" style={{ borderRightColor: item.statusColor }}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center text-3xl shadow-inner">
                    {item.aiAnalysis.includes('🏗️') ? '🏗️' : '🛑'}
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-blue-950 tracking-tight">{item.ticketId}</h4>
                    <p className="text-sm font-bold text-slate-500 flex items-center gap-1">
                      <MapPin size={14} className="text-blue-400" /> {item.customer}
                    </p>
                  </div>
                </div>

                {/* תצוגת עמודות כמו בגליון אך מעוצבת */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto">
                  <div className="text-center px-4 border-l">
                    <span className="block text-[10px] font-black text-slate-400 uppercase">זמן איתוראן</span>
                    <span className="text-sm font-black text-blue-900">{item.ituranTime}</span>
                  </div>
                  <div className="text-center px-4 border-l">
                    <span className="block text-[10px] font-black text-slate-400 uppercase">סטטוס</span>
                    <span className={`text-sm font-black ${item.status === 'תקין' ? 'text-green-600' : 'text-red-500'}`}>{item.status}</span>
                  </div>
                  <div className="col-span-2 md:col-span-2 bg-blue-50/50 p-3 rounded-2xl border border-blue-100">
                    <span className="block text-[9px] font-black text-blue-400 uppercase mb-1">ניתוח פיפס AI</span>
                    <p className="text-[11px] font-bold text-blue-900 leading-tight italic">"{item.aiAnalysis}"</p>
                  </div>
                </div>

                <button className="w-full md:w-auto bg-blue-900 text-white p-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg">
                  <span className="font-black text-sm">כרטיס לקוח</span>
                  <ChevronLeft size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer Mobile Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-around items-center md:hidden z-50">
        <button className="flex flex-col items-center text-blue-900"><Gauge size={24}/><span className="text-[10px] font-black">דשבורד</span></button>
        <button className="flex flex-col items-center text-slate-400"><User size={24}/><span className="text-[10px] font-black">נהגים</span></button>
        <button className="flex flex-col items-center text-slate-400"><Truck size={24}/><span className="text-[10px] font-black">צי רכב</span></button>
      </nav>
    </div>
  );
}
