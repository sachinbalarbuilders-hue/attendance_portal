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
                    upload_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    file_name TEXT,
                    UNIQUE(employee_name, date, file_name)
                )
            ''')
            
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
                     pin_highlight, pout_highlight, status_highlight, file_name)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                       upload_timestamp, file_name
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
            
            query += ' ORDER BY date DESC, employee_name'
            
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

# Global database instance
db = AttendanceDatabase()
