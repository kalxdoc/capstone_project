from typing import Literal, Optional
from pydantic import BaseModel

Status = Literal['verified', 'not_found', 'mismatch', 'warning', 'caution', 'no_issues_found']
Severity = Literal['info', 'caution', 'warning']


class Flag(BaseModel):
    code: str
    severity: Severity
    title_bn: str
    title_en: str
    reason_bn: str
    reason_en: str


class Agency(BaseModel):
    name: str
    license_no: str
    status: str
    valid_until: Optional[str] = None


class Extracted(BaseModel):
    line1: str
    line2: str


class Result(BaseModel):
    status: Status
    summary_bn: str
    summary_en: str
    flags: list[Flag] = []
    source: Optional[str] = None
    agency: Optional[Agency] = None
    extracted: Optional[Extracted] = None
    disclaimer_en: str = 'Not proof. Confirm with the embassy or visa center.'
    disclaimer_bn: str = 'এটি প্রমাণ নয়। দূতাবাস বা ভিসা কেন্দ্রে নিশ্চিত হয়ে নিন।'


class AgencyReq(BaseModel):
    agency_name: str
    license_no: str


class MrzReq(BaseModel):
    line1: str
    line2: str
