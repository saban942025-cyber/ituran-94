'use client';

import React, { useState, useRef } from 'react';
import { 
  FileUp, Mail, Search, Trash2, FileStack, CheckSquare, 
  ExternalLink, Loader2, HardDrive, Printer
} from 'lucide-react';
import { processScan, sendToEmail } from '../actions/process-scan';

export default function GaliaProfessionalAdmin() {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadType, setUploadType] = useState<'invoice' | 'tachograph'>('invoice');

  const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const res = await processScan(reader.result as string, uploadType);
      if (res.success) {
        setRecords(prev => [{ ...res.data, id: res.id, time: new Date().toLocaleTimeString() }, ...prev]);
      }
      setLoading(false);
    };
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const handleSendMail = async () => {
    if (selected.size === 0) return alert("בחר תעודות לשליחה");
    await sendToEmail(Array.from(selected));
    alert("נשלח בהצלחה ל-Office 365");
    setSelected(new Set());
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E0E0E0] p-6 font-sans dir-rtl" dir="rtl">
      {/* Top Bar */}
      <header className="flex justify-between items-center mb-8 border-b border-[#222] pb-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#C9A227] rounded flex items-center justify-center font-bold text-black shadow-[0_0_15px_rgba(201,162,39,0.3)]">
            ח.ס
          </div>
          <h1 className="text-xl font-semibold tracking-tight">ניהול לוגיסטי - גליה</h1>
        </div>
        <div className="flex gap-3">
          <button onClick={handleSendMail} className="btn-secondary"><Mail size={18}/> שלח למייל 365</button>
          <button className="btn-primary" onClick={() => { setUploadType('invoice'); fileInputRef.current?.click(); }}>
            <FileUp size={18}/> העלאת תעודה
          </button>
          <button className="btn-gold" onClick={() => { setUploadType('tachograph'); fileInputRef.current?.click(); }}>
            <Printer size={18}/> סריקת דיסקית
          </button>
        </div>
      </header>

      {/* Search & Stats */}
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-96">
          <Search className="absolute right-3 top-2.5 text-gray-500" size={18} />
          <input type="text" placeholder="חיפוש מהיר ברשימה..." className="search-input" />
        </div>
        <div className="text-sm text-gray-500">נבחרו {selected.size} פריטים</div>
      </div>

      {/* Main Table */}
      <div className="bg-[#111] rounded-lg border border-[#222] overflow-hidden">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-[#181818] text-gray-400 text-xs uppercase border-b border-[#222]">
              <th className="p-4 w-10"><CheckSquare size={16}/></th>
              <th className="p-4">סוג</th>
              <th className="p-4">מספר/נהג</th>
              <th className="p-4">לקוח/פרטים</th>
              <th className="p-4">כתובת/תאריך</th>
              <th className="p-4 text-center">לינק</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className={`border-b border-[#1a1a1a] hover:bg-[#161616] transition-colors ${selected.has(r.id) ? 'bg-[#1a1600]' : ''}`}>
                <td className="p-4 text-center">
                  <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} className="accent-[#C9A227]" />
                </td>
                <td className="p-4">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${r.docType === 'tachograph' ? 'bg-blue-900/30 text-blue-400' : 'bg-green-900/30 text-green-400'}`}>
                    {r.docType === 'tachograph' ? 'דיסקית' : 'תעודה'}
                  </span>
                </td>
                <td className="p-4 font-mono text-[#C9A227]">{r.invoiceNumber || r.driverName}</td>
                <td className="p-4">{r.customerName || `ק"מ: ${r.startKm}-${r.endKm}`}</td>
                <td className="p-4 text-gray-400 text-sm">{r.address || r.date}</td>
                <td className="p-4 text-center">
                  <button className="text-gray-500 hover:text-white"><ExternalLink size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="p-10 text-center"><Loader2 className="animate-spin inline text-[#C9A227]"/></div>}
        {!loading && records.length === 0 && <div className="p-20 text-center text-gray-600 italic">ממתין לסריקה...</div>}
      </div>

      <input type="file" ref={fileInputRef} onChange={onFileSelect} className="hidden" />

      <style jsx>{`
        .btn-primary { background: #333; color: white; padding: 8px 16px; border-radius: 6px; display: flex; align-items: center; gap: 8px; font-weight: 500; font-size: 0.9rem; border: 1px solid #444; }
        .btn-secondary { background: transparent; color: #888; padding: 8px 16px; border-radius: 6px; display: flex; align-items: center; gap: 8px; font-size: 0.9rem; border: 1px solid #222; }
        .btn-gold { background: #C9A227; color: black; padding: 8px 16px; border-radius: 6px; display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 0.9rem; }
        .search-input { background: #111; border: 1px solid #222; padding: 8px 40px 8px 15px; border-radius: 8px; width: 100%; color: white; outline: none; }
        .search-input:focus { border-color: #C9A227; }
      `}</style>
    </div>
  );
}
