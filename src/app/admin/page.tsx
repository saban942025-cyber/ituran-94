'use client';
import React, { useState } from 'react';
import { 
  FileUp, MapPin, CheckCircle2, AlertTriangle, 
  Search, LayoutDashboard, FileText, Clock, Menu
} from 'lucide-react';

export default function GaliaCyberDashboard() {
  const [isUploading, setIsUploading] = useState(false);

  const data = [
    { id: '1', invoice: '6710354', client: 'בנייני העיר', status: 'match', time: '12:15' },
    { id: '2', invoice: '6710355', client: 'תשתית דרום', status: 'error', time: '--:--' },
    { id: '3', invoice: '6710356', client: 'א.ב עפר', status: 'match', time: '14:30' },
  ];

  return (
    <div className="dashboard-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-left">
          <Menu size={20} />
          <span className="logo">SABAN <span className="gold">94</span> CYBER</span>
        </div>
        <div className="nav-right">
          <span className="user-name">מנהלת מערכת: גליה</span>
          <div className="status-dot animate-pulse"></div>
        </div>
      </nav>

      <div className="main-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <LayoutDashboard className="active" />
          <FileText />
          <MapPin />
          <Clock />
        </aside>

        {/* Content */}
        <main className="content">
          <header className="content-header">
            <div>
              <h1>מרכז שליטה לוגיסטי</h1>
              <p>הצלבת נתוני איתורן | ח. סבן הייטק</p>
            </div>
            <div className="search-box">
              <Search size={18} />
              <input type="text" placeholder="חיפוש מהיר..." />
            </div>
          </header>

          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <span className="label">תעודות במקומקס</span>
              <span className="value">42</span>
            </div>
            <div className="stat-card">
              <span className="label">נסרקו בשטח</span>
              <span className="value">38</span>
            </div>
            <div className="stat-card border-alert">
              <span className="label text-red">חריגות איתורן</span>
              <span className="value text-red">4</span>
            </div>
            <div className="stat-card border-gold">
              <span className="label text-gold">טכוגרף יומי</span>
              <span className="value">תקין</span>
            </div>
          </div>

          <div className="data-section">
            {/* Table */}
            <div className="table-container">
              <h3>דוח הצלבה 16:00</h3>
              <table>
                <thead>
                  <tr>
                    <th>מספר תעודה</th>
                    <th>לקוח</th>
                    <th>זמן איתורן</th>
                    <th>סטטוס</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(row => (
                    <tr key={row.id}>
                      <td>{row.invoice}</td>
                      <td>{row.client}</td>
                      <td>{row.time}</td>
                      <td>
                        <span className={`badge ${row.status}`}>
                          {row.status === 'match' ? 'תואם' : 'חריגה'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Upload Area */}
            <div className="upload-box">
              <FileUp size={40} className="text-gold" />
              <h4>העלאת מסמכים</h4>
              <p>גרור לכאן דיסקית או דוח מקומקס</p>
              <button onClick={() => setIsUploading(!isUploading)}>
                {isProcessing ? 'מעבד...' : 'בחר קובץ'}
              </button>
            </div>
          </div>
        </main>
      </div>

      <style jsx>{`
        .dashboard-container {
          background: #0a0a0a;
          color: #e0e0e0;
          min-height: 100vh;
          font-family: sans-serif;
          direction: rtl;
        }
        .navbar {
          height: 60px;
          background: #151515;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          border-bottom: 1px solid #333;
        }
        .gold { color: #C9A227; }
        .logo { font-weight: bold; letter-spacing: 1px; }
        .main-layout { display: flex; }
        .sidebar {
          width: 70px;
          background: #111;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 30px 0;
          gap: 30px;
          border-left: 1px solid #333;
        }
        .sidebar :global(svg) { color: #666; cursor: pointer; }
        .sidebar :global(svg.active) { color: #C9A227; }
        .content { flex: 1; padding: 40px; }
        .content-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
        .search-box { background: #1a1a1a; padding: 10px 20px; border-radius: 8px; display: flex; align-items: center; gap: 10px; border: 1px solid #333; }
        .search-box input { background: transparent; border: none; color: white; outline: none; }
        
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; }
        .stat-card { background: #151515; padding: 20px; border-radius: 12px; border-bottom: 3px solid #333; }
        .border-alert { border-bottom-color: #ff4d4d; }
        .border-gold { border-bottom-color: #C9A227; }
        .value { display: block; font-size: 2rem; font-weight: bold; margin-top: 10px; }
        .label { font-size: 0.8rem; color: #888; }
        
        .data-section { display: grid; grid-template-columns: 2fr 1fr; gap: 30px; }
        .table-container { background: #151515; border-radius: 12px; padding: 20px; }
        table { width: 100%; text-align: right; border-collapse: collapse; margin-top: 20px; }
        th { color: #888; padding: 12px; border-bottom: 1px solid #333; }
        td { padding: 15px 12px; border-bottom: 1px solid #222; }
        
        .badge { padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: bold; }
        .match { background: #1b3320; color: #4ade80; }
        .error { background: #421d1d; color: #fb7185; }
        
        .upload-box { background: #151515; border: 2px dashed #333; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; }
        .upload-box button { margin-top: 20px; background: #C9A227; color: black; border: none; padding: 10px 30px; border-radius: 5px; font-weight: bold; cursor: pointer; }
        
        .status-dot { width: 10px; height: 10px; background: #4ade80; border-radius: 50%; margin-right: 10px; box-shadow: 0 0 10px #4ade80; }
        .text-red { color: #fb7185; }
        .text-gold { color: #C9A227; }
      `}</style>
    </div>
  );
}
