'use client';
import { useEffect, useState, useMemo } from 'react';
import { db } from '../lib/firebase';
import { ref, onValue, push, set, update, remove, get } from 'firebase/database';
import dynamic from 'next/dynamic';
import { 
  Truck, FileText, Map as MapIcon, CheckCircle, AlertCircle, 
  User, Clock, Package, Database, X, ChevronDown, ChevronUp, Save, Trash2, Award, BarChart3, RefreshCw
} from 'lucide-react';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

export default function SabanEliteDiamondAdmin() {
  const [drivers, setDrivers] = useState<any>({});
  const [deliveryHistory, setDeliveryHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'fleet' | 'logistics'>('logistics');
  const [isClient, setIsClient] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');

  useEffect(() => {
    setIsClient(true);
    onValue(ref(db, 'team'), (snap) => snap.exists() && setDrivers(snap.val()));
    onValue(ref(db, 'delivery_history'), (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setDeliveryHistory(Object.keys(data).map(k => ({ id: k, ...data[k] })));
      } else {
        setDeliveryHistory([]);
      }
    });
  }, []);

  const filteredHistory = useMemo(() => 
    deliveryHistory.filter(t => t.date === selectedDate), 
  [deliveryHistory, selectedDate]);

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

  const handleDeleteDay = async () => {
    if (confirm(`האם אתה בטוח שברצונך למחוק את כל ${filteredHistory.length} התעודות של יום ${selectedDate}?`)) {
      for (const ticket of filteredHistory) {
        await remove(ref(db, `delivery_history/${ticket.id}`));
      }
    }
  };

  const handleJsonImport = async () => {
    try {
      const parsed = JSON.parse(jsonInput);
      const dataArray = Array.isArray(parsed) ? parsed : [parsed];
      
      if (importMode === 'replace') {
        for (const ticket of filteredHistory) {
          await remove(ref(db, `delivery_history/${ticket.id}`));
        }
      }

      for (const item of dataArray) {
        const itemDate = item.date || selectedDate;
        // בדיקת כפילויות לפי ticketId ותאריך
        const existing = deliveryHistory.find(t => t.ticketId === item.ticketId && t.date === itemDate);
        
        if (existing) {
          await update(ref(db, `delivery_history/${existing.id}`), { ...item, date: itemDate });
        } else {
          const newRef = push(ref(db, 'delivery_history'));
          await set(newRef, { ...item, date: itemDate });
        }
      }
      
      setJsonInput('');
      setShowAdminModal(false);
      alert('הנתונים עודכנו במערכת ללא כפילויות!');
    } catch (e) {
      alert('שגיאה בפורמט ה-JSON. וודא שהעתקת נכון.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-right" dir="rtl">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      {/* Identity Header */}
      <header className="bg-white border-b-4 border-blue-700 shadow-xl sticky top-0 z-[1000] p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="border-l-2 pl-6 border-slate-200">
              <h1 className="text-2xl font-black text-blue-900 leading-none tracking-tighter">ח.סבן</h1>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Management Elite</span>
            </div>
            <div className="flex flex-col">
              <h2 className="text-xl font-black text-blue-500 italic leading-none">ITURAN</h2>
              <span className="text-[8px] font-bold text-blue-800 uppercase tracking-tighter">Real-Time Data Bridge</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <button onClick={() => setShowPromptModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-full font-black text-[10px] shadow-lg hover:bg-blue-700 flex items-center gap-2">
               <Award size={14}/> הפקודה המנצחת
             </button>
             <button onClick={() => setShowAdminModal(true)} className="p-2 bg-slate-100 rounded-full text-blue-600 hover:bg-blue-200 transition-all">
               <RefreshCw size={20}/>
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            {/* מפת פעילות */}
            <div className="bg-white p-2 rounded-[3rem] shadow-2xl border-4 border-white h-[450px] relative overflow-hidden">
               {isClient && (
                <MapContainer center={[32.0853, 34.7818]} zoom={10} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {filteredHistory.map((t) => (
                    t.lat && <Marker key={t.id} position={[t.lat, t.lng]}><Popup><b>{t.customer}</b><br/>{t.address?.city}</Popup></Marker>
                  ))}
                </MapContainer>
              )}
            </div>

            {/* תרשים מוצרים */}
            <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100">
              <h3 className="font-black text-slate-800 text-xs mb-6 flex items-center gap-2 uppercase tracking-widest px-4">
                <BarChart3 className="text-blue-600" size={16}/> ריכוז העמסות יומי - {selectedDate}
              </h3>
              <div className="flex flex-wrap gap-4 px-4">
                {dailyStats.map(([name, qty]: any) => (
                  <div key={name} className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex flex-col items-center min-w-[100px]">
                    <span className="text-[9px] font-black text-slate-400 mb-1 text-center truncate w-24">{name}</span>
                    <span className="text-lg font-black text-blue-900">{qty}</span>
                  </div>
                ))}
                {dailyStats.length === 0 && <span className="text-slate-300 italic text-sm">אין נתוני העמסה להצגה</span>}
              </div>
            </div>
          </div>

          {/* לוח ניהול ראמי */}
          <div className="space-y-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-6 h-[650px] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-black text-lg text-slate-800">ניהול לוגיסטי</h2>
                <div className="flex items-center gap-2">
                  <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="text-[10px] font-bold border rounded-lg p-1 bg-slate-50" />
                  <button onClick={handleDeleteDay} className="p-2 text-red-500 hover:bg-red-50 rounded-full" title="מחק את כל היום"><Trash2 size={16}/></button>
                </div>
              </div>

              <div className="overflow-y-auto flex-1 space-y-3 pr-2 custom-scrollbar">
                {filteredHistory.map((ticket) => (
                  <div key={ticket.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-200 transition-all">
                    <div onClick={() => setExpandedRow(expandedRow === ticket.id ? null : ticket.id)} className="flex justify-between items-center cursor-pointer">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-blue-600">#{ticket.ticketId}</span>
                        <h4 className="font-bold text-slate-700 text-sm truncate w-32">{ticket.customer}</h4>
                      </div>
                      <ChevronDown size={16} className={`text-slate-400 transition-transform ${expandedRow === ticket.id ? 'rotate-180' : ''}`} />
                    </div>

                    {expandedRow === ticket.id && (
                      <div className="mt-4 pt-4 border-t border-slate-200 space-y-4 animate-in slide-in-from-top-2">
                        <div className="bg-white p-3 rounded-xl text-[10px] font-bold text-slate-500 border italic">
                          📍 {ticket.address?.street || 'רחוב לא צוין'}, {ticket.address?.city || 'עיר לא צוינה'}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                           <div className="bg-blue-50 p-2 rounded-xl text-center">
                             <span className="block text-[8px] font-black text-blue-500 uppercase">מנוף (PTO)</span>
                             <span className="text-xs font-black text-blue-900">{ticket.techographPTO?.open || '--:--'} - {ticket.techographPTO?.close || '--:--'}</span>
                           </div>
                           <div className="bg-orange-50 p-2 rounded-xl text-center">
                             <span className="block text-[8px] font-black text-orange-500 uppercase">החזרות</span>
                             <span className="text-xs font-black text-orange-900">{ticket.depositsManualCount ? 'כן' : 'לא'}</span>
                           </div>
                        </div>
                        <button onClick={() => remove(ref(db, `delivery_history/${ticket.id}`))} className="w-full py-2 text-red-600 bg-red-50 rounded-xl text-[10px] font-bold hover:bg-red-100 flex items-center justify-center gap-1">
                          <Trash2 size={12}/> מחק תעודה
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {filteredHistory.length === 0 && <div className="p-10 text-center text-slate-300 italic text-sm">אין תעודות ליום זה</div>}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Admin Import Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-blue-950/40 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl p-8 border-t-8 border-blue-600">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black flex items-center gap-3"><RefreshCw className="text-blue-600"/> עדכון נתונים דינמי</h3>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button onClick={() => setImportMode('append')} className={`px-4 py-1 rounded-lg text-xs font-bold ${importMode === 'append' ? 'bg-white shadow-sm' : ''}`}>הוספה</button>
                <button onClick={() => setImportMode('replace')} className={`px-4 py-1 rounded-lg text-xs font-bold ${importMode === 'replace' ? 'bg-white shadow-sm text-red-600' : ''}`}>החלפה</button>
              </div>
            </div>
            <textarea value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} className="w-full h-72 p-6 font-mono text-[10px] border rounded-[2rem] bg-slate-50 mb-4 outline-none focus:ring-2 focus:ring-blue-400" placeholder="הדבק JSON כאן..." />
            <div className="flex gap-4">
               <button onClick={() => setShowAdminModal(false)} className="px-8 py-4 bg-slate-100 rounded-2xl font-bold text-sm">ביטול</button>
               <button onClick={handleJsonImport} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl hover:bg-blue-700">עדכן נתונים</button>
            </div>
          </div>
        </div>
      )}

      {/* Prompt Modal */}
      {showPromptModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[2000] flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-[3.5rem] w-full max-w-xl shadow-2xl p-10 border border-slate-800">
             <div className="flex justify-between items-center mb-8">
               <h3 className="text-3xl font-black italic text-blue-400 tracking-tighter">🏆 הפקודה המנצחת</h3>
               <button onClick={() => setShowPromptModal(false)} className="text-slate-500 hover:text-white"><X/></button>
             </div>
             <div className="bg-slate-800 p-6 rounded-3xl text-[11px] font-mono text-green-400 border border-slate-700 select-all leading-relaxed mb-6">
                "נתח את קבצי ח. סבן ליום {selectedDate}. [cite_start]בצע הצלבה מלאה בין התעודות לדיסקית הטכוגרף [cite: 162-214]. חלץ כתובת (רחוב, עיר), זמני מנוף בכתב יד, ומוצרים. החזר JSON מלוטש עם שדות address ו-itemsDetailed. ללא כפילויות תווים."
             </div>
             <button onClick={() => setShowPromptModal(false)} className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black text-lg hover:scale-105 transition-all shadow-2xl">חזור לעבודה</button>
          </div>
        </div>
      )}
    </div>
  );
}
