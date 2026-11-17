import cv2
import numpy as np

from tests.test_mrz import L1, make_line2

img = np.full((400, 1200, 3), 255, np.uint8)
cv2.putText(img, 'TEST SAMPLE - NOT A REAL VISA', (40, 80), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 0), 2)
cv2.putText(img, L1, (20, 320), cv2.FONT_HERSHEY_SIMPLEX, 0.72, (0, 0, 0), 2)
cv2.putText(img, make_line2(), (20, 370), cv2.FONT_HERSHEY_SIMPLEX, 0.72, (0, 0, 0), 2)
cv2.imwrite('test_clean.png', img)
print('wrote test_clean.png')
