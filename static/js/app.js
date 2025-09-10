// Global variables
let currentUser = null;
let attendanceData = [];
let employees = [];

// Utility functions
function showLoading(text = 'Processing...') {
    const overlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');
    loadingText.textContent = text;
    overlay.style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading-overlay').style.display = 'none';
}

function showNotification(message, type = 'success') {
    const container = document.getElementById('notification-container');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Authentication functions
async function login() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!email || !password) {
        showNotification('Please enter both email and password', 'error');
        return;
    }
    
    try {
        showLoading('Logging in...');
        
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        
        const result = await response.json();
        
        if (result.success) {
            currentUser = result.user;
            showDashboard();
            showNotification(`Welcome back, ${currentUser.name}!`);
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        showNotification('Login failed. Please try again.', 'error');
        console.error('Login error:', error);
    } finally {
        hideLoading();
    }
}

function showForgotPassword() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('forgot-password-form').style.display = 'block';
}

function backToLogin() {
    document.getElementById('forgot-password-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
}

async function submitPasswordReset() {
    const email = document.getElementById('reset-email').value.trim();
    
    if (!email) {
        showNotification('Please enter your email address', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/password-reset', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Password reset request submitted successfully!');
            backToLogin();
            document.getElementById('reset-email').value = '';
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        showNotification('Failed to submit request. Please try again.', 'error');
    }
}

async function logout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        currentUser = null;
        attendanceData = [];
        employees = [];
        showLoginPage();
        showNotification('Successfully logged out!');
    } catch (error) {
        console.error('Logout error:', error);
        // Still redirect to login even if server request fails
        showLoginPage();
    }
}

// Dashboard functions
function showLoginPage() {
    document.getElementById('dashboard-section').style.display = 'none';
    document.getElementById('login-section').style.display = 'flex';
    
    // Clear form fields
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
    document.getElementById('reset-email').value = '';
    
    // Reset to login form
    document.getElementById('forgot-password-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
}

function showDashboard() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('dashboard-section').style.display = 'block';
    
    document.getElementById('user-name').textContent = currentUser.name;
    
    if (currentUser.is_admin) {
        showAdminDashboard();
    } else {
        showEmployeeDashboard();
    }
    
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date-picker').value = today;
    
    // Load initial data
    loadAttendanceData();
    loadPasswordResetRequests();
}

function showAdminDashboard() {
    document.getElementById('admin-panel').style.display = 'block';
    document.getElementById('employee-panel').style.display = 'none';
    loadEmployees();
}

function showEmployeeDashboard() {
    document.getElementById('admin-panel').style.display = 'none';
    document.getElementById('employee-panel').style.display = 'block';
    document.getElementById('employee-name').textContent = currentUser.name;
}

