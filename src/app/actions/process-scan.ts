'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { SABAN_OCR_SCHEMA, SABAN_PROMPT } from "../../lib/ocr-brain";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function processScan(base64Image: string, location: {lat: number, lng: number}) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro" 
    });

    const imageData = base64Image.split(',')[1];

    // הגדרה כ-any כדי לעקוף את חסימת ה-Build של Vercel
    const genConfig: any = {
      responseMimeType: "application/json",
    };

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [
        { inlineData: { data: imageData, mimeType: "image/jpeg" } },
        { text: `${SABAN_PROMPT} \n החזר JSON לפי המבנה הזה: ${JSON.stringify(SABAN_OCR_SCHEMA)}` }
      ]}],
      generationConfig: genConfig
    });

    const responseText = result.response.text();
    
    // ניקוי תגיות Markdown במקרה שה-AI הוסיף אותן למרות ההגדרות
    const cleanJson = responseText.replace(/```json|```/g, '').trim();
    const data = JSON.parse(cleanJson);

    // בדיקה בסיסית שחולצו נתונים
    if (!data.invoiceNumber || data.invoiceNumber === "unknown") {
      throw new Error("Missing invoice number");
    }

    // שמירה ל-Firebase
    const docRef = await addDoc(collection(db, "processed_notes"), {
      ...data,
      driver: "חכמת",
      location,
      timestamp: serverTimestamp(),
      status: "SUCCESS"
    });

    return { 
      success: true, 
      id: docRef.id, 
      data 
    };

  } catch (error) {
    console.error("Saban System Error:", error);
    // החזרת הודעה ברורה למשתמש (לחכמת)
    return { 
      success: false, 
      error: "ג'ימיני לא זיהה את מספר התעודה. וודא שהצילום ישר וברור ונסה שוב." 
    };
  }
}
