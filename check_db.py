#!/usr/bin/env python3
import sqlite3

def check_password_history():
    conn = sqlite3.connect('attendance.db')
    cursor = conn.cursor()

    # Check if password_reset_history table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='password_reset_history'")
    table_exists = cursor.fetchone()
    print(f'Password reset history table exists: {table_exists is not None}')

    if table_exists:
        # Check current records
        cursor.execute('SELECT COUNT(*) FROM password_reset_history')
        count = cursor.fetchone()[0]
        print(f'Current password reset records: {count}')
        
        if count > 0:
            cursor.execute('SELECT email, employee_name, new_password, reset_method, reset_at FROM password_reset_history ORDER BY reset_at DESC LIMIT 5')
            records = cursor.fetchall()
            print('Recent password changes:')
            for record in records:
                print(f'  {record[1]} ({record[0]}) - {record[3]} - {record[4]}')
        else:
            print('No password reset records found')
    else:
        print('Table does not exist - will be created on first password change')

    conn.close()

if __name__ == "__main__":
    check_password_history()
