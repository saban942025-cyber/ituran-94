'use client';
import { useEffect, useState, useMemo } from 'react';
import { db } from '../lib/firebase'; 
import { ref, onValue, push } from 'firebase/database';
import { 
  Zap, Fuel, Clock, ChevronDown, Activity, AlertTriangle, X, FileText, 
  Database, CheckCircle, MapPin, ExternalLink, Settings, LayoutGrid
} from 'lucide-react';

export default function SabanEnterpriseDashboard() {
  const [deliveryHistory, setDeliveryHistory] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState('2026-01-22');
  const [activePopup, setActivePopup] = useState<'waste' | 'inject' | null>(null);
  const [activeDriver, setActiveDriver] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [jsonInput, setJsonInput] = useState('');

  useEffect(() => {
    const historyRef = ref(db, 'delivery_history');
    onValue(historyRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setDeliveryHistory(Object.keys(data).map(k => ({ id: k, ...data[k] })));
      }
    });
  }, []);

  const filteredHistory = useMemo(() => {
    return deliveryHistory.filter(t => 
      t.date === selectedDate && (!activeDriver || String(t.aiAnalysis || '').includes(activeDriver))
    );
  }, [deliveryHistory, selectedDate, activeDriver]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-right flex flex-col md:flex-row" dir="rtl">
      
      {/* Sidebar - רשימת נכסי האתר (תעודות שראמי העלה) */}
      <aside className="w-full md:w-80 bg-white border-l border-slate-200 p-6 overflow-y-auto hidden md:block">
        <div className="flex items-center gap-2 mb-8 text-blue-900">
          <LayoutGrid size={24} />
          <h2 className="text-xl font-black">נכסי האתר</h2>
        </div>
        <div className="space-y-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">תעודות שהועלו לאחרונה</p>
          {filteredHistory.filter(t => t.spLink).map((file, i) => (
            <a key={i} href={file.spLink} target="_blank" className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl hover:bg-blue-50 transition-colors group">
              <div className="p-2 bg-white rounded-xl shadow-sm group-hover:text-blue-600"><FileText size={18}/></div>
              <div className="overflow-hidden">
                <p className="text-xs font-black text-slate-700 truncate">{file.customer}</p>
                <p className="text-[10px] text-slate-400 font-bold">{file.date}</p>
              </div>
            </a>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-[#001D3D] p-6 rounded-b-[3rem] shadow-2xl z-10">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-black text-white italic tracking-tighter">SABAN CONTROL</h1>
            <div className="flex items-center gap-2">
              <button onClick={() => setActivePopup('inject')} className="p-3 bg-yellow-400 text-blue-900 rounded-xl font-black flex items-center gap-2 shadow-lg shadow-yellow-400/20">
                <Database size={18} /> הזרקת נתונים
              </button>
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-blue-900 text-white font-black text-xs p-2 rounded-xl border-none outline-none" />
            </div>
          </div>
          
          {/* Driver Selector */}
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            <button onClick={() => setActiveDriver(null)} className={`flex-shrink-0 w-20 h-24 rounded-[1.8rem] flex flex-col items-center justify-center transition-all ${!activeDriver ? 'bg-white text-blue-900 scale-105 shadow-xl' : 'bg-blue-900/50 text-blue-200 opacity-60'}`}>
              <span className="text-2xl mb-1">🌐</span>
              <span className="text-[10px] font-black">הצי</span>
            </button>
            {['חכמת', 'מוחמד', 'עלי', 'יואב', 'בורהאן'].map(name => (
              <button key={name} onClick={() => setActiveDriver(name)} className={`flex-shrink-0 w-24 h-24 rounded-[1.8rem] flex flex-col items-center justify-center transition-all ${activeDriver === name ? 'bg-white text-blue-900 scale-105 shadow-xl' : 'bg-blue-900/50 text-blue-100 opacity-60'}`}>
                <span className="text-3xl mb-1">{name === 'חכמת' || name === 'עלי' ? '🏗️' : '🚛'}</span>
                <span className="text-[10px] font-black">{name}</span>
              </button>
            ))}
          </div>
        </header>

        <main className="p-6 space-y-4 max-w-5xl mx-auto w-full">
          <h2 className="text-sm font-black text-slate-400 mb-2 uppercase tracking-widest flex items-center gap-2">
            <Activity size={16}/> ניתוח תנועה והצלבת תעודות
          </h2>

          {filteredHistory.map((ticket) => (
            <div key={ticket.id} className="bg-white rounded-[2.5rem] shadow-sm border-r-[12px] overflow-hidden transition-all hover:shadow-md" style={{ borderRightColor: ticket.statusColor || '#0046ad' }}>
              <div className="p-6 cursor-pointer" onClick={() => setExpandedId(expandedId === ticket.id ? null : ticket.id)}>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-slate-100 rounded-[1.5rem] flex items-center justify-center text-3xl">
                      {String(ticket.aiAnalysis || '').includes('🏗️') ? '🏗️' : '🛑'}
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-blue-950 leading-none mb-2 italic">
                        {String(ticket.ticketId || '').replace('משלוח-', 'תעודה #')}
                      </h4>
                      <p className="text-sm font-bold text-slate-500 flex items-center gap-1"><MapPin size={14}/> {ticket.customer}</p>
                    </div>
                  </div>
                  <div className="text-left bg-slate-50 p-3 rounded-2xl border">
                    <span className="text-[10px] font-black text-slate-400 block uppercase mb-1">זמני PTO (איתוראן)</span>
                    <span className="text-sm font-black text-blue-900">{ticket.ituranTime}</span>
                  </div>
                </div>

                {/* עמודת ניתוח יום - טקסט מרובה מעוצב */}
                {ticket.dailyAnalysis && (
                  <div className="mt-6 p-5 bg-blue-50/50 rounded-[2rem] border-r-8 border-yellow-400">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap size={16} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-[11px] font-black text-blue-800 uppercase italic">ניתוח Copilot והצלבת תעודה:</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 leading-relaxed whitespace-pre-wrap italic">
                      {ticket.dailyAnalysis}
                    </p>
                  </div>
                )}
                
                <div className="mt-4 flex justify-end">
                  <ChevronDown className={`text-slate-300 transition-transform ${expandedId === ticket.id ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {expandedId === ticket.id && (
                <div className="px-6 pb-6 pt-0 animate-in fade-in slide-in-from-top-4">
                  <div className="border-t border-slate-100 pt-6 flex gap-3">
                    <a href={ticket.spLink} target="_blank" className="flex-1 bg-blue-950 text-white py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2">
                      <ExternalLink size={16}/> פתח תעודה מקורית (נכס)
                    </a>
                    <button className="p-4 bg-slate-100 text-slate-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all">
                      <Trash2 size={20}/>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </main>
      </div>

      {/* Inject Popup */}
      {activePopup === 'inject' && (
        <div className="fixed inset-0 bg-blue-950/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-blue-900 flex items-center gap-2"><Database size={24} className="text-yellow-500"/> הזרקת ניתוח Copilot</h3>
              <button onClick={() => setActivePopup(null)} className="p-2 bg-slate-100 rounded-full text-slate-400"><X size={20}/></button>
            </div>
            <textarea 
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="הדבק כאן את ה-JSON שקיבלת מ-Copilot Chat..."
              className="w-full h-64 bg-slate-50 border rounded-[2rem] p-6 text-xs font-mono outline-none focus:ring-2 ring-yellow-400"
            />
            <button 
              onClick={() => {
                try {
                  const data = JSON.parse(jsonInput);
                  const historyRef = ref(db, 'delivery_history');
                  data.forEach((item: any) => push(historyRef, item));
                  alert('הניתוח הוזרק בהצלחה!');
                  setJsonInput('');
                  setActivePopup(null);
                } catch (e) { alert('שגיאה בפורמט ה-JSON.'); }
              }}
              className="w-full mt-6 py-5 bg-blue-950 text-white rounded-[2rem] font-black shadow-xl"
            >הזרק לארכיון</button>
          </div>
        </div>
      )}
    </div>
  );
}
