'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { SABAN_OCR_SCHEMA, SABAN_PROMPT } from "../../lib/ocr-brain";

// אתחול ה-AI עם המפתח הסודי של סבן
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function processScan(base64Image: string, location: {lat: number, lng: number}) {
  try {
    // הגדרת המודל - gemini-1.5-pro תומך בניתוח תמונות מתקדם
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro"
    });

    // ניקוי התמונה מהקידומת של ה-Data URL
    const imageData = base64Image.split(',')[1];

    // הגדרת קונפיגורציה כ-any כדי לעקוף שגיאות טיפוס ב-Build (עבור JSON Mode)
    const generationConfig: any = {
      responseMimeType: "application/json",
    };

    // שליחה לג'ימיני עם ה-Prompt וה-Schema של ח. סבן
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [
        { inlineData: { data: imageData, mimeType: "image/jpeg" } },
        { text: `${SABAN_PROMPT} \n החזר פלט לפי המבנה הבא: ${JSON.stringify(SABAN_OCR_SCHEMA)}` }
      ]}],
      generationConfig
    });

    // חילוץ הטקסט וניקוי תגיות Markdown אם קיימות
    const responseText = result.response.text();
    const cleanJson = responseText.replace(/```json|```/g, '').trim();
    const data = JSON.parse(cleanJson);

    // שמירה ב-Firestore באוסף processed_notes
    // כאן אנחנו מתעדים את חכמת, המיקום באתר הלקוח והנתונים מהתעודה
    const docRef = await addDoc(collection(db, "processed_notes"), {
      ...data,
      driver: "חכמת",
      location,
      timestamp: serverTimestamp(),
      system_status: "AUTO_CAPTURED"
    });

    return { 
      success: true, 
      id: docRef.id, 
      data 
    };

  } catch (error) {
    console.error("Saban AI System Error:", error);
    return { 
      success: false, 
      error: "ג'ימיני לא הצליח לקרוא את התעודה. וודא שהצילום ברור ובתוך המסגרת, ונסה שוב." 
    };
  }
}
