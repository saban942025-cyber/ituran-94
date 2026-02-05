'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/firebase"; 
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function processScan(base64Image: string, location: any, localDraft: any) {
  const keys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3
  ].filter(Boolean) as string[];

  console.log(`--- 🛡️ מלשינון: נמצאו ${keys.length} מפתחות ---`);

  if (keys.length === 0) return { success: false, error: "חסר מפתח API" };

  // 🔥 התיקון הקריטי: ניקוי ה-Header של ה-Base64 מכל סוג קובץ
  const cleanBase64 = base64Image.replace(/^data:.*?;base64,/, "");
  
  // 🔥 זיהוי ה-MIME הנכון לפי תוכן המחרוזת
  const mimeType = base64Image.includes('application/pdf') ? 'application/pdf' : 'image/jpeg';

  console.log(`📸 מלשינון: מנתח קובץ מסוג ${mimeType}, גודל: ${(cleanBase64.length / 1024).toFixed(2)} KB`);

  for (let i = 0; i < keys.length; i++) {
    try {
      const genAI = new GoogleGenerativeAI(keys[i]);
      // שימוש ב-v1beta לתמיכה מלאה ב-1.5 פלאש
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: 'v1beta' });

      const result = await model.generateContent([
        { inlineData: { data: cleanBase64, mimeType: mimeType } },
        { text: `Analyze this document for Saban 94. 
          Return ONLY JSON:
          If Invoice: {"type": "invoice", "invoiceNumber": "string", "customerName": "string"}
          If Tachograph Disk: {"type": "disk", "driverName": "string"}
          JSON ONLY.` }
      ]);

      const text = result.response.text();
      console.log(`✅ מלשינון: מפתח ${i+1} הצליח!`);

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("JSON_NOT_FOUND");
      const data = JSON.parse(jsonMatch[0]);

      await addDoc(collection(db, "processed_notes"), {
        ...data,
        location: location || { lat: 0, lng: 0 },
        source: localDraft?.source || "unknown",
        timestamp: serverTimestamp()
      });

      return { success: true, data };

    } catch (err: any) {
      console.warn(`⚠️ מלשינון: מפתח ${i+1} נכשל: ${err.message}`);
      if (i === keys.length - 1) return { success: false, error: err.message };
    }
  }
}
