'use client';
import { useEffect, useState, useMemo } from 'react';
import { db } from '../lib/firebase';
import { ref, onValue, set, update, remove } from 'firebase/database';
import dynamic from 'next/dynamic';
import { 
  Truck, FileText, CheckCircle, Clock, Package, Database, X, 
  ChevronDown, Save, Trash2, Award, BarChart3, Edit3
} from 'lucide-react';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

export default function SabanManagementDiamond() {
  const [deliveryHistory, setDeliveryHistory] = useState<any[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [selectedDate, setSelectedDate] = useState('2026-01-18');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<string | null>(null);

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
    deliveryHistory.filter(t => t.date === selectedDate).sort((a,b) => a.ticketId.localeCompare(b.ticketId)), 
  [deliveryHistory, selectedDate]);

  const dailyStats = useMemo(() => {
    const products: any = {};
    filteredHistory.forEach(t => {
      (t.itemsDetailed || []).forEach((item: any) => {
        products[item.name] = (products[item.name] || 0) + (parseFloat(item.qty) || 0);
      });
    });
    return Object.entries(products);
  }, [filteredHistory]);

  const handleUpdate = async (id: string, updatedData: any) => {
    await update(ref(db, `delivery_history/${id}`), updatedData);
    setEditMode(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('בטוח שברצונך למחוק תעודה זו מהמאגר?')) {
      await remove(ref(db, `delivery_history/${id}`));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-right" dir="rtl">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      {/* Header */}
      <header className="bg-white border-b-4 border-blue-800 shadow-xl sticky top-0 z-[1000] p-4 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <div className="border-l-4 pl-6 border-blue-900">
            <h1 className="text-2xl font-black text-blue-900 leading-none">ח.סבן</h1>
            <span className="text-[10px] font-bold text-slate-400">ניהול לוגיסטי מתקדם</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-slate-100 p-2 rounded-2xl flex items-center gap-2">
            <Clock size={16} className="text-blue-600"/>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent font-bold text-sm outline-none" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Map */}
          <div className="bg-white p-2 rounded-[2.5rem] shadow-2xl h-[400px] overflow-hidden border-4 border-white">
            {isClient && (
              <MapContainer center={[32.16, 34.89]} zoom={11} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {filteredHistory.map((t) => (
                  t.lat && <Marker key={t.id} position={[t.lat, t.lng]}><Popup><b>{t.customer}</b></Popup></Marker>
                ))}
              </MapContainer>
            )}
          </div>

          {/* Product Summary Chart */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
            <h3 className="font-black text-slate-800 text-sm mb-6 flex items-center gap-2 uppercase"><BarChart3 size={18} className="text-blue-600"/> ריכוז העמסות יומי</h3>
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

        {/* Tickets List */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-6 h-[720px] flex flex-col border border-slate-50">
          <h2 className="font-black text-xl text-slate-800 mb-6 flex justify-between items-center">
            תעודות משלוח 
            <span className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-full">{filteredHistory.length}</span>
          </h2>
          <div className="overflow-y-auto flex-1 space-y-4 pr-2 custom-scrollbar">
            {filteredHistory.map((ticket) => (
              <div key={ticket.id} className={`rounded-3xl p-4 border transition-all ${expandedRow === ticket.id ? 'bg-blue-50/30 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex justify-between items-center cursor-pointer" onClick={() => setExpandedRow(expandedRow === ticket.id ? null : ticket.id)}>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-blue-600 uppercase">#{ticket.ticketId}</span>
                    <h4 className="font-bold text-slate-800 text-sm truncate w-40">{ticket.customer}</h4>
                  </div>
                  <ChevronDown size={18} className={`transition-transform ${expandedRow === ticket.id ? 'rotate-180' : ''}`} />
                </div>

                {expandedRow === ticket.id && (
                  <div className="mt-4 pt-4 border-t border-slate-200 space-y-4 animate-in slide-in-from-top-2">
                    {/* Editable Times */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white p-2 rounded-xl border">
                        <label className="text-[8px] font-black text-orange-600 block uppercase">תחילת PTO</label>
                        <input 
                          type="time" 
                          disabled={editMode !== ticket.id}
                          defaultValue={ticket.techographPTO?.open}
                          className="w-full text-xs font-bold bg-transparent outline-none disabled:opacity-50"
                        />
                      </div>
                      <div className="bg-white p-2 rounded-xl border">
                        <label className="text-[8px] font-black text-orange-600 block uppercase">סיום PTO</label>
                        <input 
                          type="time" 
                          disabled={editMode !== ticket.id}
                          defaultValue={ticket.techographPTO?.close}
                          className="w-full text-xs font-bold bg-transparent outline-none disabled:opacity-50"
                        />
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="bg-white rounded-xl p-3 border text-[10px] space-y-1">
                      <span className="font-black text-blue-800 block mb-1">פירוט מוצרים:</span>
                      {ticket.itemsDetailed?.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between border-b pb-1">
                          <span>{item.name}</span>
                          <span className="font-bold">{item.qty} {item.unit}</span>
                        </div>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {editMode === ticket.id ? (
                        <button onClick={() => setEditMode(null)} className="flex-1 py-2 bg-green-600 text-white rounded-xl text-[10px] font-bold flex justify-center items-center gap-1 shadow-md hover:bg-green-700">
                          <Save size={14}/> שמור
                        </button>
                      ) : (
                        <button onClick={() => setEditMode(ticket.id)} className="flex-1 py-2 bg-slate-800 text-white rounded-xl text-[10px] font-bold flex justify-center items-center gap-1 hover:bg-black transition-all">
                          <Edit3 size={14}/> עריכה
                        </button>
                      )}
                      <button onClick={() => handleDelete(ticket.id)} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 border border-red-100 transition-all">
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
