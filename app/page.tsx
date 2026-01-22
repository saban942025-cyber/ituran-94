'use client';
import { useEffect, useState, useMemo } from 'react';
import { db } from '../lib/firebase';
import { ref, onValue, set, update, remove, push } from 'firebase/database';
import dynamic from 'next/dynamic';
import { 
  Truck, FileText, Clock, Package, Save, Trash2, ChevronDown, 
  BarChart3, Edit3, MapPin, Database, AlertTriangle, Hash
} from 'lucide-react';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

export default function SabanEliteProDashboard() {
  const [deliveryHistory, setDeliveryHistory] = useState<any[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [selectedDate, setSelectedDate] = useState('2026-01-18');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<string | null>(null);
  const [globalJson, setGlobalJson] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    setIsClient(true);
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
    deliveryHistory
      .filter(t => t.date === selectedDate)
      .sort((a, b) => (a.ticketId || "").localeCompare(b.ticketId || "")), 
  [deliveryHistory, selectedDate]);

  const dailyStats = useMemo(() => {
    const products: any = {};
    filteredHistory.forEach(t => {
      (t.itemsDetailed || []).forEach((item: any) => {
        if (item.name) {
          products[item.name] = (products[item.name] || 0) + (parseFloat(item.qty) || 0);
        }
      });
    });
    return Object.entries(products);
  }, [filteredHistory]);

  const calculateDuration = (start: string, end: string) => {
    if (!start || !end || start.includes('לא')) return 0;
    try {
      const [sH, sM] = start.split(':').map(Number);
      const [eH, eM] = end.split(':').map(Number);
      const total = (eH * 60 + eM) - (sH * 60 + sM);
      return total > 0 ? total : 0;
    } catch { return 0; }
  };

  const handleGlobalImport = async () => {
    try {
      const parsed = JSON.parse(globalJson);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        const newRef = push(ref(db, 'delivery_history'));
        await set(newRef, { ...item, date: item.date || selectedDate });
      }
      setGlobalJson('');
      setShowAdmin(false);
    } catch { alert('JSON לא תקין'); }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] font-sans text-right" dir="rtl">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      {/* Corporate Header */}
      <header className="bg-white border-b-4 border-blue-900 shadow-2xl sticky top-0 z-[1000] p-4 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <div className="border-l-4 pl-4 border-blue-900">
            <h1 className="text-2xl font-black text-blue-900 italic">ח.סבן</h1>
            <span className="text-[10px] font-bold text-slate-500 uppercase">Management Elite v2.0</span>
          </div>
          <div className="bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100 flex items-center gap-3 shadow-sm">
            <Clock size={18} className="text-blue-600"/>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent font-black text-sm outline-none text-blue-900 cursor-pointer" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowAdmin(!showAdmin)} className="p-3 bg-blue-900 text-white rounded-full shadow-lg hover:scale-110 transition-transform">
            <Database size={20}/>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* מפת סיכות דינמית */}
          <div className="bg-white p-2 rounded-[3rem] shadow-2xl h-[450px] overflow-hidden border-4 border-white relative group">
            {isClient && (
              <MapContainer center={[32.16, 34.89]} zoom={11} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {filteredHistory.map((t) => (
                  t.lat && (
                    <Marker key={t.id} position={[t.lat, t.lng]}>
                      <Popup>
                        <div className="text-right font-sans p-1">
                          <div className="font-black text-blue-900">#{ticket.ticketId} - {t.customer}</div>
                          <div className="text-xs text-slate-500">{t.address?.city}</div>
                          <button onClick={() => setExpandedRow(t.id)} className="mt-2 text-[10px] bg-blue-600 text-white px-2 py-1 rounded">פתח תעודה</button>
                        </div>
                      </Popup>
                    </Marker>
                  )
                ))}
              </MapContainer>
            )}
          </div>

          {/* ריכוז העמסות יומי - תצוגה משופרת */}
          <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-200">
            <h3 className="font-black text-slate-800 text-sm mb-6 flex items-center gap-3 uppercase tracking-tighter">
              <BarChart3 size={20} className="text-blue-600"/> ריכוז העמסות יומי לסניף {selectedDate}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {dailyStats.map(([name, qty]: any) => (
                <div key={name} className="bg-gradient-to-br from-slate-50 to-white p-5 rounded-3xl border border-slate-100 flex flex-col items-center shadow-sm hover:shadow-md transition-shadow">
                  <span className="text-[10px] font-black text-slate-400 text-center h-10 flex items-center">{name}</span>
                  <span className="text-2xl font-black text-blue-900">{qty}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* רשימת תעודות קטלוג - המבורגר מקצועי */}
        <div className="bg-white rounded-[3rem] shadow-2xl p-8 h-[750px] flex flex-col border border-slate-50">
          <div className="flex justify-between items-center mb-8">
            <h2 className="font-black text-xl text-slate-800">דוח לוגיסטי</h2>
            <span className="text-xs font-black bg-blue-100 text-blue-700 px-3 py-1 rounded-full uppercase italic">Sort: Ticket ID</span>
          </div>

          <div className="overflow-y-auto flex-1 space-y-4 pr-2 custom-scrollbar">
            {filteredHistory.map((ticket) => (
              <div key={ticket.id} className={`rounded-[2.5rem] p-5 border-2 transition-all ${expandedRow === ticket.id ? 'bg-blue-50/50 border-blue-400 shadow-inner' : 'bg-slate-50 border-slate-100 hover:border-blue-200'}`}>
                <div className="flex justify-between items-center cursor-pointer" onClick={() => setExpandedRow(expandedRow === ticket.id ? null : ticket.id)}>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-blue-600 tracking-widest italic">#{ticket.ticketId}</span>
                    <h4 className="font-bold text-slate-800 text-sm truncate w-36">{ticket.customer}</h4>
                  </div>
                  <ChevronDown size={20} className={`text-slate-400 transition-transform ${expandedRow === ticket.id ? 'rotate-180' : ''}`} />
                </div>

                {expandedRow === ticket.id && (
                  <div className="mt-6 pt-6 border-t border-blue-200 space-y-5 animate-in slide-in-from-top-4">
                    {/* עריכת זמנים */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white p-3 rounded-2xl border-2 border-slate-100">
                        <label className="text-[9px] font-black text-orange-600 block mb-1">פתיחת PTO</label>
                        <input type="time" disabled={editMode !== ticket.id} defaultValue={ticket.techographPTO?.open} className="w-full font-black text-xs outline-none bg-transparent" />
                      </div>
                      <div className="bg-white p-3 rounded-2xl border-2 border-slate-100">
                        <label className="text-[9px] font-black text-orange-600 block mb-1">סגירת PTO</label>
                        <input type="time" disabled={editMode !== ticket.id} defaultValue={ticket.techographPTO?.close} className="w-full font-black text-xs outline-none bg-transparent" />
                      </div>
                    </div>
                    
                    <div className="bg-blue-900 text-white p-3 rounded-2xl flex justify-between items-center text-xs font-black shadow-lg">
                      <span>זמן עבודה מחושב:</span>
                      <span className="text-blue-300">{calculateDuration(ticket.techographPTO?.open, ticket.techographPTO?.close)} דקות</span>
                    </div>

                    {/* רשימת מוצרים בתוך המבורגר */}
                    <div className="bg-white rounded-[2rem] p-5 border-2 border-slate-100 space-y-3 shadow-inner">
                      <h5 className="text-[11px] font-black text-blue-800 underline flex items-center gap-2">
                        <Package size={14}/> פירוט מוצרים ומק"טים
                      </h5>
                      <div className="space-y-2">
                        {ticket.itemsDetailed?.map((item: any, i: number) => (
                          <div key={i} className="flex justify-between items-center border-b border-slate-50 pb-2 text-[11px]">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-700">{item.name}</span>
                              <span className="text-[8px] text-slate-400 flex items-center gap-1"><Hash size={8}/> {item.sku || 'SKU-770'+i}</span>
                            </div>
                            <span className="font-black text-blue-900 bg-blue-50 px-2 py-1 rounded-lg">{item.qty} {item.unit}</span>
                          </div>
                        ))}
                      </div>
                      
                      {/* החזרות מוצרים בולטות */}
                      <div className={`p-3 rounded-xl border-2 flex items-center gap-3 ${ticket.depositsManualCount ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-100 opacity-50'}`}>
                         <AlertTriangle size={16} className={ticket.depositsManualCount ? 'text-orange-600' : 'text-slate-400'}/>
                         <span className="text-[10px] font-black uppercase text-slate-700">החזרות/פקדונות: {ticket.depositsManualCount || 'אין דיווח'}</span>
                      </div>
                    </div>

                    {/* כפתורי פעולה */}
                    <div className="flex gap-2">
                      <button onClick={() => setEditMode(editMode === ticket.id ? null : ticket.id)} className="flex-1 py-3 bg-slate-900 text-white rounded-2xl text-[11px] font-black flex justify-center items-center gap-2 hover:bg-black transition-all">
                        {editMode === ticket.id ? <Save size={16}/> : <Edit3 size={16}/>} {editMode === ticket.id ? 'שמור שינויים' : 'ערוך תעודה'}
                      </button>
                      <button onClick={() => remove(ref(db, `delivery_history/${ticket.id}`))} className="p-3 bg-white text-red-600 rounded-2xl border-2 border-red-100 hover:bg-red-50 shadow-sm transition-all">
                        <Trash2 size={20}/>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {filteredHistory.length === 0 && <p className="text-center text-slate-300 italic pt-20">אין תעודות להצגה</p>}
          </div>
        </div>
      </main>

      {/* Admin Panel for Global JSON Injection */}
      {showAdmin && (
        <div className="fixed inset-0 bg-blue-950/40 backdrop-blur-md z-[2000] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl p-8 border-t-[12px] border-blue-900">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-blue-900 flex items-center gap-3"><Database size={24}/> הזרקת נתוני AI</h3>
                <button onClick={() => setShowAdmin(false)} className="hover:rotate-90 transition-transform"><X/></button>
             </div>
             <textarea value={globalJson} onChange={(e) => setJsonInput(e.target.value)} className="w-full h-72 p-6 font-mono text-[11px] border-2 rounded-[2.5rem] bg-slate-50 mb-6 outline-none focus:border-blue-500 transition-all" placeholder="Paste JSON here..." />
             <button onClick={handleGlobalImport} className="w-full py-5 bg-blue-900 text-white rounded-[2rem] font-black text-lg shadow-xl hover:bg-black transition-all">אשר והזרק למערכת</button>
          </div>
        </div>
      )}
    </div>
  );
}
