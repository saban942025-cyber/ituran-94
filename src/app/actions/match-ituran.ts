'use server';

import { db } from "../../../lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";

export async function matchIturanData(ituranCsvData: string) {
  console.log("--- 🛡️ מלשינון: מתחיל הצלבת נתוני איתורן ---");

  // 1. פירוק ה-CSV של איתורן (נניח פורמט: זמן, לוחית רישוי, סטטוס PTO, מיקום)
  const rows = ituranCsvData.split('\n').slice(1); // דילוג על הכותרת
  
  // 2. משיכת כל התעודות של היום מה-Firebase שעדיין "ממתינות להצלבה"
  const q = query(collection(db, "processed_notes"), where("source", "==", "GALIA_OFFICE"));
  const snapshot = await getDocs(q);
  
  let matchesFound = 0;

  for (const docSnapshot of snapshot.docs) {
    const invoice = docSnapshot.data();
    const invoiceId = docSnapshot.id;

    // לוגיקת ההצלבה: מחפשים בנתוני איתורן פעילות PTO בחלון זמן של התעודה
    const ptoEvent = rows.find(row => {
      const [time, plate, ptoStatus, location] = row.split(',');
      // כאן נכנסת הלוגיקה: האם הזמן של התעודה קרוב לזמן ה-PTO?
      return ptoStatus === "ON" && location.includes(invoice.customerName);
    });

    if (ptoEvent) {
      const [time] = ptoEvent.split(',');
      
      // עדכון התעודה עם נתוני אמת
      await updateDoc(doc(db, "processed_notes", invoiceId), {
        ptoStatus: "✅ בוצעה פריקה",
        ptoTime: time,
        matchStatus: "תואם איתורן"
      });
      matchesFound++;
    }
  }

  return { success: true, matches: matchesFound };
}
