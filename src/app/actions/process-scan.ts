'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/firebase"; 
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function processScan(base64Image: string, location: any, localDraft: any) {
  // 1. הגדרת המפתחות
  const keys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3
  ].filter(k => k && k.length > 10);

  if (keys.length === 0) return { success: false, error: "מפתחות API לא מוגדרים ב-Vercel" };

  // 2. ניקוי התמונה לפורמט Base64 נקי
  const base64Data = base64Image.replace(/^data:image\/(png|jpg|jpeg);base64,/, "");

  let lastError = "";

  // 3. לולאת הדילוג בין המפתחות
  for (let key of keys) {
    try {
      const genAI = new GoogleGenerativeAI(key!);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // שלב קריטי: אנחנו לא שולחים generationConfig עם responseMimeType
      // אנחנו מבקשים את ה-JSON ישירות בטקסט
      const result = await model.generateContent([
        {
          inlineData: {
            data: base64Data,
            mimeType: "image/jpeg"
          }
        },
        {
          text: `נער ניתוח OCR לתעודת משלוח.
          השווה לנתונים האלו מהמשרד: ${JSON.stringify(localDraft)}
          
          חובה להחזיר אך ורק אובייקט JSON תקין במבנה הבא:
          {
            "invoiceNumber": "string",
            "items": [{"itemId": "string", "name": "string", "quantity": number}],
            "signatureFound": boolean,
            "hasChanges": boolean
          }
          בלי טקסט נוסף לפני או אחרי.`
        }
      ]);

      const response = await result.response;
      const text = response.text();
      
      // 4. חילוץ JSON בטוח - לוקח רק מה שבין הסוגריים המסולסלים
      const startJson = text.indexOf('{');
      const endJson = text.lastIndexOf('}') + 1;
      const jsonStr = text.substring(startJson, endJson);
      
      const data = JSON.parse(jsonStr);

      // 5. שמירה ל-Firebase (ח. סבן הייטק)
      const docRef = await addDoc(collection(db, "processed_notes"), {
        ...data,
        driver: "חכמת",
        location: location || { lat: 0, lng: 0 },
        timestamp: serverTimestamp(),
        api_version: "v1-legacy-safe"
      });

      return { success: true, id: docRef.id, data };

    } catch (err: any) {
      console.error("Key attempt failed:", err.message);
      lastError = err.message;
      // אם גוגל חסם בגלל בטיחות, אין טעם לנסות מפתח אחר על אותה תמונה
      if (lastError.includes("SAFETY") || lastError.includes("blocked")) break;
      continue; 
    }
  }

  return { success: false, error: `כל הניסיונות נכשלו: ${lastError}` };
}
