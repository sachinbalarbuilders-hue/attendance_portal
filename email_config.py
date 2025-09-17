#!/usr/bin/env python3
"""
Email configuration for OTP system
Update these settings with your Gmail credentials
"""

import os

# Gmail SMTP Configuration
# To use Gmail SMTP, you need to:
# 1. Enable 2-factor authentication on your Gmail account
# 2. Generate an App Password (not your regular password)
# 3. Set the environment variables below

# Set these environment variables or update the values directly:
GMAIL_EMAIL = os.getenv('GMAIL_EMAIL', 'your-email@gmail.com')
GMAIL_APP_PASSWORD = os.getenv('GMAIL_APP_PASSWORD', 'your-app-password')

# Company information
COMPANY_NAME = "Balar Builders"

# OTP settings
OTP_LENGTH = 6
OTP_EXPIRY_MINUTES = 5

# Email template settings
EMAIL_FROM_NAME = "Balar Builders IT Team"

print("Email Configuration:")
print(f"Gmail Email: {GMAIL_EMAIL}")
print(f"Company Name: {COMPANY_NAME}")
print(f"OTP Length: {OTP_LENGTH}")
print(f"OTP Expiry: {OTP_EXPIRY_MINUTES} minutes")
print("\nTo configure email:")
print("1. Set GMAIL_EMAIL environment variable to your Gmail address")
print("2. Set GMAIL_APP_PASSWORD environment variable to your Gmail App Password")
print("3. Or update the values directly in this file")
