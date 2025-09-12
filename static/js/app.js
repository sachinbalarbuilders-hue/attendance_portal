// Global variables
let currentUser = null;
let attendanceData = [];
let employees = [];
let filteredData = [];
let selectedEmployee = null;
let globalShowUpdateNote = false;

// Helper function to clean employee names (remove suffixes like (T), (TC), etc.)
function cleanEmployeeName(fullName) {
    if (!fullName) return '';
    return fullName.replace(/\s*\([^)]*\)$/, '').trim();
}

// Force desktop view
function forceDesktopView() {
    // Set minimum width for all devices
    document.documentElement.style.minWidth = '1200px';
    document.body.style.minWidth = '1200px';
    document.body.style.overflowX = 'auto';
    
    // Remove any mobile-specific classes
    document.body.classList.remove('mobile', 'touch-device');
    document.documentElement.classList.remove('mobile', 'touch-device');
    
    // Force desktop tooltip behavior
    handleDesktopComments();
}

// Enable responsive (mobile-friendly) mode
function enableResponsiveMode() {
    document.documentElement.style.minWidth = '';
    document.body.style.minWidth = '';
    document.body.style.overflowX = '';
    document.body.classList.add('mobile');
    document.documentElement.classList.add('mobile');
    
    // Disable heavy animations on mobile for better performance
    const style = document.createElement('style');
    style.textContent = `
        .desktop-tooltip, .mobile-tooltip {
            animation: none !important;
            transform: none !important;
            will-change: auto !important;
        }
        .attendance-table td[data-comment]:not([data-comment=""]):hover {
            transform: none !important;
        }
        .attendance-table td[data-comment]:not([data-comment=""]):hover:after {
            transform: none !important;
            animation: none !important;
        }
    `;
    document.head.appendChild(style);
}

// Enhanced desktop comment handling
function handleDesktopComments() {
    const commentCells = document.querySelectorAll('[data-comment]:not([data-comment=""])');
    
    commentCells.forEach(cell => {
        // Remove any existing event listeners
        cell.removeEventListener('touchstart', showMobileTooltip);
        cell.removeEventListener('touchend', hideMobileTooltip);
        
        // Add desktop hover events
        cell.addEventListener('mouseenter', showDesktopTooltip);
        cell.addEventListener('mouseleave', hideDesktopTooltip);
        cell.addEventListener('mousemove', moveDesktopTooltip);
    });
}

function showDesktopTooltip(event) {
    const cell = event.currentTarget;
    const comment = cell.getAttribute('data-comment');
    
    if (!comment) return;
    
    // Remove any existing tooltips
    const existingTooltip = document.querySelector('.desktop-tooltip');
    if (existingTooltip) {
        existingTooltip.remove();
    }
    
    const tooltip = document.createElement('div');
    tooltip.className = 'desktop-tooltip';
    tooltip.innerHTML = `<div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 16px;">💬</span>
        <span>${comment}</span>
    </div>`;
    
    document.body.appendChild(tooltip);
    
    // Position tooltip
    const rect = cell.getBoundingClientRect();
    tooltip.style.left = (rect.left + window.scrollX + rect.width/2 - tooltip.offsetWidth/2) + 'px';
    tooltip.style.top = (rect.top + window.scrollY - tooltip.offsetHeight - 10) + 'px';
    
    // Ensure tooltip stays within viewport
    if (tooltip.offsetLeft < 10) {
        tooltip.style.left = '10px';
    }
    if (tooltip.offsetLeft + tooltip.offsetWidth > window.innerWidth - 10) {
        tooltip.style.left = (window.innerWidth - tooltip.offsetWidth - 10) + 'px';
    }
}

function moveDesktopTooltip(event) {
    const tooltip = document.querySelector('.desktop-tooltip');
    if (!tooltip) return;
    
    const cell = event.currentTarget;
    const rect = cell.getBoundingClientRect();
    
    tooltip.style.left = (rect.left + window.scrollX + rect.width/2 - tooltip.offsetWidth/2) + 'px';
    tooltip.style.top = (rect.top + window.scrollY - tooltip.offsetHeight - 10) + 'px';
}

function hideDesktopTooltip() {
    const tooltip = document.querySelector('.desktop-tooltip');
    if (tooltip) {
        tooltip.remove();
    }
}

// Initialize desktop view on page load
document.addEventListener('DOMContentLoaded', function() {
    // On initial load show responsive login
    enableResponsiveMode();
    
    // Re-apply desktop view on window resize
    window.addEventListener('resize', forceDesktopView);
    
    // Observer to handle dynamically loaded content
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                handleDesktopComments();
            }
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});

// Keep all your existing JavaScript functions below this point
// (login, logout, uploadFile, searchEmployees, etc.)

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
            // After login, force desktop view
            forceDesktopView();
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
        selectedEmployee = null;
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
    // When returning to login, make it responsive again
    enableResponsiveMode();
    
    // Clear form fields
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
    document.getElementById('reset-email').value = '';
    
    // Reset to login form
    document.getElementById('forgot-password-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
}

