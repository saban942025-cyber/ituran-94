'use client';
import React, { useState } from 'react';
import { 
  FileUp, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  Search,
  LayoutDashboard,
  FileText,
  Clock
} from 'lucide-react';

export default function GaliaDashboard() {
  const [isUploading, setIsUploading] = useState(false);

  // נתונים לדוגמה מהצלבת 16:00
  const crossCheckData = [
    { id: '1', invoice: '6710354', client: 'בנייני העיר', status: 'match', ituran: '12:15', driver: 'חכמת' },
    { id: '2', invoice: '6710355', client: 'תשתית דרום', status: 'mismatch', ituran: 'לא זוהה', driver: 'חכמת' },
    { id: '3', invoice: '6710356', client: 'א.ב עפר', status: 'match', ituran: '14:30', driver: 'חכמת' },
  ];

  return (
    <div className="min-h-screen bg-[#F3F2F1] text-[#323130] font-sans">
      {/* סרגל עליון - סגנון Microsoft 365 */}
      <header className="h-12 bg-[#0078D4] text-white flex items-center justify-between px-4 shadow-md">
        <div className="flex items-center gap-4">
          <LayoutDashboard size={20} />
          <span className="font-semibold text-sm">ח. סבן הייטק - ניהול לוגיסטי</span>
        </div>
        <div className="flex items-center gap-3 border-l border-white/20 pl-3">
          <span className="text-xs italic">שלום, גליה</span>
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-xs">ג</div>
        </div>
      </header>

      <div className="flex">
        {/* תפריט צד דק */}
        <aside className="w-16 min-h-[calc(100vh-48px)] bg-white border-r border-[#EDEBE9] flex flex-col items-center py-6 gap-8">
          <FileText className="text-[#0078D4] cursor-pointer" />
          <MapPin className="text-[#605E5C] hover:text-[#0078D4] cursor-pointer" />
          <Clock className="text-[#605E5C] hover:text-[#0078D4] cursor-pointer" />
        </aside>

        {/* תוכן מרכזי */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            
            {/* כותרת וחיפוש */}
            <div className="flex justify-between items-end mb-8">
              <div>
                <h1 className="text-2xl font-bold text-[#201F1E]">לוח בקרה יומי - גליה</h1>
                <p className="text-[#605E5C] text-sm">ניהול תעודות והצלבת נתוני איתורן</p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-[#605E5C]" size={16} />
                <input 
                  type="text" 
                  placeholder="חפש תעודה או לקוח..."
                  className="pl-10 pr-4 py-2 bg-white border border-[#D2D0CE] rounded-sm focus:outline-none focus:border-[#0078D4] w-64 text-sm"
                />
              </div>
            </div>

            {/* כרטיסי סיכום (Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'תעודות במקומקס', val: '42', icon: <FileText />, color: 'blue' },
                { label: 'נסרקו בשטח', val: '38', icon: <CheckCircle2 />, color: 'green' },
                { label: 'חריגות איתורן', val: '4', icon: <AlertTriangle />, color: 'red' },
                { label: 'טכוגרף תקין', val: 'V', icon: <Clock />, color: 'purple' },
              ].map((card, i) => (
                <div key={i} className="bg-white p-4 rounded-sm border-b-2 border-[#EDEBE9] shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#605E5C] uppercase font-semibold">{card.label}</p>
                    <p className="text-2xl font-bold">{card.val}</p>
                  </div>
                  <div className={`text-[#0078D4]`}>{card.icon}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* טבלת הצלבה - תופסת 2/3 מסך */}
              <div className="lg:col-span-2 bg-white rounded-sm shadow-sm border border-[#EDEBE9]">
                <div className="p-4 border-b border-[#EDEBE9] bg-[#F8F8F8] font-bold text-sm">
                  דוח הצלבה 16:00 - איתורן מול תעודות
                </div>
                <table className="w-full text-right text-sm">
                  <thead>
                    <tr className="bg-[#FAF9F8] border-b border-[#EDEBE9]">
                      <th className="p-3">מספר תעודה</th>
                      <th className="p-3">לקוח</th>
                      <th className="p-3">זמן איתורן</th>
                      <th className="p-3">סטטוס הצלבה</th>
                    </tr>
                  </thead>
                  <tbody>
                    {crossCheckData.map((row) => (
                      <tr key={row.id} className="border-b border-[#F3F2F1] hover:bg-[#F3F9FF]">
                        <td className="p-3 font-medium">{row.invoice}</td>
                        <td className="p-3">{row.client}</td>
                        <td className="p-3 text-[#605E5C]">{row.ituran}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                            row.status === 'match' ? 'bg-[#DFF6DD] text-[#107C10]' : 'bg-[#FDE7E9] text-[#A4262C]'
                          }`}>
                            {row.status === 'match' ? 'תואם' : 'חוסר התאמה'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* אזור העלאת קבצים לגליה */}
              <div className="bg-white rounded-sm shadow-sm border border-[#EDEBE9] p-6 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-[#F3F2F1] rounded-full flex items-center justify-center mb-4">
                  <FileUp className="text-[#0078D4]" size={32} />
                </div>
                <h3 className="font-bold mb-2">העלאת דוח מקומקס / דיסקית</h3>
                <p className="text-xs text-[#605E5C] mb-6">גרור קבצים לכאן או לחץ לבחירה (PDF, JPG)</p>
                <button 
                  onClick={() => setIsUploading(true)}
                  className="w-full py-2 bg-[#0078D4] text-white rounded-sm font-semibold hover:bg-[#005A9E] transition-colors"
                >
                  בחר קבצים
                </button>
                {isUploading && (
                  <div className="mt-4 w-full bg-[#F3F2F1] h-1 rounded-full overflow-hidden">
                    <div className="bg-[#107C10] h-full w-2/3 animate-pulse"></div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
