'use server';

import { db } from "@/lib/firebase"; 
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function processScan(base64Image: string, type: 'invoice' | 'tachograph') {
  const key = process.env.GEMINI_API_KEY;
  
  // התיקון הקריטי: ניקוי אגרסיבי של ה-Base64
  // אנחנו מוודאים שרק ה-Data עצמו נשאר בלי שום קידומת
  const cleanBase64 = base64Image.split(',')[1] || base64Image;
  
  const mimeType = base64Image.includes('application/pdf') ? 'application/pdf' : 'image/jpeg';

  const prompt = type === 'invoice' 
    ? "Extract from delivery note: invoiceNumber, customerName, date, address. Return ONLY JSON object."
    : "Extract from Tachograph disk: driverName, date, startKm, endKm. Return ONLY JSON object.";

  try {
    console.log(`--- 🛡️ מלשינון: מנתח ${type} ---`);
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ 
            parts: [
              { inline_data: { mime_type: mimeType, data: cleanBase64 } }, 
              { text: prompt }
            ] 
          }],
          generationConfig: { 
            response_mime_type: "application/json", 
            temperature: 0.1 
          }
        })
      }
    );

    if (!response.ok) {
      const errorBody = await response.json();
      console.error("Gemini API Error Body:", JSON.stringify(errorBody));
      throw new Error(`API Error: ${response.status}`);
    }

    const result = await response.json();
    const data = JSON.parse(result.candidates[0].content.parts[0].text);

    const docRef = await addDoc(collection(db, "galia_records"), {
      ...data,
      docType: type,
      timestamp: serverTimestamp(),
    });

    return { success: true, id: docRef.id, data: { ...data, docType: type } };
  } catch (err: any) {
    console.error("Analysis failed:", err.message);
    return { success: false, error: err.message };
  }
}

export async function sendToEmail(selectedIds: string[]) {
  console.log("Office 365 Email Sync:", selectedIds);
  return { success: true };
}
