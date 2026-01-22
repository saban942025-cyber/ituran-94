'use client';
import { useEffect, useState, useMemo } from 'react';
import { db } from '../lib/firebase';
import { ref, onValue, push, set, update } from 'firebase/database';
import dynamic from 'next/dynamic';
import { 
  Truck, FileText, Map as MapIcon, CheckCircle, AlertCircle, 
  User, Clock, Package, Database, X, ChevronDown, ChevronUp, Save, Trash2, Award, BarChart3
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
    // האזנה לצוות איתורן
    onValue(ref(db, 'team'), (snap) => snap.exists() && setDrivers(snap.val()));
    // האזנה להיסטוריית תעודות ח.סבן
    onValue(ref(db, 'delivery_history'), (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const formatted = Object.keys(data).map(k => ({ id: k, ...data[k] }));
        setDeliveryHistory(formatted);
      }
    });
  }, []);

  const filteredHistory = useMemo(() => 
    deliveryHistory.filter(t => t.date === selectedDate), 
  [deliveryHistory, selectedDate]);

  // חישוב תרשים מוצרים (Inventory Summary)
  const dailyStats = useMemo(() => {
    const products: any = {};
    filteredHistory.forEach(t => {
      const items = t.itemsDetailed || t.items || [];
      items.forEach((item: any) => {
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

  return (
    <div className="min-h-screen bg-[#f1f5f9] font-sans text-right" dir="rtl">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      {/* Identity Header - ח.סבן & איתורן */}
      <header className="bg-white border-b-4 border-blue-700 shadow-xl sticky top-0 z-[1000] p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="border-l-2 pl-6 border-slate-200">
              <h1 className="text-2xl font-black text-blue-900 leading-none">ח.סבן</h1>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">חומרי בנין (1994) בע"מ [cite: 1, 19]</span>
            </div>
            <div className="hidden md:block">
              <h2 className="text-xl font-black text-blue-500 italic leading-none">ITURAN</h2>
              <span className="text-[8px] font-bold text-blue-800">Elite Logistics Control</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
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
          
          <div className="lg:col-span-2 space-y-6">
            {/* מפה היסטורית ודינמית */}
            <div className="bg-white p-2 rounded-[2.5rem] shadow-2xl border-4 border-white h-[500px] relative overflow-hidden">
               {isClient && (
                <MapContainer center={[32.0853, 34.7818]} zoom={10} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {filteredHistory.map((t) => (
                    t.lat && <Marker key={t.id} position={[t.lat, t.lng]}><Popup><b>{t.customer} [cite: 26, 67, 124]</b><br/>תעודה #{t.ticketId}</Popup></Marker>
                  ))}
                </MapContainer>
              )}
            </div>

            {/* תרשים ריכוז העמסות יומי */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
              <h3 className="font-black text-slate-800 text-sm mb-6 flex items-center gap-2 uppercase tracking-wider">
                <BarChart3 className="text-blue-600"/> ריכוז העמסות - {selectedDate}
              </h3>
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
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-blue-600 tracking-tighter">#{ticket.ticketId} [cite: 25, 73, 123]</span>
                          <h4 className="font-bold text-slate-800 text-sm">{ticket.customer} [cite: 26, 67, 124]</h4>
                        </div>
                        <ChevronDown size={18} className={`transition-transform ${expandedRow === ticket.id ? 'rotate-180' : ''}`} />
                      </div>

                      {expandedRow === ticket.id && (
                        <div className="mt-4 pt-4 border-t border-slate-200 space-y-4 animate-in slide-in-from-top-2">
                          {/* כתובת */}
                          <div className="bg-white p-3 rounded-xl border text-[10px] font-bold text-slate-600">
                             📍 {ticket.address?.street} {ticket.address?.number}, {ticket.address?.city} 
                          </div>

                          {/* מחשבון PTO */}
                          <div className="bg-white p-3 rounded-2xl border border-blue-100 space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[8px] font-black text-orange-600 block">תחילת PTO [cite: 45, 98, 146]</label>
                                <input type="time" defaultValue={ticket.techographPTO?.open} className="w-full text-xs font-bold" />
                              </div>
                              <div>
                                <label className="text-[8px] font-black text-orange-600 block">סיום PTO [cite: 46, 99, 147]</label>
                                <input type="time" defaultValue={ticket.techographPTO?.close} className="w-full text-xs font-bold" />
                              </div>
                            </div>
                            <div className="text-[9px] font-black text-blue-700 bg-blue-50 p-2 rounded-lg flex justify-between">
                              <span>זמן מנוף בפועל:</span>
                              <span>{calculateDuration(ticket.techographPTO?.open, ticket.techographPTO?.close)} דק'</span>
                            </div>
                          </div>
                          
                          {/* מוצרים ופקדונות */}
                          <div className="text-[10px] bg-orange-50 p-3 rounded-xl border border-orange-100">
                             <span className="font-black text-orange-800 block mb-1 uppercase">החזרות/פקדונות [cite: 47-56, 89-105, 148-158]</span>
                             {ticket.depositsManualCount || 'אין נתונים'}
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

      {/* Modals */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-blue-950/40 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl p-8 border-t-8 border-blue-600">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Database size={20}/> הזרקת JSON</h3>
            <textarea value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} className="w-full h-64 p-4 font-mono text-xs border rounded-2xl mb-4 bg-slate-50" />
            <button onClick={async () => {
              try {
                const parsed = JSON.parse(jsonInput);
                const items = Array.isArray(parsed) ? parsed : [parsed];
                for (const item of items) {
                  const newRef = push(ref(db, 'delivery_history'));
                  await set(newRef, { ...item, date: item.date || selectedDate });
                }
                setShowAdminModal(false); setJsonInput('');
              } catch { alert('שגיאה בפורמט ה-JSON'); }
            }} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg">אשר והזרק</button>
          </div>
        </div>
      )}

      {showPromptModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[2000] flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-[3rem] w-full max-w-xl shadow-2xl p-10 border border-slate-700">
             <div className="flex justify-between items-center mb-8">
               <h3 className="text-3xl font-black italic text-blue-400">🏆 הפקודות המנצחות</h3>
               <button onClick={() => setShowPromptModal(false)}><X/></button>
             </div>
             <div className="space-y-6 text-right">
                <div>
                  <h4 className="text-xs font-black text-slate-500 mb-2">דוח מלא + טכוגרף [cite: 162-214]</h4>
                  <div className="bg-slate-800 p-4 rounded-2xl text-[10px] font-mono text-green-400 border border-slate-700 select-all">
                    "נתח את קבצי ח. סבן מה-{selectedDate}. בצע הצלבה מלאה בין התעודות לדיסקית הטכוגרף [cite: 162-214]. חלץ כתובת מדויקת (רחוב, עיר) לכל לקוח. חלץ מוצרים וכמויות. החזר JSON נקי ללא גרשיים כפולות."
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-500 mb-2">ניתוח בודד לתעודה [cite: 25, 73, 123]</h4>
                  <div className="bg-slate-800 p-4 rounded-2xl text-[10px] font-mono text-blue-400 border border-slate-700 select-all">
                    "נתח תעודה זו בלבד[cite: 25, 73, 123]. חלץ מוצרים, כמויות, כתובת, ושעות מנוף בכתב יד [cite: 45-46, 146-147]. החזר JSON מלוטש."
                  </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
