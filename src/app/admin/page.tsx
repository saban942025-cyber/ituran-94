'use client';
import React, { useState, useRef, useEffect } from 'react';
import { 
  FileUp, LayoutDashboard, FileText, Clock, Loader2, 
  Activity, ShieldCheck, CheckCircle2, AlertTriangle, Search
} from 'lucide-react';
import { processScan } from '../actions/process-scan';

export default function GaliaCyberDashboard() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ה-URL של הסקריפט לתיקיית galya בדרייב
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzTgyqBz-O4WxBs6Ivi-1sk-Ux4REEfdwWK6kBJvkVdM3kxl5FjeP8CfadNHtYOpOE7/exec';

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatus('1. מגבה לדרייב (galya)...');

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = reader.result as string;

      try {
        // שלב א: גיבוי ל-Google Drive
        await fetch(SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify({
            fileName: `GALIA_${Date.now()}_${file.name}`,
            base64Data: base64,
            type: 'admin_upload'
          })
        });

        // שלב ב: ניתוח ג'ימיני (המלשינון)
        setStatus('2. ג\'ימיני מנתח אונליין...');
        const res = await processScan(base64, { lat: 0, lng: 0 }, { source: "GALIA_OFFICE" });

        if (res && res.success) {
          const newData = {
            id: Date.now(),
            invoice: res.data.invoiceNumber || '---',
            client: res.data.customerName || 'לא זוהה',
            time: new Date().toLocaleTimeString('he-IL'),
            type: res.data.type,
            ptoStatus: 'ממתין להצלבה'
          };
          setResults(prev => [newData, ...prev]);
          setStatus('✅ ניתוח הושלם בהצלחה');
        } else {
          setStatus(`❌ שגיאת ניתוח: ${res?.error}`);
        }
      } catch (err) {
        setStatus('❌ תקלה בתקשורת מערכת');
      } finally {
        setIsProcessing(false);
        setTimeout(() => setStatus(''), 5000);
      }
    };
  };

  return (
    <div className="admin-container">
      {/* Navbar */}
      <nav className="nav">
        <div className="nav-left">
          <ShieldCheck className="gold" size={24} />
          <span className="logo gold font-bold">SABAN 94 CYBER</span>
        </div>
        <div className="nav-right">
          <div className="status-indicator">
            <div className="dot animate-pulse"></div>
            <span>מרכז בקרה גליה - מחובר אונליין</span>
          </div>
        </div>
      </nav>

      <div className="layout">
        {/* Sidebar */}
        <aside className="menu">
          <LayoutDashboard className="gold" size={24} />
          <Activity size={24} />
          <FileText size={24} />
          <Clock size={24} />
        </aside>

        {/* Main Content */}
        <main className="main">
          <header className="main-header">
            <div>
              <h1>מרכז שליטה לוגיסטי</h1>
              <p className="text-gray-400">ניהול תעודות ונתוני PTO בזמן אמת</p>
            </div>
            <div className="search-bar">
              <Search size={18} className="text-gray-500" />
              <input type="text" placeholder="חיפוש מהיר בתעודות..." />
            </div>
          </header>

          <div className="grid">
            {/* כרטיס העלאה */}
            <div className="card upload-card">
              <div className="card-header">
                <FileUp className="gold" size={28} />
                <h3>העלאה לניתוח וארכיון</h3>
              </div>
              <div 
                className={`dropzone ${isProcessing ? 'processing' : ''}`} 
                onClick={() => !isProcessing && fileInputRef.current?.click()}
              >
                {isProcessing ? (
                  <div className="loader-area">
                    <Loader2 className="spin gold" size={48} />
                    <p className="gold animate-pulse">{status}</p>
                  </div>
                ) : (
                  <div className="idle-area">
                    <FileUp size={48} className="text-gray-600 mb-4" />
                    <p>גרור קובץ לכאן או לחץ לבחירה</p>
                    <span className="text-xs text-gray-500">תומך ב-PDF ובתמונות (תעודות/דיסקיות)</span>
                  </div>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={onUpload} 
                className="hidden" 
                accept="image/*,application/pdf" 
              />
            </div>

            {/* טבלת נתוני אמת */}
            <div className="card table-card">
              <div className="card-header space-between">
                <h3>נתוני אמת - הצלבה אונליין</h3>
                <button className="sync-btn" onClick={() => alert('ממתין לדוח איתורן (16:00)')}>
                  בצע הצלבת PTO
                </button>
              </div>
              
              <div className="table-wrapper">
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
                    {results.length > 0 ? results.map(r => (
                      <tr key={r.id} className="fade-in">
                        <td className="text-gray-500 text-sm">{r.time}</td>
                        <td className="gold font-mono font-bold">{r.invoice}</td>
                        <td>{r.client}</td>
                        <td>
                          <span className="status-badge">
                            <Activity size={12} className="mr-1" /> {r.ptoStatus}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="empty-state">
                          ממתין לסריקה ראשונה של גליה...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      <style jsx>{`
        .admin-container { background: #070707; color: #fff; min-height: 100vh; direction: rtl; font-family: 'Segoe UI', sans-serif; }
        .nav { height: 64px; background: #111; display: flex; align-items: center; justify-content: space-between; padding: 0 30px; border-bottom: 1px solid #222; }
        .gold { color: #C9A227; }
        .logo { font-size: 1.2rem; letter-spacing: 1px; }
        .status-indicator { display: flex; align-items: center; gap: 10px; font-size: 0.8rem; color: #888; }
        .dot { width: 8px; height: 8px; background: #4ade80; border-radius: 50%; box-shadow: 0 0 12px #4ade80; }
        
        .layout { display: flex; }
        .menu { width: 70px; background: #0a0a0a; display: flex; flex-direction: column; align-items: center; padding: 40px 0; gap: 40px; min-height: calc(100vh - 64px); border-left: 1px solid #1a1a1a; }
        .menu :global(svg) { color: #444; cursor: pointer; transition: 0.3s; }
        .menu :global(svg:hover) { color: #C9A227; }
        .menu :global(svg.active) { color: #C9A227; }

        .main { flex: 1; padding: 40px; max-width: 1400px; margin: 0 auto; }
        .main-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; }
        .search-bar { background: #111; padding: 10px 20px; border-radius: 10px; border: 1px solid #222; display: flex; align-items: center; gap: 12px; width: 300px; }
        .search-bar input { background: transparent; border: none; color: white; outline: none; width: 100%; font-size: 0.9rem; }

        .grid { display: grid; grid-template-columns: 350px 1fr; gap: 30px; }
        .card { background: #111; border-radius: 16px; border: 1px solid #222; padding: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .card-header { display: flex; align-items: center; gap: 15px; margin-bottom: 25px; }
        .card-header.space-between { justify-content: space-between; }
        .card-header h3 { font-size: 1.1rem; font-weight: 600; }

        .dropzone { border: 2px dashed #333; border-radius: 12px; padding: 50px 20px; text-align: center; cursor: pointer; transition: 0.3s; position: relative; }
        .dropzone:hover { border-color: #C9A227; background: #161616; }
        .dropzone.processing { border-color: #C9A227; background: #0f0f0f; cursor: wait; }
        
        .table-wrapper { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: right; color: #555; font-size: 0.8rem; text-transform: uppercase; padding-bottom: 15px; border-bottom: 1px solid #222; }
        td { padding: 20px 0; border-bottom: 1px solid #1a1a1a; font-size: 0.95rem; }
        
        .status-badge { background: #1a1600; color: #C9A227; padding: 6px 12px; border-radius: 8px; font-size: 0.75rem; border: 1px solid #332b00; display: inline-flex; align-items: center; }
        .sync-btn { background: #C9A227; color: #000; border: none; padding: 8px 16px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 0.8rem; transition: 0.3s; }
        .sync-btn:hover { background: #e0b42d; transform: translateY(-2px); }
        
        .empty-state { text-align: center; padding: 60px 0; color: #444; font-style: italic; }
        .spin { animation: spin 2s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .fade-in { animation: fadeIn 0.5s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .hidden { display: none; }
      `}</style>
    </div>
  );
}
