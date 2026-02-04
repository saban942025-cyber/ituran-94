'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { SABAN_OCR_SCHEMA, SABAN_PROMPT } from "../../lib/ocr-brain";

// אתחול ה-AI עם המפתח שמוגדר ב-Vercel
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function processScan(base64Image: string, location: {lat: number, lng: number}) {
  try {
    // הגדרת המודל - משתמשים ב-1.5 Pro לביצועים מקסימליים
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro"
    });

    // הכנת התמונה (מוריד את הקידומת של ה-Base64)
    const imageData = base64Image.split(',')[1];

    // שליחה לג'ימיני עם ה-Prompt וה-Schema של סבן
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [
        { inlineData: { data: imageData, mimeType: "image/jpeg" } },
        { text: `${SABAN_PROMPT} \n החזר פלט לפי המבנה הבא: ${JSON.stringify(SABAN_OCR_SCHEMA)}` }
      ]}],
      // @ts-ignore - התעלמות משגיאת טיפוס בגלל גרסת SDK ישנה
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    // קבלת התשובה וניקוי תגיות JSON אם קיימות
    const responseText = result.response.text();
    const cleanJson = responseText.replace(/```json|```/g, '').trim();
    const data = JSON.parse(cleanJson);

    // שמירה ב-Firestore באוסף processed_notes
    const docRef = await addDoc(collection(db, "processed_notes"), {
      ...data,
      driver: "חכמת",
      location,
      timestamp: serverTimestamp(),
      system_version: "1.1.0"
    });

    return { 
      success: true, 
      id: docRef.id, 
      data 
    };

  } catch (error) {
    console.error("Saban AI Error:", error);
    return { 
      success: false, 
      error: "ג'ימיני לא הצליח לקרוא את התעודה. וודא שהצילום ברור ונסה שוב." 
    };
  }
}
