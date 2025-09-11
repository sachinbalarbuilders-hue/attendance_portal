from flask import Flask, render_template, request, jsonify, session, send_from_directory
import pandas as pd
from openpyxl import load_workbook
import hashlib
import datetime
import os
from werkzeug.utils import secure_filename
import tempfile
from database import db
try:
    from dotenv import load_dotenv
    # Load environment variables
    load_dotenv()
except ImportError:
    # dotenv not available (e.g., on PythonAnywhere)
    pass

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'your-secret-key-change-this-in-production')
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Maintenance mode configuration
MAINTENANCE_FLAG_FILE = 'maintenance_mode.flag'

def is_maintenance_mode():
    """Check if maintenance mode is enabled by looking for flag file"""
    return os.path.exists(MAINTENANCE_FLAG_FILE)

# Create upload folder if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# **FIXED: Single EmployeeDatabase class definition**
class EmployeeDatabase:
    def __init__(self):
        # Initialize with ONLY admin accounts - employees will be auto-created from Excel
        self.EMPLOYEE_DB = {
            # Admin accounts only (updated for Balar Builders)
            "admin@balarbuilders.com": {
                "password": hashlib.sha256("admin123".encode()).hexdigest(),
                "name": "System Administrator",
                "role": "Admin",
                "is_admin": True
            },
            "bhavin.balarbuilders@gmail.com": {
                "password": hashlib.sha256("bhavin123".encode()).hexdigest(),
                "name": "Bhavin Patel",
                "role": "Manager",
                "is_admin": True
            }
        }

    def create_employee_email(self, full_name):
        """Convert 'Pramod Dubey' to 'pramoddubey.balarbuilders@gmail.com'"""
        email_name = full_name.lower().replace(' ', '').replace('.', '')
        return f"{email_name}.balarbuilders@gmail.com"

    def add_employee(self, employee_name):
        """Add new employee to database"""
        email = self.create_employee_email(employee_name)
        password_hash = hashlib.sha256("Balar123".encode()).hexdigest()
        
        if email not in self.EMPLOYEE_DB:
            self.EMPLOYEE_DB[email] = {
                "password": password_hash,
                "name": employee_name,
                "role": "Employee",
                "is_admin": False
            }
            return True, email
        return False, email

    def authenticate_user(self, email, password):
        """Authenticate user credentials"""
        if email in self.EMPLOYEE_DB:
            hashed_password = hashlib.sha256(password.encode()).hexdigest()
            if self.EMPLOYEE_DB[email]["password"] == hashed_password:
                return True, self.EMPLOYEE_DB[email]
        return False, None

    def get_all_employees(self):
        """Get list of all employee names (excluding admins)"""
        return [user_data["name"] for email, user_data in self.EMPLOYEE_DB.items()
                if not user_data["is_admin"]]

    def user_exists(self, email):
        """Check if user already exists"""
        return email in self.EMPLOYEE_DB

    def process_excel_employees(self, unique_employees):
        """Process employee list from Excel and create accounts"""
        created_accounts = []
        existing_accounts = []
        
        for employee_name in unique_employees:
            success, email = self.add_employee(employee_name)
            if success:
                created_accounts.append({
                    'name': employee_name,
                    'email': email,
                    'password': 'Balar123'
                })
            else:
                existing_accounts.append({
                    'name': employee_name,
                    'email': email
                })
        
        return created_accounts, existing_accounts

    def reset_password(self, email, new_password):
        """Reset user password"""
        if email in self.EMPLOYEE_DB:
            self.EMPLOYEE_DB[email]["password"] = hashlib.sha256(new_password.encode()).hexdigest()
            return True
        return False

    def get_user_by_email(self, email):
        """Get user data by email"""
        return self.EMPLOYEE_DB.get(email, None)

# **FIXED: Single global instance**
employee_db = EmployeeDatabase()

# Global variables for session-like behavior
password_reset_requests = []

def authenticate_user(email, password):
    """Use the centralized authentication"""
    return employee_db.authenticate_user(email, password)

