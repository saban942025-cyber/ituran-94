'use server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { SABAN_OCR_SCHEMA, SABAN_PROMPT } from "../../lib/ocr-brain";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function processScan(base64Image: string, location: {lat: number, lng: number}) {
  try {
    // שימוש במודל 1.5 Pro שתומך ב-JSON Mode
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const imageData = base64Image.split(',')[1];

    const result = await model.generateContent([
      { inlineData: { data: imageData, mimeType: "image/jpeg" } },
      `${SABAN_PROMPT} \n החזר פלט לפי המבנה הבא: ${JSON.stringify(SABAN_OCR_SCHEMA)}`
    ]);

    const data = JSON.parse(result.response.text());

    // שמירה ל-Firestore עם המיקום של חכמת
    const docRef = await addDoc(collection(db, "processed_notes"), {
      ...data,
      driver: "חכמת",
      location,
      timestamp: serverTimestamp(),
      rawInvoiceNumber: data.invoiceNumber // לחיפוש מהיר
    });

    return { success: true, id: docRef.id, data };
  } catch (error) {
    console.error("AI Error:", error);
    return { success: false, error: "ג'ימיני לא הצליח לקרוא את התעודה, נסה לצלם שוב מקרוב" };
  }
}
