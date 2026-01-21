'use client';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { ref, onValue } from 'firebase/database';
import dynamic from 'next/dynamic';

// טעינה דינמית של המפה כדי למנוע שגיאת "window is not defined"
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

export default function SabanDashboard() {
  const [drivers, setDrivers] = useState<any>({});
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // מוודא שאנחנו בדפדפן
    const driversRef = ref(db, 'team');
    return onValue(driversRef, (snapshot) => {
      setDrivers(snapshot.exists() ? snapshot.val() : {});
    });
  }, []);

  // אייקון מותאם ל-Leaflet
  const getIcon = () => {
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
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-blue-900 mb-2">ח. סבן - ניהול צי חכם</h1>
        <p className="text-gray-600 text-lg font-semibold italic">מערכת בקרה לוגיסטית - מפה חיה</p>
      </header>

      <div className="mb-8 bg-white p-2 rounded-2xl shadow-lg border border-gray-200" style={{ height: '500px' }}>
        {isClient && (
          <MapContainer center={[32.0853, 34.7818]} zoom={9} style={{ height: '100%', width: '100%', borderRadius: '12px' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {Object.entries(drivers).map(([name, data]: [string, any]) => (
              data.lat && data.lng && (
                <Marker key={name} position={[parseFloat(data.lat), parseFloat(data.lng)]} icon={getIcon()}>
                  <Popup>
                    <div className="text-right"><strong>{name}</strong><br />סטטוס: {data.status}</div>
                  </Popup>
                </Marker>
              )
            ))}
          </MapContainer>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
        <table className="w-full text-right">
          <thead className="bg-blue-900 text-white">
            <tr>
              <th className="p-4">נהג</th>
              <th className="p-4">סטטוס</th>
              <th className="p-4">זמן עדכון</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(drivers).map(([name, data]: [string, any]) => (
              <tr key={name} className="border-b">
                <td className="p-4 font-bold">{name}</td>
                <td className="p-4">{data.status}</td>
                <td className="p-4">{data.lastUpdate ? new Date(data.lastUpdate).toLocaleTimeString('he-IL') : '--:--'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
