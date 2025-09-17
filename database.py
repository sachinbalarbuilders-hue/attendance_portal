#!/usr/bin/env python3
"""
Database module for Employee Attendance Portal
Handles SQLite database operations for storing Excel data
"""

import sqlite3
import os
import datetime
from typing import List, Dict, Any, Optional

class AttendanceDatabase:
    def __init__(self, db_path: str = 'attendance.db'):
        """Initialize database connection"""
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Create database tables if they don't exist"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Create attendance records table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS attendance_records (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    employee_name TEXT NOT NULL,
                    date TEXT NOT NULL,
                    punch_in TEXT,
                    punch_out TEXT,
                    status TEXT,
                    pin_comment TEXT,
                    pout_comment TEXT,
                    status_comment TEXT,
                    pin_highlight BOOLEAN DEFAULT 0,
                    pout_highlight BOOLEAN DEFAULT 0,
                    status_highlight BOOLEAN DEFAULT 0,
                    time_range TEXT,
                    upload_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    file_name TEXT,
                    UNIQUE(employee_name, date, file_name)
                )
            ''')
            
            # Add time_range column if it doesn't exist (for existing databases)
            try:
                cursor.execute('ALTER TABLE attendance_records ADD COLUMN time_range TEXT')
            except sqlite3.OperationalError:
                # Column already exists, ignore
                pass
            
            
            # Create leave totals table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS leave_totals (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    employee_name TEXT NOT NULL,
                    wo_days REAL DEFAULT 0,
                    pl_days REAL DEFAULT 0,
                    sl_days REAL DEFAULT 0,
                    fl_days REAL DEFAULT 0,
                    upload_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    file_name TEXT,
                    UNIQUE(employee_name, file_name)
                )
            ''')
            
            # Create file uploads table for tracking
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS file_uploads (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    file_name TEXT NOT NULL,
                    upload_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    record_count INTEGER DEFAULT 0,
                    status TEXT DEFAULT 'success'
                )
            ''')
            
            # Create admin settings table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS admin_settings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    setting_key TEXT UNIQUE NOT NULL,
                    setting_value TEXT,
                    updated_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Create password history table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS password_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT NOT NULL,
                    employee_name TEXT NOT NULL,
                    current_password TEXT NOT NULL,
                    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    changed_by TEXT DEFAULT 'employee'
                )
            ''')
            
            # Create user password status table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS user_password_status (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT UNIQUE NOT NULL,
                    has_changed_password BOOLEAN DEFAULT 0,
                    actual_email TEXT,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Add actual_email column if it doesn't exist (for existing databases)
            try:
                cursor.execute('ALTER TABLE user_password_status ADD COLUMN actual_email TEXT')
            except sqlite3.OperationalError:
                # Column already exists, ignore
                pass
            
            # Create OTP table for password change verification
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS otp_verification (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT NOT NULL,
                    otp_code TEXT NOT NULL,
                    actual_email TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    expires_at DATETIME NOT NULL,
                    is_used BOOLEAN DEFAULT 0
                )
            ''')
            
            # Create login logs table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS login_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT NOT NULL,
                    user_name TEXT NOT NULL,
                    is_admin BOOLEAN DEFAULT 0,
                    login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                    ip_address TEXT,
                    user_agent TEXT
                )
            ''')
            
            
            conn.commit()
    
    def clear_existing_data(self, file_name: str = None):
        """Clear existing data for a specific file or all data"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            if file_name:
                # Clear data for specific file
                cursor.execute('DELETE FROM attendance_records WHERE file_name = ?', (file_name,))
                cursor.execute('DELETE FROM leave_totals WHERE file_name = ?', (file_name,))
                cursor.execute('DELETE FROM file_uploads WHERE file_name = ?', (file_name,))
            else:
                # Clear all data
                cursor.execute('DELETE FROM attendance_records')
                cursor.execute('DELETE FROM leave_totals')
                cursor.execute('DELETE FROM file_uploads')
            
            conn.commit()
    
    def save_attendance_records(self, records: List[Dict[str, Any]], file_name: str):
        """Save attendance records to database"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Clear existing data for this file
            self.clear_existing_data(file_name)
            
            # Insert new records
            for record in records:
                cursor.execute('''
                    INSERT OR REPLACE INTO attendance_records 
                    (employee_name, date, punch_in, punch_out, status, 
                     pin_comment, pout_comment, status_comment, 
                     pin_highlight, pout_highlight, status_highlight, time_range, file_name)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    record.get('Employee', ''),
                    record.get('Date', ''),
                    record.get('Punch-In', ''),
                    record.get('Punch-Out', ''),
                    record.get('Status', ''),
                    record.get('pin_comment', ''),
                    record.get('pout_comment', ''),
                    record.get('status_comment', ''),
                    record.get('pin_highlight', False),
                    record.get('pout_highlight', False),
                    record.get('status_highlight', False),
                    record.get('time_range', ''),
                    file_name
                ))
            
            # Record file upload
            cursor.execute('''
                INSERT INTO file_uploads (file_name, record_count, status)
                VALUES (?, ?, ?)
            ''', (file_name, len(records), 'success'))
            
            conn.commit()
            return len(records)
    
    def save_leave_totals(self, leave_totals: Dict[str, Dict[str, float]], file_name: str):
        """Save leave totals to database"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            for employee, totals in leave_totals.items():
                cursor.execute('''
                    INSERT OR REPLACE INTO leave_totals 
                    (employee_name, wo_days, pl_days, sl_days, fl_days, file_name)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (
                    employee,
                    totals.get('W/O', 0),
                    totals.get('PL', 0),
                    totals.get('SL', 0),
                    totals.get('FL', 0),
                    file_name
                ))
            
            conn.commit()
    
    def get_attendance_records(self, employee_filter: str = None, status_filter: str = 'All') -> List[Dict[str, Any]]:
        """Get attendance records from database"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            query = '''
                SELECT employee_name, date, punch_in, punch_out, status,
                       pin_comment, pout_comment, status_comment,
                       pin_highlight, pout_highlight, status_highlight,
                       time_range, upload_timestamp, file_name
                FROM attendance_records
                WHERE 1=1
            '''
            params = []
            
            if employee_filter:
                query += ' AND employee_name = ?'
                params.append(employee_filter)
            
            if status_filter != 'All':
                query += ' AND status LIKE ?'
                params.append(f'{status_filter}%')
            
            query += ' ORDER BY date ASC, employee_name'
            
            cursor.execute(query, params)
            rows = cursor.fetchall()
            
            records = []
            for row in rows:
                records.append({
                    'Employee': row['employee_name'],
                    'Date': row['date'],
                    'Punch-In': row['punch_in'],
                    'Punch-Out': row['punch_out'],
                    'Status': row['status'],
                    'pin_comment': row['pin_comment'],
                    'pout_comment': row['pout_comment'],
                    'status_comment': row['status_comment'],
                    'pin_highlight': bool(row['pin_highlight']),
                    'pout_highlight': bool(row['pout_highlight']),
                    'status_highlight': bool(row['status_highlight']),
                    'time_range': row['time_range'],
                    'upload_timestamp': row['upload_timestamp'],
                    'file_name': row['file_name']
                })
            
            return records
    
    def get_leave_totals(self, employee_filter: str = None) -> Dict[str, Dict[str, float]]:
        """Get leave totals from database"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            query = '''
                SELECT employee_name, wo_days, pl_days, sl_days, fl_days
                FROM leave_totals
            '''
            params = []
            
            if employee_filter:
                query += ' WHERE employee_name = ?'
                params.append(employee_filter)
            
            query += ' ORDER BY employee_name'
            
            cursor.execute(query, params)
            rows = cursor.fetchall()
            
            totals = {}
            for row in rows:
                totals[row['employee_name']] = {
                    'W/O': row['wo_days'],
                    'PL': row['pl_days'],
                    'SL': row['sl_days'],
                    'FL': row['fl_days']
                }
            
            return totals
    
    def get_employees(self) -> List[str]:
        """Get list of unique employees from database"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT DISTINCT employee_name FROM attendance_records ORDER BY employee_name')
            return [row[0] for row in cursor.fetchall()]
    
    def get_upload_history(self) -> List[Dict[str, Any]]:
        """Get file upload history"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute('''
                SELECT file_name, upload_timestamp, record_count, status
                FROM file_uploads
                ORDER BY upload_timestamp DESC
            ''')
            rows = cursor.fetchall()
            
            return [dict(row) for row in rows]
    
    def get_database_stats(self) -> Dict[str, Any]:
        """Get database statistics"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Get total records
            cursor.execute('SELECT COUNT(*) FROM attendance_records')
            total_records = cursor.fetchone()[0]
            
            # Get unique employees
            cursor.execute('SELECT COUNT(DISTINCT employee_name) FROM attendance_records')
            unique_employees = cursor.fetchone()[0]
            
            # Get latest upload
            cursor.execute('''
                SELECT MAX(upload_timestamp) FROM file_uploads
            ''')
            latest_upload = cursor.fetchone()[0]
            
            return {
                'total_records': total_records,
                'unique_employees': unique_employees,
                'latest_upload': latest_upload
            }
    
    def set_admin_setting(self, key: str, value: str) -> bool:
        """Set an admin setting"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT OR REPLACE INTO admin_settings (setting_key, setting_value, updated_timestamp)
                    VALUES (?, ?, CURRENT_TIMESTAMP)
                ''', (key, value))
                conn.commit()
                return True
        except Exception as e:
            print(f"Error setting admin setting: {e}")
            return False
    
    def get_admin_setting(self, key: str) -> Optional[str]:
        """Get an admin setting value"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('SELECT setting_value FROM admin_settings WHERE setting_key = ?', (key,))
                result = cursor.fetchone()
                return result[0] if result else None
        except Exception as e:
            print(f"Error getting admin setting: {e}")
            return None
    
    def log_password_change(self, email: str, employee_name: str, current_password: str, changed_by: str = 'employee') -> bool:
        """Log password change for admin visibility"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO password_history 
                    (email, employee_name, current_password, changed_by)
                    VALUES (?, ?, ?, ?)
                ''', (email, employee_name, current_password, changed_by))
                conn.commit()
                return True
        except Exception as e:
            print(f"Error logging password change: {e}")
            return False
    
    def get_password_history(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get password history for admin view"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # First check if table exists
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='password_history'")
                table_exists = cursor.fetchone()
                
                if not table_exists:
                    return []
                
                cursor.execute('''
                    SELECT email, employee_name, current_password, changed_at, changed_by
                    FROM password_history 
                    ORDER BY changed_at DESC 
                    LIMIT ?
                ''', (limit,))
                
                results = cursor.fetchall()
                
                history = []
                for row in results:
                    history.append({
                        'email': row[0],
                        'employee_name': row[1],
                        'current_password': row[2],
                        'changed_at': row[3],
                        'changed_by': row[4]
                    })
                return history
        except Exception as e:
            print(f"Error getting password history: {e}")
            return []
    
    def has_user_changed_password(self, email: str) -> bool:
        """Check if user has ever changed their password"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT has_changed_password FROM user_password_status 
                    WHERE email = ?
                ''', (email,))
                result = cursor.fetchone()
                return result[0] if result else False
        except Exception as e:
            print(f"Error checking password change status: {e}")
            return False
    
    def mark_password_as_changed(self, email: str, actual_email: str = None) -> bool:
        """Mark that user has changed their password"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT OR REPLACE INTO user_password_status 
                    (email, has_changed_password, actual_email, updated_at)
                    VALUES (?, 1, ?, CURRENT_TIMESTAMP)
                ''', (email, actual_email))
                conn.commit()
                return True
        except Exception as e:
            print(f"Error marking password as changed: {e}")
            return False
    
    def get_actual_email(self, email: str) -> Optional[str]:
        """Get the actual email address for a user"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT actual_email FROM user_password_status 
                    WHERE email = ?
                ''', (email,))
                result = cursor.fetchone()
                return result[0] if result and result[0] else None
        except Exception as e:
            print(f"Error getting actual email: {e}")
            return None
    
    def store_otp(self, email: str, otp_code: str, actual_email: str, expires_minutes: int = 5) -> bool:
        """Store OTP code for verification"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                # Calculate expiration time
                expires_at = datetime.datetime.now() + datetime.timedelta(minutes=expires_minutes)
                
                cursor.execute('''
                    INSERT INTO otp_verification 
                    (email, otp_code, actual_email, expires_at)
                    VALUES (?, ?, ?, ?)
                ''', (email, otp_code, actual_email, expires_at))
                conn.commit()
                return True
        except Exception as e:
            print(f"Error storing OTP: {e}")
            return False
    
    def verify_otp(self, email: str, otp_code: str) -> bool:
        """Verify OTP code"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT id, actual_email FROM otp_verification 
                    WHERE email = ? AND otp_code = ? AND is_used = 0 AND expires_at > CURRENT_TIMESTAMP
                ''', (email, otp_code))
                result = cursor.fetchone()
                
                if result:
                    # Mark OTP as used
                    cursor.execute('''
                        UPDATE otp_verification SET is_used = 1 WHERE id = ?
                    ''', (result[0],))
                    conn.commit()
                    return True
                return False
        except Exception as e:
            print(f"Error verifying OTP: {e}")
            return False
    
    def cleanup_expired_otps(self) -> bool:
        """Clean up expired OTPs"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    DELETE FROM otp_verification 
                    WHERE expires_at < CURRENT_TIMESTAMP OR is_used = 1
                ''')
                conn.commit()
                return True
        except Exception as e:
            print(f"Error cleaning up expired OTPs: {e}")
            return False
    
    def log_login(self, email: str, user_name: str, is_admin: bool, ip_address: str = None, user_agent: str = None) -> bool:
        """Log a user login"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO login_logs 
                    (email, user_name, is_admin, login_time, ip_address, user_agent)
                    VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
                ''', (email, user_name, is_admin, ip_address, user_agent))
                conn.commit()
                return True
        except Exception as e:
            print(f"Error logging login: {e}")
            return False
    
    def get_login_logs(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get login logs"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Check if table exists
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='login_logs'")
                table_exists = cursor.fetchone()
                
                if not table_exists:
                    return []
                
                cursor.execute('''
                    SELECT email, user_name, is_admin, login_time, ip_address, user_agent
                    FROM login_logs 
                    ORDER BY login_time DESC 
                    LIMIT ?
                ''', (limit,))
                
                results = cursor.fetchall()
                
                logs = []
                for row in results:
                    logs.append({
                        'email': row[0],
                        'user_name': row[1],
                        'is_admin': bool(row[2]),
                        'login_time': row[3],
                        'ip_address': row[4],
                        'user_agent': row[5]
                    })
                return logs
        except Exception as e:
            print(f"Error getting login logs: {e}")
            return []
    
    def clear_attendance_records(self) -> bool:
        """Clear only attendance records - keeps all other data"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Clear only attendance records
                cursor.execute('DELETE FROM attendance_records')
                print("Cleared attendance_records table")
                
                conn.commit()
                print("Attendance records cleared successfully")
                return True
                
        except Exception as e:
            print(f"Error clearing attendance records: {e}")
            return False
    
    def clear_password_history(self) -> bool:
        """Clear all password history - ADMIN ONLY"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Clear password history
                cursor.execute('DELETE FROM password_history')
                print("Cleared password_history table")
                
                # Reset all users to default password status
                cursor.execute('DELETE FROM user_password_status')
                print("Cleared user_password_status table")
                
                conn.commit()
                print("Password history cleared successfully")
                return True
                
        except Exception as e:
            print(f"Error clearing password history: {e}")
            return False


# Global database instance
db = AttendanceDatabase()
