#!/usr/bin/env python3
"""
Database Management Script for PythonAnywhere
Simple commands to manage the attendance database
"""

from database import db

def show_stats():
    """Show database statistics"""
    stats = db.get_database_stats()
    print("📊 Database Statistics:")
    print(f"  Total Records: {stats['total_records']}")
    print(f"  Unique Employees: {stats['unique_employees']}")
    print(f"  Latest Upload: {stats['latest_upload']}")
    return stats

def show_employees():
    """Show list of employees in database"""
    employees = db.get_employees()
    print(f"👥 Employees in Database ({len(employees)}):")
    for i, emp in enumerate(employees, 1):
        print(f"  {i}. {emp}")
    return employees

def show_upload_history():
    """Show file upload history"""
    history = db.get_upload_history()
    print(f"📁 Upload History ({len(history)} files):")
    for i, upload in enumerate(history, 1):
        print(f"  {i}. {upload['file_name']} - {upload['record_count']} records - {upload['upload_timestamp']}")
    return history

def clear_database():
    """Clear all database data"""
    print("⚠️  This will delete ALL data from the database!")
    response = input("Are you sure? Type 'yes' to confirm: ")
    if response.lower() == 'yes':
        db.clear_existing_data()
        print("🗑️  Database cleared successfully!")
    else:
        print("❌ Operation cancelled")

def clear_file_data(filename):
    """Clear data for a specific file"""
    print(f"⚠️  This will delete data for file: {filename}")
    response = input("Are you sure? Type 'yes' to confirm: ")
    if response.lower() == 'yes':
        db.clear_existing_data(filename)
        print(f"🗑️  Data for {filename} cleared successfully!")
    else:
        print("❌ Operation cancelled")

def help():
    """Show available commands"""
    print("=" * 60)
    print("🗄️  Database Management Commands")
    print("=" * 60)
    print("Available commands:")
    print("  show_stats() - Show database statistics")
    print("  show_employees() - List all employees")
    print("  show_upload_history() - Show file upload history")
    print("  clear_database() - Clear all data (with confirmation)")
    print("  clear_file_data('filename.xlsx') - Clear specific file data")
    print("  help() - Show this help")
    print("=" * 60)
    print("Example usage:")
    print("  >>> show_stats()")
    print("  >>> show_employees()")
    print("  >>> clear_database()")

# Show help when imported
help()
