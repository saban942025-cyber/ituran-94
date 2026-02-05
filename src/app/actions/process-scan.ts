'use server';

import { GoogleGenerativeAI } from "@google/generative-ai"; // חזרה לשם החבילה הסטנדרטי
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

  console.log(`--- 🛡️ מלשינון 2026: מנתח עם Gemini 2.0/2.5 Flash ---`);

  if (activeKeys.length === 0) return { success: false, error: "אין מפתחות תקינים" };

  const cleanBase64 = base64Image.replace(/^data:.*?;base64,/, "");
  const mimeType = base64Image.includes('application/pdf') ? 'application/pdf' : 'image/jpeg';

  for (let i = 0; i < activeKeys.length; i++) {
    const key = activeKeys[i];
    const keyTag = `Key_${i + 1}`;

    try {
      console.log(`🔄 מלשינון: מנסה את ${keyTag} עם SDK מעודכן...`);
      
      const genAI = new GoogleGenerativeAI(key);
      
      // משתמשים במודל הכי חזק שזמין כרגע ב-SDK הזה
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash" // או gemini-1.5-flash אם 2.0 עדיין ב-Provisioning
      });

      const result = await model.generateContent([
        { inlineData: { data: cleanBase64, mimeType: mimeType } },
        { text: "Analyze this document for Saban 94. Return ONLY JSON: {invoiceNumber, customerName, type}" }
      ]);

      const response = await result.response;
      const textResponse = response.text();
      
      console.log(`✅ מלשינון: ${keyTag} הצליח!`);

      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("JSON_NOT_FOUND");
      
      const data = JSON.parse(jsonMatch[0]);

      await addDoc(collection(db, "processed_notes"), {
        ...data,
        timestamp: serverTimestamp(),
        source: "GALIA_OFFICE",
        meta: { keyUsed: keyTag }
      });

      return { success: true, data };

    } catch (err: any) {
      console.error(`⚠️ מלשינון: ${keyTag} נכשל. סיבה: ${err.message}`);
      
      if (err.message.includes("403") || err.message.includes("API_KEY_INVALID")) {
        blacklistedKeys.add(key);
      }
      continue;
    }
  }

  return { success: false, error: "כל המפתחות נכשלו" };
}
