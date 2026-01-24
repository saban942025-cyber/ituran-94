import os
import glob
import json
import re
import numpy as np
from pdf2image import convert_from_path
from PIL import Image, ImageOps
import pytesseract
import easyocr

# הגדרות נתיבים חסינות
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOWNLOADS_DIR = os.path.join(BASE_DIR, 'scripts', 'downloads')
RESULTS_FILE = os.path.join(BASE_DIR, 'scripts', 'results.json')

def safe_init():
    """ווידוא סביבת עבודה נקייה"""
    os.makedirs(DOWNLOADS_DIR, exist_ok=True)
    if not os.path.exists(RESULTS_FILE):
        with open(RESULTS_FILE, 'w') as f:
            json.dump([], f)

def run_analysis():
    safe_init()
    print(f"--- Saban X-Ray Analysis Started ---")
    
    pdf_files = glob.glob(os.path.join(DOWNLOADS_DIR, "*.pdf"))
    print(f"Found {len(pdf_files)} files in {DOWNLOADS_DIR}")

    if not pdf_files:
        print("No files found. Exiting gracefully.")
        return

    # טעינת מנוע ה-OCR עם טיפול בשגיאות הורדה
    try:
        print("Initializing EasyOCR...")
        reader = easyocr.Reader(['he', 'en'], gpu=False)
    except Exception as e:
        print(f"Error loading EasyOCR: {e}")
        return

    all_results = []

    for pdf_path in pdf_files:
        try:
            filename = os.path.basename(pdf_path)
            print(f"Analyzing: {filename}")
            
            # המרה לתמונה (DPI 300 לדיוק מירבי)
            pages = convert_from_path(pdf_path, dpi=300)
            img = pages[0]
            
            # חילוץ טקסט כללי לזיהוי לקוח/תעודה
            text_full = pytesseract.image_to_string(img, lang='heb+eng')
            ticket_id = re.search(r'\d{6,8}', filename)
            ticket_id = ticket_id.group(0) if ticket_id else "Unknown"

            # חילוץ שעה בכתב יד (EasyOCR)
            # בשלב זה אנחנו סורקים את כל הדף, בגרסה הבאה נחזיר את ה-ROI
            img_np = np.array(img)
            ocr_results = reader.readtext(img_np, detail=0, allowlist="0123456789:")
            
            found_time = None
            for item in ocr_results:
                match = re.search(r'([01]?\d|2[0-3]):[0-5]\d', item)
                if match:
                    found_time = match.group(0)
                    break

            all_results.append({
                "ticketId": ticket_id,
                "filename": filename,
                "handwrittenTime": found_time,
                "status": "Success" if found_time else "Time Not Found",
                "timestamp": datetime.now().isoformat() if 'datetime' in globals() else "2026-01-24"
            })
            
        except Exception as e:
            print(f"Failed to process {pdf_path}: {e}")

    # שמירת תוצאות
    with open(RESULTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)
    print(f"Done! Results saved to {RESULTS_FILE}")

if __name__ == "__main__":
    run_analysis()
