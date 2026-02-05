'use server';

import { db } from "@/lib/firebase"; 
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function processScan(base64Image: string, type: 'invoice' | 'tachograph') {
  const key = process.env.GEMINI_API_KEY;
  const cleanBase64 = base64Image.replace(/^data:.*?;base64,/, "");
  const mimeType = base64Image.includes('application/pdf') ? 'application/pdf' : 'image/jpeg';

  const prompt = type === 'invoice' 
    ? "Extract from delivery note: invoiceNumber, customerName, date, address. Return ONLY JSON."
    : "Extract from Tachograph disk: driverName, date, startKm, endKm. Return ONLY JSON.";

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ inline_data: { mime_type: mimeType, data: cleanBase64 } }, { text: prompt }] }],
          generationConfig: { response_mime_type: "application/json", temperature: 0.1 }
        })
      }
    );

    const result = await response.json();
    const data = JSON.parse(result.candidates[0].content.parts[0].text);

    const docRef = await addDoc(collection(db, "galia_records"), {
      ...data,
      docType: type,
      timestamp: serverTimestamp(),
    });

    return { success: true, id: docRef.id, data: { ...data, docType: type } };
  } catch (err) {
    return { success: false, error: "Analysis failed" };
  }
}

// פונקציית שליחה למייל (מדמה שליחה דרך 365)
export async function sendToEmail(selectedIds: any[]) {
  console.log("Sending records to Office 365 Mail:", selectedIds);
  return { success: true };
}
