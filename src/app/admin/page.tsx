'use client'

import React, { useState } from 'react'
import CanvasStudio from '../components/CanvasStudio'; // נתיב יחסי בטוח
import { 
  LayoutDashboard, 
  FileText, 
  UploadCloud, 
  Settings, 
  Search, 
  Bell, 
  UserCircle 
} from 'lucide-react'

export default function AdminPage() {
  // מצב לבדיקה: האם אנחנו בתצוגת רשימה או בעריכת תעודה ספציפית
  const [view, setView] = useState<'list' | 'editor'>('list')
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null)

  // נתונים לדוגמה עבור הטבלה
  const documents = [
    { id: 'INV-9401', customer: 'ח. סבן הובלות', date: '2026-02-07', status: 'ממתין לאישור' },
    { id: 'INV-9402', customer: 'גליה לוגיסטיקה', date: '2026-02-06', status: 'בתהליך' },
  ]

  const openEditor = (id: string) => {
    setSelectedDoc(id)
    setView('editor')
  }

  return (
    <div className="min-h-screen bg-[#F3F2F1] flex flex-col font-sans text-[#323130]" dir="rtl">
      
      {/* --- TOPBAR (Microsoft 365 Header) --- */}
      <header className="h-12 bg-[#0078D4] flex items-center justify-between px-4 text-white shadow-md z-50">
        <div className="flex items-center gap-4">
          <div className="p-1 hover:bg-[#106EBE] rounded cursor-pointer">
            <LayoutDashboard size={20} />
          </div>
          <span className="font-semibold tracking-wide">Saban Studio | Portal</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search className="absolute right-2 top-1.5 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="חיפוש מהיר..." 
              className="bg-[#106EBE] text-white placeholder-blue-200 text-sm rounded py-1 pr-8 pl-2 outline-none border-none w-64 focus:bg-white focus:text-black focus:placeholder-gray-400 transition-all"
            />
          </div>
          <Bell size={20} className="cursor-pointer hover:text-blue-200" />
          <UserCircle size={24} className="cursor-pointer hover:text-blue-200" />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* --- SIDEBAR (Fluent UI Style) --- */}
        <aside className="w-16 md:w-56 bg-white border-l border-[#E2E8F0] flex flex-col p-2 gap-1 shadow-sm">
          <button 
            onClick={() => setView('list')}
            className={`flex items-center gap-3 p-3 rounded-md transition-colors ${view === 'list' ? 'bg-[#EDEBE9] text-[#0078D4] font-bold' : 'hover:bg-[#F3F2F1]'}`}
          >
            <FileText size={20} />
            <span className="hidden md:block text-sm">ארכיון תעודות</span>
          </button>
          <button className="flex items-center gap-3 p-3 rounded-md hover:bg-[#F3F2F1] text-gray-600 transition-colors">
            <UploadCloud size={20} />
            <span className="hidden md:block text-sm">העלאה מהירה</span>
          </button>
          <div className="mt-auto border-t pt-2">
            <button className="flex items-center gap-3 p-3 rounded-md hover:bg-[#F3F2F1] text-gray-600 transition-colors w-full">
              <Settings size={20} />
              <span className="hidden md:block text-sm">הגדרות</span>
            </button>
          </div>
        </aside>

        {/* --- MAIN CONTENT --- */}
        <main className="flex-1 overflow-auto flex flex-col">
          
          {view === 'list' ? (
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#323130]">ניהול מסמכים</h2>
                <button className="bg-[#0078D4] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#106EBE] shadow-sm">
                  + העלאת קובץ חדש
                </button>
              </div>

              {/* טבלת ארכיון מקצועית */}
              <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-sm overflow-hidden">
                <table className="w-full text-right border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#FAF9F8] border-b border-[#E2E8F0] text-gray-500 font-medium">
                      <th className="p-4">מזהה תעודה</th>
                      <th className="p-4">לקוח</th>
                      <th className="p-4">תאריך סריקה</th>
                      <th className="p-4">סטטוס</th>
                      <th className="p-4 text-center">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => (
                      <tr key={doc.id} className="border-b border-gray-100 hover:bg-[#F8FAFC] transition-colors">
                        <td className="p-4 font-mono font-bold text-[#0078D4]">{doc.id}</td>
                        <td className="p-4">{doc.customer}</td>
                        <td className="p-4 text-gray-500">{doc.date}</td>
                        <td className="p-4">
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold">
                            {doc.status}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button 
                            onClick={() => openEditor(doc.id)}
                            className="text-[#0078D4] hover:underline font-medium"
                          >
                            פתח בסטודיו
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* תצוגת הסטודיו (Canvas) */
            <div className="flex flex-col h-full bg-white">
              <div className="bg-[#FAF9F8] border-b border-[#E2E8F0] p-2 flex items-center justify-between">
                <button 
                  onClick={() => setView('list')}
                  className="text-sm text-[#0078D4] font-medium hover:underline flex items-center gap-1"
                >
                  חזרה לארכיון {'>'}
                </button>
                <div className="text-sm font-semibold">עורך: {selectedDoc}</div>
                <div />
              </div>
              
              <div className="flex-1 overflow-hidden relative">
                {/* כאן נכנס רכיב ה-CanvasStudio שהכנו */}
                <CanvasStudio 
                  backgroundSrc="/docs/sample-invoice.png" // כאן תבוא הכתובת האמיתית מה-DB
                />
              </div>
            </div>
          )}
        </main>
      </div>

      <style jsx global>{`
        body {
          background-color: #F3F2F1;
        }
        /* התאמה אישית לפונט Segoe UI למראה מייקרוסופט */
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@300;400;700&display=swap');
        * {
          font-family: 'Segoe UI', 'Noto Sans Hebrew', Tahoma, Geneva, Verdana, sans-serif;
        }
      `}</style>
    </div>
  )
}
