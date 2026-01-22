'use client';
import { useEffect, useState, useMemo } from 'react';
import { db } from '../lib/firebase';
import { ref, onValue, update, remove, push, set } from 'firebase/database';
import dynamic from 'next/dynamic';
import { 
  Truck, FileText, Clock, Package, Save, Trash2, ChevronDown, 
  BarChart3, Edit3, MapPin, Database, Search, AlertCircle, Hash, X 
} from 'lucide-react';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

export default function SabanEliteFinalV4() {
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
      } else {
        setDeliveryHistory([]);
      }
    });
  }, []);

  // סינון ומיון חסין שגיאות
  const filteredHistory = useMemo(() => 
    deliveryHistory
      .filter(t => t.date === selectedDate)
      .filter(t => {
        const id = String(t.ticketId || "");
        const cust = String(t.customer || "").toLowerCase();
        return id.includes(searchTerm) || cust.includes(searchTerm.toLowerCase());
      })
      .sort((a, b) => String(a.ticketId || "").localeCompare(String(b.ticketId || ""))), 
  [deliveryHistory, selectedDate, searchTerm]);

  const dailyStats = useMemo(() => {
    const stats: any = {};
    filteredHistory.forEach(t => {
      (t.itemsDetailed || []).forEach((item: any) => {
        if (item.name) {
          stats[item.name] = (stats[item.name] || 0) + (parseFloat(item.qty) || 0);
        }
      });
    });
    return Object.entries(stats);
  }, [filteredHistory]);

  const handleUpdateField = async (id: string, fieldPath: string, value: any) => {
    try {
      // תיקון שגיאת ה-update: Firebase דורש אובייקט
      const updates: any = {};
      updates[fieldPath] = value;
      await update(ref(db, `delivery_history/${id}`), updates);
    } catch (e) {
      console.error("Update failed", e);
    }
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
    <div className="min-h-screen bg-[#f8fafc] font-sans text-right" dir="rtl">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      {/* Header */}
      <header className="bg-white border-b-4 border-blue-900 shadow-xl sticky top-0 z-[1000] p-4 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <div className="border-l-4 pl-4 border-blue-900">
            <h1 className="text-2xl font-black text-blue-900 italic">ח.סבן</h1>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Management Elite 4.0</span>
          </div>
          <div className="flex bg-slate-100 rounded-2xl p-1 gap-2 border border-slate-200">
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent font-black text-sm p-1 outline-none text-blue-900 cursor-pointer" />
            <div className="relative">
              <Search size={14} className="absolute right-3 top-2.5 text-slate-400" />
              <input type="text" placeholder="חיפוש חופשי..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pr-9 py-1.5 rounded-xl border-none bg-white text-xs font-bold w-48 shadow-sm focus:ring-2 focus:ring-blue-200" />
            </div>
          </div>
        </div>
        <button onClick={() => setShowAdmin(true)} className="flex items-center gap-2 px-6 py-2 bg-blue-900 text-white rounded-full font-black text-xs shadow-lg hover:scale-105 transition-all">
          <Database size={16}/> הזרקת נתוני זהב
        </button>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Map */}
          <div className="bg-white p-2 rounded-[3.5rem] shadow-2xl h-[450px] overflow-hidden border-4 border-white">
            {isClient && (
              <MapContainer center={[32.16, 34.89]} zoom={11} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {filteredHistory.map((t) => (
                  t.lat && <Marker key={t.id} position={[t.lat, t.lng]}><Popup><div className="text-right font-sans font-bold">#{t.ticketId} - {t.customer}</div></Popup></Marker>
                ))}
              </MapContainer>
            )}
          </div>

          {/* ריכוז העמסות יומי */}
          <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100">
            <h3 className="font-black text-slate-800 text-sm mb-6 flex items-center gap-3"><BarChart3 size={20} className="text-blue-600"/> ריכוז העמסות - {selectedDate}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {dailyStats.map(([name, qty]: any) => (
                <div key={name} className="bg-slate-50 p-4 rounded-3xl flex flex-col items-center border border-slate-100 shadow-sm">
                  <span className="text-[10px] font-black text-slate-400 text-center h-8 leading-tight">{name}</span>
                  <span className="text-2xl font-black text-blue-900">{qty}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* רשימת תעודות (המבורגר) */}
        <div className="bg-white rounded-[3.5rem] shadow-2xl p-6 h-[750px] flex flex-col border border-slate-50">
          <div className="overflow-y-auto flex-1 space-y-4 pr-2 custom-scrollbar">
            {filteredHistory.map((ticket) => (
              <div key={ticket.id} className={`rounded-3xl border-2 transition-all ${expandedRow === ticket.id ? 'bg-white border-blue-400 shadow-xl' : 'bg-slate-50 border-slate-100'}`}>
                <div onClick={() => setExpandedRow(expandedRow === ticket.id ? null : ticket.id)} className="p-5 flex justify-between items-center cursor-pointer">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-blue-600 tracking-tighter italic">#{ticket.ticketId}</span>
                    <h4 className="font-black text-slate-800 text-sm">{ticket.customer}</h4>
                  </div>
                  <ChevronDown size={20} className={`text-slate-400 transition-transform ${expandedRow === ticket.id ? 'rotate-180' : ''}`} />
                </div>

                {expandedRow === ticket.id && (
                  <div className="p-6 bg-white border-t border-blue-100 space-y-5 animate-in slide-in-from-top-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-orange-600 block px-1">פתיחת PTO / העמסה</label>
                        <input type="time" defaultValue={ticket.techographPTO?.open} onBlur={(e) => handleUpdateField(ticket.id, 'techographPTO/open', e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-orange-600 block px-1">סגירת PTO / סיום</label>
                        <input type="time" defaultValue={ticket.techographPTO?.close} onBlur={(e) => handleUpdateField(ticket.id, 'techographPTO/close', e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black outline-none" />
                      </div>
                    </div>
                    
                    <div className="bg-blue-900 text-white p-3 rounded-2xl flex justify-between items-center text-xs font-black shadow-lg">
                      <span>זמן עבודה כולל:</span>
                      <span className="text-blue-300">{calculateDuration(ticket.techographPTO?.open, ticket.techographPTO?.close)} דקות</span>
                    </div>

                    <div className="space-y-3">
                      <h5 className="text-[10px] font-black text-blue-800 underline flex items-center gap-2"><Package size={14}/> פירוט מוצרים</h5>
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
                        {ticket.itemsDetailed?.map((item: any, i: number) => (
                          <div key={i} className="flex justify-between items-center text-[11px] border-b border-slate-200 pb-1 italic">
                            <span className="text-slate-700 font-bold">{item.name}</span>
                            <span className="font-black text-blue-900">{item.qty} {item.unit}</span>
                          </div>
                        ))}
                      </div>
                      <div className="bg-orange-50 border-2 border-orange-100 p-4 rounded-2xl space-y-2 shadow-inner">
                        <span className="text-[10px] font-black text-orange-800 flex items-center gap-2 uppercase"><AlertCircle size={14}/> פקדונות והחזרות:</span>
                        <textarea 
                          defaultValue={ticket.depositsManualCount} 
                          onBlur={(e) => handleUpdateField(ticket.id, 'depositsManualCount', e.target.value)}
                          className="w-full bg-white border border-orange-100 rounded-xl p-2 text-[10px] font-bold outline-none shadow-sm h-16"
                        />
                      </div>
                    </div>

                    <button onClick={() => remove(ref(db, `delivery_history/${ticket.id}`))} className="w-full py-3 bg-red-50 text-red-600 rounded-2xl text-[11px] font-black hover:bg-red-100 transition-all border-2 border-red-100 flex items-center justify-center gap-2"><Trash2 size={16}/> מחק תעודה</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Admin Modal */}
      {showAdmin && (
        <div className="fixed inset-0 bg-blue-950/40 backdrop-blur-md z-[2000] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3.5rem] w-full max-w-2xl shadow-2xl p-10 border-t-[12px] border-blue-900 relative">
            <button onClick={() => setShowAdmin(false)} className="absolute top-6 left-6 text-slate-400 hover:text-red-500 transition-colors"><X size={28}/></button>
            <h3 className="text-2xl font-black mb-6 flex items-center gap-3 text-blue-900"><Database size={26}/> הזרקת JSON למערכת</h3>
            <textarea value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} className="w-full h-80 p-6 font-mono text-[11px] border-2 rounded-[3rem] bg-slate-50 mb-6 outline-none focus:border-blue-500 shadow-inner" placeholder="הדבק JSON כאן..." />
            <button onClick={async () => {
              try {
                const parsed = JSON.parse(jsonInput);
                const items = Array.isArray(parsed) ? parsed : [parsed];
                for (const item of items) { await set(push(ref(db, 'delivery_history')), { ...item, date: item.date || selectedDate }); }
                setJsonInput(''); setShowAdmin(false); alert('הנתונים עודכנו בהצלחה!');
              } catch { alert('JSON לא תקין'); }
            }} className="w-full py-5 bg-blue-900 text-white rounded-[2rem] font-black text-lg shadow-xl hover:bg-black transition-all transform active:scale-95">בצע עדכון נתונים</button>
          </div>
        </div>
      )}
    </div>
  );
}
