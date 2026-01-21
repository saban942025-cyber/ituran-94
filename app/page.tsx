'use client';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { ref, onValue } from 'firebase/database';
import dynamic from 'next/dynamic';
import { Truck, FileText, Map as MapIcon, CheckCircle, AlertCircle, User } from 'lucide-react';

// טעינה דינמית של רכיבי המפה למניעת שגיאות SSR [cite: 9]
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

export default function SabanEliteDashboard() {
  const [drivers, setDrivers] = useState<any>({});
  const [deliveryHistory, setDeliveryHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'fleet' | 'logistics'>('fleet');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    // האזנה לנתוני נהגים בזמן אמת [cite: 9, 13]
    const driversRef = ref(db, 'team');
    const unsubscribeDrivers = onValue(driversRef, (snapshot) => {
      if (snapshot.exists()) {
        setDrivers(snapshot.val());
      }
    });

    // האזנה להיסטוריית תעודות משלוח [cite: 9]
    const historyRef = ref(db, 'delivery_history');
    const unsubscribeHistory = onValue(historyRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const formattedData = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).reverse();
        setDeliveryHistory(formattedData);
      }
    });

    return () => {
      unsubscribeDrivers();
      unsubscribeHistory();
    };
  }, []);

  // יצירת אייקון מפה מותאם אישית [cite: 9]
  const createIcon = () => {
    if (typeof window !== 'undefined') {
      const L = require('leaflet');
      return new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        shadowSize: [41, 41]
      });
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-right" dir="rtl">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      {/* Header - סרגל עליון חכם [cite: 9] */}
      <header className="bg-blue-900 text-white shadow-2xl p-6 sticky top-0 z-[1000]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tighter italic">SABAN AI ELITE</h1>
            <p className="text-blue-300 text-sm font-medium">ניהול צי חכם וניקוי שולחן לוגיסטי</p>
          </div>
          
          <nav className="flex bg-blue-800/50 p-1 rounded-2xl border border-blue-700">
            <button 
              onClick={() => setActiveTab('fleet')}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl transition-all ${activeTab === 'fleet' ? 'bg-blue-600 shadow-lg text-white' : 'text-blue-200 hover:bg-blue-700'}`}
            >
              <Truck size={20} /> ניהול צי
            </button>
            <button 
              onClick={() => setActiveTab('logistics')}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl transition-all ${activeTab === 'logistics' ? 'bg-blue-600 shadow-lg text-white' : 'text-blue-200 hover:bg-blue-700'}`}
            >
              <FileText size={20} /> תעודות משלוח
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'fleet' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
            {/* מפת תנועה חיה [cite: 9] */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-200 h-[600px] relative">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2"><MapIcon /> מפת תנועה בזמן אמת</h2>
                  <span className="flex items-center gap-2 text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    מחובר לאיתורן [cite: 9]
                  </span>
                </div>
                <div className="rounded-2xl overflow-hidden h-[500px] border border-gray-100 z-0">
                  {isClient && (
                    <MapContainer center={[32.0853, 34.7818]} zoom={9} style={{ height: '100%', width: '100%' }}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      {Object.entries(drivers).map(([name, data]: [string, any]) => (
                        data.lat && data.lng && (
                          <Marker key={name} position={[parseFloat(data.lat), parseFloat(data.lng)]} icon={createIcon()}>
                            <Popup>
                              <div className="text-right p-1 font-sans">
                                <p className="font-bold text-blue-900 text-lg border-b mb-1">{name}</p>
                                <p className="text-sm"><b>סטטוס:</b> {data.status || 'בנסיעה'}</p>
                                <p className="text-sm"><b>מיקום:</b> {data.location || 'לא זוהה'}</p>
                              </div>
                            </Popup>
                          </Marker>
                        )
                      ))}
                    </MapContainer>
                  )}
                </div>
              </div>
            </div>

            {/* רשימת נהגים עם פרופילים [cite: 9] */}
            <div className="space-y-4">
              <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[600px]">
                <div className="bg-gray-50 p-5 border-b">
                  <h2 className="text-xl font-bold text-gray-800">סטטוס נהגים</h2>
                </div>
                <div className="overflow-y-auto flex-1">
                  <table className="w-full text-right">
                    <thead className="bg-gray-100 text-gray-600 text-sm sticky top-0 z-10">
                      <tr>
                        <th className="p-4">נהג</th>
                        <th className="p-4 text-center">סטטוס</th>
                        <th className="p-4 text-left">עדכון</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {Object.entries(drivers).map(([name, data]: [string, any]) => (
                        <tr key={name} className="hover:bg-blue-50 transition-all cursor-pointer">
                          <td className="p-4 flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-100 bg-slate-200 flex-shrink-0">
                              {data.profileImage ? (
                                <img src={data.profileImage} alt={name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="flex items-center justify-center h-full text-slate-400"><User size={20}/></div>
                              )}
                            </div>
                            <span className="font-bold text-gray-800">{name}</span>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-black ${data.status === 'מנוע עובד' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                              {data.status || 'בנסיעה'}
                            </span>
                          </td>
                          <td className="p-4 text-left text-gray-400 text-xs tabular-nums">
                            {data.lastUpdate ? new Date(data.lastUpdate).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* תצוגת לוגיסטיקה וניתוח תעודות [cite: 9] */
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-3xl border shadow-sm text-center">
                <span className="text-slate-500 text-sm font-bold block mb-1">תעודות בטיפול</span>
                <span className="text-4xl font-black text-red-600">{deliveryHistory.filter(t => t.status === 'Red').length}</span>
              </div>
              <div className="bg-white p-6 rounded-3xl border shadow-sm text-center">
                <span className="text-slate-500 text-sm font-bold block mb-1">תעודות מאושרות</span>
                <span className="text-4xl font-black text-green-600">{deliveryHistory.filter(t => t.status === 'Green').length}</span>
              </div>
              <div className="bg-white p-6 rounded-3xl border shadow-sm text-center">
                <span className="text-slate-500 text-sm font-bold block mb-1">דקות מנוף יומי</span>
                <span className="text-4xl font-black text-blue-600">{deliveryHistory.reduce((acc, t) => acc + (t.craneMinutes || 0), 0)}</span>
              </div>
              <div className="bg-white p-6 rounded-3xl border shadow-sm text-center">
                <span className="text-slate-500 text-sm font-bold block mb-1">פקדונות שק</span>
                <span className="text-4xl font-black text-orange-600">{deliveryHistory.reduce((acc, t) => acc + (t.deposits?.big_bag || 0), 0)}</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800">היסטוריית תעודות משלוח ואישורים</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead className="bg-slate-800 text-white text-sm">
                    <tr>
                      <th className="p-4">מס' תעודה</th>
                      <th className="p-4">לקוח</th>
                      <th className="p-4">נהג</th>
                      <th className="p-4 text-center">זמן מנוף</th>
                      <th className="p-4 text-center">סטטוס</th>
                      <th className="p-4">הערות</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {deliveryHistory.map((ticket) => (
                      <tr key={ticket.id} className={`hover:bg-slate-50 transition-colors ${ticket.status === 'Red' ? 'bg-red-50/50' : ''}`}>
                        <td className="p-4 font-black text-blue-900">#{ticket.ticketId}</td>
                        <td className="p-4 font-bold">{ticket.customer}</td>
                        <td className="p-4">{ticket.driver}</td>
                        <td className="p-4 text-center font-mono font-bold text-blue-700">{ticket.craneMinutes || 0} דק'</td>
                        <td className="p-4 text-center">
                          <div className={`flex items-center justify-center gap-1 px-3 py-1 rounded-full text-xs font-black ${ticket.status === 'Red' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {ticket.status === 'Red' ? <AlertCircle size={14}/> : <CheckCircle size={14}/>}
                            {ticket.status === 'Red' ? 'דרוש טיפול' : 'תקין'}
                          </div>
                        </td>
                        <td className="p-4 text-gray-500 text-xs italic max-w-xs truncate">{ticket.notes || '---'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {deliveryHistory.length === 0 && (
                  <div className="py-20 text-center text-slate-400 italic">אין נתונים להצגה כרגע...</div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-4 py-8 text-center text-slate-400 text-xs border-t border-gray-200">
        כל הזכויות שמורות לח. סבן חומרי בנין 1994 בע"מ &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
