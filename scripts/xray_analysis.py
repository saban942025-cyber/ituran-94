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

# הגדרות נתיבים
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOWNLOADS_DIR = os.path.join(BASE_DIR, 'scripts', 'downloads')
RESULTS_FILE = os.path.join(BASE_DIR, 'scripts', 'results.json')

def run_analysis():
    os.makedirs(DOWNLOADS_DIR, exist_ok=True)
    print(f"--- Starting Saban X-Ray Analysis ---")
    
    pdf_files = glob.glob(os.path.join(DOWNLOADS_DIR, "*.pdf"))
    if not pdf_files:
        print("No PDF files found.")
        with open(RESULTS_FILE, 'w') as f: json.dump([], f)
        return

    try:
        print("Initializing EasyOCR with Hebrew support...")
        # ניסיון טעינה עם קוד השפה התקני
        reader = easyocr.Reader(['he', 'en'], gpu=False)
    except Exception as e:
        print(f"EasyOCR Init Error: {e}")
        # ניסיון אחרון עם אנגלית בלבד אם עברית קורסת (כדי שלא יכשיל את כל ה-Build)
        reader = easyocr.Reader(['en'], gpu=False)

    all_results = []
    for pdf_path in pdf_files:
        try:
            filename = os.path.basename(pdf_path)
            print(f"Processing: {filename}")
            pages = convert_from_path(pdf_path, dpi=200) # הורדתי ל-200 למהירות בענן
            img = pages[0]
            
            # OCR בסיסי
            img_np = np.array(img)
            ocr_text = reader.readtext(img_np, detail=0)
            combined = " ".join(ocr_text)
            
            # חיפוש שעה
            time_match = re.search(r'([01]?\d|2[0-3]):[0-5]\d', combined)
            found_time = time_match.group(0) if time_match else None
            
            all_results.append({
                "ticketId": re.search(r'\d+', filename).group(0) if re.search(r'\d+', filename) else "000",
                "handwrittenTime": found_time,
                "status": "Success" if found_time else "No Time Found"
            })
        except Exception as e:
            print(f"Error on file {pdf_path}: {e}")

    with open(RESULTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_results, f, indent=2)
    print("Analysis finished successfully.")

if __name__ == "__main__":
    run_analysis()
