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

  if (keys.length === 0) return { success: false, error: "חסר מפתח API" };

  // ניקוי ה-Base64
  const base64Data = base64Image.split(',')[1] || base64Image;

  for (let i = 0; i < keys.length; i++) {
    try {
      const genAI = new GoogleGenerativeAI(keys[i]);
      // עכשיו כשה-SDK מעודכן, המודל הזה יעבוד ב-100%
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const result = await model.generateContent([
        {
          inlineData: {
            data: base64Data,
            mimeType: "image/jpeg"
          }
        },
        { text: "Analyze delivery note. Return ONLY JSON: {invoiceNumber, items: [], signatureFound: boolean}" }
      ]);

      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("JSON_MISSING");
      
      const data = JSON.parse(jsonMatch[0]);

      await addDoc(collection(db, "processed_notes"), {
        ...data,
        driver: "חכמת",
        location,
        timestamp: serverTimestamp()
      });

      return { success: true, data };

    } catch (err: any) {
      console.error(`מפתח ${i+1} נכשל:`, err.message);
      if (i === keys.length - 1) return { success: false, error: "ג'ימיני לא זיהה, נסה שוב" };
    }
  }
}
