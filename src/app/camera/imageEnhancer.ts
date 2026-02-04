/**
 * Saban 94 Image Enhancement Engine
 * מבצע אופטימיזציה של ניגודיות וחדות כדי לשפר את פענוח ה-OCR של ג'ימיני
 */

export function enhanceImageInCanvas(
  canvas: HTMLCanvasElement,
  contrastBoost = 1.35, // מגדיל את הניגודיות ב-35%
  brightnessBoost = 1.05 // משפר בהירות ב-5%
): string {
  const ctx = canvas.getContext("2d")!;
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imgData.data;

  // 1. שלב הניגודיות והבהירות (Linear Transform)
  // הופך את הלבן לבהיר יותר ואת השחור (העט) לכהה יותר
  for (let i = 0; i < d.length; i += 4) {
    // ערוצי R, G, B
    d[i]     = truncate((d[i] - 128) * contrastBoost + 128 * brightnessBoost);
    d[i + 1] = truncate((d[i + 1] - 128) * contrastBoost + 128 * brightnessBoost);
    d[i + 2] = truncate((d[i + 2] - 128) * contrastBoost + 128 * brightnessBoost);
    // ערוץ Alpha (שקיפות) נשאר ללא שינוי d[i+3]
  }

  // החלת השינויים הראשוניים על הקנבס
  ctx.putImageData(imgData, 0, 0);

  // 2. שלב החידוד (Sharpening / Unsharp Mask)
  // עוזר לג'ימיני לזהות קצוות של אותיות ומספרים
  const temp = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const blurred = boxBlur(temp, canvas.width, canvas.height);
  const bd = blurred.data;

  for (let i = 0; i < d.length; i += 4) {
    // חישוב ההפרש בין התמונה המטושטשת למקורית והוספתו (זה יוצר חידוד)
    d[i]     = truncate(d[i]     + (d[i]     - bd[i]) * 0.4);
    d[i + 1] = truncate(d[i + 1] + (d[i + 1] - bd[i + 1]) * 0.4);
    d[i + 2] = truncate(d[i + 2] + (d[i + 2] - bd[i + 2]) * 0.4);
  }

  // החלת החידוד הסופי
  ctx.putImageData(imgData, 0, 0);

  // החזרת התמונה כ-DataURL בפורמט JPEG דחוס מעט (לביצועים מהירים ב-Vercel)
  return canvas.toDataURL("image/jpeg", 0.92);
}

// פונקציית עזר למניעת חריגת ערכי פיקסל (0-255)
function truncate(v: number): number {
  return Math.max(0, Math.min(255, v));
}

// אלגוריתם טשטוש פשוט (Box Blur) המשמש כבסיס לחידוד
function boxBlur(imageData: ImageData, w: number, h: number): ImageData {
  const out = new ImageData(w, h);
  const d = imageData.data;
  const o = out.data;

  const getIdx = (x: number, y: number) => (y * w + x) * 4;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      let rs = 0, gs = 0, bs = 0;

      // סכימת הפיקסלים השכנים (מטריצה 3x3)
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const i = getIdx(x + dx, y + dy);
          rs += d[i];
          gs += d[i + 1];
          bs += d[i + 2];
        }
      }

      const oidx = getIdx(x, y);
      o[oidx]     = rs / 9;
      o[oidx + 1] = gs / 9;
      o[oidx + 2] = bs / 9;
      o[oidx + 3] = 255; // אטום לגמרי
    }
  }
  return out;
}
