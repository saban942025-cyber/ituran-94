import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  const { image } = await req.json();
  const base64Data = image.split(",")[1];

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    אתה עוזר הדרכה לנהג משאית חומרי בניין (חכמת).
    נתח את איכות הצילום של תעודת המשלוח:
    1. האם רואים את כל הפרטים (שם לקוח, פריטים, חתימה)?
    2. האם התמונה מטושטשת או חשוכה?
    
    החזר JSON בלבד בפורמט:
    {"isGood": boolean, "advice": "הוראה קצרה ופשוטה בעברית אם התמונה לא טובה"}
    
    דוגמאות להוראות: "תדליק אור", "תתקרב קצת לדף", "הדף חתוך, צלם שוב".
  `;

  const result = await model.generateContent([
    prompt,
    { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
  ]);

  const text = result.response.text();
  const cleanJson = text.replace(/```json|```/g, "");
  
  return Response.json(JSON.parse(cleanJson));
}
