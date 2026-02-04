'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/firebase"; 
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { SABAN_OCR_SCHEMA, SABAN_PROMPT } from "../../lib/ocr-brain";

/**
 * פונקציה המנסה לעבד את התמונה מול ג'ימיני.
 * אם מפתח אחד נכשל, היא עוברת אוטומטית למפתח הבא במערך.
 */
export async function processScan(base64Image: string, location: any, localDraft: any) {
  // 1. הגדרת רשימת המפתחות מתוך ה-Environment Variables ב-Vercel
  const apiKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3
  ].filter(Boolean) as string[]; // משאיר רק את אלו שהגדרת באמת

  if (apiKeys.length === 0) {
    return { success: false, error: "לא הוגדרו מפתחות API בשרת" };
  }

  let lastError = "";

  // 2. לולאת הגיבוי (Failover Loop)
  for (let i = 0; i < apiKeys.length; i++) {
    const currentKey = apiKeys[i];
    
    try {
      console.log(`נסיונות סריקה עם מפתח מספר ${i + 1}...`);
      
      const genAI = new GoogleGenerativeAI(currentKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // ניקוי ה-Base64
      const base64Clean = base64Image.replace(/^data:image\/(png|jpg|jpeg);base64,/, "");

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [
          { inlineData: { data: base64Clean, mimeType: "image/jpeg" } },
          { text: `${SABAN_PROMPT} 
            מבנה נתונים: ${JSON.stringify(SABAN_OCR_SCHEMA)} 
            נתוני טיוטה: ${JSON.stringify(localDraft)}` 
          }
        ]}],
        generationConfig: { 
          responseMimeType: "application/json",
          temperature: 0.1 
        }
      });

      const responseText = result.response.text();
      const data = JSON.parse(responseText.trim());

      // 3. הצלחה! שמירה ל-Firebase
      const docRef = await addDoc(collection(db, "processed_notes"), {
        ...data,
        driver: "חכמת",
        location: location || { lat: 0, lng: 0 },
        timestamp: serverTimestamp(),
        usedKeyIndex: i + 1 // תיעוד איזה מפתח עבד לנו
      });

      console.log(`סריקה הצליחה עם מפתח ${i + 1}`);
      return { success: true, id: docRef.id, data };

    } catch (error: any) {
      // אם הגענו לכאן, המפתח הנוכחי נכשל (REJECTED או עומס)
      lastError = error.message || "Unknown Error";
      console.error(`מפתח ${i + 1} נכשל:`, lastError);
      
      // אם זה המפתח האחרון ברשימה, נצא מהלולאה ונחזיר שגיאה סופית
      if (i === apiKeys.length - 1) {
        break;
      }
      // אחרת - הלולאה תמשיך אוטומטית למפתח הבא
      continue;
    }
  }

  // 4. אם הגענו לכאן, כל 3 המפתחות נכשלו
  return { 
    success: false, 
    error: `כל הניסיונות נכשלו. שגיאה אחרונה: ${lastError}` 
  };
}
