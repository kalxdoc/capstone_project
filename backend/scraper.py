"""Load the OEP licensed-agency list into shield.db.

Run from the backend folder with the environment active:
  python scraper.py --inspect            show what was found, change nothing
  python scraper.py                      fetch the live page and update shield.db
  python scraper.py --file page.html     parse a saved copy of the page instead
  python scraper.py --export-csv data/agency_snapshot.csv   also write a CSV snapshot
"""
import argparse
import csv
import datetime as dt
import os
import re
import sqlite3
import sys
import time

import requests
from bs4 import BeautifulSoup

from services.registry import norm_license

URL = 'https://www.oep.gov.bd/agencies'
# Identify yourself politely: put your real email here.
HEAD = {'User-Agent': 'ProvashShield-Capstone/0.1 (student project; contact:fahimmorshed32@gmail.com)'}
DB_PATH = 'shield.db'
FIELDS = ['license_no', 'name', 'address', 'phone', 'status', 'valid_until']
STATUSES = {
    'active': 'Active', 'expired': 'Expired', 'cancelled': 'Cancelled', 'canceled': 'Cancelled',
    'suspended': 'Suspended', 'server locked': 'Server Locked',
}


def header_key(text):
    t = text.lower()
    if 'status' in t:
        return 'status'
    if 'valid' in t:
        return 'valid_until'
    if 'phone' in t:
        return 'phone'
    if 'address' in t:
        return 'address'
    if 'license' in t:
        return 'license_no'
    if 'name' in t:
        return 'name'
    return None


def parse(html):
    """Return (expected_total, list_of_raw_rows, number_of_tables)."""
    soup = BeautifulSoup(html, 'html.parser')
    m = re.search(r'Total\s+Agents?\D{0,10}([0-9,]+)', soup.get_text(' ', strip=True), re.I)
    expected = int(m.group(1).replace(',', '')) if m else None
    rows = []
    tables = soup.find_all('table')
    for table in tables:
        head = [header_key(th.get_text(' ', strip=True)) for th in table.find_all('th')]
        mapping = head if 'license_no' in head and 'status' in head else None
        for tr in table.find_all('tr'):
            cells = [td.get_text(' ', strip=True) for td in tr.find_all('td')]
            if not cells:
                continue
            if mapping and len(cells) >= len(mapping):
                rows.append({k: v for k, v in zip(mapping, cells) if k})
            elif len(cells) >= 7:  # fallback: serial number + six fields
                rows.append(dict(zip(FIELDS, cells[1:7])))
    return expected, rows, len(tables)


def clean(rec):
    lic = norm_license(rec.get('license_no', ''))
    if not lic or lic == 'RL0000':  # RL0000 is BMET's own placeholder entry
        return None
    raw_status = rec.get('status', '').strip()
    return {
        'license_no': lic,
        'name': rec.get('name', '').strip(),
        'address': rec.get('address', '').strip(),
        'phone': rec.get('phone', '').strip(),
        'status': STATUSES.get(raw_status.lower(), raw_status or 'Unknown'),
        'valid_until': rec.get('valid_until', '').strip(),
    }


def init_db(con):
    con.execute('CREATE TABLE IF NOT EXISTS agency (license_no TEXT PRIMARY KEY, name TEXT, address TEXT, phone TEXT, status TEXT, valid_until TEXT, last_seen TEXT)')
    con.execute('CREATE TABLE IF NOT EXISTS agency_history (license_no TEXT, changed_on TEXT, old_status TEXT, new_status TEXT)')


def existing_count(db=DB_PATH):
    if not os.path.exists(db):
        return 0
    con = sqlite3.connect(db)
    init_db(con)
    n = con.execute("SELECT COUNT(*) FROM agency WHERE license_no NOT LIKE 'RL9%'").fetchone()[0]
    con.close()
    return n


def save(rows, db=DB_PATH):
    """Upsert rows; record status changes in agency_history. Returns number of status changes."""
    today = dt.date.today().isoformat()
    changed = 0
    con = sqlite3.connect(db)
    init_db(con)
    with con:  # one transaction: all rows or none
        for r in rows:
            old = con.execute('SELECT status FROM agency WHERE license_no=?', (r['license_no'],)).fetchone()
            if old and old[0] != r['status']:
                con.execute('INSERT INTO agency_history VALUES (?,?,?,?)', (r['license_no'], today, old[0], r['status']))
                changed += 1
            con.execute('INSERT OR REPLACE INTO agency VALUES (?,?,?,?,?,?,?)',
                        (r['license_no'], r['name'], r['address'], r['phone'], r['status'], r['valid_until'], today))
    con.close()
    return changed


def export_csv(path, db=DB_PATH):
    os.makedirs(os.path.dirname(path) or '.', exist_ok=True)
    con = sqlite3.connect(db)
    cur = con.execute("SELECT license_no, name, address, phone, status, valid_until, last_seen FROM agency WHERE license_no NOT LIKE 'RL9%' ORDER BY license_no")
    with open(path, 'w', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        w.writerow([d[0] for d in cur.description])
        w.writerows(cur.fetchall())
    con.close()


def fetch():
    for attempt in range(3):
        try:
            r = requests.get(URL, headers=HEAD, timeout=60)
            r.raise_for_status()
            return r.text
        except requests.RequestException as e:
            print('Fetch failed:', e)
            time.sleep(5 * (attempt + 1))
    sys.exit('Could not fetch the page after 3 tries.')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--file', help='parse a saved HTML file instead of fetching')
    ap.add_argument('--inspect', action='store_true', help='report only, change nothing')
    ap.add_argument('--export-csv', help='write a CSV snapshot to this path after updating')
    args = ap.parse_args()

    html = open(args.file, encoding='utf-8').read() if args.file else fetch()
    expected, raw, n_tables = parse(html)
    rows, skipped = {}, 0
    for rec in raw:
        r = clean(rec)
        if r:
            rows[r['license_no']] = r
        else:
            skipped += 1

    print(f'Tables found: {n_tables} | rows parsed: {len(raw)} | usable agencies: {len(rows)} | skipped: {skipped} | page says total: {expected}')
    by_status = {}
    for r in rows.values():
        by_status[r['status']] = by_status.get(r['status'], 0) + 1
    print('By status:', by_status)
    for r in list(rows.values())[:3]:
        print('Sample:', r['license_no'], '|', r['name'], '|', r['status'], '|', r['valid_until'])

    problems = []
    if not rows:
        problems.append('no agency rows found (the table may load with JavaScript; use --file with a saved copy)')
    if expected and len(rows) < 0.95 * expected:
        problems.append(f'only {len(rows)} usable rows but the page says {expected}')
    old = existing_count()
    if old and len(rows) < 0.9 * old:
        problems.append(f'only {len(rows)} rows but the database already has {old}')
    if problems:
        print('PROBLEMS:', *problems, sep='\n  - ')
    if args.inspect:
        return
    if problems:
        sys.exit('ABORTED: the database was NOT changed.')

    changed = save(list(rows.values()))
    print(f'Saved {len(rows)} agencies. Status changes since last run: {changed}.')
    if args.export_csv:
        export_csv(args.export_csv)
        print('CSV snapshot written to', args.export_csv)


if __name__ == '__main__':
    main()
