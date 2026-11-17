import os

import cv2
import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from schemas import AgencyReq, MrzReq, Result
from services.registry import verify_agency
from services.visa_pipeline import analyze_lines, analyze_visa

app = FastAPI(title='Provash Shield API')

ORIGINS = os.getenv('ALLOWED_ORIGINS', 'http://localhost:8443,http://localhost:5173').split(',')
app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGINS,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.get('/api/v1/health')
def health():
    return {'status': 'ok'}


@app.post('/api/v1/agency/verify', response_model=Result)
def agency_verify(req: AgencyReq):
    return verify_agency(req.agency_name, req.license_no)


@app.post('/api/v1/visa/mrz', response_model=Result)
def visa_mrz(req: MrzReq):
    return analyze_lines(req.line1, req.line2)


@app.post('/api/v1/visa/analyze', response_model=Result)
async def visa_analyze(image: UploadFile = File(...)):
    if image.content_type not in ('image/jpeg', 'image/png'):
        raise HTTPException(415, 'Only JPEG or PNG images are accepted')
    data = await image.read()
    if len(data) > 8_000_000:
        raise HTTPException(413, 'Image too large')
    img = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(400, 'Not a valid image')
    return analyze_visa(img)  # the image is never written to disk
