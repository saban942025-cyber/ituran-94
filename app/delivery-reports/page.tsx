'use client';
import { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { Truck, Calendar, Activity, Clock } from 'lucide-react';

export default function DailyReport() {
  const [selectedDate, setSelectedDate] = useState('2026-01-29');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // משיכת הנתונים לפי התאריך שנבחר
    const reportRef = ref(database, `daily_analysis/${selectedDate}`);
    get(reportRef).then((snapshot) => {
      if (snapshot.exists()) setData(snapshot.val());
    });
  }, [selectedDate]);

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 pb-20 font-sans">
      {/* Header עם תפריט המבורגר */}
      <nav className="bg-black text-white p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="text-xl font-black italic">SABAN LOGISTICS</div>
        <button className="p-2">☰</button>
      </nav>

      <div className="p-6">
        <h1 className="text-3xl font-black text-gray-900 mb-2">סיכום יומי</h1>
        
        {/* בחירת תאריך */}
        <div className="flex items-center gap-2 bg-white p-3 rounded-2xl shadow-sm mb-8">
          <Calendar className="text-blue-600" size={20} />
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="font-bold outline-none w-full"
          />
        </div>

        {/* השוואת נהגים */}
        <div className="space-y-6">
          {/* כרטיס חכמת - מרצדס */}
          <div className="bg-white rounded-[30px] p-6 shadow-sm border-r-8 border-blue-600">
            <div className="flex justify-between items-center mb-4">
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-black">משאית מנוף</span>
              <Truck size={24} className="text-blue-600" />
            </div>
            <h2 className="text-xl font-black">חכמת - מרצדס</h2>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-gray-50 p-3 rounded-2xl text-center">
                <p className="text-xs text-gray-500">זמן מנוף (PTO)</p>
                <p className="text-lg font-black text-blue-600">{data?.mercedes?.pto || 0} דק'</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-2xl text-center">
                <p className="text-xs text-gray-500">ק"מ יומי</p>
                <p className="text-lg font-black">{data?.mercedes?.km || 0}</p>
              </div>
            </div>
          </div>

          {/* כרטיס עלי - איסוזו */}
          <div className="bg-white rounded-[30px] p-6 shadow-sm border-r-8 border-orange-500">
            <div className="flex justify-between items-center mb-4">
              <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-black">פריקה ידנית</span>
              <Activity size={24} className="text-orange-600" />
            </div>
            <h2 className="text-xl font-black">עלי - איסוזו</h2>
            <div className="grid grid-cols-2 gap-4 mt-4 text-center">
               <div className="bg-gray-50 p-3 rounded-2xl">
                <p className="text-xs text-gray-500">ק"מ יומי</p>
                <p className="text-lg font-black text-orange-600">{data?.isuzu?.km || 0}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-2xl text-center text-gray-400">
                <p className="text-xs">ללא מנוף</p>
                <p className="text-lg font-black">פלטה</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
