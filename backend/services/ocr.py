import os
import shutil

import cv2
import pytesseract

# Windows: find Tesseract in its default install folder if it is not on PATH
if os.name == 'nt' and not shutil.which('tesseract'):
    _default = 'C:/Program Files/Tesseract-OCR/tesseract.exe'
    if os.path.exists(_default):
        pytesseract.pytesseract.tesseract_cmd = _default


def read_mrz_lines(img):
    h, w = img.shape[:2]
    crop = img[int(h * 0.75):, :]  # bottom quarter, where the MRZ sits
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    gray = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
    cfg = '--psm 6 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<'
    try:
        text = pytesseract.image_to_string(gray, config=cfg)
    except pytesseract.TesseractNotFoundError:
        print('WARNING: Tesseract is not installed or not found. Photo reading is disabled.')
        return None
    lines = [t.strip().replace(' ', '') for t in text.splitlines() if len(t.strip()) >= 30]
    return (lines[-2], lines[-1]) if len(lines) >= 2 else None
