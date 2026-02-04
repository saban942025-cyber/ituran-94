'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/firebase"; 
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { SABAN_OCR_SCHEMA, SABAN_PROMPT } from "../../lib/ocr-brain";

export async function processScan(base64Image: string, location: any, localDraft: any) {
  // 1. איסוף המפתחות מה-Environment Variables
  const apiKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3
  ].filter(Boolean) as string[];

  if (apiKeys.length === 0) {
    return { success: false, error: "שגיאה: לא הוגדרו מפתחות API ב-Vercel" };
  }

  // 2. ניקוי התמונה פעם אחת לפני הלולאה
  // מוריד את כל מה שלפני ה-base64, (data:image/jpeg;base64,...)
  const base64Data = base64Image.split(',')[1] || base64Image;

  let lastErrorMessage = "";

  // 3. ניסיון סריקה עם כל מפתח עד להצלחה
  for (let i = 0; i < apiKeys.length; i++) {
    try {
      const genAI = new GoogleGenerativeAI(apiKeys[i]);
      // מעבר למודל 1.5 Flash (הכי פחות נוטה לחסום בגלל עומס)
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // הגדרה כ-any כדי לעקוף את ה-Build
      const genConfig: any = {
        temperature: 0.1,
        topP: 0.1,
        topK: 16,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      };

      const result = await model.generateContent({
        contents: [{
          role: "user",
          parts: [
            { inlineData: { data: base64Data, mimeType: "image/jpeg" } },
            { text: `${SABAN_PROMPT} \n החזר JSON בלבד לפי המבנה הזה: ${JSON.stringify(SABAN_OCR_SCHEMA)}` }
          ]
        }],
        generationConfig: genConfig
      });

      const response = await result.response;
      const text = response.text();
      
      // ניקוי תגיות במקרה שחזרו
      const cleanJson = text.replace(/```json|```/g, "").trim();
      const data = JSON.parse(cleanJson);

      // הצלחה! שומרים ומחזירים
      const docRef = await addDoc(collection(db, "processed_notes"), {
        ...data,
        driver: "חכמת",
        location: location || { lat: 0, lng: 0 },
        timestamp: serverTimestamp(),
        keyUsed: i + 1
      });

      return { success: true, id: docRef.id, data };

    } catch (error: any) {
      console.error(`Key ${i+1} failed:`, error.message);
      lastErrorMessage = error.message;
      // אם זו שגיאת בטיחות או פורמט, אין טעם להמשיך למפתח הבא באותה תמונה
      if (lastErrorMessage.includes("SAFETY") || lastErrorMessage.includes("400")) {
          break;
      }
      continue; // נסה את המפתח הבא
    }
  }

  return { 
    success: false, 
    error: `כל המפתחות נכשלו. סיבה אחרונה: ${lastErrorMessage}. נסה לצלם שוב באור חזק יותר.` 
  };
}
