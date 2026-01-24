import os
import glob
import json
import re
import numpy as np
from datetime import datetime
from pdf2image import convert_from_path
from PIL import Image
import easyocr

# הגדרות נתיבים חסינות לסביבת GitHub ו-Local
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOWNLOADS_DIR = os.path.join(BASE_DIR, 'scripts', 'downloads')
RESULTS_FILE = os.path.join(BASE_DIR, 'scripts', 'results.json')

def run_analysis():
    # וידוא קיום תיקיות
    os.makedirs(DOWNLOADS_DIR, exist_ok=True)
    
    print("--- Saban X-Ray: Starting Professional ROI Analysis (V3) ---")
    
    # חיפוש תעודות PDF
    pdf_files = glob.glob(os.path.join(DOWNLOADS_DIR, "*.pdf"))
    if not pdf_files:
        print("❌ No PDF files found to analyze.")
        with open(RESULTS_FILE, 'w') as f: json.dump([], f)
        return

    # טעינת מנוע ה-OCR (עברית ואנגלית)
    try:
        print("Initializing EasyOCR Engine...")
        reader = easyocr.Reader(['he', 'en'], gpu=False)
        print("✅ OCR Engine Ready.")
    except Exception as e:
        print(f"❌ Critical OCR Error: {e}")
        return

    all_results = []

    for pdf_path in pdf_files:
        filename = os.path.basename(pdf_path)
        try:
            print(f"Analyzing: {filename}")
            
            # שלב 1: המרה לתמונה ב-DPI 300 לדיוק מקסימלי
            pages = convert_from_path(pdf_path, dpi=300)
            if not pages:
                raise ValueError("No pages rendered from PDF.")
            img = pages[0]
            
            # שלב 2: חיתוך ROI ממוקד (40% התחתונים של הדף)
            width, height = img.size
            start_y = int(height * 0.6) 
            roi_box = (0, start_y, width, height)
            roi_img = img.crop(roi_box)

            # שלב 3: שמירת תמונת דיבאג (כדי לראות מה ה-AI רואה)
            debug_img_name = f"debug_roi_{filename}.png"
            roi_img.save(os.path.join(DOWNLOADS_DIR, debug_img_name))
            
            # שלב 4: עיבוד ה-OCR
            roi_np = np.array(roi_img)

            # קריאה גולמית לדיבאג
            raw_results = reader.readtext(roi_np, detail=0)
            combined_raw = " ".join(raw_results)

            # קריאה מסוננת (מספרים וסימני זמן)
            ocr_results = reader.readtext(roi_np, detail=0, allowlist="0123456789:.- ")
            combined_text = " ".join(ocr_results)
            
            # שלב 5: חיפוש שעה עם Regex גמיש (תומך ב-14:30, 14.30, ו-1430)
            # מחפש שתי ספרות, מפריד אופציונלי, ושתי ספרות דקות
            time_match = re.search(r'([01]?\d|2[0-3])[:\.\-\s]?([0-5]\d)', combined_text)
            
            if time_match:
                # נירמול לפורמט HH:MM תקני
                hours, minutes = time_match.groups()
                found_time = f"{hours.zfill(2)}:{minutes}"
            else:
                found_time = None
            
            # חילוץ מזהה תעודה (ספרות ראשונות משם הקובץ)
            ticket_id = "".join(filter(str.isdigit, filename))[:7]
            
            all_results.append({
                "ticketId": ticket_id or "0000000",
                "handwrittenTime": found_time,
                "status": "Success" if found_time else "Time_Not_Found",
                "filename": filename,
                "debugImage": debug_img_name,
                "ocr_raw": combined_raw,
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            })
            print(f"   -> Result: {found_time if found_time else 'NOT FOUND'}")

        except Exception as e:
            print(f"❌ Failed to process {filename}: {e}")

    # שמירת תוצאות סופיות
    with open(RESULTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_results, f, indent=2, ensure_ascii=False)
    
    print(f"--- Analysis Completed. Results saved to {RESULTS_FILE} ---")

if __name__ == "__main__":
    run_analysis()