def is_font_red(cell):
    """Check if font color is specifically red or red-like"""
    if cell is None or cell.font is None:
        return False
    
    color = cell.font.color
    if color is None:
        return False
    
    # Handle RGB colors - check for red shades
    if color.type == "rgb" and color.rgb is not None:
        rgb_val = color.rgb.upper()
        red_colors = [
            "FFFF0000", "FF0000", "FFDC143C", "FFB22222", "FF8B0000",
            "FFCD5C5C", "FFF08080", "FFFA8072", "FFFF6347", "FFFF1493"
        ]
        return rgb_val in red_colors
    elif color.type == "indexed" and color.indexed is not None:
        red_indices = [3, 5, 10, 53]
        return color.indexed in red_indices
    elif color.type == "theme" and color.theme is not None:
        return color.theme == 2
    
    return False

def process_attendance_file(file_path, selected_date=None):
    """Process attendance data from Excel file - optimized for Render"""
    if selected_date is None:
        selected_date = datetime.date.today()
    
    # Use read_only mode to save memory
    wb = load_workbook(file_path, data_only=False, read_only=True)
    visible_sheets = [sheet for sheet in wb.worksheets if sheet.sheet_state == "visible"]
    
    month_abbr = selected_date.strftime("%b").upper()
    year = selected_date.year
    day_limit = selected_date.day
    
    # Your 5 blank employees
    blank_employees = [
        "Bhavin Patel",
        "Pramod Dubey",
        "Shrikant Talekar",
        "Jitendra Patolia",
        "Lalit Dobariya"
    ]
    
    def to_ts(x):
        if x is None or (isinstance(x, float) and pd.isna(x)):
            return pd.NaT
        try:
            return pd.to_datetime(x, errors="coerce")
        except Exception:
            return pd.NaT
    
    records = []
    
    ignore_statuses = {"P", "A", "W/O", "PL", "SL", "FL", "HL", "PAT", "MAT"}

    for sheet in visible_sheets:
        df = pd.read_excel(file_path, sheet_name=sheet.title, header=None)
        
        if df.dropna(how="all").empty:
            continue
        
        month_rows = [
            i for i in range(len(df)) if str(df.iloc[i, 0]).upper().startswith(month_abbr)
        ]
        
        if not month_rows:
            continue
        
        i = month_rows[0]
        
        for d in range(1, day_limit + 1):
            col = d + 2
            
            if col >= df.shape[1]:
                continue
            
            date_val = datetime.date(year, selected_date.month, d).strftime('%Y-%m-%d')
            status_row = i + 2
            status = ""
            
            if status_row < len(df):
                s = df.iloc[status_row, col]
                if pd.notna(s):
                    status = str(s).upper().strip()
            
            # Get cells for formatting info
            pin_cell = wb[sheet.title].cell(i + 1, col + 1)
            pout_cell = wb[sheet.title].cell(i + 2, col + 1) if i + 1 < len(df) else None
            status_cell = wb[sheet.title].cell(status_row + 1, col + 1) if status_row < len(df) else None
            
            # Comments logic
            pin_comment, pout_comment, status_comment = "", "", ""
            try:
                if pin_cell and pin_cell.comment:
                    pin_comment = pin_cell.comment.text
                if pout_cell and pout_cell.comment:
                    pout_comment = pout_cell.comment.text
                if status_cell and status_cell.comment:
                    status_comment = status_cell.comment.text
            except:
                pass
            
            # RED font color detection
            pin_highlight = is_font_red(pin_cell) if pin_cell else False
            pout_highlight = is_font_red(pout_cell) if pout_cell else False
            status_highlight = is_font_red(status_cell) if status_cell else False
            
            # **Rules for special statuses**
            if status in ["A", "W/O", "PL", "SL", "FL", "HL", "PAT", "MAT", "HF", "PHF", "SHF"]:
                # Show no punches for off/leave/paid statuses
                pin, pout = "", ""
            elif sheet.title.strip() in blank_employees:
                pin, pout = "", ""  # Keep blank for exception employees
            else:
                raw1 = df.iloc[i, col] if pd.notna(df.iloc[i, col]) else None
                raw2 = df.iloc[i + 1, col] if i + 1 < len(df) and pd.notna(df.iloc[i + 1, col]) else None
                
                t1, t2 = to_ts(raw1), to_ts(raw2)
                
                if pd.notna(t1) and pd.notna(t2):
                    pin, pout = t1.strftime("%H:%M"), t2.strftime("%H:%M")
                elif pd.notna(t1) and pd.isna(t2):
                    # Missing-check only when status not in ignore set
                    if status not in ignore_statuses:
                        if t1.hour >= 12:
                            pin, pout = "⚠️ MISSING", t1.strftime("%H:%M")
                        else:
                            pin, pout = t1.strftime("%H:%M"), "⚠️ MISSING"
                    else:
                        # Ignore missing, hide punches for leave/off
                        pin, pout = "", ""
                elif pd.isna(t1) and pd.notna(t2):
                    if status not in ignore_statuses:
                        if t2.hour >= 12:
                            pin, pout = "⚠️ MISSING", t2.strftime("%H:%M")
                        else:
                            pin, pout = t2.strftime("%H:%M"), "⚠️ MISSING"
                    else:
                        pin, pout = "", ""
                else:
                    # Both punches missing
                    if status not in ignore_statuses:
                        pin, pout = "⚠️ MISSING", "⚠️ MISSING"
                    else:
                        pin, pout = "", ""

            records.append({
                "Employee": sheet.title,
                "Date": date_val,
                "Punch-In": pin,
                "Punch-Out": pout,
                "Status": status,
                "pin_comment": pin_comment,
                "pout_comment": pout_comment,
                "status_comment": status_comment,
                "pin_highlight": pin_highlight,
                "pout_highlight": pout_highlight,
                "status_highlight": status_highlight
            })
    
    return records


    
    def to_ts(x):
        if x is None or (isinstance(x, float) and pd.isna(x)):
            return pd.NaT
        try:
            return pd.to_datetime(x, errors="coerce")
        except Exception:
            return pd.NaT
    
    records = []
    
    for sheet in visible_sheets:
        df = pd.read_excel(file_path, sheet_name=sheet.title, header=None)
        
        if df.dropna(how="all").empty:
            continue
        
        month_rows = [
            i for i in range(len(df)) if str(df.iloc[i, 0]).upper().startswith(month_abbr)
        ]
        
        if not month_rows:
            continue
        
        i = month_rows[0]
        
        for d in range(1, day_limit + 1):
            col = d + 2
            
            if col >= df.shape[1]:
                continue
            
            date_val = datetime.date(year, selected_date.month, d).strftime('%Y-%m-%d')
            status_row = i + 2
            status = ""
            
            if status_row < len(df):
                s = df.iloc[status_row, col]
                if pd.notna(s):
                    status = str(s).upper().strip()
            
            # Get cells for formatting info
            pin_cell = wb[sheet.title].cell(i + 1, col + 1)
            pout_cell = wb[sheet.title].cell(i + 2, col + 1) if i + 1 < len(df) else None
            status_cell = wb[sheet.title].cell(status_row + 1, col + 1) if status_row < len(df) else None
            
            # Comments logic
            pin_comment, pout_comment, status_comment = "", "", ""
            try:
                if pin_cell and pin_cell.comment:
                    pin_comment = pin_cell.comment.text
                if pout_cell and pout_cell.comment:
                    pout_comment = pout_cell.comment.text
                if status_cell and status_cell.comment:
                    status_comment = status_cell.comment.text
            except:
                pass
            
            # RED font color detection
            pin_highlight = is_font_red(pin_cell) if pin_cell else False
            pout_highlight = is_font_red(pout_cell) if pout_cell else False
            status_highlight = is_font_red(status_cell) if status_cell else False
            
            # Punch logic
            if status in ["A", "W/O", "PL", "SL", "FL", "HL"]:
                pin, pout = "--", "--"
            elif sheet.title.strip() in blank_employees:
                pin, pout = "", ""
            else:
                raw1 = df.iloc[i, col] if pd.notna(df.iloc[i, col]) else None
                raw2 = df.iloc[i + 1, col] if i + 1 < len(df) and pd.notna(df.iloc[i + 1, col]) else None
                
                t1, t2 = to_ts(raw1), to_ts(raw2)
                
                if pd.notna(t1) and pd.notna(t2):
                    pin, pout = t1.strftime("%H:%M"), t2.strftime("%H:%M")
                elif pd.notna(t1) and pd.isna(t2):
                    if t1.hour >= 12:
                        pin, pout = "❌ Missing", t1.strftime("%H:%M")
                    else:
                        pin, pout = t1.strftime("%H:%M"), "❌ Missing"
                elif pd.isna(t1) and pd.notna(t2):
                    if t2.hour >= 12:
                        pin, pout = "❌ Missing", t2.strftime("%H:%M")
                    else:
                        pin, pout = t2.strftime("%H:%M"), "❌ Missing"
                else:
                    pin, pout = "❌ Missing", "❌ Missing"
            
            records.append({
                "Employee": sheet.title,
                "Date": date_val,
                "Punch-In": pin,
                "Punch-Out": pout,
                "Status": status,
                "pin_comment": pin_comment,
                "pout_comment": pout_comment,
                "status_comment": status_comment,
                "pin_highlight": pin_highlight,
                "pout_highlight": pout_highlight,
                "status_highlight": status_highlight
            })
    
    return records


