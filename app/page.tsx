'use client';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { ref, onValue, push, set } from 'firebase/database';
import dynamic from 'next/dynamic';
import { Truck, FileText, Map as MapIcon, CheckCircle, AlertCircle, User, Clock, Package, Database, X } from 'lucide-react';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

export default function SabanEliteDashboard() {
  const [drivers, setDrivers] = useState<any>({});
  const [deliveryHistory, setDeliveryHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'fleet' | 'logistics'>('fleet');
  const [isClient, setIsClient] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    setIsClient(true);
    const driversRef = ref(db, 'team');
    onValue(driversRef, (snapshot) => snapshot.exists() && setDrivers(snapshot.val()));

    const historyRef = ref(db, 'delivery_history');
    onValue(historyRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setDeliveryHistory(Object.keys(data).map(key => ({ id: key, ...data[key] })));
      }
    });
  }, []);

  const handleJsonImport = async () => {
    try {
      const parsed = JSON.parse(jsonInput);
      const dataArray = Array.isArray(parsed) ? parsed : [parsed];
      const historyRef = ref(db, 'delivery_history');
      
      for (const item of dataArray) {
        const newRef = push(historyRef);
        await set(newRef, { ...item, date: item.date || selectedDate });
      }
      
      setJsonInput('');
      setShowAdminModal(false);
      alert('הנתונים הוזנו בהצלחה!');
    } catch (e) {
      alert('שגיאה בפורמט ה-JSON. וודא שהעתקת נכון מה-AI.');
    }
  };

  const filteredHistory = deliveryHistory.filter(t => t.date === selectedDate);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-right" dir="rtl">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      {/* Header */}
      <header className="bg-blue-900 text-white shadow-2xl p-6 sticky top-0 z-[1000]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-black italic">SABAN AI ELITE</h1>
              <p className="text-blue-300 text-sm">ניהול לוגיסטי חכם</p>
            </div>
            <button 
              onClick={() => setShowAdminModal(true)}
              className="p-2 bg-blue-800 rounded-full hover:bg-blue-700 transition-colors"
              title="הזרקת נתונים"
            >
              <Database size={18} />
            </button>
          </div>
          
          <nav className="flex bg-blue-800/50 p-1 rounded-2xl border border-blue-700">
            <button onClick={() => setActiveTab('fleet')} className={`flex items-center gap-2 px-6 py-2 rounded-xl transition-all ${activeTab === 'fleet' ? 'bg-blue-600 shadow-lg' : 'text-blue-200'}`}>
              <Truck size={20} /> ניהול צי
            </button>
            <button onClick={() => setActiveTab('logistics')} className={`flex items-center gap-2 px-6 py-2 rounded-xl transition-all ${activeTab === 'logistics' ? 'bg-blue-600 shadow-lg' : 'text-blue-200'}`}>
              <FileText size={20} /> לוגיסטיקה
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'logistics' && (
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm mb-6 border border-gray-200">
            <h2 className="text-xl font-bold text-slate-800">דוח יומי - {selectedDate}</h2>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-500">בחר יום:</span>
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border rounded-xl p-2 font-bold text-blue-900 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        )}

        {activeTab === 'fleet' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-4 rounded-3xl shadow-sm border border-gray-200 h-[600px]">
              {isClient && (
                <MapContainer center={[32.0853, 34.7818]} zoom={9} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {Object.entries(drivers).map(([name, data]: [string, any]) => (
                    data.lat && data.lng && (
                      <Marker key={name} position={[parseFloat(data.lat), parseFloat(data.lng)]}>
                        <Popup><div className="text-right font-sans"><b>{name}</b><br/>{data.status}</div></Popup>
                      </Marker>
                    )
                  ))}
                </MapContainer>
              )}
            </div>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden h-[600px] flex flex-col">
              <div className="p-5 border-b bg-gray-50 font-bold">נהגים פעילים</div>
              <div className="overflow-y-auto flex-1">
                {Object.entries(drivers).map(([name, data]: [string, any]) => (
                  <div key={name} className="p-4 flex items-center justify-between border-b hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center">
                        {data.profileImage ? <img src={data.profileImage} className="w-full h-full object-cover"/> : <User size={20}/>}
                      </div>
                      <span className="font-bold">{name}</span>
                    </div>
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-bold">{data.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard label="תעודות בטיפול" value={filteredHistory.filter(t => t.status === 'Red').length} color="text-red-600" />
              <StatCard label="תעודות תקינות" value={filteredHistory.filter(t => t.status === 'Green').length} color="text-green-600" />
              <StatCard label="דקות מנוף" value={filteredHistory.reduce((acc, t) => acc + (parseInt(t.craneMinutes) || 0), 0)} color="text-blue-600" />
              <StatCard label="החזרות פריטים" value={filteredHistory.filter(t => t.deposits).length} color="text-orange-600" />
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-right">
                <thead className="bg-slate-800 text-white text-sm">
                  <tr>
                    <th className="p-4">מס' תעודה</th>
                    <th className="p-4">לקוח</th>
                    <th className="p-4 text-center"><Clock size={14} className="inline"/> התחלה</th>
                    <th className="p-4 text-center"><Clock size={14} className="inline"/> סיום</th>
                    <th className="p-4"><Package size={14} className="inline"/> החזרות/פקדון</th>
                    <th className="p-4 text-center">סטטוס</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredHistory.map((ticket) => (
                    <tr key={ticket.id} className={ticket.status === 'Red' ? 'bg-red-50' : ''}>
                      <td className="p-4 font-black">#{ticket.ticketId}</td>
                      <td className="p-4 font-bold">{ticket.customer}</td>
                      <td className="p-4 text-center font-mono">{ticket.startTime || '--:--'}</td>
                      <td className="p-4 text-center font-mono">{ticket.endTime || '--:--'}</td>
                      <td className="p-4 text-orange-700 font-medium">
                        {typeof ticket.deposits === 'object' ? `${ticket.deposits?.big_bag || 0} שקי פקדון` : (ticket.deposits || '---')}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-black ${ticket.status === 'Red' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {ticket.status === 'Red' ? 'בטיפול' : 'תקין'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredHistory.length === 0 && <div className="p-20 text-center text-slate-400">אין נתונים לתאריך שנבחר</div>}
            </div>
          </div>
        )}
      </main>

      {/* Admin Modal - הדבקת JSON מוסתרת */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold">הזרקת נתונים מה-AI</h3>
              <button onClick={() => setShowAdminModal(false)}><X/></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">הדבק כאן את קוד ה-JSON שקיבלת מה-AI לאחר ניתוח התעודות:</p>
              <textarea 
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="w-full h-64 p-4 font-mono text-xs border rounded-2xl bg-slate-900 text-green-400 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="[{ 'ticketId': '123'... }]"
              />
              <button 
                onClick={handleJsonImport}
                disabled={!jsonInput}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 disabled:bg-slate-300 transition-all"
              >
                אשר והזרק למאגר ההיסטוריה
              </button>
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
      <span className="text-slate-500 text-xs font-bold block mb-1">{label}</span>
      <span className={`text-3xl font-black ${color}`}>{value}</span>
    </div>
  );
}
