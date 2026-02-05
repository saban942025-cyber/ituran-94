'use client';
import React, { useState, useRef } from 'react';
import { 
  FileUp, MapPin, CheckCircle2, AlertTriangle, 
  Search, LayoutDashboard, FileText, Clock, Loader2, Activity
} from 'lucide-react';
import { processScan } from '../actions/process-scan';

export default function GaliaCyberDashboard() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [liveResults, setLiveResults] = useState<any[]>([]); // נתוני אמת מג'ימיני
  const fileInputRef = useRef<HTMLInputElement>(null);

  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzTgyqBz-O4WxBs6Ivi-1sk-Ux4REEfdwWK6kBJvkVdM3kxl5FjeP8CfadNHtYOpOE7/exec';

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setUploadStatus('1. שומר בדרייב...');

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Data = reader.result as string;

      try {
        // שלב א: שמירה בדרייב (ארכיון)
        await fetch(SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify({
            fileName: `GALIA_${Date.now()}_${file.name}`,
            base64Data: base64Data,
            folderName: 'galya'
          }),
        });

        // שלב ב: ניתוח אונליין ע"י ג'ימיני
        setUploadStatus('2. ג\'ימיני מנתח נתונים...');
        const res = await processScan(base64Data, { lat: 0, lng: 0 }, { source: "GALIA_ADMIN" });

        if (res && res.success) {
          setLiveResults(prev => [{
            id: Date.now(),
            invoice: res.data.invoiceNumber,
            client: res.data.customerName || 'לקוח לא זוהה',
            status: 'ממתין לאיתורן',
            pto: 'בבדיקה...', // יתמלא בהצלבת איתורן
            time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
          }, ...prev]);
          setUploadStatus('✅ הושלם בהצלחה');
        } else {
          setUploadStatus('❌ ג\'ימיני לא זיהה את התעודה');
        }
      } catch (error) {
        setUploadStatus('❌ תקלה בתהליך');
      } finally {
        setIsProcessing(false);
        setTimeout(() => setUploadStatus(''), 5000);
      }
    };
  };

  return (
    <div className="dashboard-container">
      {/* Navbar ועיצוב כללי - זהה לקוד הקודם */}
      <nav className="navbar">
        <div className="nav-left"><span className="logo">SABAN <span className="gold">94</span> CYBER</span></div>
        <div className="nav-right"><span className="user-name">מרכז בקרה גליה</span><div className="status-dot"></div></div>
      </nav>

      <div className="main-layout">
        <aside className="sidebar">
          <LayoutDashboard className="active" size={24} />
          <Activity size={24} />
          <Clock size={24} />
        </aside>

        <main className="content">
          <header className="content-header">
            <div>
              <h1>ניהול תעודות וניתוח אונליין</h1>
              <p className="gold">ניתוח ג'ימיני פעיל + הכנה לנתוני PTO מאיתורן</p>
            </div>
          </header>

          <div className="data-section">
            {/* וידג'ט העלאה */}
            <div className="upload-box">
              <h3>העלאה מהירה לארכיון</h3>
              <div className="drop-zone" onClick={() => !isProcessing && fileInputRef.current?.click()}>
                {isProcessing ? <Loader2 className="animate-spin gold" size={40} /> : <FileUp size={40} className="gold" />}
                <p>{isProcessing ? uploadStatus : 'גרור תעודה או לחץ כאן'}</p>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,application/pdf" />
            </div>

            {/* טבלת ניתוח חיה */}
            <div className="table-container">
              <div className="table-header">
                <h3>מעקב יומי וסטטוס PTO</h3>
                <button className="sync-btn">בצע הצלבת איתורן (16:00)</button>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>זמן</th>
                    <th>מספר תעודה</th>
                    <th>לקוח</th>
                    <th>סטטוס הצלבה</th>
                    <th>PTO (עבודת מנוף/מערבל)</th>
                  </tr>
                </thead>
                <tbody>
                  {liveResults.map(row => (
                    <tr key={row.id}>
                      <td>{row.time}</td>
                      <td className="font-bold">{row.invoice}</td>
                      <td>{row.client}</td>
                      <td><span className="wait-badge">{row.status}</span></td>
                      <td className="pto-cell"><Activity size={14} /> {row.pto}</td>
                    </tr>
                  ))}
                  {liveResults.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-10 text-gray-600">אין תעודות מנותחות להיום. העלי תעודה ראשונה.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      <style jsx>{`
        .dashboard-container { background: #0a0a0a; color: #e0e0e0; min-height: 100vh; direction: rtl; font-family: sans-serif; }
        .navbar { height: 60px; background: #151515; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; border-bottom: 1px solid #333; }
        .gold { color: #C9A227; }
        .main-layout { display: flex; }
        .sidebar { width: 70px; background: #111; display: flex; flex-direction: column; align-items: center; padding: 30px 0; gap: 30px; border-left: 1px solid #333; min-height: calc(100vh - 60px); }
        .content { flex: 1; padding: 40px; }
        .data-section { display: grid; grid-template-columns: 0.8fr 2fr; gap: 30px; }
        .upload-box { background: #151515; padding: 25px; border-radius: 12px; border: 1px solid #333; height: fit-content; }
        .drop-zone { border: 2px dashed #333; border-radius: 12px; padding: 30px; text-align: center; cursor: pointer; margin-top: 15px; }
        .table-container { background: #151515; border-radius: 12px; padding: 25px; border: 1px solid #333; }
        .table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .sync-btn { background: #C9A227; color: black; border: none; padding: 8px 15px; border-radius: 5px; font-weight: bold; cursor: pointer; font-size: 0.8rem; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: right; color: #666; padding-bottom: 15px; border-bottom: 1px solid #333; font-size: 0.85rem; }
        td { padding: 15px 0; border-bottom: 1px solid #222; font-size: 0.9rem; }
        .wait-badge { background: #332b00; color: #ffcc00; padding: 3px 10px; border-radius: 12px; font-size: 0.75rem; }
        .pto-cell { color: #888; display: flex; align-items: center; gap: 5px; }
        .hidden { display: none; }
        .status-dot { width: 10px; height: 10px; background: #4ade80; border-radius: 50%; box-shadow: 0 0 10px #4ade80; }
      `}</style>
    </div>
  );
}
