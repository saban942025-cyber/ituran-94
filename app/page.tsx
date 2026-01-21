'use client';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { ref, onValue } from 'firebase/database';
import dynamic from 'next/dynamic';

// טעינה דינמית למניעת שגיאות שרת
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

export default function SabanDashboard() {
  const [drivers, setDrivers] = useState<any>({});
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const driversRef = ref(db, 'team');
    return onValue(driversRef, (snapshot) => {
      if (snapshot.exists()) {
        setDrivers(snapshot.val());
      }
    });
  }, []);

  const createIcon = () => {
    if (typeof window !== 'undefined') {
      const L = require('leaflet');
      return new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans" dir="rtl">
      {/* ייבוא עיצוב המפה */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      {/* סרגל עליון (Header) */}
      <header className="bg-blue-900 text-white shadow-lg p-6 mb-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black tracking-tight">ח. סבן - מרכז שליטה לוגיסטי</h1>
            <p className="text-blue-200 mt-1 font-medium">ניהול צי רכב חכם בזמן אמת</p>
          </div>
          <div className="bg-blue-800 px-4 py-2 rounded-lg border border-blue-700">
            <span className="text-sm block text-blue-300">סטטוס מערכת</span>
            <span className="flex items-center gap-2 font-bold">
              <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
              מחובר לאיתורן
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* המפה - תופסת 2/3 מהרוחב במסכים גדולים */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">מפת תנועה חיה</h2>
                <span className="text-sm text-gray-500">עודכן לאחרונה: {new Date().toLocaleTimeString('he-IL')}</span>
              </div>
              <div className="rounded-xl overflow-hidden border border-gray-100" style={{ height: '550px', zIndex: 1 }}>
                {isClient && (
                  <MapContainer center={[32.0853, 34.7818]} zoom={9} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {Object.entries(drivers).map(([name, data]: [string, any]) => (
                      data.lat && data.lng && (
                        <Marker key={name} position={[parseFloat(data.lat), parseFloat(data.lng)]} icon={createIcon()}>
                          <Popup>
                            <div className="text-right font-sans p-1">
                              <p className="font-bold text-blue-900 text-lg border-b mb-1">{name}</p>
                              <p className="text-sm"><b>סטטוס:</b> {data.status || 'בתנועה'}</p>
                              <p className="text-sm"><b>מיקום:</b> {data.location || 'לא זוהה'}</p>
                              <p className="text-xs text-gray-400 mt-2 italic">עדכון: {data.lastUpdate ? new Date(data.lastUpdate).toLocaleTimeString('he-IL') : '---'}</p>
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

          {/* טבלת הסטטוסים - תופסת 1/3 מהרוחב */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 p-4 border-b">
                <h2 className="text-xl font-bold text-gray-800">סטטוס נהגים</h2>
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: '550px' }}>
                <table className="w-full text-right">
                  <thead className="bg-gray-100 text-gray-600 text-sm sticky top-0">
                    <tr>
                      <th className="p-3">נהג</th>
                      <th className="p-3 text-center">סטטוס</th>
                      <th className="p-3 text-left">זמן</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {Object.entries(drivers).length > 0 ? (
                      Object.entries(drivers).map(([name, data]: [string, any]) => (
                        <tr key={name} className="hover:bg-blue-50 transition-colors cursor-pointer">
                          <td className="p-3 font-bold text-gray-800">{name}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${data.status === 'מנוע עובד' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                              {data.status || 'בנסיעה'}
                            </span>
                          </td>
                          <td className="p-3 text-left text-gray-400 text-xs">
                            {data.lastUpdate ? new Date(data.lastUpdate).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="p-10 text-center text-gray-400 italic">ממתין להתראות ראשונות...</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* כרטיס סיכום מהיר */}
            <div className="bg-blue-900 rounded-2xl p-6 text-white shadow-xl">
              <h3 className="font-bold text-lg mb-4 border-b border-blue-800 pb-2">סיכום צי יומי</h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-blue-800 rounded-xl p-3">
                  <span className="text-2xl font-black block">{Object.keys(drivers).length}</span>
                  <span className="text-xs text-blue-300 italic">משאיות פעילות</span>
                </div>
                <div className="bg-blue-800 rounded-xl p-3">
                  <span className="text-2xl font-black block">100%</span>
                  <span className="text-xs text-blue-300 italic">זמינות מערכת</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
      
      {/* פוטר */}
      <footer className="text-center py-6 text-gray-400 text-sm">
        כל הזכויות שמורות לח. סבן חומרי בנין 1994 בע"מ &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
