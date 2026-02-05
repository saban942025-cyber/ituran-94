'use server';

import { db } from "@/lib/firebase"; 
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// רשימה שחורה זמנית למפתחות תקולים
let blacklistedKeys = new Set<string>();

export async function processScan(base64Image: string, location: any, localDraft: any) {
  const allKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3
  ].filter(Boolean) as string[];

  const activeKeys = allKeys.filter(k => !blacklistedKeys.has(k));

  console.log(`--- 🛡️ מלשינון: ניסיון פריצה ישיר (נמצאו ${activeKeys.length} מפתחות) ---`);

  if (activeKeys.length === 0) return { success: false, error: "אין מפתחות תקינים" };

  const cleanBase64 = base64Image.replace(/^data:.*?;base64,/, "");
  const mimeType = base64Image.includes('application/pdf') ? 'application/pdf' : 'image/jpeg';

  for (let i = 0; i < activeKeys.length; i++) {
    const key = activeKeys[i];
    const keyTag = `Key_${i + 1}_${key.substring(0, 5)}`;

    try {
      console.log(`🔄 מלשינון: פונה ישירות ל-API עם ${keyTag}...`);

      // פנייה ישירה ל-Endpoint של גוגל - עוקף את ה-SDK
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { inlineData: { mimeType: mimeType, data: cleanBase64 } },
                { text: "Analyze document. Return ONLY JSON: {invoiceNumber, customerName, type}" }
              ]
            }],
            generationConfig: { responseMimeType: "application/json" }
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      const text = result.candidates[0].content.parts[0].text;
      
      console.log(`✅ מלשינון: ${keyTag} הצליח!`);
      const data = JSON.parse(text);

      await addDoc(collection(db, "processed_notes"), {
        ...data,
        timestamp: serverTimestamp(),
        source: "GALIA_OFFICE",
        meta: { keyUsed: keyTag, method: "REST_API" }
      });

      return { success: true, data };

    } catch (err: any) {
      console.error(`⚠️ מלשינון: ${keyTag} נכשל: ${err.message}`);
      
      if (err.message.includes("API_KEY_INVALID") || err.message.includes("403")) {
        console.error(`🚫 מלשינון: שורף את ${keyTag}`);
        blacklistedKeys.add(key);
      }
      continue;
    }
  }

  return { success: false, error: "כל המפתחות נכשלו בחיבור ישיר" };
}
