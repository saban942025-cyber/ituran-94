'use client';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { ref, onValue, push, serverTimestamp } from 'firebase/database';
import dynamic from 'next/dynamic';
import { LucideIcon, Map as MapIcon, Truck, FileText, AlertTriangle, CheckCircle } from 'lucide-react';

// טעינה דינמית למניעת שגיאות שרת (SSR)
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

export default function SmartSabanDashboard() {
  const [drivers, setDrivers] = useState<any>({});
  const [history, setHistory] = useState<any[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState('fleet'); // 'fleet' or 'logistics'

  useEffect(() => {
    setIsClient(true);
    
    // מעקב אחר נהגים בזמן אמת 
    const driversRef = ref(db, 'team');
    onValue(driversRef, (snapshot) => {
      if (snapshot.exists()) setDrivers(snapshot.val());
    });

    // מעקב אחר היסטוריית תעודות (Logistics)
    const historyRef = ref(db, 'delivery_history');
    onValue(historyRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setHistory(Object.values(data).reverse());
      }
    });
  }, []);

  const createIcon = () => {
    if (typeof window !== 'undefined') {
      const L = require('leaflet');
      return new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-right" dir="rtl">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      {/* Header חכם  */}
      <header className="bg-blue-900 text-white shadow-xl p-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter">SABAN AI ELITE</h1>
            <p className="text-blue-300 text-sm">ניהול צי רכב ותעודות משלוח חכם</p>
          </div>
          
          <nav className="flex bg-blue-800 rounded-xl p-1 gap-1">
            <button 
              onClick={() => setActiveTab('fleet')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg transition ${activeTab === 'fleet' ? 'bg-blue-600 shadow-md' : 'hover:bg-blue-700'}`}
            >
              <Truck size={18} /> ניהול צי
            </button>
            <button 
              onClick={() => setActiveTab('logistics')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg transition ${activeTab === 'logistics' ? 'bg-blue-600 shadow-md' : 'hover:bg-blue-700'}`}
            >
              <FileText size={18} /> תעודות משלוח
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'fleet' ? (
          /* תצוגת ניהול צי (המפה הקיימת משודרגת)  */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border p-4 overflow-hidden" style={{ height: '650px' }}>
              <div className="flex justify-between items-center mb-4 px-2">
                <h2 className="text-xl font-bold flex items-center gap-2 text-blue-900"><MapIcon /> מפת תנועה חיה</h2>
                <div className="flex gap-4">
                   <span className="flex items-center gap-1 text-xs text-green-600 font-bold"><CheckCircle size={14}/> מערכת אונליין</span>
                </div>
              </div>
              {isClient && (
                <MapContainer center={[32.0853, 34.7818]} zoom={9} className="h-full w-full rounded-2xl border">
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {Object.entries(drivers).map(([name, data]: [string, any]) => (
                    data.lat && data.lng && (
                      <Marker key={name} position={[parseFloat(data.lat), parseFloat(data.lng)]} icon={createIcon()}>
                        <Popup>
                          <div className="text-right">
                            <h3 className="font-bold text-blue-900 border-b pb-1 mb-2">{name}</h3>
                            <p className="text-sm"><b>סטטוס:</b> {data.status}</p>
                            <p className="text-sm"><b>מיקום:</b> {data.location}</p>
                          </div>
                        </Popup>
                      </Marker>
                    )
                  ))}
                </MapContainer>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden max-h-[650px] flex flex-col">
                <div className="p-5 border-b bg-slate-50">
                  <h2 className="font-bold text-lg text-slate-800">סטטוס נהגים נוכחי</h2>
                </div>
                <div className="overflow-y-auto">
                  {Object.entries(drivers).map(([name, data]: [string, any]) => (
                    <div key={name} className="p-4 border-b hover:bg-slate-50 flex items-center justify-between transition">
                      <div>
                        <p className="font-bold text-slate-900">{name}</p>
                        <p className="text-xs text-slate-500">{data.location || 'בנסיעה...'}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${data.status === 'מנוע עובד' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {data.status || 'בתנועה'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* תצוגת לוגיסטיקה חכמה (ניתוח תעודות ו"ניקוי שולחן") */
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-2xl border shadow-sm text-center">
                <span className="text-slate-500 text-sm block">תעודות בבדיקה</span>
                <span className="text-3xl font-black text-red-600">{history.filter(t => t.status === 'Red').length}</span>
              </div>
              <div className="bg-white p-6 rounded-2xl border shadow-sm text-center">
                <span className="text-slate-500 text-sm block">תעודות מאושרות</span>
                <span className="text-3xl font-black text-green-600">{history.filter(t => t.status === 'Green').length}</span>
              </div>
              <div className="bg-white p-6 rounded-2xl border shadow-sm text-center">
                 <span className="text-slate-500 text-sm block">זמן מנוף יומי (דק')</span>
                 <span className="text-3xl font-black text-blue-600">{history.reduce((acc, t) => acc + (t.craneMinutes || 0), 0)}</span>
              </div>
              <div className="bg-white p-6 rounded-2xl border shadow-sm text-center">
                 <span className="text-slate-500 text-sm block">סה"כ פקדונות שק</span>
                 <span className="text-3xl font-black text-orange-600">{history.reduce((acc, t) => acc + (t.deposits?.big_bag || 0), 0)}</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
              <table className="w-full text-right border-collapse">
                <thead className="bg-slate-800 text-white">
                  <tr>
                    <th className="p-4">מס' תעודה</th>
                    <th className="p-4">לקוח</th>
                    <th className="p-4">נהג</th>
                    <th className="p-4">זמן מנוף</th>
                    <th className="p-4">סטטוס</th>
                    <th className="p-4 text-center">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((ticket, idx) => (
                    <tr key={idx} className={`hover:bg-slate-50 transition ${ticket.status === 'Red' ? 'bg-red-50/30' : ''}`}>
                      <td className="p-4 font-mono font-bold">#{ticket.ticketId}</td>
                      <td className="p-4 font-bold text-slate-800">{ticket.customer}</td>
                      <td className="p-4 text-slate-600">{ticket.driver}</td>
                      <td className="p-4 text-blue-700 font-medium">{ticket.craneMinutes || 0} דק'</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${ticket.status === 'Red' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {ticket.status === 'Red' ? 'דרוש טיפול' : 'תקין'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button className="text-blue-600 hover:text-blue-900 font-bold text-sm underline">צפה ב-PDF</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {history.length === 0 && <div className="p-20 text-center text-slate-400 italic">לא נמצאה היסטוריית תעודות...</div>}
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-4 py-8 text-center text-slate-400 text-xs border-t">
        מערכת SABAN AI v2.0 | כל הזכויות שמורות לח. סבן חומרי בנין 1994 בע"מ © {new Date().getFullYear()} 
      </footer>
    </div>
  );
}
