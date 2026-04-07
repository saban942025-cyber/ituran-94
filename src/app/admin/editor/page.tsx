// src/app/admin/editor/page.tsx
'use client'

import React, { useEffect, useState, Suspense } from 'react';
import SabanEditor from "@/components/SabanEditor";
import { useSearchParams } from 'next/navigation';
// תיקון הנתיב: יוצאים מ-admin/editor (3 רמות) אל השורש לתיקיית lib
import { db } from "../../../../lib/firebase"; 
import { doc, getDoc } from "firebase/firestore";

function EditorContent() {
  const searchParams = useSearchParams();
  const ticketId = searchParams.get('id');
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTicket() {
      if (!ticketId) return;
      try {
        const docRef = doc(db, "processed_notes", ticketId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setFileUrl(snap.data().imageUrl);
        } else {
          setError("המסמך לא נמצא במאגר");
        }
      } catch (err) {
        console.error("Error loading ticket:", err);
        setError("שגיאה בטעינת הנתונים");
      }
    }
    loadTicket();
  }, [ticketId]);

  if (error) return <div className="p-10 text-red-500 font-bold">{error}</div>;
  if (!fileUrl) return <div className="p-10">טוען תעודה מהארכיון...</div>;

  return (
    <div className="h-screen p-4">
      <SabanEditor 
        fileUrl={fileUrl} 
        onSave={(updatedDataUrl) => {
          console.log("Saving to Firebase Archive...", updatedDataUrl);
          // לוגיקת שמירה סופית כאן
        }} 
      />
    </div>
  );
}

// עטיפה ב-Suspense הכרחית ב-Next.js כשמשתמשים ב-useSearchParams בדפי Client
export default function MagicEditorPage() {
  return (
    <Suspense fallback={<div className="p-10">טוען...</div>}>
      <EditorContent />
    </Suspense>
  );
}
