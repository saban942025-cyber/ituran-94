'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/firebase"; 
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { SABAN_OCR_SCHEMA, SABAN_PROMPT } from "../../lib/ocr-brain";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function processScan(base64Image: string, location: any, localDraft: any) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const imageData = base64Image.split(',')[1];

    const genConfig: any = { responseMimeType: "application/json" };

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [
        { inlineData: { data: imageData, mimeType: "image/jpeg" } },
        { text: `${SABAN_PROMPT} \n Draft data: ${JSON.stringify(localDraft)} \n Schema: ${JSON.stringify(SABAN_OCR_SCHEMA)}` }
      ]}],
      generationConfig: genConfig
    });

    const data = JSON.parse(result.response.text().replace(/```json|```/g, '').trim());

    // שמירה ל-Firebase
    const docRef = await addDoc(collection(db, "processed_notes"), {
      ...data,
      driver: "חכמת",
      location,
      timestamp: serverTimestamp()
    });

    if (data.hasChanges) {
       await addDoc(collection(db, "diff_alerts"), {
         invoiceNumber: data.invoiceNumber,
         at: new Date().toISOString(),
         diff: data,
         driverName: "חכמת"
       });
    }

    return { success: true, id: docRef.id, data };
  } catch (error) {
    console.error(error);
    return { success: false, error: "שגיאה בניתוח התעודה" };
  }
}
