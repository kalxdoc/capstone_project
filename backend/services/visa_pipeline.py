from schemas import Extracted, Flag, Result
from services.mrz import validate_visa_mrz
from services.ocr import read_mrz_lines  # returns (line1, line2) or None

SUMMARY_EN = {
    'warning': 'Some details do not match. Do not pay yet.',
    'caution': 'Be careful. Some checks could not be completed.',
    'no_issues_found': 'No problems found by this check.',
}
SUMMARY_BN = {
    'warning': 'কিছু তথ্য মিলছে না। এখনই টাকা দেবেন না।',
    'caution': 'সাবধান থাকুন। কিছু পরীক্ষা সম্পন্ন হয়নি।',
    'no_issues_found': 'এই পরীক্ষায় কোনো সমস্যা পাওয়া যায়নি।',
}

# code -> (severity, title_en, title_bn, reason_en, reason_bn)
TEXT = {
    'MRZ_UNREADABLE': ('caution', 'Could not read the bottom lines', 'নিচের কোড লাইন পড়া যায়নি',
                       'Retake the photo in good light, flat and sharp.', 'ভালো আলোতে, সোজা ও পরিষ্কার করে আবার ছবি তুলুন।'),
    'MRZ_LENGTH': ('caution', 'The code lines are the wrong length', 'কোড লাইনের দৈর্ঘ্য ঠিক নেই',
                   'Each line should have 44 characters. Check for missing or extra characters.',
                   'প্রতিটি লাইনে ৪৪টি অক্ষর থাকা উচিত। কোনো অক্ষর বাদ পড়েছে কি না দেখুন।'),
    'MRZ_CHARS': ('warning', 'Unexpected characters in the code', 'কোডে অচেনা চিহ্ন আছে',
                  'Only capital letters, numbers and the < sign are expected.', 'শুধু বড় অক্ষর, সংখ্যা ও < চিহ্ন থাকার কথা।'),
    'MRZ_DOC_TYPE': ('warning', 'This does not look like a visa code', 'এটি ভিসার কোড মনে হচ্ছে না',
                     'The first letter should be V.', 'প্রথম অক্ষর V হওয়া উচিত।'),
    'CHECK_DIGIT_VISA_NO': ('warning', 'Visa number looks edited', 'ভিসা নম্বর বদলানো মনে হচ্ছে',
                            'The check number does not match the visa number digits.', 'যাচাই সংখ্যাটি নম্বরের সাথে মিলছে না।'),
    'CHECK_DIGIT_DOB': ('warning', 'Date of birth part looks edited', 'জন্মতারিখের অংশ বদলানো মনে হচ্ছে',
                        'The check number does not match the digits.', 'যাচাই সংখ্যাটি অঙ্কগুলোর সাথে মিলছে না।'),
    'CHECK_DIGIT_EXPIRY': ('warning', 'Expiry part looks edited', 'মেয়াদের অংশ বদলানো মনে হচ্ছে',
                           'The check number does not match the digits.', 'যাচাই সংখ্যাটি অঙ্কগুলোর সাথে মিলছে না।'),
    'DIGIT_IN_NAME': ('warning', 'A number appears inside the name', 'নামের মধ্যে সংখ্যা আছে',
                      'The name part normally has letters only.', 'নামের অংশে সাধারণত শুধু অক্ষর থাকে।'),
    'LETTER_IN_DATE': ('warning', 'A letter appears where a number should be', 'তারিখের জায়গায় অক্ষর আছে',
                       'Date fields should contain numbers only.', 'তারিখের অংশে শুধু সংখ্যা থাকার কথা।'),
}


def _build(codes, extracted=None):
    flags = []
    for c in codes:
        sev, t_en, t_bn, r_en, r_bn = TEXT.get(c, ('caution', 'Unusual detail', 'অস্বাভাবিক তথ্য', c, c))
        flags.append(Flag(code=c, severity=sev, title_en=t_en, title_bn=t_bn, reason_en=r_en, reason_bn=r_bn))
    if any(f.severity == 'warning' for f in flags):
        status = 'warning'
    elif flags:
        status = 'caution'
    else:
        status = 'no_issues_found'
    return Result(status=status, summary_en=SUMMARY_EN[status], summary_bn=SUMMARY_BN[status],
                  flags=flags, extracted=extracted)


def analyze_lines(l1, l2):
    l1, l2 = l1.strip().upper(), l2.strip().upper()
    codes = [c for c, _ in validate_visa_mrz(l1, l2)]
    return _build(codes, Extracted(line1=l1, line2=l2))


def analyze_visa(img):
    lines = read_mrz_lines(img)
    if lines is None:
        return _build(['MRZ_UNREADABLE'])
    return analyze_lines(*lines)