async function showDashboard() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('dashboard-section').style.display = 'block';
    
    document.getElementById('user-name').textContent = cleanEmployeeName(currentUser.name);
    
    if (currentUser.is_admin) {
        showAdminDashboard();
    } else {
        showEmployeeDashboard();
    }
    
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date-picker').value = today;
    
    // Load initial data
    await loadAttendanceData();
    
    if (currentUser.is_admin) {
        await loadEmployees();
        // Auto-select first employee if data is available
        if (employees.length > 0 && attendanceData.length > 0) {
            const firstEmployee = employees[0];
            selectEmployee(firstEmployee);
        }
    }
    
    loadPasswordResetRequests();
}

async function loadLateStatistics() {
    try {
        console.log('Loading late statistics...');
        const response = await fetch('/api/late-statistics');
        const result = await response.json();
        
        console.log('Late statistics response:', result);
        
        if (result.success) {
            const data = result.data;
            
            // Update the statistics display
            document.getElementById('late-count').textContent = data.total_late_count;
            document.getElementById('total-late-minutes').textContent = data.total_late_minutes;
            document.getElementById('start-time').textContent = data.start_time;
            
            console.log('Updated late statistics display:', data);
            
            // Show/hide late records list
            const lateRecordsList = document.getElementById('late-records-list');
            const lateRecordsContent = document.getElementById('late-records-content');
            
            if (data.late_records && data.late_records.length > 0) {
                lateRecordsList.style.display = 'block';
                
                // Create HTML for late records with toggle button
                let recordsHtml = `
                    <div class="late-records-toggle">
                        <button class="show-records-btn" onclick="toggleLateRecords()">
                            <span class="show-records-text">Show Records</span>
                            <span class="show-records-icon">▼</span>
                        </button>
                    </div>
                    <div class="late-records-details" style="display: none;">
                `;
                
                data.late_records.forEach((record, index) => {
                    recordsHtml += `
                        <div class="late-record-item">
                            <div class="late-record-main">
                                <div class="late-record-header">
                                    <div class="late-record-sequence">${record.sequence_text || (record.sequence + ' late')}</div>
                                    <div class="late-record-date-time">
                                        <span class="late-record-date">${formatDate(record.date)}</span>
                                        <span class="late-record-day">${getDayOfWeek(record.date)}</span>
                                    </div>
                                </div>
                                <div class="late-record-times">
                                    <span class="late-record-expected">Expected: ${record.expected_punch_in || 'N/A'}</span>
                                    <span class="late-record-actual">Actual: ${record.punch_in}</span>
                                </div>
                                <div class="late-record-status">
                                    <span class="status-badge status-${record.status.toLowerCase()}">${record.status}</span>
                                </div>
                            </div>
                            <div class="late-record-late-info">
                                <span class="late-record-minutes">${record.late_minutes} min</span>
                                ${record.late_hours > 0 ? `<span class="late-record-hours">(${record.late_hours}h)</span>` : ''}
                            </div>
                        </div>
                    `;
                });
                
                recordsHtml += '</div>';
                
                lateRecordsContent.innerHTML = recordsHtml;
            } else {
                lateRecordsList.style.display = 'none';
            }
        } else {
            console.error('Failed to load late statistics:', result.message);
        }
    } catch (error) {
        console.error('Error loading late statistics:', error);
    }
}

