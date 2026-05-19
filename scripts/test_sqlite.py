import sqlite3
conn = sqlite3.connect('instance/app.db')
conn.execute('CREATE TABLE IF NOT EXISTS __test (id INTEGER)')
conn.commit()
conn.close()
print('OK')
