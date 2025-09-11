#!/usr/bin/env python3
"""
Maintenance Configuration
Simple file-based maintenance mode toggle for PythonAnywhere
"""

import os

# Maintenance mode flag file
MAINTENANCE_FLAG_FILE = 'maintenance_mode.flag'

def enable():
    """Enable maintenance mode by creating a flag file"""
    try:
        with open(MAINTENANCE_FLAG_FILE, 'w') as f:
            f.write('maintenance_enabled')
        print("🔧 Maintenance mode ENABLED!")
        print("🌐 Your app is now showing the maintenance page")
        return True
    except Exception as e:
        print(f"❌ Error enabling maintenance: {e}")
        return False

def disable():
    """Disable maintenance mode by removing the flag file"""
    try:
        if os.path.exists(MAINTENANCE_FLAG_FILE):
            os.remove(MAINTENANCE_FLAG_FILE)
        print("✅ Maintenance mode DISABLED!")
        print("🌐 Your app is now back online")
        return True
    except Exception as e:
        print(f"❌ Error disabling maintenance: {e}")
        return False

def status():
    """Check maintenance mode status"""
    if os.path.exists(MAINTENANCE_FLAG_FILE):
        print("🔧 Maintenance mode is ENABLED")
        print("   Users see the maintenance page")
        return True
    else:
        print("✅ Maintenance mode is DISABLED")
        print("   Users can access the normal app")
        return False

def db_stats():
    """Show database statistics"""
    try:
        from database import db
        stats = db.get_database_stats()
        print("📊 Database Statistics:")
        print(f"  Total Records: {stats['total_records']}")
        print(f"  Unique Employees: {stats['unique_employees']}")
        print(f"  Latest Upload: {stats['latest_upload']}")
    except Exception as e:
        print(f"❌ Error getting database stats: {e}")

def db_clear():
    """Clear all database data"""
    try:
        from database import db
        db.clear_existing_data()
        print("🗑️  Database cleared successfully!")
    except Exception as e:
        print(f"❌ Error clearing database: {e}")

def help():
    """Show available commands"""
    print("=" * 50)
    print("🛠️  PythonAnywhere Maintenance Commands")
    print("=" * 50)
    print("Available commands:")
    print("  enable()  - Enable maintenance mode")
    print("  disable() - Disable maintenance mode")
    print("  status()  - Show current status")
    print("  db_stats() - Show database statistics")
    print("  db_clear() - Clear all database data")
    print("  help()    - Show this help")
    print("=" * 50)
    print("Example usage:")
    print("  >>> enable()")
    print("  >>> db_stats()")
    print("  >>> disable()")

# Show help when imported
help()
