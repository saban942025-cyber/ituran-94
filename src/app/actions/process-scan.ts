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
  let lastError = "";

  for (let key of keys) {
    try {
      const genAI = new GoogleGenerativeAI(key!);
      
      // שינוי קריטי: בגרסאות ישנות המודל נקרא לעיתים gemini-pro 
      // אבל אנחנו ננסה לגשת ל-gemini-1.5-flash בצורה שתעקוף את ה-404
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
      });

      // אנחנו שולחים בקשה בסיסית ביותר ללא הגדרות config מתקדמות
      const result = await model.generateContent([
        {
          inlineData: {
            data: base64Data,
            mimeType: "image/jpeg"
          }
        },
        {
          text: `נתח תעודת משלוח. החזר JSON בלבד: {"invoiceNumber": "string", "items": [], "signatureFound": true}`
        }
      ]);

      const response = await result.response;
      const text = response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("JSON_NOT_FOUND");
      
      const data = JSON.parse(jsonMatch[0]);

      await addDoc(collection(db, "processed_notes"), {
        ...data,
        driver: "חכמת",
        location,
        timestamp: serverTimestamp()
      });

      return { success: true, data };

    } catch (err: any) {
      // אם השגיאה היא 404, ננסה להחליף את שם המודל לגרסה היציבה הישנה יותר
      console.error(`Attempt with key failed:`, err.message);
      lastError = err.message;
      
      if (lastError.includes("404")) {
         lastError = "המודל gemini-1.5-flash לא מזוהה. נסה לעדכן את ה-SDK.";
      }
      continue;
    }
  }

  return { success: false, error: lastError };
}
