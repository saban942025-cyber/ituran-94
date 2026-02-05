'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/firebase"; 
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function processScan(base64Image: string, location: any, localDraft: any) {
  // 1. איסוף המפתחות
  const keys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3
  ].filter(Boolean) as string[];

  console.log(`--- 🛡️ מלשינון: התחלת תהליך סריקה (נמצאו ${keys.length} מפתחות) ---`);

  if (keys.length === 0) {
    console.error("❌ מלשינון: אין מפתחות API מוגדרים ב-Vercel!");
    return { success: false, error: "שגיאת תשתית: מפתחות חסרים" };
  }

  // ניקוי ה-Base64
  const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
  console.log(`📸 מלשינון: גודל תמונה נקי: ${(cleanBase64.length / 1024).toFixed(2)} KB`);

  let lastError = "";

  // 2. לולאת הדילוג והדיווח
  for (let i = 0; i < keys.length; i++) {
    const currentKey = keys[i];
    const keyTag = `Key[${i + 1}] (${currentKey.substring(0, 6)}...)`;

    try {
      console.log(`🔄 מלשינון: מנסה את ${keyTag}`);
      
      const genAI = new GoogleGenerativeAI(currentKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const result = await model.generateContent([
        { inlineData: { data: cleanBase64, mimeType: "image/jpeg" } },
        { text: `Analyze this Saban 94 document. Return ONLY JSON. 
                 Invoice structure: {"invoiceNumber": "string", "customer": "string"}
                 Disk structure: {"type": "disk", "driver": "string"}` }
      ]);

      const responseText = result.response.text();
      console.log(`✅ מלשינון: ${keyTag} הצליח! תשובה:`, responseText);

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("התשובה לא מכילה JSON תקין");

      const data = JSON.parse(jsonMatch[0]);

      // שמירה לארכיון
      await addDoc(collection(db, "processed_notes"), {
        ...data,
        timestamp: serverTimestamp(),
        meta: { keyUsed: i + 1, status: "success" }
      });

      return { success: true, data };

    } catch (err: any) {
      lastError = err.message;
      console.warn(`⚠️ מלשינון: ${keyTag} נכשל. סיבה: ${lastError}`);

      // אם זו שגיאת עומס (429) או שגיאת שרת (500) - נמשיך לבא בתור
      if (lastError.includes("429") || lastError.includes("500") || lastError.includes("fetch")) {
        console.log("⏭️ מלשינון: עובר למפתח הבא בגלל עומס/תקלה טכנית...");
        continue;
      }

      // אם המפתח לא תקין (403/400) - נדווח ונמשיך
      if (lastError.includes("API_KEY_INVALID") || lastError.includes("403")) {
        console.error(`🚫 מלשינון: ${keyTag} פסול לשימוש!`);
        continue;
      }

      break; // בשגיאות אחרות (כמו בטיחות) נעצור
    }
  }

  console.error(`💀 מלשינון סופי: כל ${keys.length} המפתחות נכשלו!`);
  return { success: false, error: `כל הניסיונות נכשלו: ${lastError}` };
}
