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

export default function SabanEliteDiamondV2() {
  const [drivers, setDrivers] = useState<any>({});
  const [deliveryHistory, setDeliveryHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'fleet' | 'logistics'>('fleet');
  const [isClient, setIsClient] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
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

  // חישוב מוצרים יומי לתרשים
  const dailyProducts = useMemo(() => {
    const summary: any = {};
    filteredHistory.forEach(t => {
      t.itemsDetailed?.forEach((item: any) => {
        summary[item.name] = (summary[item.name] || 0) + (parseFloat(item.qty) || 0);
      });
    });
    return Object.entries(summary);
  }, [filteredHistory]);

  const handleUpdate = async (id: string, path: string, value: any) => {
    await update(ref(db, `delivery_history/${id}${path}`), value);
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] font-sans text-right" dir="rtl">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      {/* Header - מיתוג ח.סבן ואיתורן */}
      <header className="bg-white border-b-4 border-blue-700 shadow-md sticky top-0 z-[1000] p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-8">
            <div className="border-l-2 pl-6 border-slate-200">
              <h1 className="text-2xl font-black text-blue-900 leading-none">ח.סבן</h1>
              <span className="text-[10px] font-bold text-slate-500 uppercase">חומרי בנין (1994) בע"מ [cite: 1, 19, 69, 115]</span>
            </div>
            <div className="hidden md:block">
              <h2 className="text-xl font-black text-blue-500 italic">ITURAN</h2>
              <span className="text-[8px] font-bold text-blue-800">Elite Fleet Analytics</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <button onClick={() => setShowPromptModal(true)} className="px-5 py-2 bg-gradient-to-r from-blue-700 to-blue-900 text-white rounded-full font-black text-xs shadow-lg hover:scale-105 transition-all flex items-center gap-2">
               <Award size={14}/> הפקודה המנצחת
             </button>
             <button onClick={() => setShowAdminModal(true)} className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-blue-100 transition-colors">
               <Database size={20}/>
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* מפת לקוחות ונהגים */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-2 rounded-[2.5rem] shadow-2xl border-4 border-white h-[500px] relative overflow-hidden">
               {isClient && (
                <MapContainer center={[32.0853, 34.7818]} zoom={10} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {filteredHistory.map((t) => (
                    t.address && <Marker key={t.id} position={[32.16, 34.89]}><Popup><b className="text-blue-900">{t.customer}</b><br/>{t.address.street} {t.address.number}, {t.address.city}</Popup></Marker>
                  ))}
                </MapContainer>
              )}
            </div>

            {/* תרשים מוצרים יומי */}
            <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100">
              <h3 className="font-black text-slate-800 text-sm mb-4 flex items-center gap-2"><BarChart3 size={18} className="text-blue-600"/> ריכוז העמסות יומי - {selectedDate}</h3>
              <div className="flex flex-wrap gap-3">
                {dailyProducts.map(([name, qty]: any) => (
                  <div key={name} className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl flex flex-col items-center min-w-[100px]">
                    <span className="text-[10px] font-bold text-slate-500">{name}</span>
                    <span className="text-lg font-black text-blue-900">{qty}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* לוח ניהול תעודות - ראמי */}
          <div className="space-y-4">
             <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-50 p-6 h-[720px] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-black text-xl text-slate-800">דוח לוגיסטי</h2>
                  <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="text-xs font-bold border rounded-lg p-1" />
                </div>

                <div className="overflow-y-auto flex-1 space-y-4 pr-2">
                  {filteredHistory.map((ticket) => (
                    <div key={ticket.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 transition-all hover:shadow-md">
                      <div className="flex justify-between items-center cursor-pointer" onClick={() => setExpandedRow(expandedRow === ticket.id ? null : ticket.id)}>
                        <div>
                          <span className="text-[10px] font-black text-blue-600">#{ticket.ticketId}</span>
                          <h4 className="font-bold text-slate-800 text-sm">{ticket.customer}</h4>
                        </div>
                        <ChevronDown size={18} className={`transition-transform ${expandedRow === ticket.id ? 'rotate-180' : ''}`} />
                      </div>

                      {expandedRow === ticket.id && (
                        <div className="mt-4 pt-4 border-t border-slate-200 space-y-4 animate-in slide-in-from-top-2">
                          {/* שדות כתובת למפה */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-white p-2 rounded-xl border">
                              <label className="text-[8px] font-black text-slate-400 block uppercase">רחוב ומספר</label>
                              <input type="text" defaultValue={`${ticket.address?.street || ''} ${ticket.address?.number || ''}`} className="w-full text-xs font-bold outline-none" />
                            </div>
                            <div className="bg-white p-2 rounded-xl border">
                              <label className="text-[8px] font-black text-slate-400 block uppercase">עיר</label>
                              <input type="text" defaultValue={ticket.address?.city || ''} className="w-full text-xs font-bold outline-none" />
                            </div>
                          </div>

                          {/* מחשבון PTO והעמסה של ראמי */}
                          <div className="bg-white p-3 rounded-2xl border border-blue-100 space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[8px] font-black text-orange-600 block">תחילת PTO</label>
                                <input type="time" defaultValue={ticket.techographPTO?.open} className="w-full text-xs font-bold" />
                              </div>
                              <div>
                                <label className="text-[8px] font-black text-orange-600 block">סיום PTO</label>
                                <input type="time" defaultValue={ticket.techographPTO?.close} className="w-full text-xs font-bold" />
                              </div>
                            </div>
                            <div className="text-[9px] font-black text-blue-700 bg-blue-50 p-2 rounded-lg flex justify-between">
                              <span>זמן מנוף:</span>
                              <span>{calculateMins(ticket.techographPTO?.open, ticket.techographPTO?.close)} דק'</span>
                            </div>
                          </div>

                          {/* פקודה בודדת לתעודה */}
                          <button className="w-full py-2 bg-slate-800 text-white rounded-xl text-[10px] font-black flex items-center justify-center gap-2 hover:bg-black transition-all">
                            <Award size={12}/> פקודת ניתוח בודדת לתעודה זו
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
             </div>
          </div>
        </div>
      </main>

      {/* Prompt Modals */}
      {showPromptModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xl z-[2000] flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-[3rem] w-full max-w-2xl shadow-2xl border border-slate-800 overflow-hidden">
             <div className="p-10 space-y-8">
                <div className="flex justify-between items-center border-b border-slate-800 pb-6">
                  <h3 className="text-3xl font-black italic tracking-tighter text-blue-400">🏆 מרכז הפקודות המנצחות</h3>
                  <button onClick={() => setShowPromptModal(false)}><X/></button>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-slate-500 uppercase">1. דוח יומי מלא (כולל טכוגרף)</h4>
                    <div className="bg-slate-800 p-4 rounded-2xl text-[10px] font-mono text-green-400 border border-slate-700 select-all cursor-pointer">
                      "נתח את קבצי ח.סבן מתאריך {selectedDate}. בצע הצלבה מלאה בין התעודות לדיסקית הטכוגרף . חלץ כתובת מדויקת (רחוב, עיר) לכל לקוח. החזר JSON עם אובייקט address נפרד."
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-slate-500 uppercase">2. ניתוח מהיר לתעודה בודדת</h4>
                    <div className="bg-slate-800 p-4 rounded-2xl text-[10px] font-mono text-blue-400 border border-slate-700 select-all cursor-pointer">
                      "נתח את התעודה המצורפת בלבד. חלץ מוצרים, כמויות, וכתובת אספקה. זהה שעות מנוף בכתב יד בתחתית הדף [cite: 42-46, 96-99, 146-147]. החזר JSON מלוטש."
                    </div>
                  </div>
                </div>
                
                <button onClick={() => setShowPromptModal(false)} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-500 shadow-xl transition-all">הבנתי, חזור לעבודה</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
