import os
import glob
import json
import re
import numpy as np
from datetime import datetime
from pdf2image import convert_from_path
from PIL import Image
import easyocr

# הגדרות נתיבים
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOWNLOADS_DIR = os.path.join(BASE_DIR, 'scripts', 'downloads')
RESULTS_FILE = os.path.join(BASE_DIR, 'scripts', 'results.json')

def run_analysis():
    os.makedirs(DOWNLOADS_DIR, exist_ok=True)
    print("--- Saban X-Ray: Starting Professional ROI Analysis (V5) ---")
    
    pdf_files = glob.glob(os.path.join(DOWNLOADS_DIR, "*.pdf"))
    if not pdf_files:
        print("❌ No PDF files found.")
        with open(RESULTS_FILE, 'w') as f: json.dump([], f)
        return

    try:
        # טעינת המנוע פעם אחת (עברית ואנגלית)
        reader = easyocr.Reader(['he', 'en'], gpu=False)
        print("✅ OCR Engine Ready.")
    except Exception as e:
        print(f"❌ OCR Error: {e}")
        return

    all_results = []
    for pdf_path in pdf_files:
        filename = os.path.basename(pdf_path)
        try:
            print(f"Analyzing: {filename}")
            pages = convert_from_path(pdf_path, dpi=300)
            img = pages[0]
            width, height = img.size
            
            # --- סריקה 1: שעה בכתב יד (ROI תחתון 40%) ---
            bottom_roi = img.crop((0, int(height * 0.6), width, height))
            time_results = reader.readtext(np.array(bottom_roi), detail=0, allowlist="0123456789:.- ")
            time_text = " ".join(time_results)
            time_match = re.search(r'([01]?\d|2[0-3])[:\.\-\s]?([0-5]\d)', time_text)
            found_time = f"{time_match.group(1).zfill(2)}:{time_match.group(2)}" if time_match else None

            # --- סריקה 2: טבלת מוצרים (ROI מרכזי 20%-75%) ---
            table_roi = img.crop((0, int(height * 0.2), width, int(height * 0.75)))
            table_results = reader.readtext(np.array(table_roi), detail=0)
            
            items = []
            for line in table_results:
                sku_match = re.search(r'\b\d{5,8}\b', line) # מק"ט של ח. סבן
                if sku_match:
                    items.append({
                        "sku": sku_match.group(0),
                        "picked": "נלקט" in line or "V" in line.upper() or "✓" in line
                    })

            all_results.append({
                "ticketId": "".join(filter(str.isdigit, filename))[:7],
                "filename": filename,
                "handwrittenTime": found_time,
                "items": items,
                "status": "Success" if found_time else "Partial",
                "timestamp": datetime.now().isoformat()
            })
            
            # שמירת תמונת דיבאג של הטבלה
            table_roi.save(os.path.join(DOWNLOADS_DIR, f"debug_table_{filename}.png"))

        except Exception as e:
            print(f"❌ Failed {filename}: {e}")

    with open(RESULTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_results, f, indent=2, ensure_ascii=False)
    print("--- Analysis Completed ---")

if __name__ == "__main__":
    run_analysis()
