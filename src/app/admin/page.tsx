'use client';
import React, { useState, useRef } from 'react';
import { 
  FileUp, ShieldCheck, Loader2, ExternalLink, 
  FileText, Database, Share2, CheckCircle2, Search, Info
} from 'lucide-react';
import { processScan } from '../actions/process-scan';

export default function Saban94AdminBridge() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // פונקציית העלאה ועיבוד
  const handleBridgeProcess = async (file: File) => {
    setIsProcessing(true);
    setStatus('מבצע גיבוי וסנכרון ארגוני...');

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      
      try {
        // שליחה לניתוח (חילוץ 3 שדות ליבה)
        const res = await processScan(base64, { lat: 0, lng: 0 }, { source: "ADMIN_BRIDGE" });
        
        if (res?.success) {
          const newData = {
            ...res.data,
            id: Date.now(),
            time: new Date().toLocaleTimeString('he-IL'),
            // לינקים דינמיים לתיקיות הארגוניות (לפי הגדרת ה-Sync שלך)
            driveLink: "https://drive.google.com/drive/u/0/folders/galya-archive", 
            officeLink: "https://onedrive.live.com/?id=saban94-org-365"
          };
          setResults(prev => [newData, ...prev]);
          setStatus('✅ הנתונים סונכרנו בהצלחה');
        }
      } catch (e) {
        setStatus('❌ תקלה בתהליך הגשר');
      } finally {
        setIsProcessing(false);
        setTimeout(() => setStatus(''), 4000);
      }
    };
  };

  return (
    <div className="bridge-container">
      {/* Header יוקרתי עם לוגו ח. סבן */}
      <nav className="top-nav">
        <div className="nav-content">
          <div className="logo-area">
            <div className="diamond-finish">
              <ShieldCheck className="saban-gold" size={32} />
            </div>
            <div className="brand-text">
              <h1 className="brand-name">ח. סבן 94</h1>
              <span className="brand-sub">לוגיסטיקה וסחר בע"מ</span>
            </div>
          </div>
          <div className="bridge-status">
            <div className="status-dot"></div>
            <span>גשר נתונים פעיל: ארכיון ↔ אתר ארגוני</span>
          </div>
        </div>
      </nav>

      <main className="main-content">
        <div className="dashboard-layout">
          
          {/* אזור השליחה - הגשר */}
          <section className="bridge-actions">
            <div className="card hero-card">
              <div className="card-body">
                <Database className="saban-gold mb-4" size={40} />
                <h2>ארכיון וסנכרון</h2>
                <p>העלה תעודה לחילוץ נתונים אוטומטי ושליחה לתיקיות 365 וגוגל דרייב</p>
                
                <div 
                  className={`upload-zone ${isProcessing ? 'loading' : ''}`}
                  onClick={() => !isProcessing && fileInputRef.current?.click()}
                >
                  {isProcessing ? (
                    <div className="loader">
                      <Loader2 className="animate-spin saban-gold" size={32} />
                      <p className="mt-3 font-medium">{status}</p>
                    </div>
                  ) : (
                    <div className="idle">
                      <FileUp size={32} className="text-gray-400" />
                      <p>לחץ לבחירת תעודה לסריקה</p>
                    </div>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={(e) => e.target.files?.[0] && handleBridgeProcess(e.target.files[0])}
                  className="hidden" 
                />
              </div>
            </div>
          </section>

          {/* רשימת נתונים שחולצו */}
          <section className="bridge-results">
            <div className="card table-card">
              <div className="table-header">
                <h3>נתונים שחולצו מהארכיון</h3>
                <div className="search-box">
                  <Search size={16} />
                  <input type="text" placeholder="חיפוש מהיר..." />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="bridge-table">
                  <thead>
                    <tr>
                      <th>תאריך חילוץ</th>
                      <th>מספר תעודה</th>
                      <th>שם לקוח</th>
                      <th>לינקים למסמך</th>
                      <th>סטטוס</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.length > 0 ? results.map(r => (
                      <tr key={r.id} className="fade-in">
                        <td><span className="text-gray-500">{r.invoiceDate || r.time}</span></td>
                        <td className="font-bold text-blue-900">{r.invoiceNumber}</td>
                        <td className="font-medium">{r.customerName}</td>
                        <td>
                          <div className="link-group">
                            <a href={r.driveLink} target="_blank" className="link-icon google" title="פתח בגוגל דרייב">
                              <FileText size={16} />
                            </a>
                            <a href={r.officeLink} target="_blank" className="link-icon office" title="פתח ב-OneDrive 365">
                              <Share2 size={16} />
                            </a>
                          </div>
                        </td>
                        <td>
                          <span className="success-badge">
                            <CheckCircle2 size={14} /> סונכרן
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="empty-state text-center py-12 text-gray-400 italic">
                          ממתין להעלאת מסמך ראשון לגשר...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

        </div>
      </main>

      <style jsx>{`
        .bridge-container { background: #f4f7f9; min-height: 100vh; direction: rtl; font-family: 'Inter', system-ui, sans-serif; color: #333; }
        .top-nav { background: #fff; padding: 15px 40px; border-bottom: 2px solid #e2e8f0; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
        .nav-content { max-width: 1400px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; }
        
        /* לוגו ח. סבן עם פיניש יהלום */
        .logo-area { display: flex; align-items: center; gap: 15px; }
        .diamond-finish { background: linear-gradient(135deg, #fff 0%, #f1f5f9 100%); padding: 8px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); }
        .saban-gold { color: #b8860b; }
        .brand-name { font-size: 1.4rem; font-weight: 800; color: #1e293b; line-height: 1; }
        .brand-sub { font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }

        .status-dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; box-shadow: 0 0 8px #10b981; }
        .bridge-status { display: flex; align-items: center; gap: 10px; font-size: 0.85rem; font-weight: 500; color: #475569; }

        .main-content { max-width: 1400px; margin: 40px auto; padding: 0 20px; }
        .dashboard-layout { display: grid; grid-template-columns: 350px 1fr; gap: 30px; }
        
        .card { background: #fff; border-radius: 20px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 30px; }
        .hero-card { text-align: center; background: linear-gradient(to bottom, #fff, #f8fafc); }
        .hero-card h2 { font-size: 1.25rem; font-weight: 700; margin-bottom: 10px; }
        .hero-card p { font-size: 0.9rem; color: #64748b; line-height: 1.5; margin-bottom: 25px; }

        .upload-zone { border: 2px dashed #cbd5e1; border-radius: 15px; padding: 40px 20px; cursor: pointer; transition: all 0.3s ease; }
        .upload-zone:hover { border-color: #b8860b; background: #fffbeb; }
        .upload-zone.loading { background: #f8fafc; border-color: #e2e8f0; cursor: wait; }

        .table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
        .table-header h3 { font-size: 1.1rem; font-weight: 700; color: #1e293b; }
        .search-box { display: flex; align-items: center; gap: 10px; background: #f1f5f9; padding: 8px 15px; border-radius: 10px; width: 250px; }
        .search-box input { background: transparent; border: none; outline: none; font-size: 0.85rem; width: 100%; }

        .bridge-table { width: 100%; border-collapse: collapse; }
        .bridge-table th { text-align: right; font-size: 0.8rem; color: #64748b; font-weight: 600; padding: 15px 10px; border-bottom: 2px solid #f1f5f9; }
        .bridge-table td { padding: 20px 10px; border-bottom: 1px solid #f1f5f9; font-size: 0.95rem; }

        .link-group { display: flex; gap: 8px; }
        .link-icon { padding: 8px; border-radius: 8px; color: #fff; transition: transform 0.2s; }
        .link-icon:hover { transform: scale(1.1); }
        .link-icon.google { background: #4285F4; }
        .link-icon.office { background: #0078d4; }

        .success-badge { background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; display: inline-flex; align-items: center; gap: 5px; }
        
        .fade-in { animation: fadeIn 0.5s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .hidden { display: none; }
      `}</style>
    </div>
  );
}
