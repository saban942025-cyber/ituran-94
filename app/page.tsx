'use client';
import { useEffect, useState, useMemo } from 'react';
import { db } from '../lib/firebase';
import { ref, onValue, update, remove, push, set } from 'firebase/database';
import dynamic from 'next/dynamic';
// ייבוא מתוקן הכולל את X
import { 
  Truck, FileText, Clock, Package, Save, Trash2, ChevronDown, 
  BarChart3, Edit3, MapPin, Database, Search, AlertCircle, Hash, X 
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

  const filteredHistory = useMemo(() => 
    deliveryHistory
      .filter(t => t.date === selectedDate)
      .filter(t => 
        (t.ticketId || "").includes(searchTerm) || 
        (t.customer || "").toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => (a.ticketId || "").localeCompare(b.ticketId || "")), 
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

  const calculateDuration = (start: string, end: string) => {
    if (!start || !end || start.includes('לא')) return 0;
    try {
      const [sH, sM] = start.split(':').map(Number);
      const [eH, eM] = end.split(':').map(Number);
      return Math.max(0, (eH * 60 + eM) - (sH * 60 + sM));
    } catch { return 0; }
  };

  const handleUpdateField = async (id: string, path: string, value: any) => {
    await update(ref(db, `delivery_history/${id}${path}`), value);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-right" dir="rtl">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      <header className="bg-white border-b-4 border-blue-900 shadow-xl sticky top-0 z-[1000] p-4 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <div className="border-l-4 pl-4 border-blue-900">
            <h1 className="text-2xl font-black text-blue-900 italic">ח.סבן</h1>
            <span className="text-[10px] font-bold text-slate-500 uppercase">Ituran AI Management</span>
          </div>
          <div className="flex bg-slate-100 rounded-2xl p-1 gap-2 shadow-inner">
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent font-black text-sm p-1 outline-none cursor-pointer" />
            <div className="relative">
              <Search size={14} className="absolute right-3 top-2.5 text-slate-400" />
              <input type="text" placeholder="חיפוש חופשי..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pr-9 py-1.5 rounded-xl border-none bg-white text-xs font-bold w-40" />
            </div>
          </div>
        </div>
        <button onClick={() => setShowAdmin(true)} className="p-3 bg-blue-900 text-white rounded-full shadow-lg hover:scale-110 transition-transform">
          <Database size={20}/>
        </button>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-2 rounded-[3rem] shadow-2xl h-[450px] overflow-hidden border-4 border-white">
            {isClient && (
              <MapContainer center={[32.16, 34.89]} zoom={11} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {filteredHistory.map((t) => (
                  t.lat && <Marker key={t.id} position={[t.lat, t.lng]}><Popup><b>{t.customer}</b></Popup></Marker>
                ))}
              </MapContainer>
            )}
          </div>

          <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100">
            <h3 className="font-black text-slate-800 text-sm mb-6 flex items-center gap-2"><BarChart3 className="text-blue-600"/> ריכוז העמסות - {selectedDate}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {dailyStats.map(([name, qty]: any) => (
                <div key={name} className="bg-slate-50 p-4 rounded-2xl border flex flex-col items-center">
                  <span className="text-[9px] font-black text-slate-400 text-center h-8 leading-tight">{name}</span>
                  <span className="text-xl font-black text-blue-900">{qty}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[3rem] shadow-2xl p-6 h-[720px] flex flex-col border border-slate-50">
          <h2 className="font-black text-xl text-slate-800 mb-6 flex justify-between items-center">דוח לוגיסטי <span className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-full">{filteredHistory.length} תעודות</span></h2>
          <div className="overflow-y-auto flex-1 space-y-4 pr-2 custom-scrollbar">
            {filteredHistory.map((ticket) => (
              <div key={ticket.id} className={`rounded-3xl border-2 transition-all ${expandedRow === ticket.id ? 'bg-white border-blue-400 shadow-xl' : 'bg-slate-50 border-slate-100'}`}>
                <div onClick={() => setExpandedRow(expandedRow === ticket.id ? null : ticket.id)} className="p-4 flex justify-between items-center cursor-pointer">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">#{ticket.ticketId}</span>
                    <h4 className="font-bold text-slate-800 text-sm truncate w-40">{ticket.customer}</h4>
                  </div>
                  <ChevronDown size={18} className={`text-slate-400 transition-transform ${expandedRow === ticket.id ? 'rotate-180' : ''}`} />
                </div>

                {expandedRow === ticket.id && (
                  <div className="p-5 border-t border-blue-100 space-y-4 animate-in slide-in-from-top-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-50 p-2 rounded-xl border">
                        <label className="text-[8px] font-black text-orange-600 block">תחילת PTO</label>
                        <input type="time" defaultValue={ticket.techographPTO?.open} onBlur={(e) => handleUpdateField(ticket.id, '/techographPTO/open', e.target.value)} className="w-full text-xs font-black bg-transparent outline-none" />
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl border">
                        <label className="text-[8px] font-black text-orange-600 block">סיום PTO</label>
                        <input type="time" defaultValue={ticket.techographPTO?.close} onBlur={(e) => handleUpdateField(ticket.id, '/techographPTO/close', e.target.value)} className="w-full text-xs font-black bg-transparent outline-none" />
                      </div>
                    </div>
                    <div className="bg-blue-900 text-white p-2 rounded-xl text-center text-[10px] font-black">זמן עבודה: {calculateDuration(ticket.techographPTO?.open, ticket.techographPTO?.close)} דקות</div>
                    <div className="bg-white rounded-xl p-3 border space-y-1">
                      {ticket.itemsDetailed?.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between text-[11px] border-b border-slate-50 pb-1 italic last:border-0">
                          <span className="text-slate-600">{item.name}</span>
                          <span className="font-black text-blue-900">{item.qty} {item.unit}</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-orange-50 border border-orange-200 p-3 rounded-xl">
                      <span className="text-[9px] font-black text-orange-800 block mb-1">פקדונות והחזרות:</span>
                      <textarea defaultValue={ticket.depositsManualCount} onBlur={(e) => handleUpdateField(ticket.id, '/depositsManualCount', e.target.value)} className="w-full bg-white text-[10px] font-bold p-1 rounded outline-none h-12" />
                    </div>
                    <button onClick={() => remove(ref(db, `delivery_history/${ticket.id}`))} className="w-full py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-black hover:bg-red-100 transition-all flex items-center justify-center gap-1"><Trash2 size={12}/> מחק תעודה</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {showAdmin && (
        <div className="fixed inset-0 bg-blue-950/40 backdrop-blur-md z-[2000] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl p-8 border-t-[10px] border-blue-900 relative">
            <button onClick={() => setShowAdmin(false)} className="absolute top-6 left-6 text-slate-400 hover:text-red-500 transition-colors"><X size={24}/></button>
            <h3 className="text-xl font-black mb-6 flex items-center gap-3"><Database className="text-blue-900" size={24}/> הזרקת JSON למערכת</h3>
            <textarea value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} className="w-full h-80 p-6 font-mono text-[11px] border-2 rounded-[2.5rem] bg-slate-50 mb-6 outline-none focus:border-blue-500" placeholder="הדבק JSON כאן..." />
            <button onClick={async () => {
              try {
                const parsed = JSON.parse(jsonInput);
                const items = Array.isArray(parsed) ? parsed : [parsed];
                for (const item of items) { await set(push(ref(db, 'delivery_history')), { ...item, date: item.date || selectedDate }); }
                setJsonInput(''); setShowAdmin(false); alert('הנתונים עודכנו!');
              } catch { alert('JSON לא תקין'); }
            }} className="w-full py-5 bg-blue-900 text-white rounded-[2rem] font-black text-lg shadow-xl hover:bg-black transition-all">אשר והזרק למערכת</button>
          </div>
        </div>
      )}
    </div>
  );
}
