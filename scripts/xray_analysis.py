import os
import re
import json
import numpy as np
from datetime import datetime
from pdf2image import convert_from_path
from PIL import Image, ImageOps, ImageFilter
import pytesseract
import easyocr

# הגדרות מערכת - ח. סבן
DPI_TARGET = 300
ROI_RADIUS = 300  # רדיוס בפיקסלים סביב העוגן
TIME_RE = re.compile(r'([01]?\d|2[0-3]):[0-5]\d')
ANCHORS = ["חתימת הלקוח", "שם הנהג", "חתימה"]

# טעינת המודל (פעם אחת בלבד לביצועים)
print("--- Loading EasyOCR Engine (Hebrew/English) ---")
reader = easyocr.Reader(['he', 'en'], gpu=False)

class SabanOCR:
    @staticmethod
    def validate_resolution(img):
        """בדיקה אוטומטית אם הרזולוציה מספיקה לחיתוך ROI"""
        width, height = img.size
        if width < 1500 or height < 2000:
            print(f"⚠️ אזהרה: רזולוציה נמוכה ({width}x{height}). מבצע הגדלה דיגיטלית.")
            return img.resize((width * 2, height * 2), Image.Resampling.LANCZOS)
        return img

    @staticmethod
    def preprocess_for_anchor(img):
        """הכנת התמונה לאיתור העוגן המודפס"""
        gray = ImageOps.grayscale(img)
        # חיזוק ניגודיות למילים מודפסות
        return gray.point(lambda x: 0 if x < 150 else 255, mode='1')

    @staticmethod
    def find_anchor(page_img):
        """מוצא את מיקום המילה 'חתימה' או 'חתימת הלקוח'"""
        processed = SabanOCR.preprocess_for_anchor(page_img)
        data = pytesseract.image_to_data(processed, lang="heb+eng", output_type=pytesseract.Output.DICT)
        
        for i, text in enumerate(data['text']):
            clean_text = text.strip()
            if any(anchor in clean_text for anchor in ANCHORS):
                x, y, w, h = data['left'][i], data['top'][i], data['width'][i], data['height'][i]
                return (x + w//2, y + h//2) # מחזיר את מרכז העוגן
        return None

    @staticmethod
    def extract_time_from_roi(page_img, center_coords):
        """חיתוך ROI וביצוע EasyOCR ממוקד על כתב יד"""
        cx, cy = center_coords
        # הגדרת תיבת החיתוך
        left = max(0, cx - ROI_RADIUS)
        top = max(0, cy - ROI_RADIUS)
        right = min(page_img.width, cx + ROI_RADIUS)
        bottom = min(page_img.height, cy + ROI_RADIUS)
        
        roi = page_img.crop((left, top, right, bottom))
        
        # דיבאג: שמירת החיתוך כדי לראות מה ה-AI רואה
        # roi.save("debug_roi_last.png") 

        # המרה ל-Numpy עבור EasyOCR
        roi_np = np.array(roi)
        results = reader.readtext(roi_np, allowlist="0123456789:", detail=0)
        
        combined_text = " ".join(results)
        match = TIME_RE.search(combined_text)
        return match.group(0) if match else None

def analyze_delivery_note(pdf_path):
    """הפונקציה המרכזית לניתוח תעודה בודדת"""
    try:
        pages = convert_from_path(pdf_path, dpi=DPI_TARGET)
        page = SabanOCR.validate_resolution(pages[0])
        
        # 1. איתור עוגן
        anchor_center = SabanOCR.find_anchor(page)
        
        if not anchor_center:
            return {"status": "error", "message": "לא נמצא עוגן חתימה בתעודה"}

        # 2. חילוץ שעת כתב יד
        handwritten_time = SabanOCR.extract_time_from_roi(page, anchor_center)
        
        return {
            "status": "success",
            "ticketId": re.search(r'(\d{7})', pdf_path).group(1) if re.search(r'(\d{7})', pdf_path) else "Unknown",
            "handwrittenTime": handwritten_time,
            "analysisMethod": "ROI_Anchor_EasyOCR"
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

# --- דוגמת הרצה והצלבה לוגית (יהודה הלוי) ---
if __name__ == "__main__":
    test_pdf = "path_to_your_ticket.pdf"
    result = analyze_delivery_note(test_pdf)
    
    if result["status"] == "success":
        # הצלבה ליהודה הלוי (14:37)
        pto_time = "14:37"
        if result["handwrittenTime"]:
            h1, m1 = map(int, result["handwrittenTime"].split(":"))
            h2, m2 = map(int, pto_time.split(":"))
            diff = abs((h1 * 60 + m1) - (h2 * 60 + m2))
            
            print(f"--- תוצאות רנטגן לתיק # {result['ticketId']} ---")
            print(f"זמן כתב יד: {result['handwrittenTime']}")
            print(f"זמן איתוראן: {pto_time}")
            print(f"פער: {diff} דקות")
            print(f"סטטוס: {'⚠️ חריגה' if diff > 10 else '✅ תקין'}")
