// src/app/api/gemini/validate/route.ts
export async function POST(req: Request) {
  const { image } = await req.json();
  
  const prompt = `
    נתח את איכות התמונה של תעודת המשלוח:
    1. האם כל הטקסט קריא?
    2. האם התמונה מטושטשת?
    3. האם רואים את כל ארבעת הפינות של הדף?
    אם התמונה טובה, החזר {"isClear": true}.
    אם לא, החזר {"isClear": false, "instruction": "הוראה פשוטה בעברית לנהג בשטח"}.
  `;
  
  // קריאה לג'ימיני...
}
