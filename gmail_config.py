#!/usr/bin/env python3
"""
Gmail Configuration for OTP System
Update these values with your actual Gmail credentials
"""

import os

# Gmail SMTP Configuration
# Replace these with your actual Gmail credentials
GMAIL_EMAIL = "sachin.balarbuilders@gmail.com"
GMAIL_APP_PASSWORD = "syrx imud ysel upqf"

# Set environment variables
os.environ['GMAIL_EMAIL'] = GMAIL_EMAIL
os.environ['GMAIL_APP_PASSWORD'] = GMAIL_APP_PASSWORD

print("✅ Gmail configuration loaded!")
print(f"📧 Email: {GMAIL_EMAIL}")
print("🔐 App Password: Configured")

# Instructions for getting App Password:
print("\n📋 To get your Gmail App Password:")
print("1. Go to: https://myaccount.google.com/security")
print("2. Enable 2-factor authentication")
print("3. Click 'App passwords'")
print("4. Select 'Mail' and 'Other (custom name)'")
print("5. Enter 'Attendance Portal' as name")
print("6. Copy the 16-character password")
print("7. Replace 'your-16-character-app-password-here' above with your actual password")
