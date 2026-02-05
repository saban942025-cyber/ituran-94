'use server';

import { db } from "@/lib/firebase"; 
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// הגדלת מגבלת הנפח ל-10MB בשרת
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export async function processScan(base64Image: string, location: any, localDraft: any) {
  const key = process.env.GEMINI_API_KEY;
  const cleanBase64 = base64Image.replace(/^data:.*?;base64,/, "");
  const mimeType = base64Image.includes('application/pdf') ? 'application/pdf' : 'image/jpeg';

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: mimeType, data: cleanBase64 } },
              { text: "Extract exactly these 3 fields: invoiceNumber, customerName, invoiceDate. Return ONLY JSON." }
            ]
          }],
          generationConfig: { temperature: 0.1 }
        })
      }
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const result = await response.json();
    const rawText = result.candidates[0].content.parts[0].text;
    const data = JSON.parse(rawText.match(/\{[\s\S]*\}/)[0]);

    // שמירה ל-Firebase כגשר נתונים
    const docRef = await addDoc(collection(db, "processed_notes"), {
      ...data,
      timestamp: serverTimestamp(),
      source: "SABAN_BRIDGE_SYNC"
    });

    return { success: true, id: docRef.id, data };
  } catch (err: any) {
    console.error("Analysis error:", err.message);
    return { success: false, error: err.message };
  }
}
