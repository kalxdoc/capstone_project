import cv2
import numpy as np


def image_quality(img_bgr) -> dict:
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape
    sharpness = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    return {'width': w, 'height': h, 'sharpness': sharpness}


def high_freq_ratio(img_bgr) -> float:
    # Photos of screens and prints often show unusual high-frequency energy.
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY).astype(np.float32)
    spec = np.abs(np.fft.fftshift(np.fft.fft2(gray)))
    h, w = spec.shape
    cy, cx = h // 2, w // 2
    r = min(h, w) // 8
    low = spec[cy - r:cy + r, cx - r:cx + r].sum()
    return float(1 - low / spec.sum())
