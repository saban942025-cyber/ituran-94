'use client'; // התיקון שמונע את שגיאת ה-Build

import React, { useState, useRef } from 'react';
import { 
  FileUp, ShieldCheck, Loader2, FileText, 
  Share2, CheckCircle2, ExternalLink, Database 
} from 'lucide-react';
import { processScan } from '../actions/process-scan';

export default function SabanBridgeAdmin() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcess = async (file: File) => {
    setIsProcessing(true);
    setStatus('מכווץ ומסנכרן לארכיון...');

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = async () => {
        // כיווץ תמונה לפני שליחה לשרת
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1600;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);

        try {
          const res = await processScan(compressedBase64, {}, { source: "ADMIN_GATEWAY" });
          if (res?.success) {
            setResults(prev => [{
              ...res.data,
              id: Date.now(),
              time: new Date().toLocaleTimeString('he-IL'),
              driveLink: "https://drive.google.com/drive/u/0/folders/galya-archive",
              officeLink: "https://onedrive.live.com/saban94-365"
            }, ...prev]);
            setStatus('✅ סונכרן בהצלחה');
          }
        } catch (err) {
          setStatus('❌ תקלה בסנכרון');
        } finally {
          setIsProcessing(false);
          setTimeout(() => setStatus(''), 3000);
        }
      };
    };
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800" dir="rtl">
      {/* Header יוקרתי */}
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-gradient-to-br from-[#B8860B] to-[#DAA520] rounded-xl shadow-lg border border-white/20">
            <ShieldCheck className="text-white" size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">ח. סבן 94</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">גשר נתונים ארגוני: ארכיון ↔ 365</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm font-semibold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          OneDrive & Drive Active
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-10 grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-10">
        {/* צד ימין - שליחה */}
        <section className="space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 text-center">
            <Database className="mx-auto mb-4 text-[#B8860B]" size={48} />
            <h2 className="text-xl font-bold mb-2">סנכרון תעודה</h2>
            <p className="text-sm text-slate-400 mb-8 leading-relaxed text-center">העלה מסמך לחילוץ נתוני ליבה ושמירה אוטומטית בענן הארגוני</p>
            
            <div 
              className={`group border-2 border-dashed rounded-2xl p-10 transition-all cursor-pointer ${isProcessing ? 'bg-slate-50 border-slate-200' : 'border-slate-200 hover:border-[#B8860B] hover:bg-amber-50/30'}`}
              onClick={() => !isProcessing && fileInputRef.current?.click()}
            >
              {isProcessing ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="animate-spin text-[#B8860B]" size={40} />
                  <span className="font-bold text-slate-600">{status}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <FileUp className="text-slate-300 group-hover:text-[#B8860B] transition-colors" size={48} />
                  <span className="text-sm font-semibold text-slate-500">בחר קובץ לסריקה</span>
                </div>
              )}
            </div>
            <input type="file" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleProcess(e.target.files[0])} className="hidden" accept="image/*,application/pdf" />
          </div>
        </section>

        {/* צד שמאל - רשימת נתונים חכמה */}
        <section className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-700">תעודות שסונכרנו לאחרונה</h3>
            <span className="text-xs font-bold text-slate-400 uppercase">סה"כ: {results.length} רשומות</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="text-[11px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-50">
                  <th className="px-8 py-5">מידע בסיסי</th>
                  <th className="px-8 py-5">תאריך תעודה</th>
                  <th className="px-8 py-5">גישה לארכיון</th>
                  <th className="px-8 py-5">סטטוס סנכרון</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {results.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="font-bold text-slate-900 text-lg">#{r.invoiceNumber}</div>
                      <div className="text-sm text-slate-500 font-medium">{r.customerName}</div>
                    </td>
                    <td className="px-8 py-6 text-sm font-mono text-slate-400">{r.invoiceDate || r.time}</td>
                    <td className="px-8 py-6">
                      <div className="flex gap-3">
                        <a href={r.driveLink} target="_blank" className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                          <FileText size={18}/>
                        </a>
                        <a href={r.officeLink} target="_blank" className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                          <Share2 size={18}/>
                        </a>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                        <CheckCircle2 size={14}/> CLOUD SYNCED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {results.length === 0 && (
              <div className="py-32 text-center">
                <div className="inline-block p-4 bg-slate-50 rounded-full mb-4">
                   <ExternalLink size={32} className="text-slate-200" />
                </div>
                <p className="text-slate-400 text-sm italic font-medium">המערכת ממתינה לפעולת סנכרון ראשונה...</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
