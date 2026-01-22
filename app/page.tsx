'use client';
import { useEffect, useState, useMemo } from 'react';
import { db } from '../lib/firebase';
import { ref, onValue, update, remove, push, set } from 'firebase/database';
import dynamic from 'next/dynamic';
import { 
  Truck, FileText, Clock, Package, Save, Trash2, ChevronDown, 
  BarChart3, Edit3, MapPin, Database, Search, AlertCircle, Hash
} from 'lucide-react';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

export default function SabanEliteManagement() {
  const [deliveryHistory, setDeliveryHistory] = useState<any[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [selectedDate, setSelectedDate] = useState('2026-01-18');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);
  const [jsonInput, setJsonInput] = useState('');

  useEffect(() => {
    setIsClient(true);
    onValue(ref(db, 'delivery_history'), (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setDeliveryHistory(Object.keys(data).map(k => ({ id: k, ...data[k] })));
      }
    });
  }, []);

  // סינון ומיון לפי תעודה ושם לקוח
  const filteredHistory = useMemo(() => 
    deliveryHistory
      .filter(t => t.date === selectedDate)
      .filter(t => 
        (t.ticketId || "").includes(searchTerm) || 
        (t.customer || "").toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => (a.ticketId || "").localeCompare(b.ticketId || "")), 
  [deliveryHistory, selectedDate, searchTerm]);

  const handleUpdateField = async (id: string, path: string, value: any) => {
    await update(ref(db, `delivery_history/${id}${path}`), value);
  };

  const calculateDuration = (start: string, end: string) => {
    if (!start || !end || start.includes('לא')) return 0;
    try {
      const [sH, sM] = start.split(':').map(Number);
      const [eH, eM] = end.split(':').map(Number);
      return Math.max(0, (eH * 60 + eM) - (sH * 60 + sM));
    } catch { return 0; }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-right" dir="rtl">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      {/* Header עם כפתור הזרקת JSON */}
      <header className="bg-white border-b-4 border-blue-900 shadow-xl sticky top-0 z-[1000] p-4 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <div className="border-l-4 pl-4 border-blue-900">
            <h1 className="text-2xl font-black text-blue-900 italic">ח.סבן</h1>
            <span className="text-[10px] font-bold text-slate-500 uppercase">Management Elite 3.0</span>
          </div>
          <div className="flex bg-slate-100 rounded-2xl p-1 gap-2 border border-slate-200 shadow-inner">
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent font-black text-sm p-1 outline-none text-blue-900 cursor-pointer" />
            <div className="relative">
              <Search size={14} className="absolute right-3 top-2.5 text-slate-400" />
              <input type="text" placeholder="חפש תעודה או לקוח..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pr-9 py-1.5 rounded-xl border-none bg-white text-xs font-bold w-48 shadow-sm" />
            </div>
          </div>
        </div>
        <button onClick={() => setShowAdmin(true)} className="flex items-center gap-2 px-6 py-2 bg-blue-900 text-white rounded-full font-black text-xs shadow-lg hover:scale-105 transition-all">
          <Database size={16}/> הזרקת JSON
        </button>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* מפה סיכות */}
          <div className="bg-white p-2 rounded-[3rem] shadow-2xl h-[450px] overflow-hidden border-4 border-white relative">
            {isClient && (
              <MapContainer center={[32.16, 34.89]} zoom={11} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {filteredHistory.map((t) => (
                  t.lat && <Marker key={t.id} position={[t.lat, t.lng]}><Popup><div className="text-right font-sans font-bold text-blue-900">#{t.ticketId} - {t.customer}</div></Popup></Marker>
                ))}
              </MapContainer>
            )}
          </div>
          
          {/* ריכוז העמסות יומי */}
          <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100">
            <h3 className="font-black text-slate-800 text-sm mb-6 flex items-center gap-3"><BarChart3 size={20} className="text-blue-600"/> ריכוז העמסות - {selectedDate}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* סטטיסטיקה דינמית מחושבת מה-JSON */}
              <div className="bg-blue-50 p-4 rounded-3xl flex flex-col items-center border border-blue-100">
                <span className="text-[10px] font-black text-blue-600 uppercase">סה"כ תעודות</span>
                <span className="text-2xl font-black text-blue-900">{filteredHistory.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* רשימת תעודות מפורטת (המבורגר) */}
        <div className="bg-white rounded-[3rem] shadow-2xl p-6 h-[750px] flex flex-col border border-slate-50">
          <div className="p-2 border-b mb-4 flex justify-between items-center italic text-xs text-slate-400">
            <span>ממוין לפי מספר תעודה</span>
            <span>{selectedDate}</span>
          </div>
          <div className="overflow-y-auto flex-1 space-y-4 pr-2 custom-scrollbar">
            {filteredHistory.map((ticket) => (
              <div key={ticket.id} className={`rounded-3xl border-2 transition-all overflow-hidden ${expandedRow === ticket.id ? 'bg-white border-blue-400 shadow-xl' : 'bg-slate-50 border-slate-100'}`}>
                <div onClick={() => setExpandedRow(expandedRow === ticket.id ? null : ticket.id)} className="p-5 flex justify-between items-center cursor-pointer">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-blue-600 tracking-tighter italic">#{ticket.ticketId}</span>
                    <h4 className="font-black text-slate-800 text-sm">{ticket.customer}</h4>
                  </div>
                  <ChevronDown size={20} className={`text-slate-400 transition-transform ${expandedRow === ticket.id ? 'rotate-180' : ''}`} />
                </div>

                {expandedRow === ticket.id && (
                  <div className="p-6 bg-white border-t border-blue-100 space-y-6 animate-in slide-in-from-top-4">
                    {/* זמני עבודה - עריכה דינמית */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-orange-600 block px-1">פתיחת PTO / העמסה</label>
                        <input type="time" defaultValue={ticket.techographPTO?.open} onBlur={(e) => handleUpdateField(ticket.id, '/techographPTO/open', e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black focus:ring-2 focus:ring-orange-200 outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-orange-600 block px-1">סגירת PTO / סיום</label>
                        <input type="time" defaultValue={ticket.techographPTO?.close} onBlur={(e) => handleUpdateField(ticket.id, '/techographPTO/close', e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black focus:ring-2 focus:ring-orange-200 outline-none" />
                      </div>
                    </div>
                    
                    <div className="bg-blue-900 text-white p-3 rounded-2xl flex justify-between items-center text-xs font-black shadow-lg">
                      <span>זמן עבודה כולל:</span>
                      <span className="text-blue-300 italic">{calculateDuration(ticket.techographPTO?.open, ticket.techographPTO?.close)} דקות</span>
                    </div>

                    {/* פירוט מוצרים והחזרות */}
                    <div className="space-y-3">
                      <h5 className="text-[10px] font-black text-blue-800 underline flex items-center gap-2"><Package size={14}/> פירוט תכולת תעודה</h5>
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
                        {ticket.itemsDetailed?.map((item: any, i: number) => (
                          <div key={i} className="flex justify-between items-center text-[11px] border-b border-slate-200 pb-1">
                            <span className="font-bold text-slate-700">{item.name}</span>
                            <span className="font-black text-blue-900">{item.qty} {item.unit}</span>
                          </div>
                        ))}
                      </div>
                      {/* החזרות מוצרים ופקדונות - בולט */}
                      <div className="bg-orange-50 border-2 border-orange-200 p-4 rounded-2xl space-y-2">
                        <span className="text-[10px] font-black text-orange-800 flex items-center gap-2"><AlertCircle size={14}/> פקדונות והחזרות (עריכה חופשית):</span>
                        <textarea 
                          defaultValue={ticket.depositsManualCount} 
                          onBlur={(e) => handleUpdateField(ticket.id, '/depositsManualCount', e.target.value)}
                          className="w-full bg-white border border-orange-100 rounded-xl p-2 text-[10px] font-bold outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => setExpandedRow(null)} className="flex-1 py-3 bg-blue-600 text-white rounded-2xl text-[11px] font-black hover:bg-blue-700 shadow-md flex items-center justify-center gap-2">
                        <Save size={16}/> אשר נתוני תעודה
                      </button>
                      <button onClick={() => remove(ref(db, `delivery_history/${ticket.id}`))} className="p-3 bg-red-50 text-red-500 rounded-2xl border-2 border-red-100 hover:bg-red-100">
                        <Trash2 size={20}/>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Admin Modal - הזרקת JSON */}
      {showAdmin && (
        <div className="fixed inset-0 bg-blue-950/40 backdrop-blur-md z-[2000] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3.5rem] w-full max-w-2xl shadow-2xl p-10 border-t-[12px] border-blue-900">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-blue-900 flex items-center gap-3"><Database size={26}/> הזרקת JSON למערכת</h3>
                <button onClick={() => setShowAdmin(false)} className="hover:rotate-90 transition-transform"><X/></button>
             </div>
             <textarea value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} className="w-full h-80 p-8 font-mono text-[11px] border-2 rounded-[3rem] bg-slate-50 mb-6 focus:ring-4 focus:ring-blue-100 outline-none" placeholder="Paste JSON here..." />
             <button onClick={async () => {
               try {
                 const parsed = JSON.parse(jsonInput);
                 const items = Array.isArray(parsed) ? parsed : [parsed];
                 for (const item of items) {
                   const newRef = push(ref(db, 'delivery_history'));
                   await set(newRef, { ...item, date: item.date || selectedDate });
                 }
                 setJsonInput(''); setShowAdmin(false); alert('הנתונים הוזרקו בהצלחה!');
               } catch { alert('JSON לא תקין'); }
             }} className="w-full py-5 bg-blue-900 text-white rounded-[2rem] font-black text-lg shadow-xl">בצע עדכון נתונים</button>
          </div>
        </div>
      )}
    </div>
  );
}
