# Employee Attendance Portal

A comprehensive web-based attendance management system built with Flask and SQLite database.

## Features

- **Employee Management**: Admin and employee role-based access
- **Excel Upload**: Upload and process attendance data from Excel files
- **Database Storage**: SQLite database with overwrite functionality
- **Maintenance Mode**: Professional maintenance page with toggle capability
- **Leave Tracking**: Track W/O, PL, SL, FL leave types
- **Real-time Statistics**: Attendance rates, payable days, and performance metrics
- **Responsive Design**: Modern, mobile-friendly interface

## Technology Stack

- **Backend**: Flask (Python)
- **Database**: SQLite
- **Frontend**: HTML, CSS, JavaScript
- **Data Processing**: Pandas, OpenPyXL
- **Deployment**: PythonAnywhere ready

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd attendance_portal
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application**
   ```bash
   python app.py
   ```

5. **Access the application**
   - Open browser and go to: `http://localhost:5000`

## Default Login Credentials

### Admin Account
- **Email**: `admin@balarbuilders.com`
- **Password**: `admin123`

### Manager Account
- **Email**: `bhavin.balarbuilders@gmail.com`
- **Password**: `bhavin123`

## Usage

### For Admins
1. Login with admin credentials
2. Upload Excel files containing attendance data
3. View comprehensive attendance reports
4. Manage employee accounts
5. Toggle maintenance mode

### For Employees
1. Login with employee credentials
2. View personal attendance records
3. Check leave balances
4. Export personal data

## Maintenance Mode

### Enable/Disable via PythonAnywhere Console
```python
# Load maintenance commands
exec(open('maintenance_config.py').read())

# Enable maintenance mode
enable()

# Disable maintenance mode
disable()

# Check status
status()
```

### Database Management
```python
# Load database manager
exec(open('db_manager.py').read())

# Show database statistics
show_stats()

# List all employees
show_employees()

# Show upload history
show_upload_history()

# Clear all data (with confirmation)
clear_database()
```

## File Structure

```
attendance_portal/
├── app.py                    # Main Flask application
├── database.py               # Database operations
├── maintenance_config.py     # Maintenance mode commands
├── db_manager.py            # Database management
├── requirements.txt         # Python dependencies
├── .gitignore              # Git ignore rules
├── README.md               # This file
├── templates/
│   └── maintenance.html    # Maintenance page template
├── static/                 # CSS, JS, images
└── uploads/               # Excel file uploads
```

## Database Schema

### Tables
- **attendance_records**: Employee attendance data
- **leave_totals**: Employee leave balances
- **file_uploads**: Upload history tracking

### Key Features
- **Overwrite Protection**: Re-uploading same filename overwrites existing data
- **Data Integrity**: Automatic employee account creation from Excel data
- **Audit Trail**: Complete upload history with timestamps

## Deployment

### PythonAnywhere Deployment
1. Upload all files to your PythonAnywhere account
2. Install dependencies: `pip3.10 install --user -r requirements.txt`
3. Create WSGI file: `attendance_portal.wsgi`
4. Configure web app with WSGI file path
5. Reload the web application

### WSGI Configuration
```python
import sys
import os

project_dir = '/home/yourusername/attendance_portal'
if project_dir not in sys.path:
    sys.path.append(project_dir)

os.chdir(project_dir)
from app import app as application
```

## API Endpoints

- `GET /` - Main application (maintenance page if enabled)
- `POST /api/login` - User authentication
- `POST /api/logout` - User logout
- `POST /api/upload` - Excel file upload (admin only)
- `GET /api/attendance` - Get attendance records
- `GET /api/employees` - Get employee list (admin only)
- `GET /api/leave-totals` - Get leave totals
- `GET /api/database-stats` - Database statistics (admin only)
- `GET /api/upload-history` - Upload history (admin only)
- `POST /api/clear-database` - Clear database (admin only)

## Requirements

- Python 3.8+
- Flask 2.3.3
- Pandas 2.1.0
- OpenPyXL 3.1.2
- Werkzeug 2.3.7
- Python-dotenv 1.0.0
- Requests 2.32.5

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is proprietary software for Balar Builders.

## Support

For technical support or questions, contact the development team.

---

**Built with ❤️ for Balar Builders Employee Management**
