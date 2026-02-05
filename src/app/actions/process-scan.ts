'use server';

import { GoogleGenAI } from "gemini-2.5-flash"; // ה-SDK החדש
import { db } from "@/lib/firebase"; 
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

let blacklistedKeys = new Set<string>();

export async function processScan(base64Image: string, location: any, localDraft: any) {
  const allKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3
  ].filter(Boolean) as string[];

  const activeKeys = allKeys.filter(k => !blacklistedKeys.has(k));

  console.log(`--- 🛡️ מלשינון 2026: מעבר ל-Gemini 2.5 Flash (פעילים: ${activeKeys.length}) ---`);

  if (activeKeys.length === 0) return { success: false, error: "אין מפתחות תקינים" };

  // ניקוי Base64
  const cleanBase64 = base64Image.replace(/^data:.*?;base64,/, "");
  const mimeType = base64Image.includes('application/pdf') ? 'application/pdf' : 'image/jpeg';

  for (let i = 0; i < activeKeys.length; i++) {
    const key = activeKeys[i];
    const keyTag = `Key_${i + 1}`;

    try {
      console.log(`🔄 מלשינון: מנסה את ${keyTag} עם מודל 2.5...`);
      
      const client = new GoogleGenAI({ apiKey: key });
      
      // שימוש במודל החדש והחזק יותר
      const resp = await client.models.generateContent({
        model: "gemini-2.5-flash", 
        contents: [{
          role: "user",
          parts: [
            { inlineData: { data: cleanBase64, mimeType: mimeType } },
            { text: "Analyze this document for Saban 94. Return ONLY JSON: {invoiceNumber, customerName, type}" }
          ]
        }]
      });

      const textResponse = resp.text;
      console.log(`✅ מלשינון: הצלחה ב-2.5!`);

      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("JSON_NOT_FOUND");
      
      const data = JSON.parse(jsonMatch[0]);

      await addDoc(collection(db, "processed_notes"), {
        ...data,
        timestamp: serverTimestamp(),
        source: "GALIA_OFFICE",
        meta: { keyUsed: keyTag, model: "gemini-2.5-flash" }
      });

      return { success: true, data };

    } catch (err: any) {
      console.error(`⚠️ מלשינון: ${keyTag} נכשל. סיבה: ${err.message}`);
      
      // אם זה 404, סימן שהמפתח עוד לא "ראה" את 2.5 - נדווח על זה
      if (err.message.includes("404")) {
        console.error("🆘 מלשינון: המודל 2.5 לא נמצא למפתח זה. בדוק הגדרות Billing ב-AI Studio.");
      }

      if (err.message.includes("403") || err.message.includes("API_KEY_INVALID")) {
        blacklistedKeys.add(key);
      }
      continue;
    }
  }

  return { success: false, error: "נכשל בכל המפתחות גם בגרסה 2.5" };
}
