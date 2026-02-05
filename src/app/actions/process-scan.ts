'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/firebase"; 
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// מערך פנימי שיחזיק את המפתחות ה"שרופים" בזמן הריצה של השרת
let blacklistedKeys = new Set<string>();

export async function processScan(base64Image: string, location: any, localDraft: any) {
  // 1. איסוף מפתחות וסינון מפתחות שכשלו קשות בעבר
  let allKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3
  ].filter(Boolean) as string[];

  // סינון מפתחות מה"רשימה השחורה"
  const activeKeys = allKeys.filter(k => !blacklistedKeys.has(k));

  console.log(`--- 🛡️ מלשינון ח. סבן: מנתח עם ${activeKeys.length}/${allKeys.length} מפתחות פעילים ---`);

  if (activeKeys.length === 0) {
    return { success: false, error: "כל המפתחות נכשלו. רמי, תבדוק את ה-API Keys ב-Vercel!" };
  }

  // 2. הכנת הקובץ (ניקוי Header וזיהוי סוג)
  const cleanBase64 = base64Image.replace(/^data:.*?;base64,/, "");
  const mimeType = base64Image.includes('application/pdf') ? 'application/pdf' : 'image/jpeg';
  
  console.log(`📸 מלשינון: קובץ ${mimeType} בגודל ${(cleanBase64.length / 1024).toFixed(2)} KB`);

  let lastError = "";

  // 3. לולאת הניסיונות
  for (let i = 0; i < activeKeys.length; i++) {
    const currentKey = activeKeys[i];
    const keyId = `Key_${i + 1}_${currentKey.substring(0, 5)}`;

    try {
      console.log(`🔄 מלשינון: מנסה את ${keyId}...`);
      
      const genAI = new GoogleGenerativeAI(currentKey);
      // שימוש בגרסה יציבה
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const result = await model.generateContent([
        { inlineData: { data: cleanBase64, mimeType } },
        { text: "Analyze document. Return ONLY JSON: {invoiceNumber: string, customerName: string, type: 'invoice'|'disk'}" }
      ]);

      const response = await result.response;
      const text = response.text();
      
      console.log(`✅ מלשינון: ${keyId} הצליח!`);

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("JSON_MISSING");
      
      const data = JSON.parse(jsonMatch[0]);

      // שמירה ל-Firebase
      await addDoc(collection(db, "processed_notes"), {
        ...data,
        timestamp: serverTimestamp(),
        source: localDraft?.source || "OFFICE",
        meta: { keyUsed: keyId }
      });

      return { success: true, data };

    } catch (err: any) {
      lastError = err.message;
      console.error(`⚠️ מלשינון: ${keyId} נכשל. סיבה: ${lastError}`);

      // מלשינון חזק: אם המפתח פגום (400/403/401), נכניס אותו לרשימה השחורה
      if (lastError.includes("API_KEY_INVALID") || lastError.includes("403") || lastError.includes("401")) {
        console.error(`🚫 מלשינון: שורף את ${keyId}! מפתח לא תקין.`);
        blacklistedKeys.add(currentKey);
      }

      // אם הגענו למפתח האחרון וגם הוא נכשל
      if (i === activeKeys.length - 1) {
        console.error("💀 מלשינון סופי: אין יותר מפתחות לנסות.");
      }
    }
  }

  return { success: false, error: `כל המפתחות נכשלו: ${lastError}` };
}
