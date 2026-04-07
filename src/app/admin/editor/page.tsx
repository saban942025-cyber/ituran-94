// src/app/admin/editor/page.tsx
'use client'
import SabanEditor from "@/components/SabanEditor";
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function MagicEditorPage() {
  const searchParams = useSearchParams();
  const ticketId = searchParams.get('id');
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadTicket() {
      if (!ticketId) return;
      const docRef = doc(db, "processed_notes", ticketId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setFileUrl(snap.data().imageUrl); // טעינת התמונה מה-Storage [cite: 22]
      }
    }
    loadTicket();
  }, [ticketId]);

  if (!fileUrl) return <div>טוען תעודה מהארכיון...</div>;

  return (
    <div className="h-screen p-4">
      <SabanEditor 
        fileUrl={fileUrl} 
        onSave={(updatedDataUrl) => {
          console.log("Saving to Firebase Archive...", updatedDataUrl);
          // כאן נשמור את ה-PDF הסופי ל-Storage
        }} 
      />
    </div>
  );
}
