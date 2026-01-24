'use client';
import { useEffect, useState, useMemo } from 'react';
import { db } from '../lib/firebase'; 
import { ref, onValue, remove } from 'firebase/database';
import { 
  Package, Search, AlertCircle, ChevronDown, ChevronUp, ExternalLink, CheckCircle2, Trash2, Database
} from 'lucide-react';

export default function SabanEliteArchiveV6() {
  const [deliveryHistory, setDeliveryHistory] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState('2026-01-22');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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
    deliveryHistory.filter(t => t.date === selectedDate && 
      (t.customer.toLowerCase().includes(searchTerm.toLowerCase()) || t.ticketId.includes(searchTerm))
    ), [deliveryHistory, selectedDate, searchTerm]);

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-sans text-right p-4" dir="rtl">
      <header className="bg-white rounded-[2rem] shadow-lg p-6 mb-8 flex justify-between items-center border-b-4 border-blue-900">
        <div>
          <h1 className="text-2xl font-black text-blue-900 italic">SABAN LOGISTICS</h1>
          <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">ניהול צי חכם - ח.סבן</p>
        </div>
        <input 
          type="date" 
          value={selectedDate} 
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-slate-100 font-black text-sm p-2 rounded-xl outline-none text-blue-900 border"
        />
      </header>

      <main className="max-w-4xl mx-auto space-y-4">
        {filteredHistory.map((ticket) => (
          <div key={ticket.id} className="bg-white rounded-[2rem] shadow-md overflow-hidden border-r-[10px]" style={{ borderRightColor: ticket.statusColor }}>
            {/* Header - לחיצה לפתיחה/סגירה */}
            <div 
              className="p-5 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => setExpandedId(expandedId === ticket.id ? null : ticket.id)}
            >
              <div className="flex items-center gap-4">
                <div className="bg-slate-100 p-3 rounded-2xl text-xl">
                  {ticket.aiAnalysis.includes('🏗️') ? '🏗️' : '🛑'}
                </div>
                <div>
                  <h3 className="font-black text-blue-950 text-lg leading-none">{ticket.ticketId}</h3>
                  <p className="font-bold text-slate-500 text-sm mt-1">{ticket.customer}</p>
                </div>
              </div>
              {expandedId === ticket.id ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
            </div>

            {/* Content - החלק הנפתח */}
            {expandedId === ticket.id && (
              <div className="p-6 pt-0 border-t border-slate-50 animate-in fade-in slide-in-from-top-2">
                <div className="bg-blue-50/50 rounded-[1.5rem] p-5 border border-blue-100 mb-4">
                  <p className="text-[11px] font-black text-blue-700 mb-2 uppercase flex items-center gap-1">
                    <AlertCircle size={14}/> ניתוח אירוע בשטח:
                  </p>
                  <p className="text-sm font-black text-slate-800 leading-relaxed italic">"{ticket.aiAnalysis}"</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-white border rounded-2xl p-3 text-center shadow-sm">
                    <span className="text-[9px] font-black text-slate-400 block uppercase">זמן איתוראן</span>
                    <span className="text-sm font-black text-blue-900">{ticket.ituranTime}</span>
                  </div>
                  <div className="bg-white border rounded-2xl p-3 text-center shadow-sm">
                    <span className="text-[9px] font-black text-slate-400 block uppercase">סטטוס</span>
                    <span className={`text-sm font-black ${ticket.status === 'תקין' ? 'text-green-600' : 'text-amber-600'}`}>
                      {ticket.status}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <a href={ticket.spLink} target="_blank" className="flex-1 bg-blue-900 text-white py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 hover:bg-black transition-all">
                    <ExternalLink size={14}/> הצג תעודה בדרייב
                  </a>
                  <button onClick={() => remove(ref(db, `delivery_history/${ticket.id}`))} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </main>
    </div>
  );
}
