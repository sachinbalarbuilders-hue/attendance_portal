#!/usr/bin/env python3
"""
Email service for sending OTP codes
Uses Gmail SMTP for sending emails
"""

import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import random
import string
import os
from typing import Optional

class EmailService:
    def __init__(self):
        """Initialize email service with Gmail SMTP settings"""
        # Gmail SMTP settings
        self.smtp_server = "smtp.gmail.com"
        self.smtp_port = 587
        
        # Email credentials - these should be set as environment variables
        self.sender_email = os.getenv('GMAIL_EMAIL', 'your-email@gmail.com')
        self.sender_password = os.getenv('GMAIL_APP_PASSWORD', 'your-app-password')
        
        # Check if credentials are configured
        if self.sender_email == 'your-email@gmail.com' or self.sender_password == 'your-app-password':
            print("⚠️  Gmail credentials not configured!")
            print("   Run 'python setup_gmail.py' to configure Gmail")
            print("   Or set GMAIL_EMAIL and GMAIL_APP_PASSWORD environment variables")
        
        # Company name for email templates
        self.company_name = "Balar Builders"
    
    def generate_otp(self, length: int = 6) -> str:
        """Generate a random OTP code"""
        return ''.join(random.choices(string.digits, k=length))
    
    def create_otp_email_template(self, otp_code: str, employee_name: str) -> str:
        """Create HTML email template for OTP"""
        html_template = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Change OTP</title>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background-color: #2c3e50;
                    color: white;
                    padding: 20px;
                    text-align: center;
                    border-radius: 8px 8px 0 0;
                }}
                .content {{
                    background-color: #f8f9fa;
                    padding: 30px;
                    border-radius: 0 0 8px 8px;
                }}
                .otp-box {{
                    background-color: #e74c3c;
                    color: white;
                    font-size: 32px;
                    font-weight: bold;
                    text-align: center;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                    letter-spacing: 5px;
                }}
                .warning {{
                    background-color: #fff3cd;
                    border: 1px solid #ffeaa7;
                    color: #856404;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 20px 0;
                }}
                .footer {{
                    text-align: center;
                    margin-top: 30px;
                    color: #666;
                    font-size: 14px;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>{self.company_name}</h1>
                <h2>Password Change Verification</h2>
            </div>
            
            <div class="content">
                <p>Hello <strong>{employee_name}</strong>,</p>
                
                <p>You have requested to change your password for the {self.company_name} Attendance Portal.</p>
                
                <p>Please use the following OTP code to verify your identity:</p>
                
                <div class="otp-box">{otp_code}</div>
                
                <div class="warning">
                    <strong>Important:</strong>
                    <ul>
                        <li>This OTP is valid for 5 minutes only</li>
                        <li>Do not share this code with anyone</li>
                        <li>If you didn't request this password change, please contact your administrator</li>
                    </ul>
                </div>
                
                <p>Enter this code in the password change form to complete the process.</p>
                
                <p>Best regards,<br>
                <strong>{self.company_name} IT Team</strong></p>
            </div>
            
            <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
                <p>&copy; 2024 {self.company_name}. All rights reserved.</p>
            </div>
        </body>
        </html>
        """
        return html_template
    
    def send_otp_email(self, to_email: str, otp_code: str, employee_name: str) -> bool:
        """Send OTP email to the specified address"""
        try:
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = f"{self.company_name} - Password Change OTP"
            message["From"] = self.sender_email
            message["To"] = to_email
            
            # Create HTML content
            html_content = self.create_otp_email_template(otp_code, employee_name)
            
            # Create plain text version
            text_content = f"""
            {self.company_name} - Password Change OTP
            
            Hello {employee_name},
            
            You have requested to change your password for the {self.company_name} Attendance Portal.
            
            Your OTP code is: {otp_code}
            
            This OTP is valid for 5 minutes only.
            Do not share this code with anyone.
            
            If you didn't request this password change, please contact your administrator.
            
            Best regards,
            {self.company_name} IT Team
            
            This is an automated message. Please do not reply to this email.
            """
            
            # Attach parts
            text_part = MIMEText(text_content, "plain")
            html_part = MIMEText(html_content, "html")
            
            message.attach(text_part)
            message.attach(html_part)
            
            # Create secure connection and send email
            context = ssl.create_default_context()
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls(context=context)
                server.login(self.sender_email, self.sender_password)
                server.sendmail(self.sender_email, to_email, message.as_string())
            
            print(f"OTP email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            print(f"Error sending OTP email to {to_email}: {e}")
            return False
    
    def test_email_connection(self) -> bool:
        """Test email connection"""
        try:
            context = ssl.create_default_context()
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls(context=context)
                server.login(self.sender_email, self.sender_password)
            print("Email connection test successful")
            return True
        except Exception as e:
            print(f"Email connection test failed: {e}")
            return False

# Create global instance
email_service = EmailService()
