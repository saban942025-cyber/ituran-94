'use server';

import { db } from "@/lib/firebase"; 
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// הגדלת מגבלת הנפח ל-Server Actions ל-10MB ליתר ביטחון
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

// רשימה שחורה זמנית למפתחות API תקולים
let blacklistedKeys = new Set<string>();

export async function processScan(base64Image: string, location: any, localDraft: any) {
  // 1. ריכוז מפתחות API מה-Environment
  const allKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3
  ].filter(Boolean) as string[];

  // סינון מפתחות שכשלו בעבר
  const activeKeys = allKeys.filter(k => !blacklistedKeys.has(k));

  console.log(`--- 🛡️ מלשינון ח. סבן: חילוץ נתוני תעודה (פעילים: ${activeKeys.length}/${allKeys.length}) ---`);

  if (activeKeys.length === 0) {
    return { success: false, error: "אין מפתחות API תקינים. רמי, בדוק הגדרות ב-Vercel." };
  }

  // 2. ניקוי ה-Base64 (הסרת ה-Data Header)
  const cleanBase64 = base64Image.replace(/^data:.*?;base64,/, "");
  const mimeType = base64Image.includes('application/pdf') ? 'application/pdf' : 'image/jpeg';
  
  let lastError = "";

  // 3. לולאת הניסיונות (Failover)
  for (let i = 0; i < activeKeys.length; i++) {
    const key = activeKeys[i];
    const keyTag = `Key_${i + 1}`;

    try {
      console.log(`🔄 מלשינון: מבצע פנייה ישירה ל-v1 עם ${keyTag}...`);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { inline_data: { mime_type: mimeType, data: cleanBase64 } },
                { text: `Extract exactly 3 fields from this document:
                  1. Invoice Number (מספר תעודה)
                  2. Customer Name (שם לקוח)
                  3. Date (תאריך תעודה)
                  
                  Return ONLY a clean JSON object:
                  {
                    "invoiceNumber": "string",
                    "customerName": "string",
                    "invoiceDate": "string"
                  }
                  Do not include markdown or any other text.` 
                }
              ]
            }],
            generationConfig: {
              temperature: 0.1, // דיוק מקסימלי לחילוץ נתונים
              response_mime_type: "application/json"
            }
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      
      // שליפת הטקסט וניקוי במידת הצורך
      const rawText = result.candidates[0].content.parts[0].text;
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) throw new Error("JSON_NOT_FOUND");
      
      const data = JSON.parse(jsonMatch[0]);
      console.log(`✅ מלשינון: הנתונים חולצו עבור לקוח: ${data.customerName}`);

      // 4. שמירה ל-Firebase (כאן גליה תראה את זה בטבלה)
      const docRef = await addDoc(collection(db, "processed_notes"), {
        ...data,
        timestamp: serverTimestamp(),
        location: location || { lat: 0, lng: 0 },
        source: "GALIA_SYNC_PROCESS",
        // הכנה לגיבוי ענן כפול
        cloudStorage: {
          googleDrive: "PENDING",
          oneDrive365: "PENDING"
        }
      });

      return { success: true, id: docRef.id, data };

    } catch (err: any) {
      lastError = err.message;
      console.error(`⚠️ מלשינון: ${keyTag} נכשל. סיבה: ${lastError}`);

      // שריפת מפתח במידה והוא לא מורשה או פגום
      if (lastError.includes("403") || lastError.includes("API_KEY_INVALID") || lastError.includes("401")) {
        console.warn(`🚫 מלשינון: מוציא את ${keyTag} מהסבב.`);
        blacklistedKeys.add(key);
      }
      
      continue; // ניסיון עם המפתח הבא ברשימה
    }
  }

  return { success: false, error: `כל הניסיונות נכשלו: ${lastError}` };
}
