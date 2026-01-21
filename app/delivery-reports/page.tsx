'use client';
import { useState } from 'react';
import { db } from '../../lib/firebase';
import { ref, push, serverTimestamp } from 'firebase/database';

export default function DeliveryReportsPage() {
  const [jsonInput, setJsonInput] = useState('');
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // פונקציה לעיבוד ה-JSON שהתקבל מהפקודה
  const handleParse = () => {
    try {
      const data = JSON.parse(jsonInput);
      setParsedData(Array.isArray(data) ? data : [data]);
    } catch (e) {
      alert('שגיאה בפורמט ה-JSON. וודא שהעתקת את הפלט מה-AI במדויק.');
    }
  };

  // שמירת התעודות המאושרות ל-Firebase (היסטוריית תעודות)
  const saveToFirebase = async () => {
    setIsSaving(true);
    try {
      const historyRef = ref(db, 'delivery_history');
      for (const ticket of parsedData) {
        await push(historyRef, {
          ...ticket,
          processedAt: serverTimestamp(),
          status: ticket.status || 'Pending'
        });
      }
      alert('התעודות נשמרו בהצלחה במאגר ההיסטורי!');
      setParsedData([]);
      setJsonInput('');
    } catch (e) {
      console.error(e);
      alert('שגיאה בשמירה ל-Firebase');
    }
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8" dir="rtl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-blue-900">קליטת תעודות משלוח AI</h1>
        <p className="text-gray-600">הדבק את פלט ה-JSON מהניתוח כדי לעדכן את המאגר</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* אזור הזנת פקודה */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <label className="block font-bold mb-2">פלט JSON מה-AI:</label>
          <textarea
            className="w-full h-64 p-4 border rounded-xl font-mono text-sm bg-gray-900 text-green-400"
            placeholder='[{"ticketId": "6710318", ...}]'
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
          />
          <button
            onClick={handleParse}
            className="mt-4 w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition"
          >
            נתח נתונים לתצוגה
          </button>
        </div>

        {/* תצוגת אישור לפני שמירה */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <h2 className="text-xl font-bold mb-4">תצוגה מקדימה ואישור</h2>
          {parsedData.length > 0 ? (
            <div className="space-y-4">
              {parsedData.map((ticket, idx) => (
                <div key={idx} className={`p-4 rounded-lg border-2 ${ticket.status === 'Red' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-black text-lg">#{ticket.ticketId}</span>
                      <p className="font-bold">{ticket.customer}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${ticket.status === 'Red' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                      {ticket.status === 'Red' ? 'טעון בדיקה' : 'תקין'}
                    </span>
                  </div>
                  <div className="mt-2 text-sm grid grid-cols-2 gap-2">
                    <p><b>נהג:</b> {ticket.driver}</p>
                    <p><b>זמן מנוף:</b> {ticket.craneMinutes} דק'</p>
                    <p className="col-span-2 text-xs text-gray-500 italic"><b>הערות:</b> {ticket.notes || 'אין'}</p>
                  </div>
                </div>
              ))}
              <button
                onClick={saveToFirebase}
                disabled={isSaving}
                className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 disabled:opacity-50"
              >
                {isSaving ? 'שומר במאגר...' : 'אשר ושמור בהיסטוריה'}
              </button>
            </div>
          ) : (
            <p className="text-gray-400 italic text-center py-20">ממתין לנתונים לניתוח...</p>
          )}
        </div>
      </div>
    </div>
  );
}
