'use client';
import { useEffect, useState, useMemo } from 'react';
import { db } from '../lib/firebase';
import { ref, onValue, push, set, update, remove } from 'firebase/database';
import dynamic from 'next/dynamic';
import { 
  Truck, FileText, Map as MapIcon, CheckCircle, AlertCircle, 
  User, Clock, Package, Database, X, ChevronDown, ChevronUp, Save, Trash2, Award, BarChart3, MapPin, Search
} from 'lucide-react';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

export default function SabanEliteDiamondFinal() {
  const [drivers, setDrivers] = useState<any>({});
  const [deliveryHistory, setDeliveryHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'fleet' | 'logistics'>('logistics');
  const [isClient, setIsClient] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [selectedDate, setSelectedDate] = useState('2026-01-18');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    onValue(ref(db, 'team'), (snap) => snap.exists() && setDrivers(snap.val()));
    onValue(ref(db, 'delivery_history'), (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setDeliveryHistory(Object.keys(data).map(k => ({ id: k, ...data[k] })));
      }
    });
  }, []);

  const filteredHistory = useMemo(() => 
    deliveryHistory.filter(t => t.date === selectedDate), 
  [deliveryHistory, selectedDate]);

  const dailyProductStats = useMemo(() => {
    const stats: any = {};
    filteredHistory.forEach(t => {
      (t.itemsDetailed || []).forEach((item: any) => {
        stats[item.name] = (stats[item.name] || 0) + (parseFloat(item.qty) || 0);
      });
    });
    return Object.entries(stats);
  }, [filteredHistory]);

  const calculateDuration = (start: string, end: string) => {
    if (!start || !end || start.includes('לא')) return 0;
    try {
      const [sH, sM] = start.split(':').map(Number);
      const [eH, eM] = end.split(':').map(Number);
      return (eH * 60 + eM) - (sH * 60 + sM);
    } catch { return 0; }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-right" dir="rtl">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      {/* Header - Brand Identity */}
      <header className="bg-white border-b-4 border-blue-800 shadow-2xl sticky top-0 z-[1000] p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-8">
            <div className="border-l-4 pl-6 border-blue-900">
              <h1 className="text-3xl font-black text-blue-900 leading-none">ח.סבן</h1>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Building Materials 1994</span>
            </div>
            <div className="flex flex-col">
              <h2 className="text-2xl font-black text-blue-500 italic leading-none">ITURAN</h2>
              <span className="text-[9px] font-bold text-blue-800 uppercase tracking-tighter">Elite Data Analysis</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <button onClick={() => setShowPromptModal(true)} className="px-6 py-2 bg-gradient-to-r from-blue-800 to-blue-900 text-white rounded-full font-black text-xs shadow-lg hover:scale-105 transition-all flex items-center gap-2">
               <Award size={16}/> הפקודה המנצחת
             </button>
             <button onClick={() => setShowAdminModal(true)} className="p-2 bg-blue-50 text-blue-800 rounded-full hover:bg-blue-100 transition-all border border-blue-100 shadow-sm">
               <Database size={22}/>
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            {/* מפת סיכות דינמית */}
            <div className="bg-white p-2 rounded-[3.5rem] shadow-2xl border-8 border-white h-[500px] relative overflow-hidden group">
               <div className="absolute top-8 right-8 z-[500] bg-white/95 backdrop-blur-md p-4 rounded-3xl shadow-2xl border border-blue-100">
                  <div className="flex items-center gap-3">
                    <Clock size={16} className="text-blue-600"/>
                    <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="font-black text-sm outline-none bg-transparent cursor-pointer" />
                  </div>
               </div>
               {isClient && (
                <MapContainer center={[32.0853, 34.7818]} zoom={10} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {filteredHistory.map((t) => (
                    t.lat && <Marker key={t.id} position={[t.lat, t.lng]}><Popup><b>{t.customer}</b><br/>תעודה #{t.ticketId}</Popup></Marker>
                  ))}
                </MapContainer>
              )}
            </div>

            {/* תרשימי ריכוז העמסות יומי */}
            <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl border border-slate-100">
              <h3 className="font-black text-slate-800 text-sm mb-8 flex items-center gap-3 uppercase tracking-widest"><BarChart3 className="text-blue-600" size={20}/> ריכוז העמסות - {selectedDate}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {dailyProductStats.map(([name, qty]: any) => (
                  <div key={name} className="bg-slate-50 border border-slate-100 p-6 rounded-[2rem] flex flex-col items-center hover:bg-blue-50 transition-colors">
                    <span className="text-[10px] font-black text-slate-400 mb-2 text-center h-10 leading-tight">{name}</span>
                    <span className="text-3xl font-black text-blue-900">{qty}</span>
                  </div>
                ))}
                {dailyProductStats.length === 0 && <p className="col-span-full text-center text-slate-300 italic py-10">אין נתוני העמסה לתאריך זה</p>}
              </div>
            </div>
          </div>

          {/* דוח לוגיסטי - ניהול ראמי */}
          <div className="space-y-4">
            <div className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-50 p-8 h-[780px] flex flex-col">
              <div className="flex justify-between items-center mb-8 px-2">
                <h2 className="font-black text-2xl text-slate-800">דוח יומי</h2>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">{filteredHistory.length} תעודות</span>
                </div>
              </div>

              <div className="overflow-y-auto flex-1 space-y-4 pr-2 custom-scrollbar">
                {filteredHistory.map((ticket) => (
                  <div key={ticket.id} className={`rounded-[2.5rem] p-5 border transition-all ${expandedRow === ticket.id ? 'bg-blue-50/30 border-blue-200' : 'bg-slate-50 border-slate-100'}`}>
                    <div onClick={() => setExpandedRow(expandedRow === ticket.id ? null : ticket.id)} className="flex justify-between items-center cursor-pointer">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-blue-600 tracking-tighter">#{ticket.ticketId}</span>
                        <h4 className="font-bold text-slate-800 text-sm">{ticket.customer}</h4>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${ticket.validationStatus === 'Match' ? 'bg-green-500 shadow-[0_0_10px_green]' : 'bg-red-500 animate-pulse'}`}></div>
                        <ChevronDown size={20} className={`text-slate-400 transition-transform ${expandedRow === ticket.id ? 'rotate-180' : ''}`} />
                      </div>
                    </div>

                    {expandedRow === ticket.id && (
                      <div className="mt-6 pt-6 border-t border-blue-100 space-y-6 animate-in slide-in-from-top-4 duration-300">
                        {/* כתובת ומיקום */}
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-blue-50 flex items-start gap-3">
                           <MapPin className="text-blue-500 shrink-0" size={16}/>
                           <div className="text-[11px] font-bold text-slate-600 leading-relaxed">
                             {ticket.address?.street} {ticket.address?.number}, {ticket.address?.city}
                           </div>
                        </div>

                        {/* ניהול מוצרים (המבורגר פנימי) */}
                        <div className="space-y-2">
                           <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">פירוט תכולה</h5>
                           <div className="bg-white rounded-2xl p-3 border border-slate-100 max-h-40 overflow-y-auto space-y-1">
                              {ticket.itemsDetailed?.map((item: any, i: number) => (
                                <div key={i} className="flex justify-between text-[11px] border-b border-slate-50 pb-1 italic">
                                  <span className="text-slate-600">{item.name}</span>
                                  <span className="font-black text-blue-900">{item.qty} {item.unit}</span>
                                </div>
                              ))}
                           </div>
                        </div>

                        {/* מחשבון PTO ואימות איתורן */}
                        <div className="bg-white p-4 rounded-3xl border border-orange-100 space-y-4 shadow-sm">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-[9px] font-black text-orange-600 block mb-1">פתיחת PTO (איתורן)</label>
                              <input type="time" defaultValue={ticket.techographPTO?.open} className="w-full p-2 border rounded-xl text-xs font-black bg-orange-50/30" />
                            </div>
                            <div>
                              <label className="text-[9px] font-black text-orange-600 block mb-1">סגירת PTO (איתורן)</label>
                              <input type="time" defaultValue={ticket.techographPTO?.close} className="w-full p-2 border rounded-xl text-xs font-black bg-orange-50/30" />
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-[10px] font-black text-blue-800 bg-blue-50 p-3 rounded-2xl">
                            <span>זמן עבודה נטו:</span>
                            <span className="text-sm">{calculateDuration(ticket.techographPTO?.open, ticket.techographPTO?.close)} דקות</span>
                          </div>
                        </div>

                        {/* פעולות ניהול */}
                        <div className="flex gap-2">
                           <button className="flex-1 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black flex items-center justify-center gap-2 hover:bg-black transition-all">
                             <Award size={14}/> ניתוח בודד
                           </button>
                           <button className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 border border-red-100"><Trash2 size={18}/></button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Admin Injection Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-blue-950/60 backdrop-blur-xl z-[2000] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3.5rem] w-full max-w-2xl shadow-2xl p-10 border-t-[12px] border-blue-600">
            <h3 className="text-3xl font-black mb-6 flex items-center gap-4 text-blue-900"><Database size={30}/> הזרקת נתוני זהב</h3>
            <textarea value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} className="w-full h-80 p-8 font-mono text-[11px] border rounded-[2.5rem] bg-slate-50 mb-6 outline-none focus:ring-4 focus:ring-blue-100 transition-all" placeholder="Paste your AI JSON here..." />
            <div className="flex gap-4">
               <button onClick={() => setShowAdminModal(false)} className="px-10 py-5 bg-slate-100 rounded-3xl font-black text-slate-600 hover:bg-slate-200 transition-all">ביטול</button>
               <button onClick={async () => {
                 try {
                   const parsed = JSON.parse(jsonInput);
                   const tickets = Array.isArray(parsed) ? parsed : [parsed];
                   for (const t of tickets) {
                     const newRef = push(ref(db, 'delivery_history'));
                     await set(newRef, { ...t, date: t.date || selectedDate });
                   }
                   setShowAdminModal(false); setJsonInput('');
                 } catch { alert('JSON format error'); }
               }} className="flex-1 py-5 bg-blue-600 text-white rounded-3xl font-black text-lg shadow-2xl hover:bg-blue-700 transition-all">אשר ועדכן מערכת</button>
            </div>
          </div>
        </div>
      )}

      {/* Prompt Excellence Modal */}
      {showPromptModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-[2000] flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-[4rem] w-full max-w-2xl shadow-2xl p-12 border border-slate-800 text-center">
             <div className="flex justify-between items-center mb-10">
               <h3 className="text-4xl font-black italic text-blue-400 tracking-tighter">🏆 הפקודה המנצחת</h3>
               <button onClick={() => setShowPromptModal(false)} className="hover:rotate-90 transition-transform"><X/></button>
             </div>
             <div className="bg-slate-800 p-8 rounded-[2.5rem] text-[12px] font-mono text-green-400 border border-slate-700 select-all leading-relaxed text-right">
                "בצע הצלבה מלאה בין תעודות ח. סבן  לבין דוח איתורן. חלץ כתובת (רחוב, עיר), זמני PTO מדויקים מהאקסל, ופירוט מוצרים מלא. החזר JSON מלוטש עם שדות address ו-itemsDetailed. ללא כפילויות תווים."
             </div>
             <button onClick={() => setShowPromptModal(false)} className="mt-8 w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-xl hover:scale-105 transition-all shadow-2xl">חזור לניהול הצי</button>
          </div>
        </div>
      )}
    </div>
  );
}
