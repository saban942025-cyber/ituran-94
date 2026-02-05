'use client';
import React, { useState, useRef } from 'react';
import { FileUp, LayoutDashboard, FileText, Clock, Loader2, Activity, ShieldCheck } from 'lucide-react';
import { processScan } from '../actions/process-scan';

export default function GaliaCyberDashboard() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzTgyqBz-O4WxBs6Ivi-1sk-Ux4REEfdwWK6kBJvkVdM3kxl5FjeP8CfadNHtYOpOE7/exec';

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatus('1. שומר בדרייב...');

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = reader.result as string;

      try {
        // שלב א: שליחה לדרייב (Google Script)
        await fetch(SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify({
            fileName: `GALYA_${Date.now()}_${file.name}`,
            base64Data: base64,
            type: 'admin_upload'
          })
        });

        // שלב ב: ניתוח ג'ימיני
        setStatus('2. ג\'ימיני מנתח נתונים...');
        const res = await processScan(base64, { lat: 0, lng: 0 }, { source: "GALIA_OFFICE" });

        if (res && res.success) {
          setResults(prev => [{
            id: Date.now(),
            invoice: res.data.invoiceNumber || '---',
            client: res.data.customerName || 'לא זוהה',
            time: new Date().toLocaleTimeString('he-IL'),
          }, ...prev]);
          setStatus('✅ הושלם בהצלחה!');
        } else {
          setStatus(`❌ שגיאה: ${res?.error || 'ניתוח נכשל'}`);
        }
      } catch (err) {
        setStatus('❌ תקלה בתקשורת');
      } finally {
        setIsProcessing(false);
        setTimeout(() => setStatus(''), 5000);
      }
    };
  };

  return (
    <div className="admin-container">
      <nav className="nav">
        <div className="flex items-center gap-2">
          <ShieldCheck className="gold" size={24} />
          <span className="logo gold">SABAN 94 CYBER</span>
        </div>
        <div className="status-indicator">
          <div className="dot"></div>
          <span>מערכת בקרה פעילה - גליה</span>
        </div>
      </nav>

      <div className="layout">
        <aside className="menu">
          <LayoutDashboard className="gold" />
          <Activity />
          <FileText />
          <Clock />
        </aside>

        <main className="main">
          <div className="grid">
            <div className="card upload">
              <h3>העלאה לארכיון וניתוח</h3>
              <div className="dropzone" onClick={() => !isProcessing && fileInputRef.current?.click()}>
                {isProcessing ? <Loader2 className="spin gold" size={48} /> : <FileUp size={48} className="gold" />}
                <p className="mt-4">{isProcessing ? status : 'גרור או לחץ להעלאת תעודה/דיסקית'}</p>
              </div>
              <input type="file" ref={fileInputRef} onChange={onUpload} className="hidden" accept="image/*,application/pdf" />
            </div>

            <div className="card table-card">
              <h3>נתוני אמת - הצלבה אונליין</h3>
              <table>
                <thead>
                  <tr>
                    <th>זמן</th>
                    <th>מספר תעודה</th>
                    <th>לקוח</th>
                    <th>סטטוס PTO</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map(r => (
                    <tr key={r.id}>
                      <td>{r.time}</td>
                      <td className="gold font-bold">{r.invoice}</td>
                      <td>{r.client}</td>
                      <td><span className="wait-tag">ממתין להצלבה</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      <style jsx>{`
        .admin-container { background: #0a0a0a; color: #fff; min-height: 100vh; direction: rtl; font-family: sans-serif; }
        .nav { height: 60px; background: #151515; display: flex; align-items: center; justify-content: space-between; padding: 0 25px; border-bottom: 1px solid #333; }
        .gold { color: #C9A227; }
        .status-indicator { display: flex; align-items: center; gap: 10px; font-size: 0.8rem; }
        .dot { width: 8px; height: 8px; background: #4ade80; border-radius: 50%; box-shadow: 0 0 10px #4ade80; }
        .layout { display: flex; }
        .menu { width: 70px; background: #111; display: flex; flex-direction: column; align-items: center; padding: 30px 0; gap: 35px; min-height: calc(100vh - 60px); border-left: 1px solid #333; }
        .main { flex: 1; padding: 40px; }
        .grid { display: grid; grid-template-columns: 1fr 2fr; gap: 30px; }
        .card { background: #151515; padding: 25px; border-radius: 15px; border: 1px solid #333; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
        .dropzone { border: 2px dashed #333; border-radius: 12px; padding: 60px 20px; text-align: center; cursor: pointer; transition: 0.3s; }
        .dropzone:hover { border-color: #C9A227; background: #1a1a1a; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { text-align: right; color: #666; font-size: 0.85rem; padding-bottom: 15px; border-bottom: 1px solid #333; }
        td { padding: 18px 0; border-bottom: 1px solid #222; font-size: 0.95rem; }
        .wait-tag { background: #332b00; color: #C9A227; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; border: 1px solid #443a00; }
        .spin { animation: spin 2s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .hidden { display: none; }
      `}</style>
    </div>
  );
}
