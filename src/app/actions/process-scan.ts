export async function processScan(base64Image: string, location: any, localDraft: any) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { success: false, error: "מפתח API חסר ב-Vercel" };

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // משתמשים בגרסת ה-Flash - היא הרבה יותר מהירה ופחות "רגישה" לחסימות
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
    });

    // ניקוי יסודי של ה-Base64
    const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [
        { inlineData: { data: base64Data, mimeType: "image/jpeg" } },
        { text: `${SABAN_PROMPT} 
          Draft: ${JSON.stringify(localDraft)} 
          Schema: ${JSON.stringify(SABAN_OCR_SCHEMA)}
          Return JSON only.` 
        }
      ]}],
      // הגדרות למניעת חסימות מיותרות של גוגל
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
      ],
      generationConfig: { responseMimeType: "application/json" }
    });

    const data = JSON.parse(result.response.text().trim());
    
    // שמירה ל-Firebase
    await addDoc(collection(db, "processed_notes"), {
      ...data,
      driver: "חכמת",
      timestamp: serverTimestamp()
    });

    return { success: true, data };

  } catch (error: any) {
    console.error("Gemini Error Detail:", error);
    // אם ג'ימיני דוחה בגלל עומס או בטיחות
    return { success: false, error: "ג'ימיני עמוס או שהתמונה לא ברורה. נסה לצלם שוב מרחוק יותר." };
  }
}
