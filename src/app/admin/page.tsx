'use client';
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

        // כיווץ ל-JPEG באיכות 0.7 (חוסך המון נפח ושומר על חדות לכתב יד)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        
        try {
          setStatus('ג\'ימיני מנתח מוצרים...');
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
      <nav className="navbar">
        <ShieldCheck className="gold" />
        <span className="logo gold">SABAN 94 CYBER - GALIA</span>
      </nav>

      <main className="p-8">
        <div className="grid">
          {/* Upload Card */}
          <div className="card">
            <h3>סורק מוצרים וכתב יד</h3>
            <div className={`dropzone ${isProcessing ? 'disabled' : ''}`} onClick={() => !isProcessing && fileInputRef.current?.click()}>
              {isProcessing ? <Loader2 className="spin gold" size={40} /> : <FileUp size={40} />}
              <p>{isProcessing ? status : 'העלה תעודה לניתוח חריגות'}</p>
            </div>
            <input type="file" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && compressAndProcess(e.target.files[0])} className="hidden" accept="image/*,application/pdf" />
          </div>

          {/* Results Table */}
          <div className="card">
            <table className="w-full">
              <thead>
                <tr>
                  <th>זמן</th>
                  <th>תעודה</th>
                  <th>לקוח</th>
                  <th>סטטוס</th>
                </tr>
              </thead>
              <tbody>
                {results.map(r => (
                  <React.Fragment key={r.id}>
                    <tr className="row-hover" onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
                      <td>{r.time}</td>
                      <td className="gold">{r.invoiceNumber}</td>
                      <td>{r.customerName}</td>
                      <td>
                        {r.hasDiscrepancy ? <span className="tag-red">חריגה</span> : <span className="tag-green">תקין</span>}
                      </td>
                    </tr>
                    {expandedId === r.id && (
                      <tr className="bg-details">
                        <td colSpan={4} className="p-4">
                          <div className="flex flex-col gap-4">
                            <div>
                              <h4 className="flex items-center gap-2 gold text-sm"><Package size={14}/> פריטים שנמצאו:</h4>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {r.items?.map((it: any, i: number) => (
                                  <div key={i} className="pill">
                                    {it.name} ({it.qty}) {it.returned > 0 && <span className="text-red-500">חזר: {it.returned}</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                            {r.handwrittenNotes && (
                              <div className="border-t border-gray-800 pt-2">
                                <h4 className="flex items-center gap-2 gold text-sm"><MessageSquare size={14}/> הערות בכתב יד:</h4>
                                <p className="text-gray-400 italic mt-1 text-sm">{r.handwrittenNotes}</p>
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
        .admin-wrapper { background: #050505; color: #fff; min-height: 100vh; direction: rtl; }
        .navbar { background: #111; padding: 15px 30px; border-bottom: 1px solid #222; display: flex; align-items: center; gap: 10px; }
        .gold { color: #C9A227; }
        .card { background: #111; border-radius: 12px; padding: 20px; border: 1px solid #222; }
        .grid { display: grid; grid-template-columns: 300px 1fr; gap: 20px; }
        .dropzone { border: 2px dashed #333; padding: 40px; text-align: center; cursor: pointer; border-radius: 10px; }
        .tag-red { color: #ff4d4d; background: #300; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; }
        .tag-green { color: #4ade80; background: #030; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; }
        .row-hover { cursor: pointer; transition: 0.2s; }
        .row-hover:hover { background: #1a1a1a; }
        .bg-details { background: #0a0a0a; }
        .pill { background: #222; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; border: 1px solid #333; }
        .spin { animation: spin 2s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .hidden { display: none; }
      `}</style>
    </div>
  );
}
