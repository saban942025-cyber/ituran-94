'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/firebase"; 
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { SABAN_OCR_SCHEMA, SABAN_PROMPT } from "../../lib/ocr-brain";

export async function processScan(base64Image: string, location: any, localDraft: any) {
  // 1. רשימת מפתחות לגיבוי
  const apiKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3
  ].filter(Boolean) as string[];

  if (apiKeys.length === 0) {
    return { success: false, error: "לא הוגדרו מפתחות API" };
  }

  let lastError = "";

  // 2. לולאת הדילוג (Failover)
  for (let i = 0; i < apiKeys.length; i++) {
    try {
      const genAI = new GoogleGenerativeAI(apiKeys[i]);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const base64Clean = base64Image.replace(/^data:image\/(png|jpg|jpeg);base64,/, "");

      // מעקף TypeScript: הגדרת הקונפיגורציה כ-any
      const generationConfig: any = { 
        responseMimeType: "application/json",
        temperature: 0.1 
      };

      const result = await model.generateContent({
        contents: [{ 
          role: 'user', 
          parts: [
            { inlineData: { data: base64Clean, mimeType: "image/jpeg" } },
            { text: `${SABAN_PROMPT} \n מבנה JSON נדרש: ${JSON.stringify(SABAN_OCR_SCHEMA)} \n טיוטה: ${JSON.stringify(localDraft)}` }
          ]
        }],
        generationConfig
      });

      const responseText = result.response.text();
      const data = JSON.parse(responseText.replace(/```json|```/g, '').trim());

      // שמירה ל-Firebase
      const docRef = await addDoc(collection(db, "processed_notes"), {
        ...data,
        driver: "חכמת",
        location: location || { lat: 0, lng: 0 },
        timestamp: serverTimestamp(),
        usedKeyIndex: i + 1
      });

      return { success: true, id: docRef.id, data };

    } catch (error: any) {
      lastError = error.message || "Unknown Error";
      console.error(`Attempt ${i+1} failed:`, lastError);
      if (i === apiKeys.length - 1) break;
      continue;
    }
  }

  return { success: false, error: `כל המפתחות נכשלו: ${lastError}` };
}
