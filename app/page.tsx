'use client';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { ref, onValue } from 'firebase/database';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';

export default function SabanDashboard() {
  const [drivers, setDrivers] = useState<any>(null);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);

  // משיכת נתונים מ-Firebase
  useEffect(() => {
    const driversRef = ref(db, 'team');
    return onValue(driversRef, (snapshot) => {
      if (snapshot.exists()) {
        setDrivers(snapshot.val());
      } else {
        setDrivers({}); // אם אין נתונים, שים אובייקט ריק
      }
    });
  }, []);

  const mapContainerStyle = { width: '100%', height: '450px', borderRadius: '12px' };
  const center = { lat: 32.0853, lng: 34.7818 }; // מרכז הארץ

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen" dir="rtl">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-blue-900 mb-2">ח. סבן - ניהול צי חכם</h1>
        <p className="text-gray-600 text-lg font-semibold">סטטוס צוות בזמן אמת והתראות אחרונות</p>
      </header>

      {/* חלק המפה */}
      <div className="mb-8 bg-white p-2 rounded-2xl shadow-lg border border-gray-200">
        <LoadScript googleMapsApiKey="0592368999282ef7ea7c5ef8bddc23fda18b9bf76856359df062eec32ceccf27" language="he" region="IL">
          <GoogleMap mapContainerStyle={mapContainerStyle} center={center} zoom={9}>
            {drivers && Object.entries(drivers).map(([name, data]: [string, any]) => (
              data.lat && data.lng && (
                <Marker 
                  key={name} 
                  position={{ lat: parseFloat(data.lat), lng: parseFloat(data.lng) }} 
                  onClick={() => setSelectedDriver({ name, ...data })}
                  label={{ text: name, color: 'black', fontWeight: 'bold', className: 'bg-yellow-400 px-1 rounded shadow' }}
                />
              )
            ))}
          </GoogleMap>
        </LoadScript>
      </div>

      {/* טבלת נהגים */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
        <table className="w-full text-right border-collapse">
          <thead className="bg-blue-900 text-white text-lg">
            <tr>
              <th className="p-4 border-b">נהג</th>
              <th className="p-4 border-b">סטטוס</th>
              <th className="p-4 border-b">מיקום אחרון</th>
              <th className="p-4 border-b">זמן עדכון</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {drivers && Object.entries(drivers).length > 0 ? (
              Object.entries(drivers).map(([name, data]: [string, any]) => (
                <tr key={name} className="hover:bg-blue-50 transition-colors">
                  <td className="p-4 font-bold text-gray-800">{name}</td>
                  <td className="p-4 text-blue-700 font-medium">{data.status || 'לא ידוע'}</td>
                  <td className="p-4 text-gray-600">{data.location || 'מחפש GPS...'}</td>
                  <td className="p-4 text-gray-500 text-sm">
                    {data.lastUpdate ? new Date(data.lastUpdate).toLocaleTimeString('he-IL') : '--:--'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="p-10 text-center text-gray-400 italic">
                  מחכה להתראות ראשונות מאיתורן...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
