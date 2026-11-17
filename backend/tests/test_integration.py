from fastapi.testclient import TestClient

from main import app
from tests.test_mrz import L1, make_line2

client = TestClient(app)


def test_agency_returns_record():
    r = client.post('/api/v1/agency/verify',
                    json={'agency_name': 'TEST ACTIVE OVERSEAS', 'license_no': 'RL9001'}).json()
    assert r['status'] == 'verified'
    assert r['agency']['license_no'] == 'RL9001'


def test_mrz_endpoint_clean_and_edited():
    ok = client.post('/api/v1/visa/mrz', json={'line1': L1, 'line2': make_line2()}).json()
    assert ok['status'] == 'no_issues_found'
    bad_line = make_line2()[:13] + '740813' + make_line2()[19:]
    bad = client.post('/api/v1/visa/mrz', json={'line1': L1, 'line2': bad_line}).json()
    assert bad['status'] == 'warning'
    assert bad['flags'][0]['code'] == 'CHECK_DIGIT_DOB'


def test_mrz_wrong_length_is_caution_not_warning():
    r = client.post('/api/v1/visa/mrz', json={'line1': L1[:30], 'line2': make_line2()}).json()
    assert r['status'] == 'caution'
