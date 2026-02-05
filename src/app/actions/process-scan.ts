'use server';

import { db } from "@/lib/firebase"; 
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// רשימה שחורה זמנית למפתחות שכשלו קשות (נמחקת בריסטרט של השרת)
let blacklistedKeys = new Set<string>();

export async function processScan(base64Image: string, location: any, localDraft: any) {
  // 1. איסוף כל המפתחות האפשריים מה-Environment
  const allKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3
  ].filter(Boolean) as string[];

  // סינון מפתחות שסומנו כלא תקינים
  const activeKeys = allKeys.filter(k => !blacklistedKeys.has(k));

  console.log(`--- 🛡️ מלשינון ח. סבן: התחלת סריקה (פעילים: ${activeKeys.length}/${allKeys.length}) ---`);

  if (activeKeys.length === 0) {
    return { success: false, error: "אין מפתחות API תקינים במערכת. רמי, בדוק הגדרות ב-Vercel." };
  }

  // 2. הכנת הקובץ - ניקוי Header וזיהוי סוג (PDF או תמונה)
  const cleanBase64 = base64Image.replace(/^data:.*?;base64,/, "");
  const mimeType = base64Image.includes('application/pdf') ? 'application/pdf' : 'image/jpeg';
  
  console.log(`📸 מלשינון: מנתח קובץ ${mimeType} בגודל ${(cleanBase64.length / 1024).toFixed(2)} KB`);

  let lastError = "";

  // 3. לולאת הניסיונות (Failover)
  for (let i = 0; i < activeKeys.length; i++) {
    const key = activeKeys[i];
    const keyTag = `Key_${i + 1}_${key.substring(0, 6)}`;

    try {
      console.log(`🔄 מלשינון: פונה ישירות ל-API עם ${keyTag}...`);

      // פנייה ישירה ל-REST API (עוקף את שגיאות ה-SDK)
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { inline_data: { mime_type: mimeType, data: cleanBase64 } },
                { text: "Analyze this document for Saban 94 logistics. Return ONLY a JSON object: {invoiceNumber: string, customerName: string, type: 'invoice'|'disk'}. No intro, no markdown." }
              ]
            }],
            generationConfig: {
              temperature: 0.1,
              topP: 1,
              maxOutputTokens: 200
            }
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      
      // שליפת הטקסט מתוך המבנה של גוגל
      const rawText = result.candidates[0].content.parts[0].text;
      console.log(`✅ מלשינון: ${keyTag} הצליח! מנקה JSON...`);

      // חילוץ ה-JSON בעזרת Regex (למקרה שג'ימיני הוסיף טקסט מיותר)
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("לא נמצא מבנה JSON בתשובה");
      
      const data = JSON.parse(jsonMatch[0]);

      // 4. שמירה ל-Firebase לארכיון אמת
      const docRef = await addDoc(collection(db, "processed_notes"), {
        ...data,
        timestamp: serverTimestamp(),
        location: location || { lat: 0, lng: 0 },
        source: localDraft?.source || "GALIA_ADMIN",
        meta: { keyUsed: keyTag, version: "REST_v1_STABLE" }
      });

      return { success: true, id: docRef.id, data };

    } catch (err: any) {
      lastError = err.message;
      console.error(`⚠️ מלשינון: ${keyTag} נכשל. סיבה: ${lastError}`);

      // אם המפתח פסול או חסום - נכניס אותו לרשימה השחורה
      if (lastError.includes("403") || lastError.includes("API_KEY_INVALID") || lastError.includes("401")) {
        console.error(`🚫 מלשינון: שורף את ${keyTag}. מפתח לא תקין!`);
        blacklistedKeys.add(key);
      }

      // אם זו שגיאת עומס (429), נחכה שנייה לפני המפתח הבא
      if (lastError.includes("429")) {
        await new Promise(r => setTimeout(r, 1000));
      }
      
      continue; // עובר למפתח הבא
    }
  }

  console.error(`💀 מלשינון סופי: כל ${activeKeys.length} המפתחות נכשלו.`);
  return { success: false, error: `ניתוח נכשל: ${lastError}` };
}
