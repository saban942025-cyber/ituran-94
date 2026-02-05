'use client';
import React, { useState, useRef } from 'react';
import { 
  FileUp, MapPin, CheckCircle2, AlertTriangle, 
  Search, LayoutDashboard, FileText, Clock, Menu, Loader2
} from 'lucide-react';

export default function GaliaCyberDashboard() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadType, setUploadType] = useState<'invoice' | 'disk'>('invoice');

  // חיבור לסקריפט הדרייב שנתת
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzTgyqBz-O4WxBs6Ivi-1sk-Ux4REEfdwWK6kBJvkVdM3kxl5FjeP8CfadNHtYOpOE7/exec';

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setUploadStatus('מעלה לתיקיית GALYA...');

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Data = reader.result as string;

      try {
        const response = await fetch(SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors', // נדרש בעבודה מול Google Apps Script מ-Browser
          body: JSON.stringify({
            fileName: `${uploadType === 'disk' ? 'DISK' : 'INV'}_${file.name}`,
            base64Data: base64Data,
            type: uploadType,
            folderName: 'galya'
          }),
        });

        // בגלל no-cors לא ניתן לקרוא את התשובה ישירות, אז נניח הצלחה אם לא נזרקה שגיאה
        setUploadStatus('✅ הקובץ נשלח בהצלחה לדרייב!');
        setTimeout(() => setUploadStatus(''), 3000);
      } catch (error) {
        setUploadStatus('❌ תקלה בהעלאה');
        console.error(error);
      } finally {
        setIsProcessing(false);
      }
    };
  };

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="nav-left">
          <span className="logo">SABAN <span className="gold">94</span> CYBER</span>
        </div>
        <div className="nav-right">
          <span className="user-name font-bold">מערכת ניהול - גליה</span>
          <div className="status-dot"></div>
        </div>
      </nav>

      <div className="main-layout">
        <aside className="sidebar">
          <LayoutDashboard className="active" size={24} />
          <FileText size={24} />
          <Clock size={24} />
        </aside>

        <main className="content">
          <header className="content-header">
            <div>
              <h1>מרכז בקרה ותפעול</h1>
              <p className="gold">תיקייה פעילה: Google Drive / galya</p>
            </div>
          </header>

          <div className="data-section">
            {/* ניהול העלאות */}
            <div className="upload-box">
              <div className="upload-header">
                <FileUp size={40} className="gold" />
                <h3>העלאת מסמכי אמת</h3>
              </div>

              <div className="type-selector">
                <button 
                  onClick={() => setUploadType('invoice')}
                  className={uploadType === 'invoice' ? 'active' : ''}
                >תעודת משלוח</button>
                <button 
                  onClick={() => setUploadType('disk')}
                  className={uploadType === 'disk' ? 'active' : ''}
                >דיסקית טכוגרף</button>
              </div>

              <div className="drop-zone" onClick={() => fileInputRef.current?.click()}>
                {isProcessing ? (
                  <Loader2 className="animate-spin gold" size={40} />
                ) : (
                  <p>לחץ כאן להעלאת {uploadType === 'disk' ? 'דיסקית' : 'תעודה'}</p>
                )}
                <span className="status-text">{uploadStatus}</span>
              </div>

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                accept="image/*,application/pdf"
              />
            </div>

            {/* טבלת מעקב מהירה */}
            <div className="table-container">
              <h3>סטטוס יומי - הצלבת איתורן</h3>
              <table>
                <thead>
                  <tr>
                    <th>מספר תעודה</th>
                    <th>לקוח</th>
                    <th>איתורן</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>6710354</td>
                    <td>בנייני העיר</td>
                    <td><span className="match">תואם 12:15</span></td>
                  </tr>
                }
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
        .data-section { display: grid; grid-template-columns: 1fr 1.5fr; gap: 30px; }
        
        .upload-box { background: #151515; padding: 30px; border-radius: 12px; border: 1px solid #333; }
        .type-selector { display: flex; gap: 10px; margin: 20px 0; }
        .type-selector button { flex: 1; padding: 10px; border: 1px solid #333; background: #222; color: #888; border-radius: 8px; cursor: pointer; transition: 0.3s; }
        .type-selector button.active { background: #C9A227; color: black; font-weight: bold; border-color: #C9A227; }
        
        .drop-zone { border: 2px dashed #333; border-radius: 12px; padding: 40px; text-align: center; cursor: pointer; transition: 0.3s; }
        .drop-zone:hover { border-color: #C9A227; background: #1a1a1a; }
        .status-text { display: block; margin-top: 15px; font-size: 0.9rem; color: #4ade80; }
        
        .table-container { background: #151515; border-radius: 12px; padding: 25px; border: 1px solid #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { text-align: right; color: #666; padding-bottom: 15px; border-bottom: 1px solid #333; }
        td { padding: 15px 0; border-bottom: 1px solid #222; }
        .match { color: #4ade80; font-size: 0.85rem; }
        .status-dot { width: 10px; height: 10px; background: #4ade80; border-radius: 50%; box-shadow: 0 0 10px #4ade80; }
        .hidden { display: none; }
      `}</style>
    </div>
  );
}
