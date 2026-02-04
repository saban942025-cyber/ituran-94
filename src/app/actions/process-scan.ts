'use server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/firebase"; // וודא שהנתיב תקין
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function processScan(base64Image: string, location: {lat: number, lng: number}) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // שליחה לג'ימיני
    const result = await model.generateContent([
      { inlineData: { data: base64Image.split(',')[1], mimeType: "image/jpeg" } },
      "Extract data from this delivery note as JSON. Include invoiceNumber, customerName, items (itemId, name, quantity), and handwrittenNotes."
    ]);

    const data = JSON.parse(result.response.text());

    // שמירה ל-Firebase עם ה"מוח" הלוגיסטי
    const docRef = await addDoc(collection(db, "processed_notes"), {
      ...data,
      driver: "חכמת",
      location,
      status: data.items.some((i: any) => i.quantity > 100) ? "FLAGGED" : "APPROVED",
      timestamp: serverTimestamp()
    });

    return { success: true, id: docRef.id, data };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to process scan" };
  }
}