async function loadAdminLateStatistics() {
    try {
        console.log('Loading admin late statistics...');
        
        const response = await fetch('/api/admin/late-statistics');
        const result = await response.json();
        
        console.log('Admin late statistics response:', result);
        
        if (result.success) {
            const data = result.data;
            
            // Calculate summary statistics
            let totalLateCount = 0;
            let totalLateMinutes = 0;
            let employeesWithLate = 0;
            
            data.forEach(employee => {
                totalLateCount += employee.total_late_count;
                totalLateMinutes += employee.total_late_minutes;
                if (employee.total_late_count > 0) {
                    employeesWithLate++;
                }
            });
            
            // Update summary cards (both compact and modal)
            document.getElementById('admin-total-late-count').textContent = totalLateCount;
            document.getElementById('admin-total-late-minutes').textContent = totalLateMinutes;
            document.getElementById('admin-late-employees').textContent = employeesWithLate;
            
            // Update modal summary cards
            document.getElementById('modal-total-late-count').textContent = totalLateCount;
            document.getElementById('modal-total-late-minutes').textContent = totalLateMinutes;
            document.getElementById('modal-late-employees').textContent = employeesWithLate;
            
            // Update detailed employee list (modal only)
            const modalEmployeesList = document.getElementById('modal-late-employees-content');
            
            console.log('Processing employees data:', data);
            
            if (data.length > 0) {
                let employeesHtml = '';
                
                let employeesWithLateCount = 0;
                data.forEach(employee => {
                    if (employee.total_late_count > 0) {
                        employeesWithLateCount++;
                        console.log(`Adding employee ${employeesWithLateCount}: ${employee.employee_name} with ${employee.total_late_count} late records`);
                        employeesHtml += `
                            <div class="admin-late-employee-item">
                                <div class="admin-late-employee-header">
                                    <div class="admin-late-employee-name">${cleanEmployeeName(employee.employee_name)}</div>
                                    <div class="admin-late-employee-stats">
                                        <div class="admin-late-employee-stat">
                                            <span class="stat-value">${employee.total_late_count}</span>
                                            <span class="stat-label">Times Late</span>
                                        </div>
                                        <div class="admin-late-employee-stat">
                                            <span class="stat-value">${employee.total_late_minutes}</span>
                                            <span class="stat-label">Total Minutes</span>
                                        </div>
                                        <div class="admin-late-employee-stat">
                                            <span class="stat-value">${employee.start_time}</span>
                                            <span class="stat-label">Start Time</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="admin-late-employee-records">
                                    <h5>Late Arrival Records:</h5>
                                    ${employee.late_records.map(record => `
                                        <div class="admin-late-record-item">
                                            <div class="admin-late-record-main">
                                                <div class="admin-late-record-header">
                                                    <div class="admin-late-record-sequence">${record.sequence_text || (record.sequence + ' late')}</div>
                                                    <div class="admin-late-record-date-time">
                                                        <span class="admin-late-record-date">${formatDate(record.date)}</span>
                                                        <span class="admin-late-record-day">${getDayOfWeek(record.date)}</span>
                                                    </div>
                                                </div>
                                                <div class="admin-late-record-times">
                                                    <span class="admin-late-record-expected">Expected: ${record.expected_punch_in || 'N/A'}</span>
                                                    <span class="admin-late-record-actual">Actual: ${record.punch_in}</span>
                                                </div>
                                                <div class="admin-late-record-status">
                                                    <span class="status-badge status-${record.status.toLowerCase()}">${record.status}</span>
                                                </div>
                                            </div>
                                            <div class="admin-late-record-late-info">
                                                <span class="admin-late-record-minutes">${record.late_minutes} min</span>
                                                ${record.late_hours > 0 ? `<span class="admin-late-record-hours">(${record.late_hours}h)</span>` : ''}
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `;
                    }
                });
                
                console.log(`Generated employees HTML for modal - Total employees with late records: ${employeesWithLateCount}`);
                console.log(`HTML length: ${employeesHtml.length} characters`);
                console.log(`HTML preview (first 1000 chars): ${employeesHtml.substring(0, 1000)}`);
                
                if (employeesHtml) {
                    modalEmployeesList.innerHTML = employeesHtml;
                    console.log('Updated modal employee list with HTML');
                    console.log(`Modal content after update: ${modalEmployeesList.innerHTML.length} characters`);
                } else {
                    const noDataMessage = '<p style="text-align: center; color: #666; padding: 20px;">No late arrivals found for any employees.</p>';
                    modalEmployeesList.innerHTML = noDataMessage;
                    console.log('No employees with late arrivals found');
                }
            } else {
                const noDataMessage = '<p style="text-align: center; color: #666; padding: 20px;">No employee data available.</p>';
                modalEmployeesList.innerHTML = noDataMessage;
            }
            
            console.log('Updated admin late statistics display');
            
            // Force update modal content if modal is open
            const modal = document.getElementById('late-statistics-modal');
            if (modal && modal.style.display === 'flex') {
                console.log('Modal is open, ensuring content is updated');
                const modalContent = document.getElementById('modal-late-employees-content');
                if (modalContent) {
                    modalContent.innerHTML = employeesList.innerHTML;
                    console.log('Updated modal content from main list');
                }
            }
        } else {
            console.error('Failed to load admin late statistics:', result.message);
        }
    } catch (error) {
        console.error('Error loading admin late statistics:', error);
    }
}

function toggleLateStatisticsModal() {
    const modal = document.getElementById('late-statistics-modal');
    const modalContent = document.getElementById('modal-late-employees-content');
    
    console.log('Opening late statistics modal');
    console.log('Modal content element:', modalContent);
    console.log('Modal content HTML length:', modalContent ? modalContent.innerHTML.length : 'Element not found');
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function closeLateStatisticsModal() {
    const modal = document.getElementById('late-statistics-modal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Restore scrolling
}

function toggleLateRecords() {
    const details = document.querySelector('.late-records-details');
    const button = document.querySelector('.show-records-btn');
    const text = button.querySelector('.show-records-text');
    const icon = button.querySelector('.show-records-icon');
    
    if (details.style.display === 'none') {
        details.style.display = 'block';
        text.textContent = 'Hide Records';
        icon.textContent = '▲';
    } else {
        details.style.display = 'none';
        text.textContent = 'Show Records';
        icon.textContent = '▼';
    }
}


// Close modal when clicking outside of it
document.addEventListener('click', function(event) {
    const modal = document.getElementById('late-statistics-modal');
    if (event.target === modal) {
        closeLateStatisticsModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeLateStatisticsModal();
    }
});

function showAdminDashboard() {
    document.getElementById('admin-panel').style.display = 'block';
    document.getElementById('employee-panel').style.display = 'none';
    
    // Load admin late statistics
    loadAdminLateStatistics();
}

function showEmployeeDashboard() {
    document.getElementById('admin-panel').style.display = 'none';
    document.getElementById('employee-panel').style.display = 'block';
    document.getElementById('employee-name').textContent = cleanEmployeeName(currentUser.name);
    
    // Populate personal cumulative leave totals
    fetchAndRenderLeaveTotals(currentUser.name, true);
    
    // Load late statistics
    loadLateStatistics();
}

// File upload functions
async function uploadFile() {
    const fileInput = document.getElementById('file-upload');
    const files = Array.from(fileInput.files || []);

    if (!files.length) {
        showNotification('Please select at least one file', 'error');
        return;
    }

    const xlsxFiles = files.filter(f => f.name.toLowerCase().endsWith('.xlsx'));
    if (!xlsxFiles.length) {
        showNotification('Please select .xlsx files only', 'error');
        return;
    }

    const formData = new FormData();
    xlsxFiles.forEach(f => formData.append('files', f));

    const selectedDate = document.getElementById('date-picker').value;
    if (selectedDate) {
        formData.append('selected_date', selectedDate);
    }

    try {
        showLoading('Processing attendance files...');

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            showNotification(result.message);

            await loadAttendanceData();
            await loadEmployees();

            if (currentUser.is_admin && employees.length > 0 && attendanceData.length > 0) {
                const firstEmployee = employees[0];
                selectEmployee(firstEmployee);
            }

        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        showNotification('Upload failed. Please try again.', 'error');
        console.error('Upload error:', error);
    } finally {
        hideLoading();
        fileInput.value = '';
    }
}

// **FIXED: Employee Search Functions**
function searchEmployees() {
    const searchTerm = document.getElementById('employee-search').value.trim();
    
    // **FIX: Allow empty search to show "no selection" state**
    if (!searchTerm) {
        // Don't auto-select anything when search is empty
        selectedEmployee = null;
        filteredData = [];
        hideEmployeeProfile();
        
        // Remove search dropdown if exists
        const dropdown = document.getElementById('search-results-dropdown');
        if (dropdown) {
            dropdown.remove();
        }
        
        // Show message that search is cleared
        const container = document.getElementById('attendance-table-container');
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-search"></i>
                <h3>Search Cleared</h3>
                <p>Type an employee name to search</p>
            </div>
        `;
        
        // Update stats to show full dataset
        updateAdminStats();
        return; // **IMPORTANT: Exit here, don't auto-select**
    }
    
    // **CHECK: Ensure employees array exists and has data**
    if (!employees || employees.length === 0) {
        showNotification('No employees data available. Please upload attendance file first.', 'error');
        return;
    }
    
    // Filter employees based on search term
    const matchingEmployees = employees.filter(emp => 
        emp.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (matchingEmployees.length === 1) {
        // If exactly one match, select that employee
        selectEmployee(matchingEmployees[0]);
    } else if (matchingEmployees.length === 0) {
        // No matches found
        showNotification('No employees found matching your search', 'warning');
        hideEmployeeProfile();
        
        // Show no results message
        const container = document.getElementById('attendance-table-container');
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-user-slash"></i>
                <h3>No Matches Found</h3>
                <p>No employees found matching "${searchTerm}"</p>
            </div>
        `;
        
        selectedEmployee = null;
        filteredData = [];
        updateAdminStats();
    } else {
        // Multiple matches - show dropdown or list for selection
        showMultipleMatchesSelection(matchingEmployees);
    }
}


// **NEW: Handle multiple search matches**
function showMultipleMatchesSelection(matchingEmployees) {
    // Create a temporary selection interface
    const searchContainer = document.getElementById('employee-search').parentElement;
    
    // Remove existing dropdown if any
    const existingDropdown = document.getElementById('search-results-dropdown');
    if (existingDropdown) {
        existingDropdown.remove();
    }
    
    // Create dropdown for multiple matches
    const dropdown = document.createElement('div');
    dropdown.id = 'search-results-dropdown';
    dropdown.className = 'search-dropdown';
    
    let dropdownHTML = '<div class="search-results-header">Select Employee:</div>';
    matchingEmployees.forEach(employee => {
        dropdownHTML += `
            <div class="search-result-item" onclick="selectEmployeeFromSearch('${employee}')">
                ${cleanEmployeeName(employee)}
            </div>
        `;
    });
    
    dropdown.innerHTML = dropdownHTML;
    searchContainer.appendChild(dropdown);
    
    // Auto-hide dropdown after 10 seconds
    setTimeout(() => {
        if (dropdown.parentElement) {
            dropdown.remove();
        }
    }, 10000);
}

// **NEW: Select employee from search dropdown**
function selectEmployeeFromSearch(employeeName) {
    selectEmployee(employeeName);
    
    // Remove search dropdown
    const dropdown = document.getElementById('search-results-dropdown');
    if (dropdown) {
        dropdown.remove();
    }
}

function selectEmployee(employeeName) {
    selectedEmployee = employeeName;
    document.getElementById('employee-search').value = cleanEmployeeName(employeeName);
    
    // Remove search dropdown if exists
    const dropdown = document.getElementById('search-results-dropdown');
    if (dropdown) {
        dropdown.remove();
    }
    
    // Filter data for selected employee
    filteredData = attendanceData.filter(record => record.Employee === employeeName);
    
    // Show employee profile and data
    showEmployeeProfile(employeeName);
    // Also fetch cumulative leave totals from Excel and render breakdown
    fetchAndRenderLeaveTotals(employeeName, false);
    
    displayAdminAttendanceData(globalShowUpdateNote);
    updateAdminStats();
    
    showNotification(`Viewing data for ${cleanEmployeeName(employeeName)}`, 'success');
}

function clearEmployeeSearch() {
    selectedEmployee = null;
    filteredData = [];
    
    // **CLEAR SEARCH BOX**
    document.getElementById('employee-search').value = '';
    
    hideEmployeeProfile();
    
    // Remove search dropdown if exists
    const dropdown = document.getElementById('search-results-dropdown');
    if (dropdown) {
        dropdown.remove();
    }
    
    // **DON'T AUTO-SELECT: Show empty state instead**
    const container = document.getElementById('attendance-table-container');
    container.innerHTML = `
        <div class="no-data">
            <i class="fas fa-search"></i>
            <h3>Search Cleared</h3>
            <p>Type an employee name to search, or upload data to get started</p>
        </div>
    `;
    
    updateAdminStats();
    showNotification('Search cleared', 'success');
}


function showEmployeeProfile(employeeName) {
    const profileCard = document.getElementById('employee-profile');
    const employeeData = attendanceData.filter(record => record.Employee === employeeName);
    
    if (employeeData.length === 0) {
        hideEmployeeProfile();
        return;
    }
    
    // Calculate stats for this employee
    const presentDays = employeeData.filter(record => record.Status.startsWith('P')).length;
    const halfDays = employeeData.filter(record => record.Status.startsWith('HF')).length;
    const absentDays = employeeData.filter(record => record.Status.startsWith('A')).length;
    const totalWorkingDays = presentDays + halfDays + absentDays; // P + HF + A (excludes planned leaves: SL, PL, W/O, FL, HL)
    const presentDaysWeighted = presentDays + (halfDays * 0.5);
    const leaveDays = employeeData.filter(record => 
        ['W/O', 'PL', 'SL', 'FL', 'HL'].some(leave => record.Status.startsWith(leave))
    ).length;
    const wo = employeeData.filter(record => record.Status.startsWith('W/O')).length;
    const pl = employeeData.filter(record => record.Status.startsWith('PL')).length;
    const sl = employeeData.filter(record => record.Status.startsWith('SL')).length;
    const fl = employeeData.filter(record => record.Status.startsWith('FL')).length;
    const attendanceRate = totalWorkingDays > 0 ? ((presentDaysWeighted / totalWorkingDays) * 100).toFixed(1) : 0;
    const weightByStatus = {
        'P': 1,
        'PL': 1,
        'SL': 1,
        'FL': 1,
        'PAT': 1,
        'MAT': 1,
        'W/O': 1,
        'HL': 1,
        'HF': 0.5,
        'PHF': 1,
        'SHF': 1,
    };
    const payableDays = employeeData.reduce((sum, r) => {
        const s = (r.Status || '').toUpperCase();
        const key = Object.keys(weightByStatus).find(k => s.startsWith(k));
        return sum + (key ? weightByStatus[key] : 0);
    }, 0);
    
    // Update profile card content
    document.getElementById('profile-employee-name').textContent = cleanEmployeeName(employeeName);
    document.getElementById('profile-total-days').textContent = totalWorkingDays;
    document.getElementById('profile-present-days').textContent = presentDaysWeighted;
    document.getElementById('profile-absent-days').textContent = absentDays;
    document.getElementById('profile-leave-days').textContent = leaveDays;
    document.getElementById('profile-attendance-rate').textContent = `${attendanceRate}%`;
    const payableEl = document.getElementById('profile-payable-days');
    if (payableEl) payableEl.textContent = payableDays;
    // Leave breakdown
    const woEl = document.getElementById('profile-wo');
    const plEl = document.getElementById('profile-pl');
    const slEl = document.getElementById('profile-sl');
    const flEl = document.getElementById('profile-fl');
    if (woEl) woEl.textContent = wo;
    if (plEl) plEl.textContent = pl;
    if (slEl) slEl.textContent = sl;
    if (flEl) flEl.textContent = fl;
    
    // Show the profile card
    profileCard.classList.add('show');
}

function hideEmployeeProfile() {
    const profileCard = document.getElementById('employee-profile');
    profileCard.classList.remove('show');
}

// Server-side date management functions
async function saveAdminDate(date) {
    if (!currentUser.is_admin) return;
    
    try {
        const response = await fetch('/api/admin/set-date', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ date: date })
        });
        
        const result = await response.json();
        if (!result.success) {
            console.error('Failed to save admin date:', result.message);
        }
    } catch (error) {
        console.error('Error saving admin date:', error);
    }
}

async function getAdminDate() {
    try {
        const response = await fetch('/api/admin/get-date');
        const result = await response.json();
        
        if (result.success) {
            return result.date;
        } else {
            console.error('Failed to get admin date:', result.message);
            return null;
        }
    } catch (error) {
        console.error('Error getting admin date:', error);
        return null;
    }
}

// Data loading functions
async function loadAttendanceData() {
    try {
        const statusFilter = currentUser.is_admin ? 
            document.getElementById('status-filter')?.value || 'All' : 
            document.getElementById('employee-status-filter')?.value || 'All';
        
        // **FIXED: Don't apply employee filter from dropdown when loading data**
        // This was causing the issue - the dropdown filter was restricting data
        const url = new URL('/api/attendance', window.location.origin);
        if (statusFilter !== 'All') url.searchParams.append('status', statusFilter);
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success) {
            // Base dataset from server
            let data = result.data;
            // Apply client-side date filter (month/year) if a date is selected
            let selectedDateStr = '';
            if (currentUser.is_admin) {
                // For admin, use the date picker value
                const dp = document.getElementById('date-picker');
                selectedDateStr = dp ? dp.value : '';
                // If no date selected, try to load from server
                if (!selectedDateStr) {
                    selectedDateStr = await getAdminDate() || '';
                    // Update the date picker if we found a stored date
                    if (selectedDateStr && dp) {
                        dp.value = selectedDateStr;
                    }
                } else {
                    // Save admin's selection to server
                    await saveAdminDate(selectedDateStr);
                }
            } else {
                // For employee, get admin's selection from server
                selectedDateStr = await getAdminDate() || '';
            }
            
            globalShowUpdateNote = false;
            if (selectedDateStr) {
                const selected = new Date(selectedDateStr);
                const selYear = selected.getFullYear();
                const selMonth = selected.getMonth();
                const selDay = selected.getDate();
                
                // Check if selected date is before current date
                const today = new Date();
                const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                const selectedDate = new Date(selYear, selMonth, selDay);
                
                if (selectedDate < currentDate) {
                    globalShowUpdateNote = true;
                }
                
                data = data.filter(r => {
                    const d = new Date(r.Date);
                    const sameMonth = d.getFullYear() === selYear && d.getMonth() === selMonth;
                    const dayMatch = d.getDate() <= selDay;
                    return sameMonth && dayMatch;
                });
            }
            attendanceData = data;
            
            if (currentUser.is_admin) {
                displayAdminAttendanceData(globalShowUpdateNote);
                updateAdminStats();
            } else {
                displayEmployeeAttendanceData(globalShowUpdateNote);
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
function displayAdminAttendanceData(showUpdateNote = false) {
    const container = document.getElementById('attendance-table-container');
    const noteElement = document.getElementById('data-update-note');
    
    // Show/hide update note
    if (noteElement) {
        if (showUpdateNote) {
            noteElement.style.display = 'flex';
        } else {
            noteElement.style.display = 'none';
        }
    }
    
    // **FIXED: Use correct data based on selection**
    let dataToDisplay;
    
    if (selectedEmployee) {
        // Show selected employee's data
        dataToDisplay = attendanceData.filter(record => record.Employee === selectedEmployee);
    } else {
        // Show all data (fallback)
        dataToDisplay = attendanceData;
    }
    
    if (dataToDisplay.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-inbox"></i>
                <h3>No Data Available</h3>
                <p>${attendanceData.length === 0 ? 'Upload an Excel file to get started' : 'No records found for the selected employee'}</p>
            </div>
        `;
        return;
    }
    
    const table = createAttendanceTable(dataToDisplay);
    container.innerHTML = table;
}

function displayEmployeeAttendanceData(showUpdateNote = false) {
    const container = document.getElementById('employee-attendance-table');
    const noteElement = document.getElementById('employee-data-update-note');
    
    // Show/hide update note
    if (noteElement) {
        if (showUpdateNote) {
            noteElement.style.display = 'flex';
        } else {
            noteElement.style.display = 'none';
        }
    }
    
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
    // Extract unique time ranges from the data
    const timeRanges = [...new Set(data.map(record => record.time_range).filter(tr => tr))];
    const timeRangeInfo = timeRanges.length > 0 ? 
        `<div class="time-range-header">⏰ Work Hours: ${timeRanges.join(' | ')}</div>` : '';
    
    let html = `
        ${timeRangeInfo}
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
        <td>${cleanEmployeeName(record.Employee)}</td>
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

// application submission flow removed

// Mobile tooltip function
function showMobileTooltip(element, comment) {
    if (!comment.trim()) return;
    
    const existingTooltip = document.querySelector('.mobile-tooltip');
    if (existingTooltip) {
        existingTooltip.remove();
    }
    
    const tooltip = document.createElement('div');
    tooltip.className = 'mobile-tooltip';
    tooltip.innerHTML = `<div style="display: flex; align-items: center; gap: 6px;">
        <span style="font-size: 14px;">💬</span>
        <span>${comment}</span>
    </div>`;
    
    const rect = element.getBoundingClientRect();
    tooltip.style.position = 'fixed';
    tooltip.style.top = (rect.top - 10) + 'px';
    tooltip.style.left = (rect.left + rect.width/2) + 'px';
    tooltip.style.transform = 'translateX(-50%) translateY(-100%)';
    
    // Disable animations on mobile for better performance
    if (document.body.classList.contains('mobile')) {
        tooltip.style.animation = 'none';
        tooltip.style.transition = 'none';
    }
    
    document.body.appendChild(tooltip);
    
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
    if (!status) return '';
    const s = status.toUpperCase();
    // Granular classes so entire row can be styled differently
    if (s.startsWith('P')) return 'status-P';
    if (s.startsWith('A')) return 'status-A';
    if (s.startsWith('W/O')) return 'status-WO';
    if (s.startsWith('PL')) return 'status-PL';
    if (s.startsWith('SL')) return 'status-SL';
    if (s.startsWith('FL')) return 'status-FL';
    if (s.startsWith('HL')) return 'status-HL';
    if (s.startsWith('PHF')) return 'status-PHF';
    if (s.startsWith('SHF')) return 'status-SHF';
    if (s.startsWith('PAT')) return 'status-PAT';
    if (s.startsWith('MAT')) return 'status-MAT';
    if (s.startsWith('HF')) return 'status-HF';
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

function getDayOfWeek(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { weekday: 'long' });
    } catch (error) {
        return '';
    }
}

function updateAdminStats() {
    // **FIXED: Always show total counts from full dataset**
    let dataToUse;
    
    if (selectedEmployee) {
        dataToUse = attendanceData.filter(record => record.Employee === selectedEmployee);
    } else {
        dataToUse = attendanceData;
    }
    
    // Always calculate totals from the full dataset
    const totalEmployees = [...new Set(attendanceData.map(record => record.Employee))].length;
    const totalRecords = attendanceData.length; // Show total records from full dataset
    const dateUntil = document.getElementById('date-picker').value;
    
    document.getElementById('total-employees').textContent = totalEmployees;
    document.getElementById('total-records').textContent = totalRecords;
    document.getElementById('data-until').textContent = dateUntil ? new Date(dateUntil).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '--';
}



function updateEmployeeStats() {
    const employeeData = attendanceData.filter(record => record.Employee === currentUser.name);
    const presentDays = employeeData.filter(record => record.Status.startsWith('P')).length;
    const halfDays = employeeData.filter(record => record.Status.startsWith('HF')).length;
    const absentDays = employeeData.filter(record => record.Status.startsWith('A')).length;
    const totalWorkingDays = presentDays + halfDays + absentDays; // P + HF + A (excludes planned leaves: SL, PL, W/O, FL, HL)
    const presentDaysWeighted = presentDays + (halfDays * 0.5);
    const attendanceRate = totalWorkingDays > 0 ? ((presentDaysWeighted / totalWorkingDays) * 100).toFixed(1) : 0;
    const weightByStatus = {
        'P': 1,
        'PL': 1,
        'SL': 1,
        'FL': 1,
        'PAT': 1,
        'MAT': 1,
        'W/O': 1,
        'HL': 1,
        'HF': 0.5,
        'PHF': 1,
        'SHF': 1,
    };
    const payableDays = employeeData.reduce((sum, r) => {
        const s = (r.Status || '').toUpperCase();
        const key = Object.keys(weightByStatus).find(k => s.startsWith(k));
        return sum + (key ? weightByStatus[key] : 0);
    }, 0);
    
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
    document.getElementById('present-days').textContent = presentDaysWeighted;
    document.getElementById('performance-status').innerHTML = `${performanceEmoji} ${performanceStatus}`;
    const payableDaysEl = document.getElementById('payable-days');
    if (payableDaysEl) payableDaysEl.textContent = payableDays;
}

// Fetch cumulative leave totals from backend and render
async function fetchAndRenderLeaveTotals(employeeName, isSelf) {
    try {
        const url = new URL('/api/leave-totals', window.location.origin);
        url.searchParams.append('employee', employeeName);
        const res = await fetch(url);
        const result = await res.json();
        if (!result.success) return;
        const data = result.data && result.data[employeeName] ? result.data[employeeName] : { 'W/O': 0, 'PL': 0, 'SL': 0, 'FL': 0 };

        if (!isSelf) {
            const woEl = document.getElementById('profile-wo');
            const plEl = document.getElementById('profile-pl');
            const slEl = document.getElementById('profile-sl');
            const flEl = document.getElementById('profile-fl');
            if (woEl) woEl.textContent = data['W/O'] ?? 0;
            if (plEl) plEl.textContent = data['PL'] ?? 0;
            if (slEl) slEl.textContent = data['SL'] ?? 0;
            if (flEl) flEl.textContent = data['FL'] ?? 0;
        } else {
            const myWOEl = document.getElementById('my-wo');
            const myPLEl = document.getElementById('my-pl');
            const mySLEl = document.getElementById('my-sl');
            const myFLEl = document.getElementById('my-fl');
            if (myWOEl) myWOEl.textContent = data['W/O'] ?? 0;
            if (myPLEl) myPLEl.textContent = data['PL'] ?? 0;
            if (mySLEl) mySLEl.textContent = data['SL'] ?? 0;
            if (myFLEl) myFLEl.textContent = data['FL'] ?? 0;
        }
    } catch (e) {
        // Silent fail; UI will keep previously computed values
        console.error('Failed to load leave totals', e);
    }
}

// **FIXED: Employee dropdown filter function**
function updateEmployeeFilter() {
    const select = document.getElementById('employee-filter');
    if (!select) return;
    
    select.innerHTML = '<option value="">All Employees</option>';
    
    employees.forEach(employee => {
        const option = document.createElement('option');
        option.value = employee;
        option.textContent = cleanEmployeeName(employee);
        select.appendChild(option);
    });
    
    // **NEW: Add event listener for dropdown selection**
    select.onchange = function() {
        const selectedValue = this.value;
        if (selectedValue) {
            selectEmployee(selectedValue);
        } else {
            // If "All Employees" is selected, show first employee
            if (employees.length > 0) {
                selectEmployee(employees[0]);
            }
        }
    };
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
            loadPasswordResetRequests();
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
    // Re-apply current employee selection after loading
    if (selectedEmployee && currentUser.is_admin) {
        setTimeout(() => {
            selectEmployee(selectedEmployee);
        }, 100);
    }
}

function applyEmployeeFilters() {
    loadAttendanceData();
}

async function updateDateRange() {
    // Store admin's date selection before loading data
    if (currentUser.is_admin) {
        const dp = document.getElementById('date-picker');
        const selectedDate = dp ? dp.value : null;
        // Save to server
        if (selectedDate) {
            await saveAdminDate(selectedDate);
        }
    }
    await loadAttendanceData();
    // Re-apply current employee selection after loading
    if (selectedEmployee && currentUser.is_admin) {
        setTimeout(() => {
            selectEmployee(selectedEmployee);
        }, 100);
    }
}

// Quick date selection function
async function setQuickDate(type) {
    if (!currentUser.is_admin) return;
    
    const dp = document.getElementById('date-picker');
    if (!dp) return;
    
    const today = new Date();
    let selectedDate = '';
    
    switch (type) {
        case 'today':
            selectedDate = today.toISOString().split('T')[0];
            break;
        case 'yesterday':
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            selectedDate = yesterday.toISOString().split('T')[0];
            break;
        case 'week-ago':
            const weekAgo = new Date(today);
            weekAgo.setDate(today.getDate() - 7);
            selectedDate = weekAgo.toISOString().split('T')[0];
            break;
        case 'month-ago':
            const monthAgo = new Date(today);
            monthAgo.setMonth(today.getMonth() - 1);
            selectedDate = monthAgo.toISOString().split('T')[0];
            break;
        case 'clear':
            selectedDate = '';
            break;
    }
    
    // Update the date picker
    dp.value = selectedDate;
    
    // Update button states
    updateQuickDateButtons(type);
    
    // Trigger date change
    await updateDateRange();
}

// Update quick date button states
function updateQuickDateButtons(activeType) {
    const buttons = document.querySelectorAll('.quick-date-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.onclick.toString().includes(`'${activeType}'`)) {
            btn.classList.add('active');
        }
    });
}


function exportData() {
    let dataToExport;
    
    if (selectedEmployee) {
        dataToExport = attendanceData.filter(record => record.Employee === selectedEmployee);
    } else {
        dataToExport = attendanceData;
    }
    
    if (dataToExport.length === 0) {
        showNotification('No data to export', 'warning');
        return;
    }
    
    const csvContent = convertToCSV(dataToExport);
    const filename = selectedEmployee ? `${selectedEmployee}_attendance.csv` : 'attendance_data.csv';
    downloadCSV(csvContent, filename);
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
    
    csvRows.push(headers.join(','));
    
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
    
    // **NEW: Handle clicks outside search dropdown to close it**
    document.addEventListener('click', function(e) {
        const dropdown = document.getElementById('search-results-dropdown');
        if (dropdown && !e.target.closest('.search-dropdown') && !e.target.closest('#employee-search')) {
            dropdown.remove();
        }
    });
    
});
