'use client';
import { useEffect, useState, useMemo } from 'react';
import { db } from '../lib/firebase';
import { ref, onValue, push, set, update } from 'firebase/database';
import dynamic from 'next/dynamic';
import { 
  Truck, FileText, Map as MapIcon, CheckCircle, AlertCircle, 
  User, Clock, Package, Database, X, ChevronDown, ChevronUp, Save, Trash2, Award
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

  const calculateMins = (start: string, end: string) => {
    if (!start || !end || start.includes('לא') || end.includes('לא')) return 0;
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    return (eH * 60 + eM) - (sH * 60 + sM);
  };

  const handleUpdate = async (id: string, data: any) => {
    await update(ref(db, `delivery_history/${id}`), data);
    alert('הנתון עודכן בהצלחה');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-right" dir="rtl">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      {/* Identity Header */}
      <header className="bg-white border-b-4 border-blue-600 shadow-lg sticky top-0 z-[1000] p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="flex flex-col border-l pl-6 border-slate-200">
              <span className="text-2xl font-black text-blue-900 leading-none">ח.סבן</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">חומרי בניין (1994) בע"מ [cite: 19]</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-blue-500 italic leading-none italic">Ituran</span>
              <span className="text-[8px] font-bold text-blue-800 uppercase">Real-time Logistics</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setShowPromptModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full font-black text-xs shadow-md hover:bg-blue-700 transition-all">
              <Award size={14}/> הפקודה המנצחת
            </button>
            <nav className="flex bg-slate-100 p-1 rounded-2xl">
              <button onClick={() => setActiveTab('fleet')} className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'fleet' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500'}`}>
                <Truck size={18} /> ניהול צי
              </button>
              <button onClick={() => setActiveTab('logistics')} className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'logistics' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500'}`}>
                <FileText size={18} /> לוגיסטיקה
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* מפה דינמית: מציגה נהגים או מיקומי תעודות לפי התאריך שנבחר */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-2 rounded-[2rem] shadow-xl border-8 border-white h-[600px] overflow-hidden relative">
              <div className="absolute top-6 right-6 z-[500] bg-white/90 backdrop-blur p-3 rounded-2xl shadow-2xl border border-blue-100">
                <h3 className="text-xs font-black text-blue-900 mb-1">
                  {activeTab === 'fleet' ? 'מיקום משאיות כרגע' : `יעדי פריקה - ${selectedDate}`}
                </h3>
                {activeTab === 'logistics' && (
                  <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="text-xs font-bold border-none bg-transparent outline-none cursor-pointer" />
                )}
              </div>
              
              {isClient && (
                <MapContainer center={[32.0853, 34.7818]} zoom={9} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {activeTab === 'fleet' ? (
                    Object.entries(drivers).map(([name, data]: [string, any]) => (
                      data.lat && <Marker key={name} position={[data.lat, data.lng]}><Popup><b>{name}</b><br/>{data.status}</Popup></Marker>
                    ))
                  ) : (
                    filteredHistory.map((t: any) => (
                      t.lat && <Marker key={t.id} position={[t.lat, t.lng]}><Popup><b>{t.customer}</b><br/>תעודה #{t.ticketId}</Popup></Marker>
                    ))
                  )}
                </MapContainer>
              )}
            </div>
          </div>

          {/* לוח בקרה צדדי */}
          <div className="space-y-4">
            <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-black text-slate-800 text-lg">דוח יומי</h2>
                <button onClick={() => setShowAdminModal(true)} className="p-2 bg-slate-50 rounded-full hover:bg-slate-200"><Database size={16}/></button>
              </div>
              
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {filteredHistory.map((ticket) => (
                  <div key={ticket.id} className="border-b pb-3 group">
                    <div 
                      onClick={() => setExpandedRow(expandedRow === ticket.id ? null : ticket.id)}
                      className="flex justify-between items-center cursor-pointer"
                    >
                      <div className="flex flex-col">
                        <span className="font-black text-blue-900 text-sm">#{ticket.ticketId}</span>
                        <span className="text-[11px] font-bold text-slate-600">{ticket.customer}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${ticket.validationStatus === 'Match' ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></span>
                        <ChevronDown size={16} className={`transition-transform ${expandedRow === ticket.id ? 'rotate-180' : ''}`} />
                      </div>
                    </div>

                    {expandedRow === ticket.id && (
                      <div className="mt-4 p-4 bg-blue-50/50 rounded-2xl space-y-4 animate-in slide-in-from-top-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-white p-2 rounded-xl border">
                            <label className="text-[8px] font-black text-blue-500 block uppercase">תחילת PTO</label>
                            <input type="time" defaultValue={ticket.techographPTO?.open} className="w-full text-xs font-bold outline-none" />
                          </div>
                          <div className="bg-white p-2 rounded-xl border">
                            <label className="text-[8px] font-black text-blue-500 block uppercase">סיום PTO</label>
                            <input type="time" defaultValue={ticket.techographPTO?.close} className="w-full text-xs font-bold outline-none" />
                          </div>
                        </div>
                        <div className="text-[10px] bg-white p-2 rounded-xl italic text-slate-600 border border-blue-100">
                          <b>סיכום פקדונות:</b> {ticket.depositsManualCount}
                        </div>
                        <div className="flex gap-2">
                          <button className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black flex items-center justify-center gap-1 hover:bg-blue-700 shadow-md">
                            <Save size={12}/> שמור
                          </button>
                          <button className="p-2 bg-white text-red-500 rounded-xl border hover:bg-red-50"><Trash2 size={12}/></button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {filteredHistory.length === 0 && <p className="text-center text-slate-400 italic text-sm">אין נתונים ליום זה</p>}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Admin Modals */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-blue-950/40 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl p-6">
            <h3 className="text-xl font-bold mb-4">הזרקת נתונים מה-AI</h3>
            <textarea value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} className="w-full h-64 p-4 font-mono text-xs border rounded-2xl mb-4" placeholder="Paste JSON here..." />
            <button onClick={async () => {
              const parsed = JSON.parse(jsonInput);
              const dataArray = Array.isArray(parsed) ? parsed : [parsed];
              for (const item of dataArray) {
                const newRef = push(ref(db, 'delivery_history'));
                await set(newRef, { ...item, date: item.date || selectedDate });
              }
              setShowAdminModal(false);
            }} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black">הזרק למאגר</button>
          </div>
        </div>
      )}

      {showPromptModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[2000] flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden border border-slate-700">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black italic tracking-tighter text-blue-400">🏆 הפקודה המנצחת</h3>
                <button onClick={() => setShowPromptModal(false)}><X/></button>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed italic">
                העתק את הפקודה הזו לקופילוט יחד עם הקבצים של ה-18/01/2026 לקבלת שיקוף מלא:
              </p>
              <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 font-mono text-[11px] text-green-400 select-all cursor-pointer">
                "נתח את קבצי ח.סבן מתאריך {selectedDate}. בצע הצלבה מלאה בין התעודות לדיסקית הטכוגרף. 1. חלץ שעות העמסה ושעות עבודת מנוף [cite: 45-46, 146-147]. 2. נתח רעידות בטבעת הפנימית לזיהוי PTO [cite: 162-214]. 3. סיכום פקדונות ידני מול מודפס. 4. החזר JSON נקי."
              </div>
              <button onClick={() => setShowPromptModal(false)} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-500 transition-all">הבנתי, סגור חלון</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string, value: any, color: string }) {
  return (
    <div className="bg-white p-6 rounded-3xl border shadow-sm">
      <span className="text-slate-400 text-[10px] font-black uppercase block mb-1">{label}</span>
      <span className={`text-3xl font-black ${color}`}>{value}</span>
    </div>
  );
}
