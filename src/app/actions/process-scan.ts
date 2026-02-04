'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/firebase"; 
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function processScan(base64Image: string, location: any, localDraft: any) {
  const keys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3
  ].filter(k => k && k.length > 10);

  if (keys.length === 0) return { success: false, error: "מפתחות API לא מוגדרים" };

  const base64Data = base64Image.split(',')[1] || base64Image;

  for (let key of keys) {
    try {
      const genAI = new GoogleGenerativeAI(key!);
      
      // שינוי קריטי: משתמשים במודל הישן שנתמך ב-V1
      const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

      const prompt = `נתח את תעודת המשלוח הזו. 
      השווה לטיוטה: ${JSON.stringify(localDraft)}
      חובה להחזיר JSON בלבד עם המבנה: 
      {"invoiceNumber": "string", "items": [], "signatureFound": boolean}`;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: "image/jpeg"
          }
        }
      ]);

      const response = await result.response;
      const text = response.text();
      
      // חילוץ JSON פשוט
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("JSON_NOT_FOUND");
      
      const data = JSON.parse(jsonMatch[0]);

      await addDoc(collection(db, "processed_notes"), {
        ...data,
        driver: "חכמת",
        location,
        timestamp: serverTimestamp(),
        model_used: "gemini-pro-vision"
      });

      return { success: true, data };

    } catch (err: any) {
      console.error("Attempt failed:", err.message);
      if (err.message.includes("404")) {
          // אם גם זה לא עובד, כנראה שה-SDK ממש דורש עדכון
          return { success: false, error: "גרסת ה-SDK ישנה מדי. אנא הרץ npm install @google/generative-ai@latest" };
      }
      continue;
    }
  }
  return { success: false, error: "תקלה בסריקה" };
}