def extract_leave_totals(file_path):
    """Parse cumulative W/O, PL, SL, FL totals per employee sheet from the Excel.
    Strategy: find header row containing these labels, then take the last numeric value
    in each corresponding column as the sheet's cumulative total.
    """
    wb = load_workbook(file_path, data_only=True)
    visible_sheets = [sheet for sheet in wb.worksheets if sheet.sheet_state == "visible"]

    per_employee = {}

    target_labels = {
        "W/O": ["W/O", "W O", "W-0", "W-O"],
        "PL": ["PL"],
        "SL": ["SL"],
        "FL": ["FL"],
    }

    for sheet in visible_sheets:
        ws = wb[sheet.title]

        # Search header rows (first 10 rows) for our labels
        label_to_col = {}
        max_header_rows = min(10, ws.max_row)
        for r in range(1, max_header_rows + 1):
            for c in range(1, ws.max_column + 1):
                val = ws.cell(row=r, column=c).value
                if not isinstance(val, str):
                    continue
                text = val.strip().upper()
                for key, variants in target_labels.items():
                    if text in [v.upper() for v in variants]:
                        label_to_col[key] = c
            # Small optimization: if all found, stop searching
            if len(label_to_col) == len(target_labels):
                break

        if not label_to_col:
            continue

        # Walk from bottom up to locate last numeric value for each label
        totals = {"W/O": 0, "PL": 0, "SL": 0, "FL": 0}
        for key, col in label_to_col.items():
            for r in range(ws.max_row, 0, -1):
                cell = ws.cell(row=r, column=col)
                val = cell.value
                if isinstance(val, (int, float)):
                    try:
                        totals[key] = float(val)
                    except Exception:
                        totals[key] = 0
                    break

        per_employee[sheet.title] = totals

    return per_employee

