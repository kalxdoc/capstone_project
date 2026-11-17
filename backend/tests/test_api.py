from fastapi.testclient import TestClient

import services.visa_pipeline as vp
from main import app
from tests.test_mrz import L1, make_line2

client = TestClient(app)


def test_health():
    assert client.get('/api/v1/health').json() == {'status': 'ok'}


def verify(name, lic):
    return client.post('/api/v1/agency/verify', json={'agency_name': name, 'license_no': lic}).json()


def test_agency_cases():
    assert verify('TEST ACTIVE OVERSEAS', 'RL9001')['status'] == 'verified'
    assert verify('SOMETHING ELSE', 'RL9001')['status'] == 'mismatch'
    assert verify('TEST CANCELLED OVERSEAS', 'RL9002')['status'] == 'warning'
    assert verify('X', 'RL9999')['status'] == 'not_found'


def test_visa_clean_and_edited(monkeypatch):
    monkeypatch.setattr(vp, 'read_mrz_lines', lambda img: (L1, make_line2()))
    assert vp.analyze_visa(None).status == 'no_issues_found'
    bad = make_line2()[:13] + '740813' + make_line2()[19:]
    monkeypatch.setattr(vp, 'read_mrz_lines', lambda img: (L1, bad))
    assert vp.analyze_visa(None).status == 'warning'


def test_visa_unreadable(monkeypatch):
    monkeypatch.setattr(vp, 'read_mrz_lines', lambda img: None)
    assert vp.analyze_visa(None).status == 'caution'


def test_visa_rejects_non_image():
    r = client.post('/api/v1/visa/analyze', files={'image': ('x.txt', b'hello', 'text/plain')})
    assert r.status_code == 415
