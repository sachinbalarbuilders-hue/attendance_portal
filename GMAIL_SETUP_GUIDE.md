# Gmail Setup Guide for OTP System

## Step 1: Enable 2-Factor Authentication

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Sign in to your Google account
3. Under "Signing in to Google", click **2-Step Verification**
4. Follow the prompts to enable 2-factor authentication

## Step 2: Generate App Password

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", click **App passwords**
3. You may need to sign in again
4. Select **Mail** as the app
5. Select **Other (custom name)** as the device
6. Enter "Attendance Portal OTP" as the name
7. Click **Generate**
8. **Copy the 16-character password** (it will look like: `abcd efgh ijkl mnop`)

## Step 3: Configure the Application

### Option A: Environment Variables (Recommended)
Set these environment variables in your system:

**Windows (PowerShell):**
```powershell
$env:GMAIL_EMAIL="your-email@gmail.com"
$env:GMAIL_APP_PASSWORD="your-16-character-app-password"
```

**Windows (Command Prompt):**
```cmd
set GMAIL_EMAIL=your-email@gmail.com
set GMAIL_APP_PASSWORD=your-16-character-app-password
```

**Linux/Mac:**
```bash
export GMAIL_EMAIL="your-email@gmail.com"
export GMAIL_APP_PASSWORD="your-16-character-app-password"
```

### Option B: Direct Configuration
Update the values in `email_config.py`:

```python
GMAIL_EMAIL = "your-email@gmail.com"
GMAIL_APP_PASSWORD = "your-16-character-app-password"
```

## Step 4: Test Configuration

Run the test script to verify everything works:

```bash
python -c "from email_service import email_service; print('Email test:', email_service.test_email_connection())"
```

## Important Notes

- **Never use your regular Gmail password** - always use the App Password
- **Keep your App Password secure** - don't share it or commit it to version control
- **The App Password is 16 characters** with spaces (remove spaces when using)
- **If you change your Gmail password**, you'll need to generate a new App Password

## Troubleshooting

### "Username and Password not accepted" Error
- Make sure 2-factor authentication is enabled
- Use the App Password, not your regular password
- Remove spaces from the App Password when setting it

### "Less secure app access" Error
- This shouldn't happen with App Passwords
- Make sure you're using the App Password, not your regular password

### Email Not Sending
- Check your internet connection
- Verify the App Password is correct
- Make sure the recipient email is valid

## Security Best Practices

1. **Use environment variables** instead of hardcoding credentials
2. **Never commit credentials** to version control
3. **Use a dedicated Gmail account** for the application if possible
4. **Regularly rotate App Passwords** for security
5. **Monitor email sending** for any suspicious activity
