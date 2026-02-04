'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/firebase"; 
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { SABAN_OCR_SCHEMA, SABAN_PROMPT } from "../../lib/ocr-brain";

export async function processScan(base64Image: string, location: any, localDraft: any) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { success: false, error: "מפתח API חסר בשרת" };

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // שלב קריטי: ניקוי ה-Base64 מכל ה-Header (data:image/jpeg;base64,...)
    const base64Clean = base64Image.replace(/^data:image\/(png|jpg|jpeg);base64,/, "");

    // יצירת חלקי ההודעה כפי שגוגל דורשת בדיוק
    const promptParts = [
      {
        inlineData: {
          data: base64Clean,
          mimeType: "image/jpeg"
        }
      },
      {
        text: `${SABAN_PROMPT}
        נתונים מקוריים מהמשרד: ${JSON.stringify(localDraft)}
        תבנית JSON נדרשת: ${JSON.stringify(SABAN_OCR_SCHEMA)}
        תחזיר אך ורק JSON תקין.`
      }
    ];

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: promptParts }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1, // יציבות מקסימלית
      }
    });

    const responseText = result.response.text();
    const data = JSON.parse(responseText.trim());

    // שמירה ל-Firebase
    await addDoc(collection(db, "processed_notes"), {
      ...data,
      driver: "חכמת",
      location: location || { lat: 0, lng: 0 },
      timestamp: serverTimestamp()
    });

    return { success: true, data };

  } catch (error: any) {
    console.error("Critical Gemini Error:", error);
    // אם גוגל חוסמת, ננסה להבין אם זה בגלל בטיחות או פורמט
    const errorMsg = error.message || "";
    if (errorMsg.includes("400") || errorMsg.includes("safety")) {
       return { success: false, error: "ג'ימיני חסם את התמונה מטעמי בטיחות. נסה לצלם רק את מרכז הדף ללא רקע." };
    }
    return { success: false, error: "תקשורת נדחתה. נסה להקטין את התמונה או לצלם שוב." };
  }
}
