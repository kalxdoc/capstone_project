import datetime as dt
import sqlite3

from rapidfuzz import fuzz

from schemas import Agency, Flag, Result

DB_PATH = 'shield.db'
SOURCE = 'OEP agency list'
BAD = ('Expired', 'Cancelled', 'Suspended', 'Server Locked')


def norm_license(s):
    s = s.upper().replace(' ', '')
    if len(s) == 6 and s.startswith('RL') and all(c in '0123456789OIL' for c in s[2:]):
        return 'RL' + s[2:].replace('O', '0').replace('I', '1').replace('L', '1')
    return None


def _get(lic):
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    row = con.execute('SELECT * FROM agency WHERE license_no=?', (lic,)).fetchone()
    con.close()
    return row


def _status(row):
    if row['status'] != 'Active':
        return row['status']
    try:
        due = dt.datetime.strptime(row['valid_until'], '%d/%b/%Y').date()
    except ValueError:
        return 'Active'
    return 'Expired' if due < dt.date.today() else 'Active'


def verify_agency(name, license_no):
    lic = norm_license(license_no)
    row = _get(lic) if lic else None
    if row is None:
        return Result(status='not_found', summary_en='Not found in the list.',
                      summary_bn='তালিকায় পাওয়া যায়নি', source=SOURCE)
    src = SOURCE + ' dated ' + row['last_seen']
    st = _status(row)
    agency = Agency(name=row['name'], license_no=row['license_no'], status=st, valid_until=row['valid_until'])
    if name.strip() and fuzz.token_set_ratio(name.lower(), row['name'].lower()) < 80:
        f = Flag(code='NAME_LICENSE_MISMATCH', severity='warning',
                 title_en='Name and license do not match', title_bn='নাম ও লাইসেন্স নম্বর মিলছে না',
                 reason_en='This license number belongs to a different agency name.',
                 reason_bn='এই লাইসেন্স নম্বর অন্য একটি এজেন্সির।')
        return Result(status='mismatch', summary_en='Do not pay yet.', summary_bn='এখনই টাকা দেবেন না',
                      flags=[f], source=src, agency=agency)
    if st in BAD:
        f = Flag(code='LICENSE_' + st.upper().replace(' ', '_'), severity='warning',
                 title_en='License status: ' + st, title_bn='লাইসেন্সের অবস্থা: ' + st,
                 reason_en='The list shows this license as ' + st + '.',
                 reason_bn='তালিকায় এই লাইসেন্সের অবস্থা: ' + st)
        return Result(status='warning', summary_en='Do not pay yet.', summary_bn='এখনই টাকা দেবেন না',
                      flags=[f], source=src, agency=agency)
    return Result(status='verified', summary_en='Listed as active.',
                  summary_bn='তালিকায় সক্রিয় হিসেবে পাওয়া গেছে', source=src, agency=agency)
