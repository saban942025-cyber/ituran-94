'use client';
import { useState } from 'react';
// תיקון נתיב הייבוא ל-Firebase
import { db } from '@/lib/firebase'; 
import { ref, push, set } from 'firebase/database';
import { Sparkles, Trash2, CheckCircle, FileText, BrainCircuit, X, Database } from 'lucide-react';

export default function SabanBrainAnalyzer() {
  // המפתחות שסיפקת - מוגדרים כקבועים לצורך הניתוח
  const GEMINI_KEYS = [
    "AIzaSyD2PehLHX2olQQavvHo2vjclOq7iSdiagI",
    "AIzaSyAdfGVrmr90Mp9ZhNMItD81iaE8OipKwz0"
  ];
  
  const [rawContent, setRawContent] = useState('');
  const [stagedTickets, setStagedTickets] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const processWithAI = async () => {
    setIsAnalyzing(true);
    try {
      // שימוש במפתח הראשון מהרשימה
      const apiKey = GEMINI_KEYS[0];
      const prompt = `נתח את נתוני תעודות המשלוח והאקסל של ח.סבן. 
      חלץ: מספר תעודה (ticketId), שם לקוח, כתובת מדויקת, מוצרים (שם, כמות, יחידה), וזמני PTO מאיתורן.
      החזר אך ורק מערך JSON נקי במבנה הזה:
      [{"ticketId": string, "customer": string, "date": "YYYY-MM-DD", "address": {"street": string, "city": string}, "itemsDetailed": [{"name": string, "qty": number, "unit": string}], "techographPTO": {"open": "HH:MM", "close": "HH:MM"}}]
      טקסט לניתוח: ${rawContent}`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      const data = await response.json();
      if (data.candidates && data.candidates[0].content.parts[0].text) {
        const aiText = data.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim();
        setStagedTickets(JSON.parse(aiText));
      }
    } catch (e) {
      alert("שגיאה בניתוח: וודא שהטקסט הועתק נכון מהקבצים.");
    }
    setIsAnalyzing(false);
  };

  const commitToSystem = async (index: number) => {
    try {
      const target = stagedTickets[index];
      const newRef = push(ref(db, 'delivery_history'));
      await set(newRef, target);
      setStagedTickets(stagedTickets.filter((_, i) => i !== index));
      alert(`תעודה ${target.ticketId} נשמרה בזיכרון.`);
    } catch (e) {
      alert("שגיאה בשמירה ל-Firebase");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans text-right" dir="rtl">
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-12 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <BrainCircuit size={40} className="text-blue-500" />
          <div>
            <h1 className="text-3xl font-black text-white italic">SABAN AI BRAIN</h1>
            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">מנוע ניתוח תעודות ואיתורן</p>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* קנבס קלט */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2"><FileText size={18}/> הזנת נתונים גולמיים</h2>
          <textarea 
            className="w-full h-[500px] bg-slate-900 border-2 border-slate-800 rounded-[2.5rem] p-6 font-mono text-xs outline-none focus:border-blue-500 shadow-2xl"
            placeholder="הדבק כאן את הטקסט מה-PDF ומהאקסל של איתורן..."
            value={rawContent}
            onChange={(e) => setRawContent(e.target.value)}
          />
          <button 
            onClick={processWithAI}
            disabled={isAnalyzing || !rawContent}
            className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl font-black text-xl shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all"
          >
            {isAnalyzing ? 'המוח מנתח נתונים...' : <><Sparkles size={24}/> הפעל ניתוח AI</>}
          </button>
        </div>

        {/* קנבס אישור */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2 text-green-400"><CheckCircle size={18}/> קנבס עריכה ואישור סופי</h2>
          <div className="space-y-4 h-[580px] overflow-y-auto pr-2 custom-scrollbar">
            {stagedTickets.map((ticket, idx) => (
              <div key={idx} className="bg-slate-900 border border-slate-800 p-6 rounded-[2.5rem] space-y-4 relative border-r-4 border-r-blue-500">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <span className="font-black text-blue-400">{ticket.customer}</span>
                  <span className="text-[10px] font-mono text-slate-500 italic">#{ticket.ticketId}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                  <div className="bg-slate-800 p-2 rounded-xl">📍 {ticket.address?.city}</div>
                  <div className="bg-slate-800 p-2 rounded-xl text-orange-400 text-center">⏱️ {ticket.techographPTO?.open} - {ticket.techographPTO?.close}</div>
                </div>

                <div className="bg-black/20 p-3 rounded-xl space-y-1">
                  {ticket.itemsDetailed?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-[11px] border-b border-slate-800 last:border-0 pb-1 italic">
                      <span>{item.name}</span>
                      <span className="text-blue-500 font-black">{item.qty} {item.unit}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button onClick={() => commitToSystem(idx)} className="flex-1 py-3 bg-green-600/20 text-green-400 border border-green-600/30 rounded-2xl text-xs font-black hover:bg-green-600 hover:text-white transition-all">
                    אשר ושמור לזיכרון המערכת
                  </button>
                  <button onClick={() => setStagedTickets(stagedTickets.filter((_, i) => i !== idx))} className="p-3 text-red-500 hover:bg-red-500/10 rounded-2xl">
                    <Trash2 size={18}/>
                  </button>
                </div>
              </div>
            ))}
            {stagedTickets.length === 0 && (
              <div className="h-full border-2 border-dashed border-slate-800 rounded-[3rem] flex flex-col items-center justify-center text-slate-600 italic">
                <BrainCircuit size={48} className="mb-4 opacity-20"/>
                ממתין לנתונים לניתוח...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
