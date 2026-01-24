import os
import glob
import json
import re
import numpy as np
from datetime import datetime
from pdf2image import convert_from_path
import easyocr

# הגדרות נתיבים
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOWNLOADS_DIR = os.path.join(BASE_DIR, 'scripts', 'downloads')
RESULTS_FILE = os.path.join(BASE_DIR, 'scripts', 'results.json')

def run_analysis():
    os.makedirs(DOWNLOADS_DIR, exist_ok=True)
    print("--- Saban X-Ray Engine: Starting Production Analysis (V5) ---")
    
    pdf_files = glob.glob(os.path.join(DOWNLOADS_DIR, "*.pdf"))
    if not pdf_files:
        print("❌ No files found.")
        with open(RESULTS_FILE, 'w') as f: json.dump([], f)
        return

    # ניסיון טעינה חכם עם הגנה משגיאות שפה
    try:
        print("Initializing EasyOCR (HE+EN)...")
        reader = easyocr.Reader(['he', 'en'], gpu=False)
    except Exception as e:
        print(f"⚠️ Hebrew Init Error: {e}. Using English fallback.")
        reader = easyocr.Reader(['en'], gpu=False)

    all_results = []
    for pdf_path in pdf_files:
        filename = os.path.basename(pdf_path)
        try:
            pages = convert_from_path(pdf_path, dpi=300)
            img = pages[0]
            width, height = img.size
            
            # 1. שעה בכתב יד (ROI תחתון 40%)
            bottom_img = img.crop((0, int(height * 0.6), width, height))
            time_res = reader.readtext(np.array(bottom_img), detail=0, allowlist="0123456789:.- ")
            time_text = " ".join(time_res)
            time_match = re.search(r'([01]?\d|2[0-3])[:\.\-\s]?([0-5]\d)', time_text)
            found_time = f"{time_match.group(1).zfill(2)}:{time_match.group(2)}" if time_match else None

            # 2. טבלת מוצרים (ROI מרכזי 20%-75%)
            table_img = img.crop((0, int(height * 0.2), width, int(height * 0.75)))
            table_res = reader.readtext(np.array(table_img), detail=0)
            items = []
            for line in table_res:
                sku_match = re.search(r'\b\d{5,8}\b', line) # חיפוש מק"ט
                if sku_match:
                    items.append({
                        "sku": sku_match.group(0),
                        "picked": any(x in line.upper() for x in ["נלקט", "V", "✓"])
                    })

            all_results.append({
                "ticketId": "".join(filter(str.isdigit, filename))[:7],
                "handwrittenTime": found_time,
                "items": items,
                "filename": filename,
                "timestamp": datetime.now().isoformat()
            })
            
        except Exception as e:
            print(f"❌ Error {filename}: {e}")

    with open(RESULTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_results, f, indent=2, ensure_ascii=False)
    print("--- Analysis Finished ---")

if __name__ == "__main__":
    run_analysis()
