import os
import glob
import json
import re
import numpy as np
from datetime import datetime
from pdf2image import convert_from_path
from PIL import Image, ImageOps
import pytesseract
import easyocr

# הגדרות נתיבים חסינות לסביבת GitHub ו-Local
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOWNLOADS_DIR = os.path.join(BASE_DIR, 'scripts', 'downloads')
RESULTS_FILE = os.path.join(BASE_DIR, 'scripts', 'results.json')

def run_analysis():
    # וידוא קיום תיקיות
    os.makedirs(DOWNLOADS_DIR, exist_ok=True)
    
    print("--- Saban X-Ray: Starting ROI Focused Analysis (V2) ---")
    
    # חיפוש תעודות PDF בתיקיית ה-downloads
    pdf_files = glob.glob(os.path.join(DOWNLOADS_DIR, "*.pdf"))
    if not pdf_files:
        print("❌ No PDF files found to analyze.")
        with open(RESULTS_FILE, 'w') as f: json.dump([], f)
        return

    # טעינת מנוע ה-OCR פעם אחת לביצועים
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
            
            # שלב 1: המרה לתמונה ב-DPI 300 (קריטי לכתב יד)
            pages = convert_from_path(pdf_path, dpi=300)
            img = pages[0]
            
            # שלב 2: חיתוך ROI ממוקד (רק 35% התחתונים של התעודה)
            width, height = img.size
            # חותכים את האזור שבו נמצאות בדרך כלל החתימה והשעה
            roi_box = (0, int(height * 0.65), width, height) 
            roi_img = img.crop(roi_box)
            
            # שלב 3: שמירת תמונת דיבאג (כדי שנוכל לראות מה ה-AI רואה)
            debug_img_name = f"debug_roi_{filename}.png"
            roi_img.save(os.path.join(DOWNLOADS_DIR, debug_img_name))
            print(f"   -> Saved ROI Debug: {debug_img_name}")
            
            # שלב 4: זיהוי שעה בתוך ה-ROI בלבד
            roi_np = np.array(roi_img)
            # שימוש ב-allowlist כדי למנוע "רעש" של אותיות בתוך השעה
            ocr_results = reader.readtext(roi_np, detail=0, allowlist="0123456789:")
            combined_text = " ".join(ocr_results)
            
            # חיפוש תבנית שעה HH:MM
            time_match = re.search(r'([01]?\d|2[0-3]):[0-5]\d', combined_text)
            found_time = time_match.group(0) if time_match else None
            
            # חילוץ מזהה תעודה משם הקובץ (7 ספרות)
            ticket_id = "".join(filter(str.isdigit, filename))[:7]
            
            all_results.append({
                "ticketId": ticket_id or "0000000",
                "handwrittenTime": found_time,
                "status": "Success" if found_time else "Time_Not_Found",
                "filename": filename,
                "debugImage": debug_img_name
            })
            print(f"   -> Result: {found_time if found_time else 'NOT FOUND'}")

        except Exception as e:
            print(f"❌ Failed to process {filename}: {e}")

    # שמירת התוצאות הסופיות ל-JSON
    with open(RESULTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_results, f, indent=2, ensure_ascii=False)
    
    print(f"--- Analysis Completed. Results: {RESULTS_FILE} ---")

if __name__ == "__main__":
    run_analysis()
