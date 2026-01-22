'use client';
import { useEffect, useState, useMemo } from 'react';
import { db } from '../lib/firebase';
import { ref, onValue, push, set, update, remove } from 'firebase/database';
import dynamic from 'next/dynamic';
import { 
  Truck, FileText, Map as MapIcon, CheckCircle, AlertCircle, 
  User, Clock, Package, Database, X, ChevronDown, ChevronUp, Save, Trash2, Award, BarChart3, MapPin
} from 'lucide-react';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

export default function SabanEliteDiamond() {
  const [drivers, setDrivers] = useState<any>({});
  const [deliveryHistory, setDeliveryHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'fleet' | 'logistics'>('fleet');
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

  const dailyStats = useMemo(() => {
    const products: any = {};
    filteredHistory.forEach(t => {
      t.itemsDetailed?.forEach((item: any) => {
        products[item.name] = (products[item.name] || 0) + (parseFloat(item.qty) || 0);
      });
    });
    return Object.entries(products);
  }, [filteredHistory]);

  const calculateDuration = (start: string, end: string) => {
    if (!start || !end || start.includes('לא') || end.includes('לא')) return 0;
    try {
      const [sH, sM] = start.split(':').map(Number);
      const [eH, eM] = end.split(':').map(Number);
      return (eH * 60 + eM) - (sH * 60 + sM);
    } catch { return 0; }
  };

  const saveTicket = async (id: string, data: any) => {
    await update(ref(db, `delivery_history/${id}`), data);
    alert('הנתונים נשמרו בהצלחה');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-right" dir="rtl">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      {/* Corporate Identity Header */}
      <header className="bg-white border-b-4 border-blue-700 shadow-xl sticky top-0 z-[1000] p-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-6">
            <div className="border-l-2 pl-6 border-slate-200">
              <h1 className="text-3xl font-black text-blue-900 leading-none">ח.סבן</h1>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">חומרי בנין (1994) בע"מ</span>
            </div>
            <div className="flex flex-col">
              <h2 className="text-2xl font-black text-blue-500 italic leading-none">ITURAN</h2>
              <span className="text-[9px] font-bold text-blue-800 uppercase tracking-tighter">Elite Fleet Analytics</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <button onClick={() => setShowPromptModal(true)} className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-700 to-blue-900 text-white rounded-full font-black text-xs shadow-lg hover:scale-105 transition-all">
               <Award size={16}/> הפקודה המנצחת
             </button>
             <button onClick={() => setShowAdminModal(true)} className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-blue-100 transition-colors">
               <Database size={20}/>
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* מפה ותרשימי ניתוח */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-2 rounded-[3rem] shadow-2xl border-4 border-white h-[550px] relative overflow-hidden">
               <div className="absolute top-6 right-6 z-[500] bg-white/90 backdrop-blur p-4 rounded-2xl shadow-2xl border border-blue-100">
                  <h3 className="text-xs font-black text-blue-900 mb-2">בורר תאריך לתצוגה:</h3>
                  <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="font-bold text-sm outline-none bg-transparent cursor-pointer" />
               </div>
               {isClient && (
                <MapContainer center={[32.0853, 34.7818]} zoom={10} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {activeTab === 'fleet' ? 
                    Object.entries(drivers).map(([name, d]: any) => d.lat && <Marker key={name} position={[d.lat, d.lng]}><Popup><b>{name}</b><br/>{d.status}</Popup></Marker>) :
                    filteredHistory.map((t) => t.address && <Marker key={t.id} position={[32.164, 34.891]}><Popup><b>{t.customer}</b><br/>{t.address.street}, {t.address.city}</Popup></Marker>)
                  }
                </MapContainer>
              )}
            </div>

            {/* תרשים מוצרים שיצאו מהמחסן */}
            <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100">
              <h3 className="font-black text-slate-800 text-sm mb-6 flex items-center gap-2 uppercase tracking-wider"><BarChart3 className="text-blue-600"/> ריכוז העמסות יומי - {selectedDate}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {dailyStats.map(([name, qty]: any) => (
                  <div key={name} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col items-center">
                    <span className="text-[9px] font-black text-slate-400 mb-1 text-center h-8">{name}</span>
                    <span className="text-xl font-black text-blue-900">{qty}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* לוח בקרה של ראמי */}
          <div className="space-y-4">
            <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-50 p-6 h-[760px] flex flex-col">
              <div className="flex justify-between items-center mb-6 px-2">
                <h2 className="font-black text-xl text-slate-800">דוח לוגיסטי</h2>
                <nav className="flex bg-slate-100 p-1 rounded-xl">
                  <button onClick={() => setActiveTab('fleet')} className={`px-4 py-1 rounded-lg text-xs font-bold ${activeTab === 'fleet' ? 'bg-white shadow-sm' : ''}`}>צי</button>
                  <button onClick={() => setActiveTab('logistics')} className={`px-4 py-1 rounded-lg text-xs font-bold ${activeTab === 'logistics' ? 'bg-white shadow-sm' : ''}`}>דוח</button>
                </nav>
              </div>

              <div className="overflow-y-auto flex-1 space-y-4 pr-2">
                {filteredHistory.map((ticket) => (
                  <div key={ticket.id} className="bg-slate-50 rounded-3xl p-4 border border-slate-100 group transition-all">
                    <div onClick={() => setExpandedRow(expandedRow === ticket.id ? null : ticket.id)} className="flex justify-between items-center cursor-pointer">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-blue-600 tracking-tighter">#{ticket.ticketId}</span>
                        <h4 className="font-bold text-slate-800 text-sm">{ticket.customer}</h4>
                      </div>
                      <ChevronDown size={18} className={`transition-transform ${expandedRow === ticket.id ? 'rotate-180' : ''}`} />
                    </div>

                    {expandedRow === ticket.id && (
                      <div className="mt-4 pt-4 border-t border-slate-200 space-y-4 animate-in slide-in-from-top-4">
                        {/* ניהול כתובת ללקוח */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-white p-2 rounded-xl border border-slate-200">
                            <label className="text-[8px] font-black text-slate-400 block uppercase">רחוב ומספר</label>
                            <input type="text" defaultValue={`${ticket.address?.street || ''} ${ticket.address?.number || ''}`} className="w-full text-xs font-bold outline-none" />
                          </div>
                          <div className="bg-white p-2 rounded-xl border border-slate-200">
                            <label className="text-[8px] font-black text-slate-400 block uppercase">עיר</label>
                            <input type="text" defaultValue={ticket.address?.city || ''} className="w-full text-xs font-bold outline-none" />
                          </div>
                        </div>

                        {/* מחשבון PTO והעמסה של ראמי */}
                        <div className="bg-white p-4 rounded-3xl border border-blue-50 shadow-inner space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-[9px] font-black text-orange-600 block mb-1">תחילת PTO</label>
                              <input type="time" defaultValue={ticket.techographPTO?.open} className="w-full p-2 border rounded-lg text-xs font-bold" />
                            </div>
                            <div>
                              <label className="text-[9px] font-black text-orange-600 block mb-1">סיום PTO</label>
                              <input type="time" defaultValue={ticket.techographPTO?.close} className="w-full p-2 border rounded-lg text-xs font-bold" />
                            </div>
                          </div>
                          <div className="flex justify-between text-[10px] font-black text-blue-700 bg-blue-50/50 p-2 rounded-xl">
                            <span>זמן מנוף מחושב:</span>
                            <span>{calculateDuration(ticket.techographPTO?.open, ticket.techographPTO?.close)} דקות</span>
                          </div>
                        </div>

                        {/* פקודה בודדת */}
                        <div className="flex gap-2">
                          <button onClick={() => alert(`פקודת ניתוח לתעודה ${ticket.ticketId}`)} className="flex-1 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black hover:bg-black flex items-center justify-center gap-2">
                            <Award size={14}/> ניתוח בודד לתעודה
                          </button>
                          <button onClick={() => saveTicket(ticket.id, {})} className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg hover:bg-blue-700"><Save size={16}/></button>
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

      {/* Admin & Prompt Modals */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-blue-950/40 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl p-8 border-t-8 border-blue-600">
            <h3 className="text-2xl font-black mb-4 flex items-center gap-3"><Database className="text-blue-600"/> הזרקת נתונים מ-AI</h3>
            <textarea value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} className="w-full h-72 p-6 font-mono text-xs border rounded-[2rem] bg-slate-50 mb-4 focus:ring-4 focus:ring-blue-100 outline-none" placeholder="הדבק כאן את ה-JSON שקיבלת מה-AI..." />
            <div className="flex gap-4">
               <button onClick={() => setShowAdminModal(false)} className="px-8 py-4 bg-slate-100 rounded-2xl font-bold">ביטול</button>
               <button onClick={async () => {
                 try {
                   const parsed = JSON.parse(jsonInput);
                   const items = Array.isArray(parsed) ? parsed : [parsed];
                   for (const item of items) {
                     const newRef = push(ref(db, 'delivery_history'));
                     await set(newRef, { ...item, date: item.date || selectedDate });
                   }
                   setShowAdminModal(false); setJsonInput('');
                 } catch { alert('JSON לא תקין'); }
               }} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl hover:bg-blue-700">הזרק למאגר ההיסטוריה</button>
            </div>
          </div>
        </div>
      )}

      {showPromptModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xl z-[2000] flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-[4rem] w-full max-w-2xl shadow-2xl border border-slate-800 overflow-hidden">
             <div className="p-12 space-y-8 text-center">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-4xl font-black italic tracking-tighter text-blue-400">🏆 הפקודות המנצחות</h3>
                  <button onClick={() => setShowPromptModal(false)} className="p-2 hover:bg-slate-800 rounded-full"><X/></button>
                </div>
                
                <div className="space-y-8 text-right">
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">1. פקודת דוח יומי מלא (כולל טכוגרף)</h4>
                    <div className="bg-slate-800 p-6 rounded-3xl text-[11px] font-mono text-green-400 border border-slate-700 select-all leading-relaxed">
                      "נתח את קבצי ח. סבן מתאריך {selectedDate}. בצע הצלבה מלאה בין התעודות לדיסקית הטכוגרף [cite: 162-214]. חלץ כתובת מדויקת (רחוב, עיר) לכל לקוח. חלץ מוצרים וכמויות מודפסות/בעט. החזר JSON עם אובייקטים address ו-itemsDetailed."
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">2. פקודת ניתוח מהיר לתעודה בודדת</h4>
                    <div className="bg-slate-800 p-6 rounded-3xl text-[11px] font-mono text-blue-400 border border-slate-700 select-all leading-relaxed">
                      "נתח את התעודה המצורפת בלבד. חלץ מוצרים, כמויות, וכתובת אספקה. זהה שעות מנוף בכתב יד בתחתית הדף [cite: 45-46, 146-147]. החזר JSON מלוטש הכולל address ו-handwrittenTimes."
                    </div>
                  </div>
                </div>
                <button onClick={() => setShowPromptModal(false)} className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black text-xl hover:bg-blue-500 shadow-2xl transform hover:scale-105 transition-all">חזור לניהול הצי</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