# Routes
@app.route('/')
def index():
    if is_maintenance_mode():
        return render_template('maintenance.html')
    return render_template('index.html')

@app.route('/maintenance')
def maintenance():
    return render_template('maintenance.html')

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'success': False, 'message': 'Email and password required'})

    is_valid, user_data = authenticate_user(email, password)

    if is_valid:
        session['user_email'] = email
        session['user_data'] = user_data
        return jsonify({'success': True, 'user': user_data})

    return jsonify({'success': False, 'message': 'Invalid credentials'})

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True})

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'user_data' not in session or not session['user_data'].get('is_admin'):
        return jsonify({'success': False, 'message': 'Admin access required'})

    # Support multiple files under key 'files'
    files = request.files.getlist('files')
    if not files:
        return jsonify({'success': False, 'message': 'No files uploaded'})

    # Filter valid Excel files and check size
    valid_files = []
    for f in files:
        if f and f.filename and f.filename.lower().endswith('.xlsx'):
            # Check file size (limit to 5MB for free tier)
            f.seek(0, 2)  # Seek to end
            file_size = f.tell()
            f.seek(0)  # Reset to beginning
            
            if file_size > 2 * 1024 * 1024:  # 2MB limit for Render free tier
                return jsonify({'success': False, 'message': f'File {f.filename} is too large. Please keep files under 2MB for Render free tier.'})
            
            valid_files.append(f)
    
    if not valid_files:
        return jsonify({'success': False, 'message': 'No valid .xlsx files selected'})

    # Limit to 1 file at a time to prevent timeout
    if len(valid_files) > 1:
        return jsonify({'success': False, 'message': 'Please upload one file at a time to prevent timeout'})

    try:
        selected_date = datetime.date.today()
        if 'selected_date' in request.form:
            selected_date = datetime.datetime.strptime(request.form['selected_date'], '%Y-%m-%d').date()

        total_records = 0
        uploaded_filepaths = []
        created_accounts = []
        existing_accounts = []

        for file in valid_files:
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            uploaded_filepaths.append(filepath)

            # Process attendance data with memory optimization
            try:
                # Process in smaller chunks to avoid memory issues
                file_records = process_attendance_file(filepath, selected_date)
                
                # Limit records to prevent memory overflow on Render
                if len(file_records) > 1000:
                    file_records = file_records[:1000]  # Limit to 1000 records max
                
                # Save to database
                records_saved = db.save_attendance_records(file_records, filename)
                total_records += records_saved

                # Process leave totals (simplified for memory)
                try:
                    sheet_totals = extract_leave_totals(filepath)
                    db.save_leave_totals(sheet_totals, filename)
                except Exception as e:
                    # If leave totals fail, continue without them
                    print(f"Warning: Could not process leave totals: {e}")

                # Auto-create employee accounts (limit to prevent memory issues)
                unique_employees = list(set([record['Employee'] for record in file_records[:100]]))  # Limit to 100 employees
                file_created, file_existing = employee_db.process_excel_employees(unique_employees)
                created_accounts.extend(file_created)
                existing_accounts.extend(file_existing)

            except Exception as e:
                return jsonify({'success': False, 'message': f'Error processing file {filename}: {str(e)}'})

        # Cleanup uploaded files
        for p in uploaded_filepaths:
            if os.path.exists(p):
                os.remove(p)

        message = f"Processed {len(valid_files)} file(s), {total_records} total records saved to database. "
        if created_accounts:
            message += f"{len(created_accounts)} new employee accounts created."

        return jsonify({
            'success': True,
            'message': message,
            'record_count': total_records,
            'files_processed': len(valid_files),
            'created_accounts': created_accounts,
            'total_employees': len(set([acc['name'] for acc in created_accounts + existing_accounts])),
            'new_accounts': len(created_accounts)
        })

    except Exception as e:
        # Cleanup on error
        for p in uploaded_filepaths:
            if os.path.exists(p):
                os.remove(p)
        return jsonify({'success': False, 'message': f'Error processing files: {str(e)}'})

    

