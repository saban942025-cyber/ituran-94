'use client'; // חייב להיות Client Component כי יש לנו useState ו-Canvas
import React, { useState, useRef } from 'react';
import { 
  FileUp, ShieldCheck, Loader2, AlertTriangle, 
  CheckCircle, ChevronDown, ChevronUp, Package, MessageSquare 
} from 'lucide-react';
import { processScan } from '../actions/process-scan';

export default function GaliaAdminPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressAndProcess = async (file: File) => {
    setIsProcessing(true);
    setStatus('מכווץ תמונה...');

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = async () => {
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
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        
        try {
          setStatus('ג\'ימיני מנתח מוצרים...');
          // כאן אנחנו קוראים ל-Server Action מהקובץ הנפרד
          const res = await processScan(compressedBase64, { lat: 0, lng: 0 }, { source: "GALIA" });
          
          if (res?.success) {
            setResults(prev => [{ ...res.data, id: Date.now(), time: new Date().toLocaleTimeString('he-IL') }, ...prev]);
            setStatus('✅ הושלם');
          } else {
            setStatus('❌ שגיאה בניתוח');
          }
        } catch (e) {
          setStatus('❌ שגיאת תקשורת');
        } finally {
          setIsProcessing(false);
          setTimeout(() => setStatus(''), 3000);
        }
      };
    };
  };

  return (
    <div className="admin-wrapper">
      <nav className="navbar px-6 py-4 border-b border-gray-800 flex items-center gap-2">
        <ShieldCheck className="gold" />
        <span className="logo gold font-bold">SABAN 94 CYBER - GALIA</span>
      </nav>

      <main className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
          <div className="card bg-[#111] p-6 rounded-xl border border-gray-800">
            <h3 className="mb-4 font-bold">סורק מוצרים וכתב יד</h3>
            <div className={`dropzone border-2 border-dashed border-gray-700 p-8 text-center rounded-lg cursor-pointer hover:border-yellow-600 transition-colors ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`} onClick={() => fileInputRef.current?.click()}>
              {isProcessing ? <Loader2 className="spin gold mx-auto" size={40} /> : <FileUp className="mx-auto mb-2 text-gray-500" size={40} />}
              <p className="text-sm text-gray-400">{isProcessing ? status : 'העלה תעודה לניתוח חריגות'}</p>
            </div>
            <input type="file" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && compressAndProcess(e.target.files[0])} className="hidden" accept="image/*,application/pdf" />
          </div>

          <div className="card bg-[#111] p-6 rounded-xl border border-gray-800">
            <table className="w-full text-right">
              <thead>
                <tr className="text-gray-500 text-xs uppercase border-b border-gray-800">
                  <th className="pb-3">זמן</th>
                  <th className="pb-3">תעודה</th>
                  <th className="pb-3 text-right">לקוח</th>
                  <th className="pb-3">סטטוס</th>
                </tr>
              </thead>
              <tbody>
                {results.map(r => (
                  <React.Fragment key={r.id}>
                    <tr className="border-b border-gray-900 hover:bg-white/5 cursor-pointer transition-colors" onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
                      <td className="py-4 text-gray-500 text-sm">{r.time}</td>
                      <td className="py-4 gold font-mono">{r.invoiceNumber}</td>
                      <td className="py-4">{r.customerName}</td>
                      <td className="py-4">
                        {r.hasDiscrepancy ? <span className="bg-red-900/30 text-red-500 px-2 py-1 rounded text-xs">חריגה</span> : <span className="bg-green-900/30 text-green-500 px-2 py-1 rounded text-xs">תקין</span>}
                      </td>
                    </tr>
                    {expandedId === r.id && (
                      <tr className="bg-black/40">
                        <td colSpan={4} className="p-4 border-b border-yellow-900/20">
                          <div className="flex flex-col gap-4">
                            <div>
                              <h4 className="flex items-center gap-2 gold text-sm mb-2"><Package size={14}/> פריטים שנמצאו:</h4>
                              <div className="flex flex-wrap gap-2">
                                {r.items?.map((it: any, i: number) => (
                                  <div key={i} className="bg-gray-800 px-3 py-1 rounded-full text-xs border border-gray-700">
                                    {it.name} ({it.qty}) {it.returned > 0 && <span className="text-red-400 mr-1">- {it.returned}</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                            {r.handwrittenNotes && (
                              <div className="border-t border-gray-800 pt-3">
                                <h4 className="flex items-center gap-2 gold text-sm mb-1"><MessageSquare size={14}/> הערות בכתב יד:</h4>
                                <p className="text-gray-400 italic text-sm">{r.handwrittenNotes}</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <style jsx>{`
        .gold { color: #C9A227; }
        .spin { animation: spin 2s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
