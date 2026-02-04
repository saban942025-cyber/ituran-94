'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/firebase"; 
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { SABAN_OCR_SCHEMA, SABAN_PROMPT } from "../../lib/ocr-brain";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function processScan(base64Image: string, location: any, localDraft: any) {
  try {
    // 1. אתחול המודל
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // 2. הכנת התמונה
    const imageData = base64Image.split(',')[1];

    // 3. הגדרת קונפיגורציה גמישה
    const genConfig: any = { 
      responseMimeType: "application/json" 
    };

    // 4. פנייה ל-AI
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [
        { inlineData: { data: imageData, mimeType: "image/jpeg" } },
        { text: `${SABAN_PROMPT} 
          הנתונים המקוריים מהמשרד (Draft): ${JSON.stringify(localDraft)} 
          חובה להחזיר פלט במבנה JSON הבא בלבד: ${JSON.stringify(SABAN_OCR_SCHEMA)}` 
        }
      ]}],
      generationConfig: genConfig
    });

    const responseText = result.response.text();
    console.log("Raw Gemini Response:", responseText); // לצפייה בלוגים של Vercel

    // 5. מנגנון חילוץ JSON חסין (מנקה Markdown ותווים מיותרים)
    let cleanJson = responseText;
    if (responseText.includes("```")) {
      cleanJson = responseText.split(/```(?:json)?/)[1].split("```")[0];
    }
    
    const data = JSON.parse(cleanJson.trim());

    // 6. שמירה ל-Firebase
    const docRef = await addDoc(collection(db, "processed_notes"), {
      ...data,
      driver: "חכמת",
      location: location || { lat: 0, lng: 0 },
      timestamp: serverTimestamp(),
      rawResponse: responseText.substring(0, 500) // לביקורת במקרה של תקלה
    });

    // 7. אם יש חריגות - רישום התראה
    if (data.hasChanges) {
       await addDoc(collection(db, "diff_alerts"), {
         invoiceNumber: data.invoiceNumber,
         at: new Date().toISOString(),
         diff: data,
         driverName: "חכמת",
         location
       });
    }

    return { success: true, id: docRef.id, data };

  } catch (error: any) {
    console.error("Detailed AI Error:", error);
    
    // הודעת שגיאה מפורטת יותר לחכמת
    let userMessage = "ג'ימיני לא זיהה את התעודה.";
    if (error.message?.includes("Unexpected token")) {
      userMessage = "שגיאת מבנה נתונים - נסה לצלם שוב ישר יותר.";
    }
    
    return { success: false, error: userMessage };
  }
}