@app.route('/api/attendance')
def get_attendance():
    if 'user_data' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'})

    user_data = session['user_data']
    filter_status = request.args.get('status', 'All')
    employee_filter = request.args.get('employee')

    # Determine which employee to filter by
    if not user_data.get('is_admin') or employee_filter:
        target_employee = employee_filter if employee_filter else user_data['name']
    else:
        target_employee = None

    # Get data from database
    filtered_data = db.get_attendance_records(target_employee, filter_status)

    return jsonify({'success': True, 'data': filtered_data})


    

@app.route('/api/employees')
def get_employees():
    if 'user_data' not in session or not session['user_data'].get('is_admin'):
        return jsonify({'success': False, 'message': 'Admin access required'})

    employees = db.get_employees()
    return jsonify({'success': True, 'employees': sorted(employees)})


@app.route('/api/leave-totals')
def get_leave_totals():
    if 'user_data' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'})

    user_data = session['user_data']
    employee = request.args.get('employee')

    # Non-admins can only view their own totals
    if not user_data.get('is_admin'):
        employee = user_data['name']

    # Get data from database
    totals = db.get_leave_totals(employee)
    
    if employee and employee not in totals:
        totals[employee] = {"W/O": 0, "PL": 0, "SL": 0, "FL": 0}

    return jsonify({'success': True, 'data': totals})

