'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/firebase"; 
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function processScan(base64Image: string, location: any, localDraft: any) {
  const apiKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3
  ].filter(Boolean) as string[];

  if (apiKeys.length === 0) {
    return { success: false, error: "לא הוגדרו מפתחות API" };
  }

  const base64Data = base64Image.replace(/^data:image\/(png|jpg|jpeg);base64,/, "");
  let lastError = "";

  for (let i = 0; i < apiKeys.length; i++) {
    try {
      const genAI = new GoogleGenerativeAI(apiKeys[i]);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // עקיפת שגיאת SDK ישנה עם any
      const generationConfig: any = { temperature: 0.1 };

      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [
            { inlineData: { data: base64Data, mimeType: "image/jpeg" } },
            { text: `Analyze invoice. Return JSON ONLY: {"invoiceNumber": "string", "hasChanges": boolean}` }
          ]
        }],
        generationConfig
      });

      const response = await result.response;
      const text = response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) throw new Error("JSON_NOT_FOUND");
      const data = JSON.parse(jsonMatch[0]);

      await addDoc(collection(db, "processed_notes"), {
        ...data,
        driver: "חכמת",
        location,
        timestamp: serverTimestamp(),
        keyIndex: i + 1
      });

      return { success: true, data };

    } catch (err: any) {
      lastError = err.message;
      console.error(`Key ${i+1} failed:`, lastError);
      continue;
    }
  }

  return { success: false, error: `כל המפתחות נכשלו: ${lastError}` };
}
