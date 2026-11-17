from services.mrz import check_digit, validate_visa_mrz


def make_line2(no='A1234567', nat='UTO', dob='740812', sex='F', exp='301231'):
    n = no.ljust(9, '<')
    s = n + check_digit(n) + nat + dob + check_digit(dob) + sex + exp + check_digit(exp)
    return s.ljust(44, '<')


L1 = ('V<UTO' + 'ERIKSSON<<ANNA<MARIA').ljust(44, '<')


def codes(l1, l2):
    return [c for c, _ in validate_visa_mrz(l1, l2)]


def test_check_digit_reference():
    # reference values from the public ICAO 9303 specimen
    assert check_digit('L898902C3') == '6'
    assert check_digit('740812') == '2'
    assert check_digit('120415') == '9'


def test_clean_lines_pass():
    assert codes(L1, make_line2()) == []


def test_edited_dob_is_caught():
    bad = make_line2()
    bad = bad[:13] + '740813' + bad[19:]
    assert 'CHECK_DIGIT_DOB' in codes(L1, bad)


def test_letter_o_in_date_is_caught():
    bad = make_line2()
    bad = bad[:13] + '74O812' + bad[19:]
    assert 'LETTER_IN_DATE' in codes(L1, bad)


def test_bad_length():
    assert codes(L1[:40], make_line2()) == ['MRZ_LENGTH']
