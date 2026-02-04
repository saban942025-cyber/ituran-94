'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/firebase"; 
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { SABAN_OCR_SCHEMA, SABAN_PROMPT } from "../../lib/ocr-brain";

export async function processScan(base64Image: string, location: any, localDraft: any) {
  // 1. הגדרת המפתחות מה-Environment Variables
  const apiKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3
  ].filter(Boolean) as string[];

  if (apiKeys.length === 0) {
    return { success: false, error: "לא נמצאו מפתחות API תקינים ב-Vercel" };
  }

  // 2. ניקוי והכנת התמונה (מוריד את ה-header של ה-base64)
  const base64Data = base64Image.replace(/^data:image\/(png|jpg|jpeg);base64,/, "");

  let lastErrorMessage = "";

  // 3. לולאת הדילוג (Failover) - מנסה כל מפתח בזה אחר זה
  for (let i = 0; i < apiKeys.length; i++) {
    try {
      // יצירת חיבור ל-API בגרסת ה-v1beta הנתמכת
      const genAI = new GoogleGenerativeAI(apiKeys[i]);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
      });

      // הגדרות ייצור (Production Settings)
      const generationConfig: any = {
        temperature: 0.1, // דיוק מקסימלי, בלי "המצאות"
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 2048,
        responseMimeType: "application/json", // עכשיו זה יעבוד ב-v1beta!
      };

      const result = await model.generateContent({
        contents: [{
          role: "user",
          parts: [
            { inlineData: { data: base64Data, mimeType: "image/jpeg" } },
            { text: `${SABAN_PROMPT}\nReturn JSON structure: ${JSON.stringify(SABAN_OCR_SCHEMA)}` }
          ]
        }],
        generationConfig
      });

      const response = await result.response;
      const text = response.text();
      
      // ניקוי JSON במידה והמודל הוסיף Markdown
      const cleanJson = text.replace(/```json|```/g, "").trim();
      const data = JSON.parse(cleanJson);

      // 4. שמירה ל-Firebase תחת "ח. סבן הייטק"
      const docRef = await addDoc(collection(db, "processed_notes"), {
        ...data,
        driver: "חכמת",
        location: location || { lat: 0, lng: 0 },
        timestamp: serverTimestamp(),
        meta: {
          apiKeyIndex: i + 1,
          apiVersion: "v1beta"
        }
      });

      return { success: true, id: docRef.id, data };

    } catch (error: any) {
      console.error(`Key ${i + 1} failed:`, error.message);
      lastErrorMessage = error.message;

      // אם זו שגיאת בטיחות (Safety) או הרשאות (403), אין טעם לנסות מפתח אחר באותה בקשה
      if (lastErrorMessage.includes("SAFETY") || lastErrorMessage.includes("403")) {
        break;
      }
      // אחרת (עומס 429 או שגיאת שרת 500) - עוברים למפתח הבא
      continue;
    }
  }

  return { 
    success: false, 
    error: `כל הניסיונות נכשלו. שגיאה אחרונה: ${lastErrorMessage}` 
  };
}
