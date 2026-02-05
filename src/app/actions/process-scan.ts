'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/firebase"; 
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function processScan(base64Image: string, location: any, localDraft: any) {
  // 1. איסוף המפתחות מה-Environment
  const keys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3
  ].filter(Boolean) as string[];

  console.log(`--- 🛡️ מלשינון: התחלת תהליך סריקה (נמצאו ${keys.length} מפתחות) ---`);

  if (keys.length === 0) {
    console.error("❌ מלשינון: אין מפתחות API מוגדרים ב-Vercel!");
    return { success: false, error: "חסרים מפתחות API" };
  }

  // 2. ניקוי Base64 - חשוב לניתוח תקין
  const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
  console.log(`📸 מלשינון: גודל תמונה: ${(cleanBase64.length / 1024).toFixed(2)} KB`);

  let lastError = "";

  // 3. לולאת הניסיונות (Failover)
  for (let i = 0; i < keys.length; i++) {
    const currentKey = keys[i];
    const keyTag = `Key[${i + 1}] (${currentKey.substring(0, 6)}...)`;

    try {
      console.log(`🔄 מלשינון: מנסה את ${keyTag}`);
      
      const genAI = new GoogleGenerativeAI(currentKey);
      
      // התיקון הקריטי: הכרחת apiVersion ל-v1beta כדי למנוע 404
      const model = genAI.getGenerativeModel(
        { model: "gemini-1.5-flash" },
        { apiVersion: 'v1beta' }
      );

      const result = await model.generateContent([
        { inlineData: { data: cleanBase64, mimeType: "image/jpeg" } },
        { text: `Analyze this document for Saban 94. 
          Return ONLY JSON:
          If Invoice: {"type": "invoice", "invoiceNumber": "string", "customerName": "string", "ptoRequired": boolean}
          If Tachograph Disk: {"type": "disk", "driverName": "string", "date": "string"}
          JSON ONLY, NO MARKDOWN.` }
      ]);

      const responseText = result.response.text();
      console.log(`✅ מלשינון: ${keyTag} הצליח!`);

      // חילוץ JSON נקי
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("JSON_NOT_FOUND");
      
      const data = JSON.parse(jsonMatch[0]);

      // שמירה ל-Firebase
      const docRef = await addDoc(collection(db, "processed_notes"), {
        ...data,
        location: location || { lat: 0, lng: 0 },
        source: localDraft?.source || "unknown",
        timestamp: serverTimestamp(),
        meta: { keyUsed: i + 1 }
      });

      return { success: true, id: docRef.id, data };

    } catch (err: any) {
      lastError = err.message;
      console.warn(`⚠️ מלשינון: ${keyTag} נכשל: ${lastError}`);
      
      // אם זה 404 או שגיאת גרסה, אין טעם לנסות מפתחות אחרים אם כולם באותה גרסת SDK
      if (lastError.includes("404") || lastError.includes("v1beta")) {
         console.error("🚫 מלשינון: שגיאת גרסת API קריטית - בדוק את הגדרת v1beta");
      }
      continue; 
    }
  }

  console.error(`💀 מלשינון: כל הניסיונות נכשלו!`);
  return { success: false, error: lastError };
}
