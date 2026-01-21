'use client';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { ref, onValue } from 'firebase/database';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

export default function SabanDashboard() {
  const [drivers, setDrivers] = useState<any>(null);

  // טעינת המפה בצורה בטוחה
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyC_HYvh7IupneJt_nKuSWd3qKInl36KZ-M",
    language: "he",
    region: "IL"
  });

  useEffect(() => {
    const driversRef = ref(db, 'team');
    return onValue(driversRef, (snapshot) => {
      setDrivers(snapshot.exists() ? snapshot.val() : {});
    });
  }, []);

  const center = { lat: 32.0853, lng: 34.7818 };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen" dir="rtl">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-blue-900 mb-2">ח. סבן - ניהול צי חכם</h1>
        <p className="text-gray-600 text-lg font-semibold">סטטוס צוות בזמן אמת</p>
      </header>

      {/* חלק המפה - מוגן מפני שגיאות */}
      <div className="mb-8 bg-white p-2 rounded-2xl shadow-lg border border-gray-200" style={{ minHeight: '450px' }}>
        {loadError && <div className="p-10 text-center text-red-500 text-xl font-bold">שגיאה בטעינת המפה: וודא שה-API Key תקין</div>}
        {!isLoaded && !loadError && <div className="p-10 text-center text-blue-600 animate-pulse text-xl">טוען מפת ישראל...</div>}
        
        {isLoaded && (
          <GoogleMap 
            mapContainerStyle={{ width: '100%', height: '450px', borderRadius: '12px' }} 
            center={center} 
            zoom={9}
          >
            {drivers && Object.entries(drivers).map(([name, data]: [string, any]) => (
              data.lat && data.lng && (
                <Marker 
                  key={name} 
                  position={{ lat: parseFloat(data.lat), lng: parseFloat(data.lng) }} 
                  label={{ text: name, color: 'black', fontWeight: 'bold', className: 'bg-yellow-400 px-1 rounded shadow' }}
                />
              )
            ))}
          </GoogleMap>
        )}
      </div>

      {/* טבלת נהגים - תמיד תופיע! */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
        <table className="w-full text-right border-collapse">
          <thead className="bg-blue-900 text-white text-lg">
            <tr>
              <th className="p-4">נהג</th>
              <th className="p-4">סטטוס</th>
              <th className="p-4">מיקום</th>
              <th className="p-4">זמן</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {drivers && Object.keys(drivers).length > 0 ? (
              Object.entries(drivers).map(([name, data]: [string, any]) => (
                <tr key={name} className="hover:bg-blue-50">
                  <td className="p-4 font-bold text-gray-800">{name}</td>
                  <td className="p-4 text-blue-700 font-medium">{data.status || '---'}</td>
                  <td className="p-4 text-gray-600 text-sm">{data.location || 'GPS מחפש...'}</td>
                  <td className="p-4 text-gray-500 text-sm">
                    {data.lastUpdate ? new Date(data.lastUpdate).toLocaleTimeString('he-IL') : '--:--'}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={4} className="p-10 text-center text-gray-400">מחכה לנתונים מאיתורן...</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
