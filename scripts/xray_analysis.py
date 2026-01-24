import os
import glob
import json
import re
import numpy as np
from pdf2image import convert_from_path
from PIL import Image, ImageOps
import pytesseract
import easyocr

# הגדרות נתיבים ל-GitHub Actions
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOWNLOADS_DIR = os.path.join(BASE_DIR, 'scripts', 'downloads')
RESULTS_FILE = os.path.join(BASE_DIR, 'scripts', 'results.json')

def run_analysis():
    # יצירת תיקיות במידה וחסר
    os.makedirs(DOWNLOADS_DIR, exist_ok=True)
    
    print("--- Saban X-Ray Analysis: Starting Production Run ---")
    
    # חיפוש תעודות
    pdf_files = glob.glob(os.path.join(DOWNLOADS_DIR, "*.pdf"))
    if not pdf_files:
        print("❌ No PDF files found in downloads folder.")
        with open(RESULTS_FILE, 'w') as f: json.dump([], f)
        return

    # אתחול EasyOCR עם טיפול בשגיאת שפה
    try:
        print("Initializing EasyOCR Engine...")
        # הוספת download_enabled=True מוודא שהענן ינסה להוריד את המודל מחדש אם הוא חסר
        reader = easyocr.Reader(['he', 'en'], gpu=False, download_enabled=True)
        print("✅ EasyOCR initialized with Hebrew/English support.")
    except Exception as e:
        print(f"⚠️ EasyOCR Hebrew Load Failed: {e}")
        print("Switching to English-only fallback for timestamp recovery...")
        reader = easyocr.Reader(['en'], gpu=False)

    all_results = []

    for pdf_path in pdf_files:
        try:
            filename = os.path.basename(pdf_path)
            print(f"Processing Ticket: {filename}")
            
            # המרה לתמונה (DPI 200 מאוזן לביצועי ענן)
            pages = convert_from_path(pdf_path, dpi=200)
            img = pages[0]
            
            # זיהוי שעה בכתב יד
            img_np = np.array(img)
            # שימוש ב-paragraph=True עוזר לחבר חתיכות טקסט קרובות
            ocr_results = reader.readtext(img_np, detail=0, paragraph=False)
            combined_text = " ".join(ocr_results)
            
            # חיפוש תבנית שעה HH:MM
            time_match = re.search(r'([01]?\d|2[0-3]):[0-5]\d', combined_text)
            found_time = time_match.group(0) if time_match else None
            
            # חילוץ מזהה תעודה משם הקובץ
            ticket_id = "".join(filter(str.isdigit, filename))[:7]
            
            all_results.append({
                "ticketId": ticket_id or "0000000",
                "handwrittenTime": found_time,
                "status": "Success" if found_time else "Time_Not_Found",
                "filename": filename
            })
            print(f"Result for {filename}: {found_time}")

        except Exception as e:
            print(f"❌ Failed to process {filename}: {e}")

    # שמירת התוצאות ל-JSON
    with open(RESULTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_results, f, indent=2, ensure_ascii=False)
    
    print(f"--- Analysis Finished. JSON saved to {RESULTS_FILE} ---")

if __name__ == "__main__":
    run_analysis()
