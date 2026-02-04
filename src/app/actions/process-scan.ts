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
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // כאן הסרנו את ה-responseMimeType שגרם לשגיאה 400
      const result = await model.generateContent([
        { inlineData: { data: base64Data, mimeType: "image/jpeg" } },
        { text: `Analyze this delivery note. Return ONLY a JSON object with: 
          {
            "invoiceNumber": "string",
            "items": [{"itemId": "string", "name": "string", "quantity": number}],
            "signatureFound": boolean,
            "hasChanges": boolean
          }
          Do not include any other text, only the JSON.` 
        }
      ]);

      const responseText = result.response.text();
      
      // חילוץ JSON חכם - מחפש את הסוגריים המסולסלים הראשונים והאחרונים
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");
      
      const data = JSON.parse(jsonMatch[0]);

      // שמירה ל-Firebase
      await addDoc(collection(db, "processed_notes"), {
        ...data,
        driver: "חכמת",
        location: location || { lat: 0, lng: 0 },
        timestamp: serverTimestamp()
      });

      return { success: true, data };

    } catch (err: any) {
      console.error("Key attempt failed:", err.message);
      lastError = err.message;
      continue; // עובר למפתח הבא
    }
  }

  return { success: false, error: `שגיאה: ${lastError}` };
}
