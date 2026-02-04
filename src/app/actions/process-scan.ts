'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/firebase"; 
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { SABAN_OCR_SCHEMA, SABAN_PROMPT } from "../../lib/ocr-brain";

export async function processScan(base64Image: string, location: any, localDraft: any) {
  // 1. בדיקת מפתח API
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { success: false, error: "API_KEY_MISSING: וודא שהגדרת GEMINI_API_KEY ב-Vercel" };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // 2. הכנת התמונה (חיתוך הקידומת)
    const imageData = base64Image.split(',')[1];

    // 3. הגדרת JSON Mode
    const genConfig: any = { responseMimeType: "application/json" };

    // 4. פנייה לג'ימיני
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [
        { inlineData: { data: imageData, mimeType: "image/jpeg" } },
        { text: `${SABAN_PROMPT} 
          נתונים מקוריים: ${JSON.stringify(localDraft)} 
          מבנה נדרש: ${JSON.stringify(SABAN_OCR_SCHEMA)}` 
        }
      ]}],
      generationConfig: genConfig
    });

    const responseText = result.response.text();
    
    // 5. ניקוי ופענוח JSON
    let cleanJson = responseText.replace(/```json|```/g, '').trim();
    const data = JSON.parse(cleanJson);

    // 6. שמירה ל-Firebase
    const docRef = await addDoc(collection(db, "processed_notes"), {
      ...data,
      driver: "חכמת",
      location: location || { lat: 0, lng: 0 },
      timestamp: serverTimestamp(),
      system_log: "Processed via Gemini 1.5 Pro"
    });

    // 7. התראה למשרד אם יש שינוי
    if (data.hasChanges) {
       await addDoc(collection(db, "diff_alerts"), {
         invoiceNumber: data.invoiceNumber,
         at: new Date().toISOString(),
         diff: data,
         driverName: "חכמת"
       });
    }

    return { success: true, id: docRef.id, data };

  } catch (error: any) {
    console.error("Saban AI Error:", error);
    return { 
      success: false, 
      error: `GEMINI_REJECTED: ${error.message || "ג'ימיני לא הצליח לעבד את התמונה"}` 
    };
  }
}
