'use client';
import React, { useState, useRef } from 'react';
import { 
  FileUp, LayoutDashboard, FileText, Clock, Loader2, 
  Activity, ShieldCheck, AlertTriangle, ChevronDown, ChevronUp,
  Package, MessageSquare, CheckCircle
} from 'lucide-react';
import { processScan } from '../actions/process-scan';

export default function GaliaCyberDashboard() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzTgyqBz-O4WxBs6Ivi-1sk-Ux4REEfdwWK6kBJvkVdM3kxl5FjeP8CfadNHtYOpOE7/exec';

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatus('שומר בדרייב ומנתח כתב יד...');

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = reader.result as string;

      try {
        // 1. גיבוי לדרייב
        await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ fileName: `G_${Date.now()}_${file.name}`, base64Data: base64 }) });

        // 2. ניתוח מוצרים וחריגות (המלשינון)
        const res = await processScan(base64, { lat: 0, lng: 0 }, { source: "GALIA_OFFICE" });

        if (res && res.success) {
          const newData = {
            id: Date.now(),
            invoice: res.data.invoiceNumber || '---',
            client: res.data.customerName || 'לא זוהה',
            items: res.data.items || [],
            notes: res.data.handwrittenNotes || '',
            hasError: res.data.hasDiscrepancy || false,
            time: new Date().toLocaleTimeString('he-IL'),
          };
          setResults(prev => [newData, ...prev]);
          setStatus('✅ ניתוח מוצרים הושלם');
        } else {
          setStatus('❌ תקלה בניתוח');
        }
      } catch (err) {
        setStatus('❌ שגיאת מערכת');
      } finally {
        setIsProcessing(false);
        setTimeout(() => setStatus(''), 4000);
      }
    };
  };

  const toggleRow = (id: number) => setExpandedId(expandedId === id ? null : id);

  return (
    <div className="cyber-admin">
      {/* Top Navbar */}
      <nav className="navbar">
        <div className="flex items-center gap-3">
          <ShieldCheck className="gold" size={28} />
          <span className="logo gold font-bold tracking-tighter">SABAN 94 CYBER</span>
        </div>
        <div className="user-profile">
          <div className="dot animate-pulse"></div>
          <span>מנהלת מערכת: גליה</span>
        </div>
      </nav>

      <div className="layout">
        <aside className="sidebar">
          <LayoutDashboard className="active gold" size={24} />
          <Activity size={24} />
          <FileText size={24} />
        </aside>

        <main className="content">
          <div className="dashboard-grid">
            
            {/* Upload Section */}
            <div className="card upload-section">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">סורק תעודות חכם</h3>
                {isProcessing && <Loader2 className="spin gold" />}
              </div>
              
              <div className="dropzone" onClick={() => !isProcessing && fileInputRef.current?.click()}>
                <FileUp size={48} className={isProcessing ? 'gold opacity-50' : 'text-gray-700'} />
                <p className="mt-4">{isProcessing ? status : 'לחץ להעלאת תעודה לניתוח מוצרים'}</p>
              </div>
              <input type="file" ref={fileInputRef} onChange={onUpload} className="hidden" accept="image/*,application/pdf" />
            </div>

            {/* Results Table */}
            <div className="card table-card">
              <h3 className="mb-6 font-bold text-lg border-b border-gray-800 pb-3">מעקב החזרות ומוצרים אונליין</h3>
              
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>זמן</th>
                      <th>תעודה</th>
                      <th>לקוח</th>
                      <th>סטטוס</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map(r => (
                      <React.Fragment key={r.id}>
                        <tr onClick={() => toggleRow(r.id)} className={`cursor-pointer hover:bg-black/40 ${r.hasError ? 'border-r-4 border-red-600' : ''}`}>
                          <td className="text-gray-500 text-xs">{r.time}</td>
                          <td className="gold font-mono">{r.invoice}</td>
                          <td className="font-medium">{r.client}</td>
                          <td>
                            {r.hasError ? 
                              <span className="badge-error"><AlertTriangle size={12}/> חריגה</span> : 
                              <span className="badge-success"><CheckCircle size={12}/> תקין</span>
                            }
                          </td>
                          <td>{expandedId === r.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}</td>
                        </tr>
                        
                        {/* Expanded Detail View */}
                        {expandedId === r.id && (
                          <tr className="bg-white/5">
                            <td colSpan={5} className="p-0">
                              <div className="details-panel fade-in">
                                <div className="detail-section">
                                  <h4 className="flex items-center gap-2 text-sm gold mb-3"><Package size={14}/> פירוט מוצרים וכמויות:</h4>
                                  <div className="items-list">
                                    {r.items.map((item: any, i: number) => (
                                      <div key={i} className={`item-row ${item.returned > 0 ? 'text-red-400' : ''}`}>
                                        <span>{item.name}</span>
                                        <span className="font-mono">כמות: {item.qty} {item.returned > 0 ? `| החזרה: ${item.returned}` : ''}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                {r.notes && (
                                  <div className="detail-section border-t border-gray-800">
                                    <h4 className="flex items-center gap-2 text-sm gold mb-2"><MessageSquare size={14}/> זיהוי כתב יד (הערות):</h4>
                                    <p className="text-sm italic text-gray-300 bg-black/30 p-3 rounded-lg border border-gray-800">{r.notes}</p>
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

          </div>
        </main>
      </div>

      <style jsx>{`
        .cyber-admin { background: #050505; color: #eee; min-height: 100vh; direction: rtl; font-family: system-ui; }
        .navbar { height: 60px; background: #0f0f0f; display: flex; align-items: center; justify-content: space-between; padding: 0 30px; border-bottom: 1px solid #222; }
        .gold { color: #C9A227; }
        .layout { display: flex; }
        .sidebar { width: 70px; background: #080808; display: flex; flex-direction: column; align-items: center; padding: 30px 0; gap: 35px; border-left: 1px solid #1a1a1a; min-height: calc(100vh - 60px); }
        .content { flex: 1; padding: 30px; }
        .dashboard-grid { display: grid; grid-template-columns: 320px 1fr; gap: 25px; align-items: start; }
        .card { background: #0f0f0f; border-radius: 12px; border: 1px solid #222; padding: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .dropzone { border: 2px dashed #333; border-radius: 12px; padding: 40px 15px; text-align: center; cursor: pointer; transition: 0.2s; }
        .dropzone:hover { border-color: #C9A227; background: #151515; }
        
        table { width: 100%; border-collapse: collapse; }
        th { text-align: right; color: #555; font-size: 0.75rem; padding-bottom: 15px; border-bottom: 1px solid #222; }
        td { padding: 18px 10px; border-bottom: 1px solid #151515; font-size: 0.9rem; }
        
        .badge-success { color: #4ade80; background: #062010; padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; display: inline-flex; align-items: center; gap: 5px; }
        .badge-error { color: #f87171; background: #2a0a0a; padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; display: inline-flex; align-items: center; gap: 5px; }
        
        .details-panel { padding: 20px; border-bottom: 2px solid #C9A227; }
        .detail-section { padding: 15px 0; }
        .item-row { display: flex; justify-content: space-between; font-size: 0.85rem; padding: 6px 0; border-bottom: 1px solid #1a1a1a; }
        
        .spin { animation: spin 2s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
        .hidden { display: none; }
      `}</style>
    </div>
  );
}
