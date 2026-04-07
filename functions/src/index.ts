// functions/src/index.ts
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";

admin.initializeApp();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const onNewScanProcess = functions.storage.object().onFinalize(async (object) => {
  const filePath = object.name;
  if (!filePath?.startsWith("scans/")) return;

  const bucket = admin.storage().bucket(object.bucket);
  const [fileBuffer] = await bucket.file(filePath).download();
  const base64Data = fileBuffer.toString("base64");

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  // שימוש ב-SABAN_PROMPT וב-Schema שהגדרנו [cite: 31, 33]
  const prompt = `נתח את תעודת המשלוח. זהה חתימה בפינה שמאלית תחתונה. 
                  אם יש תיקון ידני בכמות, עדכן ב-newQty. החזר JSON בלבד.`;

  const result = await model.generateContent([
    prompt,
    { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
  ]);

  const extractedData = JSON.parse(result.response.text().replace(/```json|```/g, ""));

  // שמירה ל-Firestore כעובד שחור [cite: 22, 23]
  await admin.firestore().collection("processed_notes").add({
    ...extractedData,
    originalFile: filePath,
    status: "analyzed",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    magicToken: Math.random().toString(36).substring(2, 15) // טוקן ללינק קסם
  });

  return console.log(`Ticket ${extractedData.invoiceNumber} processed successfully.`);
});
