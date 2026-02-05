'use server';

import { db } from "@/lib/firebase"; 
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// רשימה שחורה למפתחות שכשלו
let blacklistedKeys = new Set<string>();

export async function processScan(base64Image: string, location: any, localDraft: any) {
  const allKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3
  ].filter(Boolean) as string[];

  const activeKeys = allKeys.filter(k => !blacklistedKeys.has(k));

  console.log(`--- 🛡️ מלשינון ח. סבן: פריצה ישירה (פעילים: ${activeKeys.length}/${allKeys.length}) ---`);

  if (activeKeys.length === 0) return { success: false, error: "אין מפתחות תקינים" };

  // ניקוי Base64 והגדרת MIME
  const cleanBase64 = base64Image.replace(/^data:.*?;base64,/, "");
  const mimeType = base64Image.includes('application/pdf') ? 'application/pdf' : 'image/jpeg';

  for (let i = 0; i < activeKeys.length; i++) {
    const key = activeKeys[i];
    const keyTag = `Key_${i + 1}_${key.substring(0, 6)}`;

    try {
      console.log(`🔄 מלשינון: שולח בקשת REST ישירה ל-v1 דרך ${keyTag}...`);

      // שימוש ב-v1 הסטנדרטי שעוקף את ה-404 של הבטא
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { inlineData: { mimeType: mimeType, data: cleanBase64 } },
                { text: "Analyze document for Saban 94. Return ONLY JSON: {invoiceNumber, customerName, type}" }
              ]
            }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.1
            }
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      const textResponse = result.candidates[0].content.parts[0].text;
      
      console.log(`✅ מלשינון: ${keyTag} הצליח! נתונים:`, textResponse);

      const data = JSON.parse(textResponse);

      await addDoc(collection(db, "processed_notes"), {
        ...data,
        timestamp: serverTimestamp(),
        source: "GALIA_OFFICE",
        meta: { keyUsed: keyTag, protocol: "REST_v1" }
      });

      return { success: true, data };

    } catch (err: any) {
      console.error(`⚠️ מלשינון: ${keyTag} נכשל. סיבה: ${err.message}`);
      
      // אם המפתח פגום, נשרוף אותו
      if (err.message.includes("403") || err.message.includes("API_KEY_INVALID")) {
        console.error(`🚫 מלשינון: המפתח ${keyTag} נשרף.`);
        blacklistedKeys.add(key);
      }
      continue;
    }
  }

  return { success: false, error: "כל הניסיונות נכשלו בערוץ הישיר" };
}
