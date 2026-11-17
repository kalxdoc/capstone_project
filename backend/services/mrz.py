WEIGHTS = (7, 3, 1)


def _val(c: str) -> int:
    if c == '<':
        return 0
    if c.isdigit():
        return int(c)
    return ord(c) - 55  # A=10 ... Z=35


def check_digit(field: str) -> str:
    return str(sum(_val(c) * WEIGHTS[i % 3] for i, c in enumerate(field)) % 10)


def validate_visa_mrz(l1: str, l2: str) -> list[tuple[str, dict]]:
    issues = []
    if len(l1) != 44 or len(l2) != 44:
        return [('MRZ_LENGTH', {'len1': len(l1), 'len2': len(l2)})]
    if any(not (ch.isdigit() or ('A' <= ch <= 'Z') or ch == '<') for ch in l1 + l2):
        issues.append(('MRZ_CHARS', {}))
    if l1[0] != 'V':
        issues.append(('MRZ_DOC_TYPE', {'got': l1[0]}))
    fields = [('VISA_NO', l2[0:9], l2[9]), ('DOB', l2[13:19], l2[19]), ('EXPIRY', l2[21:27], l2[27])]
    for name, field, cd in fields:
        if check_digit(field) != cd:
            issues.append(('CHECK_DIGIT_' + name, {'expected': check_digit(field), 'found': cd}))
    if any(ch.isdigit() for ch in l1[5:]):
        issues.append(('DIGIT_IN_NAME', {}))
    if any(ch.isalpha() for ch in l2[13:19] + l2[21:27]):
        issues.append(('LETTER_IN_DATE', {}))
    return issues
