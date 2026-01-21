'use client';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { ref, onValue } from 'firebase/database';
import dynamic from 'next/dynamic';

// טעינה דינמית של רכיבי המפה - חובה ל-Next.js
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

  // יצירת אייקון רק בדפדפן
  const createIcon = () => {
    if (typeof window !== 'undefined') {
      const L = require('leaflet');
      return new L.Icon({
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });
    }
    return null;
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen" dir="rtl">
      {/* הזרקת ה-CSS של המפה ישירות מה-CDN כדי למנוע 404 */}
      <link 
        rel="stylesheet" 
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" 
      />

      <header className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-blue-900 mb-2">ח. סבן - ניהול צי חכם</h1>
        <p className="text-gray-600 text-lg font-semibold italic">מערכת בקרה לוגיסטית - מפה חיה</p>
      </header>

      <div className="mb-8 bg-white p-2 rounded-2xl shadow-lg border border-gray-200" style={{ height: '500px', position: 'relative', zIndex: 1 }}>
        {isClient ? (
          <MapContainer center={[32.0853, 34.7818]} zoom={9} style={{ height: '100%', width: '100%', borderRadius: '12px' }}>
            <TileLayer 
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            {Object.entries(drivers).map(([name, data]: [string, any]) => (
              data.lat && data.lng && (
                <Marker key={name} position={[parseFloat(data.lat), parseFloat(data.lng)]} icon={createIcon()}>
                  <Popup>
                    <div className="text-right">
                      <strong className="text-blue-900">{name}</strong><br />
                      סטטוס: {data.status || 'בתנועה'}
                    </div>
                  </Popup>
                </Marker>
              )
            ))}
          </MapContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-blue-600 animate-pulse">
            טוען מפת לוגיסטיקה...
          </div>
        )}
      </div>

      {/* טבלת נהגים */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
        <table className="w-full text-right border-collapse">
          <thead className="bg-blue-900 text-white font-bold">
            <tr>
              <th className="p-4 border-b">נהג</th>
              <th className="p-4 border-b">סטטוס</th>
              <th className="p-4 border-b">זמן עדכון</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {Object.entries(drivers).length > 0 ? (
              Object.entries(drivers).map(([name, data]: [string, any]) => (
                <tr key={name} className="hover:bg-blue-50 transition-colors">
                  <td className="p-4 font-bold text-gray-800">{name}</td>
                  <td className="p-4 text-blue-700 font-medium">{data.status || 'בטיפול'}</td>
                  <td className="p-4 text-gray-500 text-sm">
                    {data.lastUpdate ? new Date(data.lastUpdate).toLocaleTimeString('he-IL') : '--:--'}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={3} className="p-10 text-center text-gray-400">מחכה להתראות ראשונות...</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