@app.route('/api/database-stats')
def get_database_stats():
    if 'user_data' not in session or not session['user_data'].get('is_admin'):
        return jsonify({'success': False, 'message': 'Admin access required'})

    stats = db.get_database_stats()
    return jsonify({'success': True, 'stats': stats})

@app.route('/api/upload-history')
def get_upload_history():
    if 'user_data' not in session or not session['user_data'].get('is_admin'):
        return jsonify({'success': False, 'message': 'Admin access required'})

    history = db.get_upload_history()
    return jsonify({'success': True, 'history': history})

@app.route('/api/clear-database', methods=['POST'])
def clear_database():
    if 'user_data' not in session or not session['user_data'].get('is_admin'):
        return jsonify({'success': False, 'message': 'Admin access required'})

    try:
        db.clear_existing_data()
        return jsonify({'success': True, 'message': 'Database cleared successfully'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error clearing database: {str(e)}'})

@app.route('/api/test-upload', methods=['POST'])
def test_upload():
    """Simple test endpoint to check if basic upload works"""
    if 'user_data' not in session or not session['user_data'].get('is_admin'):
        return jsonify({'success': False, 'message': 'Admin access required'})
    
    try:
        files = request.files.getlist('files')
        if not files:
            return jsonify({'success': False, 'message': 'No files uploaded'})
        
        file = files[0]
        if file and file.filename and file.filename.lower().endswith('.xlsx'):
            # Just check file size and return success
            file.seek(0, 2)
            file_size = file.tell()
            file.seek(0)
            
            return jsonify({
                'success': True, 
                'message': f'File {file.filename} received successfully. Size: {file_size} bytes',
                'file_size': file_size
            })
        else:
            return jsonify({'success': False, 'message': 'Invalid file type'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Test upload error: {str(e)}'})

@app.route('/api/password-reset', methods=['POST'])
def request_password_reset():
    global password_reset_requests

    data = request.json
    email = data.get('email')

    # Check if user exists in our database
    if employee_db.user_exists(email):
        user_data = employee_db.get_user_by_email(email)
        if user_data:
            request_obj = {
                "email": email,
                "name": user_data["name"],
                "timestamp": datetime.datetime.now().isoformat(),
                "status": "pending"
            }
            password_reset_requests.append(request_obj)
            return jsonify({'success': True, 'message': 'Password reset request submitted'})

    return jsonify({'success': False, 'message': 'Email not found'})

@app.route('/api/reset-requests')
def get_reset_requests():
    global password_reset_requests

    if 'user_data' not in session or not session['user_data'].get('is_admin'):
        return jsonify({'success': False, 'message': 'Admin access required'})

    pending_requests = [req for req in password_reset_requests if req['status'] == 'pending']
    return jsonify({'success': True, 'requests': pending_requests})

@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    global password_reset_requests

    if 'user_data' not in session or not session['user_data'].get('is_admin'):
        return jsonify({'success': False, 'message': 'Admin access required'})

    data = request.json
    email = data.get('email')
    new_password = data.get('new_password')

    if email and new_password:
        # Use centralized password reset
        if employee_db.reset_password(email, new_password):
            # Mark requests as completed
            for req in password_reset_requests:
                if req["email"] == email and req["status"] == "pending":
                    req["status"] = "completed"
            return jsonify({'success': True, 'message': 'Password reset successfully'})

    return jsonify({'success': False, 'message': 'Invalid email or password'})

if __name__ == '__main__':
    # For production, use gunicorn instead of Flask's built-in server
    # Check if running on PythonAnywhere (has specific environment)
    if 'PYTHONANYWHERE_DOMAIN' in os.environ:
        # PythonAnywhere - use their default settings
        app.run(debug=False)
    else:
        # Other platforms (Render, local, etc.)
        port = int(os.environ.get('PORT', 5000))
        debug = os.environ.get('FLASK_ENV') == 'development'
        app.run(host='0.0.0.0', port=port, debug=debug)
