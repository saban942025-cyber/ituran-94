'use client';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { ref, onValue, push, set } from 'firebase/database';
import dynamic from 'next/dynamic';
import { 
  Truck, FileText, Map as MapIcon, CheckCircle, AlertCircle, 
  User, Clock, Package, Database, X, ChevronDown, ChevronUp, ExternalLink 
} from 'lucide-react';

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
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

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
              <h1 className="text-3xl font-black italic tracking-tighter">SABAN AI ELITE</h1>
              <p className="text-blue-300 text-xs font-bold">ניהול לוגיסטי וחקר טכוגרף [cite: 1, 19]</p>
            </div>
            <button 
              onClick={() => setShowAdminModal(true)}
              className="p-2 bg-blue-800 rounded-full hover:bg-blue-700 transition-colors"
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
            <h2 className="text-xl font-bold text-slate-800 underline decoration-blue-500">דוח יומי - {selectedDate}</h2>
            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-slate-400 uppercase">לוח שנה:</span>
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
                        <Popup><div className="text-right font-sans"><b>{name}</b><br/>{data.status} [cite: 58]</div></Popup>
                      </Marker>
                    )
                  ))}
                </MapContainer>
              )}
            </div>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden h-[600px] flex flex-col">
              <div className="p-5 border-b bg-slate-50 font-black text-slate-700">נהגים פעילים [cite: 10]</div>
              <div className="overflow-y-auto flex-1 divide-y divide-slate-50">
                {Object.entries(drivers).map(([name, data]: [string, any]) => (
                  <div key={name} className="p-4 flex items-center justify-between hover:bg-blue-50/50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center border-2 border-white shadow-sm">
                        {data.profileImage ? <img src={data.profileImage} className="w-full h-full object-cover"/> : <User size={20} className="text-slate-400"/>}
                      </div>
                      <span className="font-bold text-slate-800">{name}</span>
                    </div>
                    <span className="text-[10px] px-2 py-1 bg-green-100 text-green-700 rounded-full font-black uppercase tracking-tighter">{data.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard label="תעודות בטיפול" value={filteredHistory.filter(t => t.status === 'Red' || t.validationStatus === 'Investigation Needed').length} color="text-red-600" />
              <StatCard label="אימותי טכוגרף" value={filteredHistory.filter(t => t.validationStatus === 'Match').length} color="text-green-600" />
              <StatCard label="דקות מנוף" value={filteredHistory.reduce((acc, t) => acc + (parseInt(t.craneMinutes) || 0), 0)} color="text-blue-600" />
              <StatCard label="סיכום פקדונות" value={filteredHistory.filter(t => t.depositsManualCount).length} color="text-orange-600" />
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-5 border-b bg-slate-800 text-white font-bold flex justify-between items-center">
                <span className="flex items-center gap-2"><FileText size={18}/> פירוט תעודות והצלבות</span>
                <span className="text-xs opacity-60">לחץ על שורה לשיקוף מלא </span>
              </div>
              <div className="divide-y divide-slate-100">
                {filteredHistory.map((ticket) => (
                  <div key={ticket.id} className="transition-all">
                    <button 
                      onClick={() => setExpandedRow(expandedRow === ticket.id ? null : ticket.id)}
                      className="w-full p-4 flex items-center justify-between hover:bg-slate-50 text-right"
                    >
                      <div className="flex items-center gap-4">
                        <span className="font-black text-blue-900">#{ticket.ticketId}</span>
                        <span className="font-bold text-slate-700">{ticket.customer}</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-left">
                          <span className="block text-[9px] text-slate-400 font-bold">זמן נהג </span>
                          <span className="font-mono text-xs font-bold">{ticket.handwrittenTimes?.start || '--:--'} - {ticket.handwrittenTimes?.end || '--:--'}</span>
                        </div>
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black border ${ticket.validationStatus === 'Match' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                          {ticket.validationStatus === 'Match' ? 'PTO מאומת ' : 'בדיקה נדרשת'}
                        </span>
                        {expandedRow === ticket.id ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                      </div>
                    </button>

                    {expandedRow === ticket.id && (
                      <div className="p-6 bg-slate-50/50 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-top-2">
                        <div className="space-y-4">
                          <h4 className="font-black text-blue-900 flex items-center gap-2 underline text-xs italic"><Clock size={14}/> הצלבת זמנים (נהג vs טכוגרף )</h4>
                          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-center">
                              <div className="p-2 bg-blue-50 rounded-xl border border-blue-100">
                                <span className="block text-[9px] font-black text-blue-600 uppercase">דיווח עט [cite: 45, 98]</span>
                                <span className="font-mono text-sm font-bold italic">{ticket.handwrittenTimes?.start || 'N/A'} - {ticket.handwrittenTimes?.end || 'N/A'}</span>
                              </div>
                              <div className="p-2 bg-orange-50 rounded-xl border border-orange-100">
                                <span className="block text-[9px] font-black text-orange-600 uppercase">זיהוי PTO </span>
                                <span className="font-mono text-sm font-bold italic">{ticket.techographPTO?.open || 'N/A'} - {ticket.techographPTO?.close || 'N/A'}</span>
                              </div>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-relaxed italic border-r-2 border-blue-500 pr-3">
                              <b>ניתוח AI:</b> {ticket.expertNotes || 'לא בוצעה הצלבה אוטומטית.'} 
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-black text-orange-700 flex items-center gap-2 underline text-xs italic"><Package size={14}/> בקרה לוגיסטית ופריטים </h4>
                          <div className="bg-white p-4 rounded-2xl border border-orange-100 shadow-sm space-y-4">
                            <div className="max-h-32 overflow-y-auto space-y-1">
                              {ticket.itemsDetailed?.map((item: any, i: number) => (
                                <div key={i} className="flex justify-between text-[10px] border-b border-slate-50 pb-1">
                                  <span>{item.name} [cite: 37]</span>
                                  <span className="font-bold text-blue-900">{item.qty} {item.unit}</span>
                                </div>
                              ))}
                            </div>
                            <div className="bg-orange-50 p-3 rounded-xl border border-orange-200">
                              <span className="text-[10px] font-black text-orange-800 uppercase block mb-1">סיכום פקדונות[cite: 47, 148]:</span>
                              <p className="text-xs font-bold text-orange-950">{ticket.depositsManualCount || 'אין נתוני פקדון מזוהים.'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {filteredHistory.length === 0 && <div className="p-20 text-center text-slate-400 font-bold italic">אין נתונים לתאריך זה [cite: 2]</div>}
            </div>
          </div>
        )}
      </main>

      {/* Admin Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-blue-950/40 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold flex items-center gap-2"><Database className="text-blue-600"/> הזרקת דוח AI מעובד</h3>
              <button onClick={() => setShowAdminModal(false)} className="hover:rotate-90 transition-transform"><X/></button>
            </div>
            <div className="p-6 space-y-4">
              <textarea 
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="w-full h-64 p-4 font-mono text-xs border rounded-2xl bg-slate-900 text-green-400 outline-none focus:ring-4 focus:ring-blue-100"
                placeholder="[{ 'ticketId': '123'... }]"
              />
              <button 
                onClick={handleJsonImport}
                disabled={!jsonInput}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 disabled:bg-slate-300 transition-all shadow-xl active:scale-95"
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
    <div className="bg-white p-6 rounded-3xl border shadow-sm hover:shadow-md transition-shadow">
      <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest block mb-1">{label}</span>
      <span className={`text-3xl font-black ${color}`}>{value}</span>
    </div>
  );
}
