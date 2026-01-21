'use client';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { ref, onValue } from 'firebase/database';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';

export default function SabanDashboard() {
  const [drivers, setDrivers] = useState<any>({});
  const [selectedDriver, setSelectedDriver] = useState<any>(null);

  useEffect(() => {
    const driversRef = ref(db, 'team');
    return onValue(driversRef, (snapshot) => {
      if (snapshot.exists()) setDrivers(snapshot.val());
    });
  }, []);

  const mapContainerStyle = { width: '100%', height: '500px', borderRadius: '12px' };
  const center = { lat: 32.0853, lng: 34.7818 }; // מרכז הארץ כברירת מחדל

  return (
    <div className="p-6 bg-gray-100 min-h-screen" dir="rtl">
      <h1 className="text-3xl font-bold mb-6 text-blue-900 underline">ח. סבן - ניהול צי רכב (זמן אמת)</h1>
      
      {/* המפה */}
      <div className="mb-8 shadow-xl">
        <LoadScript googleMapsApiKey="0592368999282ef7ea7c5ef8bddc23fda18b9bf76856359df062eec32ceccf27" language="he" region="IL">
          <GoogleMap mapContainerStyle={mapContainerStyle} center={center} zoom={9}>
            {Object.entries(drivers).map(([name, data]: [string, any]) => (
              data.lat && data.lng && (
                <Marker 
                  key={name} 
                  position={{ lat: data.lat, lng: data.lng }} 
                  onClick={() => setSelectedDriver({ name, ...data })}
                  label={{ text: name, color: 'white', className: 'bg-blue-600 p-1 rounded text-xs' }}
                />
              )
            ))}
            
            {selectedDriver && (
              <InfoWindow 
                position={{ lat: selectedDriver.lat, lng: selectedDriver.lng }}
                onCloseClick={() => setSelectedDriver(null)}
              >
                <div className="text-right p-2">
                  <h3 className="font-bold">{selectedDriver.name}</h3>
                  <p>סטטוס: {selectedDriver.status}</p>
                  <p>מהירות: {selectedDriver.speed} קמ"ש</p>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </LoadScript>
      </div>

      {/* הטבלה המוכרת שלך תמשיך כאן למטה... */}
      <div className="bg-white rounded-lg shadow p-4">
          {/* קוד הטבלה הקודם שלך */}
      </div>
    </div>
  );
}
