// src/app/actions/saban-logic-engine.ts
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";

export async function verifyWithIturan(ticketId: string, locationName: string) {
  console.log(`--- 🛡️ סריקת איתורן עבור תעודה: ${ticketId} ---`);

  // משיכת נתונים מה-Realtime DB של איתורן [cite: 22]
  const ituranRef = collection(db, "ituran_raw_data");
  const q = query(ituranRef, where("location", "==", locationName), where("pto", "==", "ON"));
  
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    const ptoEvent = snapshot.docs[0].data();
    
    // עדכון סטטוס התעודה לארכיון [cite: 22]
    const noteRef = doc(db, "processed_notes", ticketId);
    await updateDoc(noteRef, {
      verificationStatus: "✅ מאושר איתורן",
      ptoTime: ptoEvent.timestamp,
      isAnomalous: false
    });
    
    return { success: true, message: "הצלבה הצליחה" };
  }

  return { success: false, message: "לא נמצאה פעילות מנוף תואמת" };
}
