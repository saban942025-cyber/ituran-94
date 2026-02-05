'use server';
import { db } from "@/lib/firebase"; 
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

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
              { text: `נתח את תעודת המשלוח הזו עבור ח. סבן. 
                1. זהה כתב יד (הערות נהג, סימוני חוסר, חתימות).
                2. חלץ טבלה של מוצרים: שם מוצר, כמות מקורית, וכמות שהוחזרה/חסרה (אם סומן בכתב יד).
                Return ONLY JSON: 
                {
                  "invoiceNumber": "string",
                  "customerName": "string",
                  "items": [{"name": "string", "qty": number, "returned": number}],
                  "handwrittenNotes": "string",
                  "hasDiscrepancy": boolean
                }` 
              }
            ]
          }]
        })
      }
    );

    const result = await response.json();
    const text = result.candidates[0].content.parts[0].text;
    const data = JSON.parse(text.match(/\{[\s\S]*\}/)[0]);

    await addDoc(collection(db, "processed_notes"), { ...data, timestamp: serverTimestamp() });
    return { success: true, data };
  } catch (err) {
    return { success: false, error: "ניתוח מוצרים נכשל" };
  }
}
