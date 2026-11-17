import sqlite3

con = sqlite3.connect('shield.db')
con.execute('CREATE TABLE IF NOT EXISTS agency (license_no TEXT PRIMARY KEY, name TEXT, address TEXT, phone TEXT, status TEXT, valid_until TEXT, last_seen TEXT)')
rows = [
    ('RL9001', 'TEST ACTIVE OVERSEAS', 'Test Road, Dhaka', '01700000001', 'Active', '31/Dec/2030', '2026-11-14'),
    ('RL9002', 'TEST CANCELLED OVERSEAS', 'Test Road, Dhaka', '01700000002', 'Cancelled', '31/Dec/2030', '2026-11-14'),
    ('RL9003', 'TEST EXPIRED OVERSEAS', 'Test Road, Dhaka', '01700000003', 'Expired', '01/Jan/2025', '2026-11-14'),
]
con.executemany('INSERT OR REPLACE INTO agency VALUES (?,?,?,?,?,?,?)', rows)
con.commit()
print('seeded', len(rows))