// File upload functions
async function uploadFile() {
    const fileInput = document.getElementById('file-upload');
    const file = fileInput.files[0];
    
    if (!file) {
        showNotification('Please select a file', 'error');
        return;
    }
    
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
        showNotification('Please select a .xlsx file', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    const selectedDate = document.getElementById('date-picker').value;
    if (selectedDate) {
        formData.append('selected_date', selectedDate);
    }
    
    try {
        showLoading('Processing attendance file...');
        
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(result.message);
            loadAttendanceData();
            loadEmployees();
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        showNotification('Upload failed. Please try again.', 'error');
        console.error('Upload error:', error);
    } finally {
        hideLoading();
        fileInput.value = ''; // Clear the file input
    }
}

// Data loading functions
async function loadAttendanceData() {
    try {
        const statusFilter = currentUser.is_admin ? 
            document.getElementById('status-filter')?.value || 'All' : 
            document.getElementById('employee-status-filter')?.value || 'All';
        
        const employeeFilter = currentUser.is_admin ? 
            document.getElementById('employee-filter')?.value || '' : '';
        
        const url = new URL('/api/attendance', window.location.origin);
        if (statusFilter !== 'All') url.searchParams.append('status', statusFilter);
        if (employeeFilter) url.searchParams.append('employee', employeeFilter);
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success) {
            attendanceData = result.data;
            if (currentUser.is_admin) {
                displayAdminAttendanceData();
                updateAdminStats();
            } else {
                displayEmployeeAttendanceData();
                updateEmployeeStats();
            }
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        console.error('Error loading attendance data:', error);
        showNotification('Failed to load attendance data', 'error');
    }
}

async function loadEmployees() {
    if (!currentUser.is_admin) return;
    
    try {
        const response = await fetch('/api/employees');
        const result = await response.json();
        
        if (result.success) {
            employees = result.employees;
            updateEmployeeFilter();
        }
    } catch (error) {
        console.error('Error loading employees:', error);
    }
}

async function loadPasswordResetRequests() {
    if (!currentUser.is_admin) return;
    
    try {
        const response = await fetch('/api/reset-requests');
        const result = await response.json();
        
        if (result.success && result.requests.length > 0) {
            displayPasswordResetRequests(result.requests);
        }
    } catch (error) {
        console.error('Error loading reset requests:', error);
    }
}

// Display functions
function displayAdminAttendanceData() {
    const container = document.getElementById('attendance-table-container');
    
    if (attendanceData.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-inbox"></i>
                <h3>No Data Available</h3>
                <p>Upload an Excel file to get started</p>
            </div>
        `;
        return;
    }
    
    const table = createAttendanceTable(attendanceData);
    container.innerHTML = table;
}

function displayEmployeeAttendanceData() {
    const container = document.getElementById('employee-attendance-table');
    const employeeData = attendanceData.filter(record => record.Employee === currentUser.name);
    
    if (employeeData.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-user-clock"></i>
                <h3>No Personal Records Found</h3>
                <p>Your attendance records are not available in the current dataset.</p>
            </div>
        `;
        return;
    }
    
    const table = createAttendanceTable(employeeData);
    container.innerHTML = table;
}

function createAttendanceTable(data) {
    let html = `
        <table class="attendance-table">
            <thead>
                <tr>
                    <th>Employee</th>
                    <th>Date</th>
                    <th>Punch-In</th>
                    <th>Punch-Out</th>
                    <th>Status</th>
                    <th>Comments</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    data.forEach(record => {
        const statusClass = getStatusClass(record.Status);
        const comments = formatComments(record);
        
       html += `
    <tr class="${statusClass}">
        <td>${record.Employee}</td>
        <td>${formatDate(record.Date)}</td>
        <td class="${record.pin_highlight ? 'red-text' : ''}" 
            title="${record.pin_comment || ''}"
            onclick="showMobileTooltip(this, '${record.pin_comment || ''}')"
            data-comment="${record.pin_comment || ''}">
            ${record['Punch-In']}
        </td>
        <td class="${record.pout_highlight ? 'red-text' : ''}" 
            title="${record.pout_comment || ''}"
            onclick="showMobileTooltip(this, '${record.pout_comment || ''}')"
            data-comment="${record.pout_comment || ''}">
            ${record['Punch-Out']}
        </td>
        <td class="${record.status_highlight ? 'red-text' : ''}" 
            title="${record.status_comment || ''}"
            onclick="showMobileTooltip(this, '${record.status_comment || ''}')"
            data-comment="${record.status_comment || ''}">
            ${record.Status}
        </td>
        <td>${comments}</td>
    </tr>
`;

    });
    
    html += `
            </tbody>
        </table>
    `;
    
    return html;
}

// Add this function to your app.js
function showMobileTooltip(element, comment) {
    if (!comment.trim()) return; // Don't show empty tooltips
    
    // Remove any existing mobile tooltips
    const existingTooltip = document.querySelector('.mobile-tooltip');
    if (existingTooltip) {
        existingTooltip.remove();
    }
    
    // Create mobile tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'mobile-tooltip';
    tooltip.textContent = comment;
    
    // Position tooltip
    const rect = element.getBoundingClientRect();
    tooltip.style.position = 'fixed';
    tooltip.style.top = (rect.top - 10) + 'px';
    tooltip.style.left = (rect.left + rect.width/2) + 'px';
    tooltip.style.transform = 'translateX(-50%) translateY(-100%)';
    
    document.body.appendChild(tooltip);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        if (tooltip.parentNode) {
            tooltip.remove();
        }
    }, 3000);
}

// Close tooltip when tapping elsewhere
document.addEventListener('touchstart', function(e) {
    if (!e.target.closest('.attendance-table td[data-comment]')) {
        const tooltip = document.querySelector('.mobile-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }
});


function formatComments(record) {
    const comments = [];
    if (record.pin_comment && record.pin_comment.trim()) {
        comments.push(`Punch-In: ${record.pin_comment}`);
    }
    if (record.pout_comment && record.pout_comment.trim()) {
        comments.push(`Punch-Out: ${record.pout_comment}`);
    }
    if (record.status_comment && record.status_comment.trim()) {
        comments.push(`Status: ${record.status_comment}`);
    }
    return comments.join(' | ');
}

function getStatusClass(status) {
    if (status.startsWith('P')) return 'status-present';
    if (status.startsWith('A')) return 'status-absent';
    if (status.startsWith('W/O') || status.startsWith('PL') || status.startsWith('SL') || 
        status.startsWith('FL') || status.startsWith('HL')) return 'status-leave';
    return '';
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function updateAdminStats() {
    const totalEmployees = [...new Set(attendanceData.map(record => record.Employee))].length;
    const totalRecords = attendanceData.length;
    const dateUntil = document.getElementById('date-picker').value;
    
    document.getElementById('total-employees').textContent = totalEmployees;
    document.getElementById('total-records').textContent = totalRecords;
    document.getElementById('data-until').textContent = dateUntil ? new Date(dateUntil).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '--';
}

function updateEmployeeStats() {
    const employeeData = attendanceData.filter(record => record.Employee === currentUser.name);
    const totalDays = employeeData.length;
    const presentDays = employeeData.filter(record => record.Status.startsWith('P')).length;
    const attendanceRate = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : 0;
    
    let performanceStatus, performanceEmoji;
    if (attendanceRate >= 90) {
        performanceStatus = 'Excellent';
        performanceEmoji = '🌟';
    } else if (attendanceRate >= 75) {
        performanceStatus = 'Good';
        performanceEmoji = '👍';
    } else {
        performanceStatus = 'Needs Improvement';
        performanceEmoji = '⚠️';
    }
    
    document.getElementById('attendance-rate').textContent = `${attendanceRate}%`;
    document.getElementById('present-days').textContent = presentDays;
    document.getElementById('performance-status').innerHTML = `${performanceEmoji} ${performanceStatus}`;
}

function updateEmployeeFilter() {
    const select = document.getElementById('employee-filter');
    select.innerHTML = '<option value="">All Employees</option>';
    
    employees.forEach(employee => {
        const option = document.createElement('option');
        option.value = employee;
        option.textContent = employee;
        select.appendChild(option);
    });
}

function displayPasswordResetRequests(requests) {
    const section = document.getElementById('password-reset-section');
    const listContainer = document.getElementById('reset-requests-list');
    
    let html = '';
    requests.forEach((request, index) => {
        html += `
            <div class="reset-request">
                <h4>${request.name}</h4>
                <p><strong>Email:</strong> ${request.email}</p>
                <p><strong>Requested:</strong> ${new Date(request.timestamp).toLocaleString()}</p>
                <div class="reset-form">
                    <input type="password" id="new-password-${index}" placeholder="Enter new password">
                    <button onclick="resetUserPassword('${request.email}', ${index})">
                        <i class="fas fa-key"></i> Reset Password
                    </button>
                </div>
            </div>
        `;
    });
    
    listContainer.innerHTML = html;
    section.style.display = 'block';
}

async function resetUserPassword(email, index) {
    const newPassword = document.getElementById(`new-password-${index}`).value.trim();
    
    if (!newPassword) {
        showNotification('Please enter a new password', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, new_password: newPassword })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(`Password reset successfully for ${email}`);
            loadPasswordResetRequests(); // Reload to update the display
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        showNotification('Failed to reset password', 'error');
        console.error('Password reset error:', error);
    }
}

// Filter and utility functions
function applyFilters() {
    loadAttendanceData();
}

function applyEmployeeFilters() {
    loadAttendanceData();
}

function updateDateRange() {
    loadAttendanceData();
}

function exportData() {
    if (attendanceData.length === 0) {
        showNotification('No data to export', 'warning');
        return;
    }
    
    const csvContent = convertToCSV(attendanceData);
    downloadCSV(csvContent, 'attendance_data.csv');
}

function exportEmployeeData() {
    const employeeData = attendanceData.filter(record => record.Employee === currentUser.name);
    
    if (employeeData.length === 0) {
        showNotification('No data to export', 'warning');
        return;
    }
    
    const csvContent = convertToCSV(employeeData);
    downloadCSV(csvContent, `${currentUser.name}_attendance.csv`);
}

function convertToCSV(data) {
    if (data.length === 0) return '';
    
    const headers = ['Employee', 'Date', 'Punch-In', 'Punch-Out', 'Status', 'Comments'];
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add data rows
    data.forEach(record => {
        const comments = formatComments(record);
        const row = [
            `"${record.Employee}"`,
            `"${record.Date}"`,
            `"${record['Punch-In']}"`,
            `"${record['Punch-Out']}"`,
            `"${record.Status}"`,
            `"${comments}"`
        ];
        csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
}

function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showNotification(`${filename} downloaded successfully!`);
}

function toggleDemoCredentials() {
    const content = document.getElementById('demo-content');
    content.classList.toggle('show');
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Add drag and drop functionality
    const uploadArea = document.querySelector('.file-upload-area');
    if (uploadArea) {
        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                document.getElementById('file-upload').files = files;
                uploadFile();
            }
        });
    }
    
    // Add enter key support for login
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            if (document.getElementById('login-section').style.display !== 'none') {
                if (document.getElementById('login-form').style.display !== 'none') {
                    login();
                } else if (document.getElementById('forgot-password-form').style.display !== 'none') {
                    submitPasswordReset();
                }
            }
        }
    });
});
