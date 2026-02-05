'use server';

import { db } from "@/lib/firebase"; 
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// פונקציית המתנה חכמה (Backoff)
const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

export async function processScan(base64Image: string, location: any, localDraft: any) {
  const keys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3
  ].filter(Boolean) as string[];

  const cleanBase64 = base64Image.replace(/^data:.*?;base64,/, "");
  const mimeType = base64Image.includes('application/pdf') ? 'application/pdf' : 'image/jpeg';

  console.log(`--- 🛡️ מלשינון ח. סבן: חיפוש מודל חינמי פעיל ---`);

  for (let key of keys) {
    try {
      // 1. גילוי מודלים זמינים למפתח הספציפי
      const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
      const listData = await listRes.json();
      const availableModels = listData.models?.map((m: any) => m.name) || [];

      // 2. בחירת המודל הטוב ביותר שזמין (סדר עדיפויות: 2.5 פלאש -> 1.5 פלאש)
      const selectedModel = 
        availableModels.find((m: string) => m.includes("gemini-2.5-flash")) ||
        availableModels.find((m: string) => m.includes("gemini-1.5-flash")) ||
        "models/gemini-1.5-flash"; // ברירת מחדל אחרונה

      console.log(`🔄 מלשינון: נבחר מודל ${selectedModel}`);

      // 3. ניסיון ניתוח עם מנגנון Retry
      let attempts = 0;
      while (attempts < 2) {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1/${selectedModel}:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { inline_data: { mime_type: mimeType, data: cleanBase64 } },
                  { text: "Analyze this document. Return ONLY JSON: {invoiceNumber, customerName, type}" }
                ]
              }]
            })
          }
        );

        if (response.status === 429) {
          console.log("⏳ מלשינון: מכסה מלאה, מחכה 5 שניות לניסיון חוזר...");
          await wait(5000);
          attempts++;
          continue;
        }

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const result = await response.json();
        const text = result.candidates[0].content.parts[0].text;
        const data = JSON.parse(text.match(/\{[\s\S]*\}/)[0]);

        // שמירה ל-Firebase
        await addDoc(collection(db, "processed_notes"), {
          ...data,
          timestamp: serverTimestamp(),
          source: "GALIA_OFFICE",
          meta: { model: selectedModel }
        });

        return { success: true, data };
      }
    } catch (err: any) {
      console.error(`⚠️ מלשינון: מפתח נכשל (${err.message}). עובר למפתח הבא...`);
      continue;
    }
  }

  return { success: false, error: "לא נמצא מודל חינמי זמין או שהמכסה נגמרה. נסה שוב בעוד דקה." };
}
