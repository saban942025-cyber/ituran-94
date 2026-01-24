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
    print("--- Saban X-Ray: Starting ROI Focused Analysis ---")
    
    pdf_files = glob.glob(os.path.join(DOWNLOADS_DIR, "*.pdf"))
    if not pdf_files:
        print("No files to process.")
        with open(RESULTS_FILE, 'w') as f: json.dump([], f)
        return

    try:
        reader = easyocr.Reader(['he', 'en'], gpu=False)
        print("✅ OCR Engine Ready.")
    except Exception as e:
        print(f"OCR Error: {e}")
        return

    all_results = []

    for pdf_path in pdf_files:
        try:
            filename = os.path.basename(pdf_path)
            print(f"Processing: {filename}")
            
            # שלב 1: המרה לתמונה איכותית (DPI 300)
            pages = convert_from_path(pdf_path, dpi=300)
            img = pages[0]
            
            # שלב 2: חיתוך ROI ממוקד (רק החלק התחתון שבו נמצאת החתימה)
            # בתעודות סטנדרטיות, החתימה ב-25% התחתונים של הדף
            width, height = img.size
            roi_box = (0, int(height * 0.70), width, height) 
            roi_img = img.crop(roi_box)
            
            # שלב 3: זיהוי שעה בתוך החיתוך
            roi_np = np.array(roi_img)
            ocr_results = reader.readtext(roi_np, detail=0, allowlist="0123456789:")
            combined = " ".join(ocr_results)
            
            time_match = re.search(r'([01]?\d|2[0-3]):[0-5]\d', combined)
            found_time = time_match.group(0) if time_match else None
            
            all_results.append({
                "ticketId": "".join(filter(str.isdigit, filename))[:7] or "000",
                "handwrittenTime": found_time,
                "status": "Success" if found_time else "Not_Found",
                "filename": filename
            })
            print(f"Result for {filename}: {found_time}")

        except Exception as e:
            print(f"❌ Error processing {filename}: {e}")

    with open(RESULTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_results, f, indent=2, ensure_ascii=False)
    print("--- Analysis Completed ---")

if __name__ == "__main__":
    run_analysis()
