'use server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function processScan(base64Image: string, location: {lat: number, lng: number}) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const imageData = base64Image.split(',')[1];

    const result = await model.generateContent([
      { inlineData: { data: imageData, mimeType: "image/jpeg" } },
      "Analyze this delivery note. Return JSON: { invoiceNumber: string, customerName: string, items: Array, handwrittenNotes: string, confidence: number }. If no invoice number found, return { error: 'ERR_NO_INVOICE' }"
    ]);

    const responseText = result.response.text();
    const data = JSON.parse(responseText.replace(/```json|```/g, ''));

    if (data.error === "ERR_NO_INVOICE") {
      return { success: false, error: "לא נמצא מספר תעודה, קרב את המצלמה" };
    }

    const docRef = await addDoc(collection(db, "processed_notes"), {
      ...data,
      driver: "חכמת",
      location,
      timestamp: serverTimestamp()
    });

    return { success: true, id: docRef.id, data };
  } catch (error) {
    return { success: false, error: "תקלה בעיבוד התמונה" };
  }
}
