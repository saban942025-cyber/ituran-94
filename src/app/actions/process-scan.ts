'use server';

import { db } from "@/lib/firebase"; 
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// הגדלת מגבלת הנפח ל-Server Actions (למקרה שהכיווץ עדיין גדול)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

let blacklistedKeys = new Set<string>();

export async function processScan(base64Image: string, location: any, localDraft: any) {
  const allKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3
  ].filter(Boolean) as string[];

  const activeKeys = allKeys.filter(k => !blacklistedKeys.has(k));
  const cleanBase64 = base64Image.replace(/^data:.*?;base64,/, "");
  const mimeType = base64Image.includes('application/pdf') ? 'application/pdf' : 'image/jpeg';

  for (let i = 0; i < activeKeys.length; i++) {
    const key = activeKeys[i];
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
                { text: `Analyze this delivery note for Saban 94. 
                  1. Identify handwritten notes or corrections.
                  2. Extract items table: name, original qty, and discrepancy (returned/missing).
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

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      const text = result.candidates[0].content.parts[0].text;
      const data = JSON.parse(text.match(/\{[\s\S]*\}/)[0]);

      await addDoc(collection(db, "processed_notes"), {
        ...data,
        timestamp: serverTimestamp(),
        source: "GALIA_OFFICE"
      });

      return { success: true, data };
    } catch (err: any) {
      console.error(`Key ${i+1} failed: ${err.message}`);
      if (err.message.includes("403")) blacklistedKeys.add(key);
      continue;
    }
  }
  return { success: false, error: "כל הניסיונות נכשלו" };
}
