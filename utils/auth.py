import hashlib

class EmployeeDatabase:
    def __init__(self):
        # Initialize with ONLY admin accounts - employees will be auto-created from Excel
        self.EMPLOYEE_DB = {
            # Admin accounts only
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
    
    def clean_employee_name(self, full_name):
        """Clean employee name by removing suffixes like (T), (TC), etc."""
        import re
        cleaned_name = full_name.strip()
        cleaned_name = re.sub(r'\s*\([^)]*\)$', '', cleaned_name)
        return cleaned_name.lower().replace(' ', '').replace('.', '').replace('-', '')
    
    def create_employee_email(self, full_name):
        """Convert 'Sachin Mandal (T)' to 'sachinmandal@gmail.com'"""
        email_name = self.clean_employee_name(full_name)
        return f"{email_name}@gmail.com"
    
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

# Create global instance
employee_db = EmployeeDatabase()

# Legacy function for backward compatibility
def authenticate_user(email, password):
    """Legacy function - use employee_db.authenticate_user() instead"""
    return employee_db.authenticate_user(email, password)
