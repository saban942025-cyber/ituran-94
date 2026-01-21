'use client';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { ref, onValue } from 'firebase/database';
// ייבוא המפה החינמית
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// תיקון לאייקונים של Leaflet ב-Next.js
const customIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function SabanDashboard() {
  const [drivers, setDrivers] = useState<any>({});

  useEffect(() => {
    const driversRef = ref(db, 'team');
    return onValue(driversRef, (snapshot) => {
      setDrivers(snapshot.exists() ? snapshot.val() : {});
    });
  }, []);

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen" dir="rtl">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-blue-900 mb-2">ח. סבן - ניהול צי חכם</h1>
        <p className="text-gray-600 text-lg font-semibold italic">מערכת בקרה לוגיסטית - מפה חופשית</p>
      </header>

      {/* חלק המפה - Leaflet */}
      <div className="mb-8 bg-white p-2 rounded-2xl shadow-lg border border-gray-200" style={{ height: '500px', zIndex: 1 }}>
        <MapContainer center={[32.0853, 34.7818]} zoom={9} style={{ height: '100%', width: '100%', borderRadius: '12px' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {Object.entries(drivers).map(([name, data]: [string, any]) => (
            data.lat && data.lng && (
              <Marker key={name} position={[parseFloat(data.lat), parseFloat(data.lng)]} icon={customIcon}>
                <Popup>
                  <div className="text-right font-sans">
                    <strong className="text-blue-900">{name}</strong><br />
                    סטטוס: {data.status}<br />
                    עדכון: {data.lastUpdate ? new Date(data.lastUpdate).toLocaleTimeString('he-IL') : '---'}
                  </div>
                </Popup>
              </Marker>
            )
          ))}
        </MapContainer>
      </div>

      {/* טבלת הנהגים המוכרת */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
        <table className="w-full text-right border-collapse">
          <thead className="bg-blue-900 text-white">
            <tr>
              <th className="p-4">נהג</th>
              <th className="p-4">סטטוס</th>
              <th className="p-4">מיקום אחרון</th>
              <th className="p-4">זמן עדכון</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {Object.entries(drivers).length > 0 ? (
              Object.entries(drivers).map(([name, data]: [string, any]) => (
                <tr key={name} className="hover:bg-blue-50 transition-colors">
                  <td className="p-4 font-bold text-gray-800">{name}</td>
                  <td className="p-4 text-blue-700 font-medium">{data.status || 'בתנועה'}</td>
                  <td className="p-4 text-gray-600 text-sm">{data.location || 'מחפש GPS...'}</td>
                  <td className="p-4 text-gray-500 text-sm">
                    {data.lastUpdate ? new Date(data.lastUpdate).toLocaleTimeString('he-IL') : '--:--'}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={4} className="p-10 text-center text-gray-400">מחכה לנתונים מאיתורן (נקה קאש אם המפה לא עולה)</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
