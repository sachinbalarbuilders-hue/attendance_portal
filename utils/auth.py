import hashlib

EMPLOYEE_DB = {
    "admin@company.com": {
        "password": hashlib.sha256("admin123".encode()).hexdigest(),
        "name": "System Administrator",
        "role": "Admin",
        "is_admin": True
    },
    "bhavin.patel@company.com": {
        "password": hashlib.sha256("bhavin123".encode()).hexdigest(),
        "name": "Bhavin Patel",
        "role": "Manager",
        "is_admin": True
    },
    "pramod.dubey@company.com": {
        "password": hashlib.sha256("pramod123".encode()).hexdigest(),
        "name": "Pramod Dubey",
        "role": "Senior Developer",
        "is_admin": False
    },
    "shrikant.talekar@company.com": {
        "password": hashlib.sha256("shrikant123".encode()).hexdigest(),
        "name": "Shrikant Talekar",
        "role": "Team Lead",
        "is_admin": False
    },
    "jitendra.patolia@company.com": {
        "password": hashlib.sha256("jitendra123".encode()).hexdigest(),
        "name": "Jitendra Patolia",
        "role": "Developer",
        "is_admin": False
    },
    "lalit.dobariya@company.com": {
        "password": hashlib.sha256("lalit123".encode()).hexdigest(),
        "name": "Lalit Dobariya",
        "role": "Junior Developer",
        "is_admin": False
    }
}

def authenticate_user(email, password):
    """Authenticate user credentials"""
    if email in EMPLOYEE_DB:
        hashed_password = hashlib.sha256(password.encode()).hexdigest()
        if EMPLOYEE_DB[email]["password"] == hashed_password:
            return True, EMPLOYEE_DB[email]
    return False, None
