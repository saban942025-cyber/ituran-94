import os
import glob
import json
import re
import numpy as np
from datetime import datetime
from pdf2image import convert_from_path
from PIL import Image
import easyocr

# נתיבי עבודה
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOWNLOADS_DIR = os.path.join(BASE_DIR, 'scripts', 'downloads')
RESULTS_FILE = os.path.join(BASE_DIR, 'scripts', 'results.json')

def run_analysis():
    os.makedirs(DOWNLOADS_DIR, exist_ok=True)
    print("--- Saban X-Ray: Starting Professional ROI Analysis (V4) ---")
    
    pdf_files = glob.glob(os.path.join(DOWNLOADS_DIR, "*.pdf"))
    if not pdf_files:
        print("❌ No PDF files found.")
        with open(RESULTS_FILE, 'w') as f: json.dump([], f)
        return

    # ניסיון טעינה חכם של EasyOCR
    try:
        print("Initializing EasyOCR Engine (Hebrew/English)...")
        reader = easyocr.Reader(['he', 'en'], gpu=False)
    except Exception as e:
        print(f"⚠️ Hebrew Load Failed: {e}. Switching to English fallback...")
        # אם עברית לא נתמכת, לפחות נחלץ מספרים בעזרת מודל אנגלי
        reader = easyocr.Reader(['en'], gpu=False)

    all_results = []
    for pdf_path in pdf_files:
        filename = os.path.basename(pdf_path)
        try:
            print(f"Analyzing: {filename}")
            pages = convert_from_path(pdf_path, dpi=300)
            img = pages[0]
            width, height = img.size
            
            # ROI - חיתוך 40% תחתונים
            roi_img = img.crop((0, int(height * 0.6), width, height))
            
            # OCR גמיש למספרים וזמנים
            ocr_results = reader.readtext(np.array(roi_img), detail=0, allowlist="0123456789:.- ")
            combined_text = " ".join(ocr_results)
            
            # חיפוש שעה HH:MM
            time_match = re.search(r'([01]?\d|2[0-3])[:\.\-\s]?([0-5]\d)', combined_text)
            found_time = f"{time_match.group(1).zfill(2)}:{time_match.group(2)}" if time_match else None
            
            all_results.append({
                "ticketId": "".join(filter(str.isdigit, filename))[:7],
                "handwrittenTime": found_time,
                "status": "Success" if found_time else "Time_Not_Found",
                "filename": filename
            })
            print(f"   -> Result: {found_time}")
            
        except Exception as e:
            print(f"❌ Failed processing {filename}: {e}")

    with open(RESULTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_results, f, indent=2, ensure_ascii=False)
    print("--- Analysis Completed ---")

if __name__ == "__main__":
    run_analysis()
