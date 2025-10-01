// Global variables
// Cache bust: Date format updated to show full day names
let currentUser = null;
let currentZoomLevel = 100;
let attendanceData = [];
let employees = [];
let filteredData = [];
let selectedEmployee = null;
let globalShowUpdateNote = false;
let resetToken = null;

// Force desktop viewport for entire application - ULTRA AGGRESSIVE
function forceDesktopViewport() {
    // Override viewport meta tag to force desktop view
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
        viewportMeta.content = 'width=1200, initial-scale=1.0, user-scalable=no';
    } else {
        // Create viewport meta tag if it doesn't exist
        viewportMeta = document.createElement('meta');
        viewportMeta.name = 'viewport';
        viewportMeta.content = 'width=1200, initial-scale=1.0, user-scalable=no';
        document.head.appendChild(viewportMeta);
    }
    
    // Force body width for entire application
    document.body.style.minWidth = '1200px';
    document.body.style.width = '1200px';
    document.body.style.maxWidth = 'none';
    document.body.style.overflowX = 'auto';
    
    // Force HTML element as well
    document.documentElement.style.minWidth = '1200px';
    document.documentElement.style.width = '1200px';
    document.documentElement.style.maxWidth = 'none';
    
    // Force all main containers
    const containers = document.querySelectorAll('#app, #dashboard-section, .dashboard, .main-wrapper, .content');
    containers.forEach(container => {
        container.style.minWidth = '1200px';
        container.style.width = '1200px';
        container.style.maxWidth = 'none';
    });
    
    // Disable text size adjustment
    document.documentElement.style.setProperty('-webkit-text-size-adjust', 'none', 'important');
    document.documentElement.style.setProperty('-moz-text-size-adjust', 'none', 'important');
    document.documentElement.style.setProperty('text-size-adjust', 'none', 'important');
}

// Keep desktop viewport for login (no restore function needed)
function keepDesktopViewport() {
    // Same as forceDesktopViewport - always desktop
    forceDesktopViewport();
}

// Continuous desktop view enforcement
function continuousDesktopEnforcement() {
    // Force desktop viewport every 2 seconds
    setInterval(function() {
        forceDesktopViewport();
        
        // Force all dashboard elements to desktop width
        const dashboardElements = document.querySelectorAll('#dashboard-section, .dashboard, .dashboard-header, .control-panel, .stats-section, .filters-section, .table-container, .attendance-table, .action-buttons, #admin-panel');
        dashboardElements.forEach(element => {
            element.style.minWidth = '1200px';
            element.style.width = '1200px';
            element.style.maxWidth = 'none';
        });
    }, 2000);
}

// Initialize app focus on page load
document.addEventListener('DOMContentLoaded', function() {
    // Force desktop viewport immediately on page load
    forceDesktopViewport();
    
    // Start continuous enforcement
    continuousDesktopEnforcement();
    
    // ULTRA-AGGRESSIVE: Set up observer to force desktop view on any dashboard elements
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) { // Element node
                        // Check if dashboard section is visible
                        if (document.getElementById('dashboard-section') && document.getElementById('dashboard-section').style.display !== 'none') {
                            // Force desktop view immediately
                            forceDesktopViewport();
                            
                            // Force all dashboard elements to desktop width
                            const dashboardElements = document.querySelectorAll('#dashboard-section, .dashboard, .dashboard-header, .control-panel, .stats-section, .filters-section, .table-container, .attendance-table, .action-buttons, #admin-panel');
                            dashboardElements.forEach(element => {
                                element.style.minWidth = '1200px';
                                element.style.width = '1200px';
                                element.style.maxWidth = 'none';
                            });
                        }
                    }
                });
            }
        });
    });
    
    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Ensure navbar is hidden on page load
    const navbar = document.getElementById('main-navbar');
    if (navbar) {
        navbar.style.display = 'none';
    }
    
    // Load saved credentials if available
    loadSavedCredentials();
    
    // Auto-focus on email input
    autoFocusEmailInput();
    
    // Initialize horizontal scroll functionality
    
    // Focus functionality removed
    
    // Keyboard navigation for login form (Enter key only)
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    if (emailInput) {
        emailInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                // Move to password field without focus
                passwordInput.click();
            }
        });
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                login();
            }
        });
    }
    
    // Add clear credentials button functionality
    const clearBtn = document.getElementById('clear-saved-credentials');
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            clearSavedCredentials();
            document.getElementById('email').value = '';
            document.getElementById('password').value = '';
            document.getElementById('remember-me').checked = false;
            showNotification('Saved credentials cleared', 'success', 3000);
        });
    }
});

// Credential Management Functions
function saveCredentials(email, password) {
    try {
        // Simple encryption (not secure, just obfuscation)
        const encodedEmail = btoa(email);
        const encodedPassword = btoa(password);
        
        localStorage.setItem('saved_email', encodedEmail);
        localStorage.setItem('saved_password', encodedPassword);
        localStorage.setItem('remember_me', 'true');
        
        console.log('Credentials saved successfully');
    } catch (error) {
        console.error('Failed to save credentials:', error);
    }
}

function loadSavedCredentials() {
    try {
        const rememberMe = localStorage.getItem('remember_me');
        if (rememberMe === 'true') {
            const encodedEmail = localStorage.getItem('saved_email');
            const encodedPassword = localStorage.getItem('saved_password');
            
            if (encodedEmail && encodedPassword) {
                const email = atob(encodedEmail);
                const password = atob(encodedPassword);
                
                document.getElementById('email').value = email;
                document.getElementById('password').value = password;
                document.getElementById('remember-me').checked = true;
                
                console.log('Saved credentials loaded');
            }
        }
    } catch (error) {
        console.error('Failed to load saved credentials:', error);
        // Clear corrupted data
        clearSavedCredentials();
    }
}

function clearSavedCredentials() {
    try {
        localStorage.removeItem('saved_email');
        localStorage.removeItem('saved_password');
        localStorage.removeItem('remember_me');
        console.log('Saved credentials cleared');
    } catch (error) {
        console.error('Failed to clear saved credentials:', error);
    }
}


// Auto-focus on email input
function autoFocusEmailInput() {
    const emailInput = document.getElementById('email');
    if (emailInput) {
        // Small delay to ensure page is fully loaded
        setTimeout(() => {
            emailInput.focus();
        }, 300);
    }
}

// Show data update message permanently
function showDataUpdateMessage() {
    const adminNote = document.getElementById('data-update-note');
    const employeeNote = document.getElementById('employee-data-update-note');
    
    if (adminNote) {
        adminNote.style.display = 'flex';
    }
    
    if (employeeNote) {
        employeeNote.style.display = 'flex';
    }
}

// Helper function to clean employee names (remove suffixes like (T), (TC), etc.)
function cleanEmployeeName(fullName) {
    if (!fullName) return '';
    return fullName.replace(/\s*\([^)]*\)$/, '').trim();  // Updated: T employees not eligible for PL/SL
}

// Helper function to check if we're on mobile
function isMobileDevice() {
    return document.body.classList.contains('mobile') || 
           document.documentElement.classList.contains('mobile') ||
           window.innerWidth <= 768;
}

// Ensure only one section is visible at a time
function ensureSingleSectionVisible() {
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    
    if (!loginSection || !dashboardSection) return;
    
    // Check which section should be visible based on current state
    const loginVisible = loginSection.style.display !== 'none';
    const dashboardVisible = dashboardSection.style.display !== 'none';
    
    // If both are visible or both are hidden, determine which should be shown
    if (loginVisible && dashboardVisible) {
        // Both visible - hide dashboard, keep login
        dashboardSection.style.display = 'none';
    } else if (!loginVisible && !dashboardVisible) {
        // Both hidden - show login by default
        loginSection.style.display = 'flex';
    }
}

// Force desktop view
function forceDesktopView() {
    // Set minimum width for all devices
    document.documentElement.style.minWidth = '1200px';
    document.body.style.minWidth = '1200px';
    document.body.style.overflowX = 'auto';
    document.body.style.overflowY = 'auto';
    
    // Ensure app container has horizontal scroll
    const app = document.getElementById('app');
    if (app) {
        app.style.overflowX = 'auto';
        app.style.overflowY = 'auto';
    }
    
    // Remove any mobile-specific classes
    document.body.classList.remove('mobile', 'touch-device');
    document.documentElement.classList.remove('mobile', 'touch-device');
    
    // Ensure only one section is visible
    ensureSingleSectionVisible();
    
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
        
        // Only add desktop events if not on mobile
        if (!document.body.classList.contains('mobile') && !document.documentElement.classList.contains('mobile')) {
        cell.addEventListener('mouseenter', showDesktopTooltip);
        cell.addEventListener('mouseleave', hideDesktopTooltip);
        cell.addEventListener('mousemove', moveDesktopTooltip);
        }
    });
}

function showDesktopTooltip(event) {
    // Tooltips disabled
    return;
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
    // Tooltips disabled
    return;
}

// Initialize desktop view on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check if running as PWA (installed app)
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  window.navigator.standalone === true ||
                  document.referrer.includes('android-app://');
    
    // Check if we're on login page or dashboard
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    
    if (isPWA) {
        // PWA mode - always force desktop view regardless of page
        console.log('PWA detected - forcing desktop mode');
        forceDesktopView();
        
        // Ensure proper section visibility for PWA
        if (loginSection && loginSection.style.display !== 'none') {
            // Login page in PWA - still allow some responsive behavior but maintain desktop layout
            document.body.classList.remove('mobile', 'touch-device');
            document.documentElement.classList.remove('mobile', 'touch-device');
            document.body.style.overflowX = 'hidden';
            document.documentElement.style.overflowX = 'hidden';
        }
    } else if (loginSection && loginSection.style.display !== 'none') {
        // Login page - allow responsive behavior
        document.body.classList.remove('mobile', 'touch-device');
        document.documentElement.classList.remove('mobile', 'touch-device');
        document.documentElement.style.minWidth = '';
        document.body.style.minWidth = '';
        document.body.style.overflowX = 'hidden';
        document.documentElement.style.overflowX = 'hidden';
    } else {
        // Dashboard - force desktop view
        forceDesktopView();
    }
    
    // Re-apply desktop view on window resize
    window.addEventListener('resize', function() {
        // Check if running as PWA (installed app)
        const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                      window.navigator.standalone === true ||
                      document.referrer.includes('android-app://');
        
        const loginSection = document.getElementById('login-section');
        const dashboardSection = document.getElementById('dashboard-section');
        
        if (isPWA) {
            // PWA mode - always maintain desktop view
            console.log('PWA resize - maintaining desktop mode');
            forceDesktopView();
            
            // Ensure proper section visibility
            if (loginSection && loginSection.style.display !== 'none') {
                if (dashboardSection) dashboardSection.style.display = 'none';
                loginSection.style.display = 'flex';
            } else if (dashboardSection && dashboardSection.style.display !== 'none') {
                if (loginSection) loginSection.style.display = 'none';
                dashboardSection.style.display = 'block';
            }
        } else {
            // Browser mode - normal responsive behavior
            if (loginSection && loginSection.style.display !== 'none') {
                // Login is active - allow responsive behavior but prevent dual display
                if (dashboardSection) dashboardSection.style.display = 'none';
                loginSection.style.display = 'flex';
                
                // For login page, don't force desktop view - allow responsive
                document.body.classList.remove('mobile', 'touch-device');
                document.documentElement.classList.remove('mobile', 'touch-device');
                document.documentElement.style.minWidth = '';
                document.body.style.minWidth = '';
                document.body.style.overflowX = 'hidden';
                document.documentElement.style.overflowX = 'hidden';
            } else if (dashboardSection && dashboardSection.style.display !== 'none') {
                // Dashboard is active - apply desktop view and prevent mobile mode
                if (loginSection) loginSection.style.display = 'none';
                dashboardSection.style.display = 'block';
                
                // Prevent mobile class from being applied
                document.body.classList.remove('mobile', 'touch-device');
                document.documentElement.classList.remove('mobile', 'touch-device');
                
                forceDesktopView();
            }
        }
    });
    
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
    
    // Continuous check to ensure proper section visibility
    setInterval(function() {
        const loginSection = document.getElementById('login-section');
        const dashboardSection = document.getElementById('dashboard-section');
        
        if (dashboardSection && dashboardSection.style.display === 'block') {
            // Dashboard is active, ensure login is hidden
            if (loginSection && loginSection.style.display !== 'none') {
                loginSection.style.display = 'none';
            }
        }
    }, 100); // Check every 100ms
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

function showNotification(message, type = 'success', duration = 5000, clickable = false, clickCallback = null) {
    const container = document.getElementById('notification-container');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    if (clickable) {
        notification.style.cursor = 'pointer';
        notification.style.textDecoration = 'underline';
        notification.addEventListener('click', () => {
            if (clickCallback) {
                clickCallback();
            }
            notification.remove();
        });
    }
    
    notification.textContent = message;
    container.appendChild(notification);
    
    // Trigger animation after a small delay
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Auto remove after duration
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300); // Wait for animation to complete
    }, duration);
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
            showNotification(`Welcome back, ${cleanEmployeeName(currentUser.name)}!`);
            
            // Handle remember me functionality
            const rememberMe = document.getElementById('remember-me').checked;
            if (rememberMe) {
                saveCredentials(email, password);
            } else {
                clearSavedCredentials();
            }
            
            // Store if user needs password change for later use
            currentUser.needs_password_change = result.needs_password_change;
            console.log('DEBUG: needs_password_change flag set to:', result.needs_password_change);
            
            // Store admin restrictions
            currentUser.restrictions = result.restrictions || {};
            console.log('DEBUG: Admin restrictions:', currentUser.restrictions);
            
            // Show logs button only for admin users
            const logsBtn = document.getElementById('logs-btn');
            if (logsBtn) {
                logsBtn.style.display = currentUser.is_admin ? 'flex' : 'none';
                logsBtn.setAttribute('aria-hidden', !currentUser.is_admin);
            }
            
            // Show leave application notification if flag is set
            if (result.leave_notification) {
                setTimeout(() => {
                    showNotification('Submit your pending applications', 'info', 8000);
                }, 2000);
            }
            
            showDashboard();
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



async function logout() {
    try {
        // Show loading state
        const logoutBtn = document.querySelector('.btn-logout');
        if (logoutBtn) {
            const originalText = logoutBtn.innerHTML;
            logoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> <span>Logging out...</span>';
            logoutBtn.disabled = true;
        }
        
        await fetch('/api/logout', { method: 'POST' });
        
        // Clear all data
        currentUser = null;
        attendanceData = [];
        employees = [];
        selectedEmployee = null;
        
        // Hide logs button
        const logsBtn = document.getElementById('logs-btn');
        if (logsBtn) {
            logsBtn.style.display = 'none';
            logsBtn.setAttribute('aria-hidden', 'true');
        }
        
        // Hide navbar completely
        const navbar = document.getElementById('main-navbar');
        if (navbar) {
            navbar.style.display = 'none';
            navbar.style.visibility = 'hidden';
            navbar.style.opacity = '0';
        }
        
        showLoginPage();
        showNotification('Successfully logged out!', 'success');
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('Logout failed, but redirecting to login', 'warning');
        // Still redirect to login even if server request fails
        const navbar = document.getElementById('main-navbar');
        if (navbar) {
            navbar.style.display = 'none';
            navbar.style.visibility = 'hidden';
            navbar.style.opacity = '0';
        }
        showLoginPage();
    } finally {
        // Reset button state
        const logoutBtn = document.querySelector('.btn-logout');
        if (logoutBtn) {
            logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt" aria-hidden="true"></i> <span>Logout</span>';
            logoutBtn.disabled = false;
        }
    }
}

// Password change functionality with OTP

let passwordChangeStep = 1;
let currentActualEmail = '';

function showChangePasswordModal() {
    console.log('DEBUG: showChangePasswordModal called');
    const modal = document.getElementById('change-password-modal');
    if (!modal) {
        console.error('DEBUG: change-password-modal not found in DOM');
        return;
    }
    console.log('DEBUG: Modal found, showing...');
    modal.style.display = 'flex';
    
    // Reset to step 1
    passwordChangeStep = 1;
    currentActualEmail = '';
    
    // Check if user has stored email
    checkStoredEmail();
}

async function checkStoredEmail() {
    try {
        const response = await fetch('/api/get-stored-email');
        const result = await response.json();
        
        if (result.success && result.has_stored_email) {
            // User has stored email, show email display step
            showEmailDisplayStep(result.email);
        } else {
            // User doesn't have stored email, show email input step
            showEmailInputStep();
        }
    } catch (error) {
        console.error('Error checking stored email:', error);
        showEmailInputStep();
    }
}

function showEmailInputStep() {
    // Hide all steps
    hideAllPasswordSteps();
    
    // Show email input step
    document.getElementById('email-input-step').style.display = 'block';
    
    // Update button
    const btn = document.getElementById('password-modal-btn');
    btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send OTP';
    btn.onclick = handlePasswordChangeStep;
    
    // Clear inputs
    document.getElementById('actual-email-input').value = '';
}

function showEmailDisplayStep(email) {
    // Hide all steps
    hideAllPasswordSteps();
    
    // Show email display step
    document.getElementById('email-display-step').style.display = 'block';
    document.getElementById('stored-email-display').textContent = email;
    
    // Update button
    const btn = document.getElementById('password-modal-btn');
    btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send OTP';
    btn.onclick = handlePasswordChangeStep;
    
    currentActualEmail = email;
}

function showOTPStep(email) {
    // Hide all steps
    hideAllPasswordSteps();
    
    // Show OTP input step
    document.getElementById('otp-input-step').style.display = 'block';
    document.getElementById('otp-email-display').textContent = email;
    
    // Update button
    const btn = document.getElementById('password-modal-btn');
    btn.innerHTML = '<i class="fas fa-check"></i> Verify OTP';
    btn.onclick = handlePasswordChangeStep;
    
    // Clear OTP input
    document.getElementById('otp-input').value = '';
    
    // Focus on OTP input
    setTimeout(() => {
        document.getElementById('otp-input').focus();
    }, 100);
}

function showNewPasswordStep() {
    // Hide all steps
    hideAllPasswordSteps();
    
    // Show new password step
    document.getElementById('new-password-step').style.display = 'block';
    
    // Update button
    const btn = document.getElementById('password-modal-btn');
    btn.innerHTML = '<i class="fas fa-check"></i> Submit';
    btn.onclick = handlePasswordChangeStep;
    
    // Clear password inputs
    document.getElementById('new-password-input').value = '';
    document.getElementById('confirm-password-input').value = '';
}

function hideAllPasswordSteps() {
    document.getElementById('email-input-step').style.display = 'none';
    document.getElementById('email-display-step').style.display = 'none';
    document.getElementById('otp-input-step').style.display = 'none';
    document.getElementById('new-password-step').style.display = 'none';
}

async function handlePasswordChangeStep() {
    const btn = document.getElementById('password-modal-btn');
    const originalText = btn.innerHTML;
    
    try {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        btn.disabled = true;
        
        if (passwordChangeStep === 1) {
            // Step 1: Send OTP
            await sendOTP();
        } else if (passwordChangeStep === 2) {
            // Step 2: Verify OTP
            await verifyOTP();
        } else if (passwordChangeStep === 3) {
            // Step 3: Change Password
            await changePasswordWithOTP();
        }
    } catch (error) {
        console.error('Error in password change step:', error);
        showNotification('An error occurred. Please try again.', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

async function sendOTP() {
    let email;
    
    if (currentActualEmail) {
        // Using stored email
        email = currentActualEmail;
    } else {
        // Get email from input
        email = document.getElementById('actual-email-input').value.trim();
        
        if (!email) {
            showNotification('Please enter your company email address', 'error');
            return;
        }
        
        // Basic email validation
        if (!email.includes('@') || !email.includes('.')) {
            showNotification('Please enter a valid email address', 'error');
            return;
        }
        
        currentActualEmail = email;
    }
    
    try {
        const response = await fetch('/api/send-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                actual_email: email 
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            passwordChangeStep = 2;
            showOTPStep(email);
            showNotification(`OTP sent to ${email}`, 'success');
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        console.error('Error sending OTP:', error);
        showNotification('Failed to send OTP. Please try again.', 'error');
    }
}

async function verifyOTP() {
    const otpCode = document.getElementById('otp-input').value.trim();
    
    if (!otpCode) {
        showNotification('Please enter the OTP code', 'error');
        return;
    }
    
    if (otpCode.length !== 6) {
        showNotification('OTP must be 6 digits', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/verify-otp-only', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                otp_code: otpCode
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            passwordChangeStep = 3;
            showNewPasswordStep();
            showNotification('OTP verified successfully! Now set your new password.', 'success');
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        console.error('Error verifying OTP:', error);
        showNotification('Failed to verify OTP. Please try again.', 'error');
    }
}

async function changePasswordWithOTP() {
    const newPassword = document.getElementById('new-password-input').value.trim();
    const confirmPassword = document.getElementById('confirm-password-input').value.trim();
    
    // Validation
    if (!newPassword || !confirmPassword) {
        showNotification('Please fill in all password fields', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showNotification('Password must be at least 6 characters long', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/change-password-final', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                new_password: newPassword
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Password changed successfully!', 'success');
            hideChangePasswordModal();
            addChangePasswordButtonToTop();
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        showNotification('Failed to change password. Please try again.', 'error');
    }
}

async function resendOTP() {
    const btn = document.querySelector('.resend-btn');
    const originalText = btn.innerHTML;
    
    try {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        btn.disabled = true;
        
        const response = await fetch('/api/send-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                actual_email: currentActualEmail 
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(`OTP resent to ${currentActualEmail}`, 'success');
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        console.error('Error resending OTP:', error);
        showNotification('Failed to resend OTP. Please try again.', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

function hideChangePasswordModal() {
    const modal = document.getElementById('change-password-modal');
    modal.style.display = 'none';
    // Clear the needs_password_change flag after user interacts with modal
    if (currentUser) {
        currentUser.needs_password_change = false;
    }
}

function closePasswordChangeDialog() {
    hideChangePasswordModal();
    // Add change password button next to user name when closed
    addChangePasswordButtonToTop();
    showNotification('You can change your password anytime using the button next to your name.', 'info');
}

function skipPasswordChange() {
    hideChangePasswordModal();
    // Add change password button next to user name (only for non-admin users)
    addChangePasswordButtonToTop();
    if (!currentUser || !currentUser.is_admin) {
    showNotification('You can change your password anytime using the button next to your name.', 'info');
    }
}

function addChangePasswordButtonToTop() {
    // Don't show change password button for admin users
    if (currentUser && currentUser.is_admin) {
        console.log('DEBUG: Skipping change password button for admin user');
        return;
    }
    
    const userInfoElement = document.getElementById('user-info');
    console.log('DEBUG: userInfoElement found:', !!userInfoElement);
    console.log('DEBUG: currentUser:', currentUser);
    
    if (userInfoElement && !userInfoElement.querySelector('.change-password-btn-top')) {
        console.log('DEBUG: Adding change password button to top');
        const changePasswordBtn = document.createElement('button');
        changePasswordBtn.className = 'change-password-btn-top';
        changePasswordBtn.innerHTML = '<i class="fas fa-key"></i> Change Password';
        changePasswordBtn.onclick = showChangePasswordModal;
        changePasswordBtn.style.cssText = `
            margin-left: 10px;
            padding: 5px 10px;
            background: #ff6b6b;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 0.8rem;
            cursor: pointer;
            transition: background-color 0.3s;
        `;
        changePasswordBtn.addEventListener('mouseenter', () => {
            changePasswordBtn.style.backgroundColor = '#ff5252';
        });
        changePasswordBtn.addEventListener('mouseleave', () => {
            changePasswordBtn.style.backgroundColor = '#ff6b6b';
        });
        userInfoElement.appendChild(changePasswordBtn);
        console.log('DEBUG: Change password button added successfully');
    } else {
        console.log('DEBUG: Change password button already exists or user-info element not found');
    }
}

function removeChangePasswordButtonFromTop() {
    const changePasswordBtn = document.querySelector('.change-password-btn-top');
    if (changePasswordBtn) {
        changePasswordBtn.remove();
    }
}

async function submitPasswordChange() {
    const newPassword = document.getElementById('new-password-input').value.trim();
    const confirmPassword = document.getElementById('confirm-password-input').value.trim();
    
    // Validation
    if (!newPassword || !confirmPassword) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showNotification('Password must be at least 6 characters long', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                new_password: newPassword 
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Password changed successfully!', 'success');
            hideChangePasswordModal();
            // Keep the change password button available for future changes
            addChangePasswordButtonToTop();
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        showNotification('Failed to change password. Please try again.', 'error');
    }
}

// Current password functionality




// Login Logs functionality
function showLogs() {
    // Check if user is admin before showing logs
    if (!currentUser || !currentUser.is_admin) {
        showNotification('Access denied. Admin privileges required.', 'error');
        return;
    }
    
    const modal = document.getElementById('logs-modal');
    if (!modal) {
        showNotification('Logs modal not found', 'error');
        return;
    }
    
    modal.style.display = 'flex';
    loadLoginLogs();
}

function closeLogsModal() {
    const modal = document.getElementById('logs-modal');
    modal.style.display = 'none';
}

function refreshLogs() {
    loadLoginLogs();
}

async function loadLoginLogs() {
    try {
        const response = await fetch('/api/login-logs');
        const result = await response.json();
        
        if (result.success) {
            displayLoginLogs(result.logs);
        } else {
            showNotification('Failed to load login logs: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error loading login logs:', error);
        showNotification('Error loading login logs', 'error');
    }
}

function displayLoginLogs(logs) {
    const logsList = document.getElementById('logs-list');
    
    if (logs.length === 0) {
        logsList.innerHTML = '<div class="no-logs">No login logs found.</div>';
        return;
    }
    
    // Group logs by date
    const logsByDate = {};
    logs.forEach(log => {
        const date = new Date(log.login_time).toLocaleDateString();
        if (!logsByDate[date]) {
            logsByDate[date] = [];
        }
        logsByDate[date].push(log);
    });
    
    let html = '';
    Object.keys(logsByDate).sort().reverse().forEach(date => {
        html += `
            <div class="log-date-group">
                <div class="log-date-header">
                    <h5><i class="fas fa-calendar-day"></i> ${date}</h5>
                    <span class="log-count">${logsByDate[date].length} login(s)</span>
                </div>
                <div class="log-entries">
        `;
        
        logsByDate[date].forEach(log => {
            const time = new Date(log.login_time).toLocaleTimeString();
            const userType = log.is_admin ? 'Admin' : 'Employee';
            const userTypeClass = log.is_admin ? 'admin-user' : 'employee-user';
            
            html += `
                <div class="log-entry">
                    <div class="log-time">
                        <i class="fas fa-clock"></i> ${time}
                    </div>
                    <div class="log-user">
                        <span class="user-name">${log.user_name}</span>
                        <span class="user-type ${userTypeClass}">${userType}</span>
                    </div>
                    <div class="log-email">
                        <i class="fas fa-envelope"></i> ${log.email}
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    logsList.innerHTML = html;
}


function getEmployeeEmail(employeeName) {
    // Convert employee name to email format (matching backend logic)
    let cleanedName = employeeName.trim();
    
    // Remove suffixes like (T), (TC), etc. using regex
    cleanedName = cleanedName.replace(/\s*\([^)]*\)$/, '');
    
    // Convert to lowercase and remove spaces, dots, and hyphens
    const emailName = cleanedName.toLowerCase()
        .replace(/\s+/g, '')
        .replace(/\./g, '')
        .replace(/-/g, '');
    
    return `${emailName}@gmail.com`;
}



// Dashboard functions
function ensureNavbarFixed() {
    const navbar = document.getElementById('main-navbar');
    if (navbar) {
        navbar.style.position = 'fixed';
        navbar.style.top = '0px';
        navbar.style.left = '0px';
        navbar.style.right = '0px';
        navbar.style.width = '100%';
        navbar.style.maxWidth = '100%';
        navbar.style.minWidth = '100%';
        navbar.style.height = '60px';
        navbar.style.zIndex = '9999';
        navbar.style.transform = 'none';
        navbar.style.margin = '0';
        navbar.style.padding = '1rem 2rem';
        navbar.style.boxSizing = 'border-box';
    }
}

function showLoginPage() {
    document.getElementById('dashboard-section').style.display = 'none';
    document.getElementById('main-navbar').style.display = 'none';
    document.getElementById('login-section').style.display = 'flex';
    
    // Remove dashboard-active class to restore blue background
    document.body.classList.remove('dashboard-active');
    
    // Keep desktop viewport for login page too
    keepDesktopViewport();
    
    // Auto-focus on email input when returning to login
    autoFocusEmailInput();
    
    // Check if running as PWA
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  window.navigator.standalone === true ||
                  document.referrer.includes('android-app://');
    
    if (isPWA) {
        // PWA mode - maintain desktop layout
        console.log('PWA login page - maintaining desktop layout');
        forceDesktopView();
        document.body.style.overflowX = 'hidden';
        document.documentElement.style.overflowX = 'hidden';
    } else {
        // Browser mode - allow responsive behavior
        document.body.classList.remove('mobile', 'touch-device');
        document.documentElement.classList.remove('mobile', 'touch-device');
        document.documentElement.style.minWidth = '';
        document.body.style.minWidth = '';
        document.body.style.overflowX = 'hidden';
        document.documentElement.style.overflowX = 'hidden';
    }
    
    // Load saved credentials if remember me was checked
    loadSavedCredentials();
    
    // If no saved credentials, clear form fields
    const rememberMe = localStorage.getItem('remember_me');
    if (rememberMe !== 'true') {
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
        document.getElementById('remember-me').checked = false;
    }
    
    // Reset to login form
    document.getElementById('login-form').style.display = 'block';
    
    // Focus on email input after a short delay to ensure DOM is ready
    // Focus functionality removed from showLoginPage
}

async function showDashboard() {
    document.getElementById('login-section').style.display = 'none';
    
    // Add dashboard-active class to body to change background
    document.body.classList.add('dashboard-active');
    
    // ULTRA-AGGRESSIVE: Force desktop viewport for dashboard
    forceDesktopViewport();
    
    // Additional aggressive desktop view enforcement
    setTimeout(function() {
        // Force viewport again after a short delay
        let viewportMeta = document.querySelector('meta[name="viewport"]');
        if (viewportMeta) {
            viewportMeta.content = 'width=1200, initial-scale=1.0, user-scalable=no';
        }
        
        // Force body styles again
        document.body.style.minWidth = '1200px';
        document.body.style.width = '1200px';
        document.body.style.maxWidth = 'none';
        document.body.style.overflowX = 'auto';
        
        // Force all dashboard elements to desktop width
        const dashboardElements = document.querySelectorAll('#dashboard-section, .dashboard, .dashboard-header, .control-panel, .stats-section, .filters-section, .table-container, .attendance-table, .action-buttons, #admin-panel');
        dashboardElements.forEach(element => {
            element.style.minWidth = '1200px';
            element.style.width = '1200px';
            element.style.maxWidth = 'none';
        });
    }, 100);
    
    // Show and properly position navbar
    const navbar = document.getElementById('main-navbar');
    if (navbar) {
        navbar.style.display = 'flex';
        navbar.style.visibility = 'visible';
        navbar.style.opacity = '1';
        navbar.style.width = '100%';
        navbar.style.maxWidth = '100%';
        navbar.style.minWidth = '100%';
        navbar.style.left = '0px';
        navbar.style.right = '0px';
        navbar.style.margin = '0';
        navbar.style.boxSizing = 'border-box';
    }
    
    document.getElementById('dashboard-section').style.display = 'block';
    
    // Check if running as PWA
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  window.navigator.standalone === true ||
                  document.referrer.includes('android-app://');
    
    if (isPWA) {
        // PWA mode - always force desktop view
        console.log('PWA dashboard - forcing desktop view');
        forceDesktopView();
    } else {
        // Browser mode - prevent mobile mode from interfering with dashboard
        document.body.classList.remove('mobile', 'touch-device');
        document.documentElement.classList.remove('mobile', 'touch-device');
        forceDesktopView();
    }
    
    document.getElementById('user-name').textContent = cleanEmployeeName(currentUser.name);
    
    // Ensure navbar stays fixed on scroll
    ensureNavbarFixed();
    
    // Add scroll event listener to maintain fixed position
    window.addEventListener('scroll', ensureNavbarFixed);
    
    // Initialize zoom for dashboard
    initializeZoom();
    
    if (currentUser.is_admin) {
        showAdminDashboard();
    } else {
        showEmployeeDashboard();
    }
    
    // Check if user needs password change and show dialog directly
    console.log('DEBUG: Checking password change flag:', currentUser.needs_password_change);
    if (currentUser.needs_password_change && !currentUser.is_admin) {
        console.log('DEBUG: Showing change password modal for first-time users');
        setTimeout(() => {
            showChangePasswordModal();
        }, 1000); // Show after 1 second delay
    }
    
    // Always add change password button for non-admin users (if not already shown)
    if (!currentUser.is_admin) {
        setTimeout(() => {
            addChangePasswordButtonToTop();
        }, 1000);
    }
    
    // Add manual trigger for testing (remove in production)
    window.testChangePasswordModal = function() {
        console.log('DEBUG: Manual test trigger called');
        showChangePasswordModal();
    };
    
    // Load initial data first to get stored date
    await loadAttendanceData();
    
    // Only set today's date as default if no date was loaded from server
    const dp = document.getElementById('date-picker');
    if (!dp.value) {
        const today = new Date().toISOString().split('T')[0];
        dp.value = today;
        // Save the default date to server
        await saveAdminDate(today);
    }
    
    if (currentUser.is_admin) {
        await loadEmployees();
        // Auto-select first employee if employees are available
        if (employees.length > 0) {
            const firstEmployee = employees[0];
            selectEmployee(firstEmployee);
            console.log('Admin: Auto-selected first employee:', firstEmployee);
        } else {
            console.log('Admin: No employees available to select');
        }
    }
    
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
    
    // Apply admin restrictions
    applyAdminRestrictions();
    
    // Load admin late statistics
    loadAdminLateStatistics();
}

function applyAdminRestrictions() {
    if (!currentUser || !currentUser.restrictions) {
        return;
    }
    
    const restrictions = currentUser.restrictions;
    
    // Hide Excel upload section if restricted
    if (restrictions.no_excel_upload) {
        const uploadSection = document.querySelector('.upload-section');
        if (uploadSection) {
            uploadSection.style.display = 'none';
        }
    }
    
    // Hide maintenance control section if restricted
    if (restrictions.no_maintenance_mode) {
        const maintenanceSection = document.querySelector('.maintenance-control-section');
        if (maintenanceSection) {
            maintenanceSection.style.display = 'none';
        }
    }
    
    // Hide date picker section if restricted
    if (restrictions.no_date_picker) {
        const datePickerSection = document.querySelector('.date-picker-section');
        if (datePickerSection) {
            datePickerSection.style.display = 'none';
        }
    }
    
    // Hide entire control panel if both upload and date picker are restricted
    if (restrictions.no_excel_upload && restrictions.no_date_picker) {
        const controlPanel = document.querySelector('.control-panel');
        if (controlPanel) {
            controlPanel.style.display = 'none';
        }
    }
}

function showEmployeeDashboard() {
    document.getElementById('admin-panel').style.display = 'none';
    document.getElementById('employee-panel').style.display = 'block';
    document.getElementById('employee-name').textContent = cleanEmployeeName(currentUser.name);
    
    
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

        console.log('Upload response status:', response.status);
        console.log('Upload response headers:', response.headers);
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Upload result:', result);

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
        showNotification(`Upload failed: ${error.message}`, 'error');
        console.error('Upload error:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
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
    console.log('selectEmployee() called with:', employeeName);
    selectedEmployee = employeeName;
    document.getElementById('employee-search').value = cleanEmployeeName(employeeName);
    
    // Update employee filter dropdown to reflect selection
    const employeeFilter = document.getElementById('employee-filter');
    if (employeeFilter) {
        employeeFilter.value = employeeName;
        console.log('Updated dropdown to show:', employeeName);
    } else {
        console.log('Employee filter dropdown not found');
    }
    
    // Remove search dropdown if exists
    const dropdown = document.getElementById('search-results-dropdown');
    if (dropdown) {
        dropdown.remove();
    }
    
    // Filter data for selected employee
    filteredData = attendanceData.filter(record => record.Employee === employeeName);
    console.log(`Filtered data for ${employeeName}: ${filteredData.length} records`);
    
    // Show employee profile and data
    showEmployeeProfile(employeeName);
    
    
    displayAdminAttendanceData(globalShowUpdateNote);
    updateAdminStats();
    
    console.log('Selected employee:', employeeName);
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


async function showEmployeeProfile(employeeName) {
    const profileCard = document.getElementById('employee-profile');
    const employeeData = attendanceData.filter(record => record.Employee === employeeName);
    
    if (employeeData.length === 0) {
        hideEmployeeProfile();
        return;
    }
    
    // Check if this employee is T (not eligible for PL/SL)
    let isTEmployee = false;
    try {
        const eligibilityUrl = new URL('/api/employee-leave-eligibility', window.location.origin);
        eligibilityUrl.searchParams.append('employee', employeeName);
        const eligibilityRes = await fetch(eligibilityUrl);
        const eligibilityResult = await eligibilityRes.json();
        if (eligibilityResult.success) {
            isTEmployee = eligibilityResult.is_t_employee;
        }
    } catch (e) {
        console.error('Failed to check T status', e);
    }
    
    // Calculate stats for this employee
    const presentDays = employeeData.filter(record => record.Status.startsWith('P') && !record.Status.startsWith('PL') && !record.Status.startsWith('SL') && !record.Status.startsWith('FL') && !record.Status.startsWith('PAT') && !record.Status.startsWith('MAT') && !record.Status.startsWith('HL')).length;
    const halfDays = employeeData.filter(record => record.Status.startsWith('HF')).length;
    const paidHalfDays = employeeData.filter(record => record.Status.startsWith('PHF')).length;
    const sickHalfDays = employeeData.filter(record => record.Status.startsWith('SHF')).length;
    const weekOffDays = employeeData.filter(record => record.Status.startsWith('W/O')).length;
    const absentDays = employeeData.filter(record => record.Status.startsWith('A')).length + 
                      (employeeData.filter(record => record.Status.startsWith('HF')).length * 0.5) +
                      (employeeData.filter(record => record.Status.startsWith('PHF')).length * 1) +
                      (employeeData.filter(record => record.Status.startsWith('SHF')).length * 1);
    // Use working days only for attendance rate calculation (exclude W/O)
    const totalDaysInMonth = employeeData.length; // Total records = total days in month
    const totalWorkingDays = employeeData.filter(record => !record.Status.startsWith('W/O')).length; // Exclude W/O days
    const presentDaysWeighted = presentDays + (halfDays * 0.5) + (paidHalfDays * 1) + (sickHalfDays * 1); // P=1, HF=0.5, PHF/SHF=1
    const paidLeaveDays = employeeData.filter(record => 
        ['PL', 'SL', 'FL', 'PAT', 'MAT', 'HL'].some(leave => record.Status.startsWith(leave))
    ).length;
    
    // Calculate unpaid days: HF = 0.5, A = 1.0
    const unpaidDays = (employeeData.filter(record => record.Status.startsWith('A')).length) + 
                      (employeeData.filter(record => record.Status.startsWith('HF')).length * 0.5);
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
    const employeeNameEl = document.getElementById('profile-employee-name');
    employeeNameEl.textContent = cleanEmployeeName(employeeName);
    
    // Note: TC indicator removed from dashboard display as requested
    
    document.getElementById('profile-total-days').textContent = totalDaysInMonth;
    document.getElementById('profile-present-days').textContent = presentDaysWeighted;
    document.getElementById('profile-leave-days').textContent = paidLeaveDays;
    document.getElementById('profile-unpaid-days').textContent = unpaidDays;
    document.getElementById('profile-attendance-rate').textContent = `${attendanceRate}%`;
    const payableEl = document.getElementById('profile-payable-days');
    if (payableEl) payableEl.textContent = payableDays;
    
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
    
    // **ADMIN: Always show only one employee at a time**
    let dataToDisplay;
    
    if (selectedEmployee) {
        // Show selected employee's data
        dataToDisplay = attendanceData.filter(record => record.Employee === selectedEmployee);
    } else {
        // For admin, don't show any data if no employee is selected
        dataToDisplay = [];
    }
    
    if (dataToDisplay.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-inbox"></i>
                <h3>No Data Available</h3>
                <p>${attendanceData.length === 0 ? 'Upload an Excel file to get started' : 'Please select an employee from the dropdown to view their attendance data'}</p>
            </div>
        `;
        return;
    }
    
    const table = createAttendanceTable(dataToDisplay);
    container.innerHTML = table;
    
    // Add enhanced hover effects to status rows
    addStatusRowHoverEffects();
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
    
    // Add enhanced hover effects to status rows
    addStatusRowHoverEffects();
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
                    <th>
                        <div class="header-cell">
                            <span>Employee Name</span>
                        </div>
                    </th>
                    <th>
                        <div class="header-cell">
                            <span>Date</span>
                        </div>
                    </th>
                    <th>
                        <div class="header-cell">
                            <span>Punch In</span>
                        </div>
                    </th>
                    <th>
                        <div class="header-cell">
                            <span>Punch Out</span>
                        </div>
                    </th>
                    <th>
                        <div class="header-cell">
                            <span>Status</span>
                        </div>
                    </th>
                    <th>
                        <div class="header-cell">
                            <span>Comment</span>
                        </div>
                    </th>
                </tr>
            </thead>
            <tbody>
    `;
    
    data.forEach(record => {
        const statusClass = getStatusClass(record.Status);
        const comments = formatComments(record);
        
       html += `
    <tr class="${statusClass}" style="${getStatusStyle(record.Status)}">
        <td style="${getStatusStyle(record.Status)}">${cleanEmployeeName(record.Employee)}</td>
        <td style="${getStatusStyle(record.Status)}">${formatDate(record.Date)}</td>
        <td class="${record.pin_highlight ? 'red-text' : ''}" 
            style="${getStatusStyle(record.Status)}"
            title="${record.pin_comment || ''}"
            data-comment="${(record.pin_comment || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;')}">
            ${record['Punch-In']}
        </td>
        <td class="${record.pout_highlight ? 'red-text' : ''}" 
            style="${getStatusStyle(record.Status)}"
            title="${record.pout_comment || ''}"
            data-comment="${(record.pout_comment || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;')}">
            ${record['Punch-Out']}
        </td>
        <td class="${record.status_highlight ? 'red-text' : ''}" 
            style="${getStatusStyle(record.Status)}"
            title="${record.status_comment || ''}"
            data-comment="${(record.status_comment || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;')}">
            ${record.Status}
        </td>
        <td style="${getStatusStyle(record.Status)}">${comments}</td>
    </tr>
`;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    return html;
}

function addStatusRowHoverEffects() {
    // Add hover effects to all status rows
    const statusRows = document.querySelectorAll('.attendance-table tr[class*="status-"]');
    
    statusRows.forEach(row => {
        const statusClass = Array.from(row.classList).find(cls => cls.startsWith('status-'));
        if (!statusClass) return;
        
        const status = statusClass.replace('status-', '').toUpperCase();
        
        // Add mouseenter event
        row.addEventListener('mouseenter', function() {
            const hoverStyle = getStatusHoverStyle(status);
            if (hoverStyle) {
                this.style.cssText += hoverStyle;
                // Apply to all cells in the row
                const cells = this.querySelectorAll('td');
                cells.forEach(cell => {
                    cell.style.cssText += hoverStyle;
                });
            }
        });
        
        // Add mouseleave event
        row.addEventListener('mouseleave', function() {
            const originalStyle = getStatusStyle(status);
            if (originalStyle) {
                this.style.cssText = originalStyle;
                // Apply to all cells in the row
                const cells = this.querySelectorAll('td');
                cells.forEach(cell => {
                    cell.style.cssText = originalStyle;
                });
            }
        });
    });
}

// application submission flow removed

// Mobile tooltip function
function showMobileTooltip(element, comment) {
    // Tooltips disabled
    return;
}

function hideMobileTooltip() {
    // Tooltips disabled
    return;
}

// Tooltip event listeners disabled

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

function getStatusStyle(status) {
    if (!status) return '';
    const s = status.toUpperCase();
    
    // Simple styles - just background colors
    if (s.startsWith('P')) return 'background-color: #d4edda !important;';
    if (s.startsWith('A')) return 'background-color: #f8d7da !important;';
    if (s.startsWith('W/O')) return 'background-color: #eaf4ff !important;';
    if (s.startsWith('PL')) return 'background-color: #fff3cd !important;';
    if (s.startsWith('SL')) return 'background-color: #fde2e4 !important;';
    if (s.startsWith('FL')) return 'background-color: #fcefe3 !important;';
    if (s.startsWith('HL')) return 'background-color: #e8eaf6 !important;';
    if (s.startsWith('PHF')) return 'background-color: #e2f0cb !important;';
    if (s.startsWith('SHF')) return 'background-color: #e0f7fa !important;';
    if (s.startsWith('PAT')) return 'background-color: #ffe0b2 !important;';
    if (s.startsWith('MAT')) return 'background-color: #f3e5f5 !important;';
    if (s.startsWith('HF')) return 'background-color: #e1f5fe !important;';
    return '';
}

function getStatusHoverStyle(status) {
    if (!status) return '';
    const s = status.toUpperCase();
    
    // Simple hover styles - just darker colors
    if (s.startsWith('P')) return 'background-color: #c3e6cb !important;';
    if (s.startsWith('A')) return 'background-color: #f5c6cb !important;';
    if (s.startsWith('W/O')) return 'background-color: #d1ecf1 !important;';
    if (s.startsWith('PL')) return 'background-color: #ffeaa7 !important;';
    if (s.startsWith('SL')) return 'background-color: #f8d7da !important;';
    if (s.startsWith('FL')) return 'background-color: #fadbd8 !important;';
    if (s.startsWith('HL')) return 'background-color: #d1c4e9 !important;';
    if (s.startsWith('PHF')) return 'background-color: #c8e6c9 !important;';
    if (s.startsWith('SHF')) return 'background-color: #b2ebf2 !important;';
    if (s.startsWith('PAT')) return 'background-color: #ffcc80 !important;';
    if (s.startsWith('MAT')) return 'background-color: #e1bee7 !important;';
    if (s.startsWith('HF')) return 'background-color: #b3e5fc !important;';
    return '';
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    
    // Handle different date formats
    let date;
    if (typeof dateStr === 'string') {
        // Try different date formats
        date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            // Try parsing as YYYY-MM-DD format
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                date = new Date(parts[0], parts[1] - 1, parts[2]);
            }
        }
    } else {
        date = new Date(dateStr);
    }
    
    if (isNaN(date.getTime())) {
        console.log('Invalid date:', dateStr);
        return dateStr; // Return original string if can't parse
    }
    
    const formatted = date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
    console.log('formatDate input:', dateStr, 'output:', formatted);
    return formatted;
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
    const presentDays = employeeData.filter(record => record.Status.startsWith('P') && !record.Status.startsWith('PL') && !record.Status.startsWith('SL') && !record.Status.startsWith('FL') && !record.Status.startsWith('PAT') && !record.Status.startsWith('MAT') && !record.Status.startsWith('HL')).length;
    const halfDays = employeeData.filter(record => record.Status.startsWith('HF')).length;
    const paidHalfDays = employeeData.filter(record => record.Status.startsWith('PHF')).length;
    const sickHalfDays = employeeData.filter(record => record.Status.startsWith('SHF')).length;
    const weekOffDays = employeeData.filter(record => record.Status.startsWith('W/O')).length;
    const absentDays = employeeData.filter(record => record.Status.startsWith('A')).length + 
                      (employeeData.filter(record => record.Status.startsWith('HF')).length * 0.5) +
                      (employeeData.filter(record => record.Status.startsWith('PHF')).length * 1) +
                      (employeeData.filter(record => record.Status.startsWith('SHF')).length * 1);
    
    // Use working days only for attendance rate calculation (exclude W/O)
    const totalWorkingDays = employeeData.filter(record => !record.Status.startsWith('W/O')).length; // Exclude W/O days
    const presentDaysWeighted = presentDays + (halfDays * 0.5) + (paidHalfDays * 1) + (sickHalfDays * 1); // P=1, HF=0.5, PHF/SHF=1
    const attendanceRate = totalWorkingDays > 0 ? ((presentDaysWeighted / totalWorkingDays) * 100).toFixed(1) : 0;
    
    // Calculate unpaid days: HF = 0.5, A = 1.0
    const unpaidDays = (employeeData.filter(record => record.Status.startsWith('A')).length) + 
                      (employeeData.filter(record => record.Status.startsWith('HF')).length * 0.5);
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
    document.getElementById('unpaid-days').textContent = unpaidDays;
    document.getElementById('performance-status').innerHTML = `${performanceEmoji} ${performanceStatus}`;
    const payableDaysEl = document.getElementById('payable-days');
    if (payableDaysEl) payableDaysEl.textContent = payableDays;
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
    
    // Event listener is handled by HTML onchange attribute
}

// **NEW: Handle employee filter dropdown change**
window.handleEmployeeFilterChange = function() {
    console.log('handleEmployeeFilterChange() called');
    const select = document.getElementById('employee-filter');
    if (!select) {
        console.log('Employee filter select element not found');
        return;
    }
    
    const selectedValue = select.value;
    console.log('Employee filter changed to:', selectedValue);
    
    if (selectedValue) {
        // Select specific employee
        console.log('Calling selectEmployee with:', selectedValue);
        selectEmployee(selectedValue);
    } else {
        // If "All Employees" is selected, show first employee by default
        if (employees.length > 0) {
            console.log('No employee selected, defaulting to first employee:', employees[0]);
            selectEmployee(employees[0]);
            // Update dropdown to show first employee as selected
            select.value = employees[0];
        }
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


// Email validation helper
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Zoom functionality
function initializeZoom() {
    // Load saved zoom level from localStorage
    const savedZoom = localStorage.getItem('attendancePortalZoom');
    if (savedZoom) {
        currentZoomLevel = parseInt(savedZoom);
        applyZoom(currentZoomLevel);
        updateZoomDisplay();
    }
}

function zoomIn() {
    if (currentZoomLevel < 200) {
        currentZoomLevel += 10;
        applyZoom(currentZoomLevel);
        updateZoomDisplay();
        saveZoomLevel();
        console.log('Zoomed in to:', currentZoomLevel + '%');
    }
}

function zoomOut() {
    if (currentZoomLevel > 50) {
        currentZoomLevel -= 10;
        applyZoom(currentZoomLevel);
        updateZoomDisplay();
        saveZoomLevel();
        console.log('Zoomed out to:', currentZoomLevel + '%');
    }
}

function resetZoom() {
    currentZoomLevel = 100;
    applyZoom(currentZoomLevel);
    updateZoomDisplay();
    saveZoomLevel();
    console.log('Zoom reset to:', currentZoomLevel + '%');
}

function applyZoom(zoomLevel) {
    const dashboardSection = document.getElementById('dashboard-section');
    if (dashboardSection) {
        console.log('Applying zoom:', zoomLevel + '%', 'to dashboard section');
        
        // Apply zoom transform
        dashboardSection.style.transform = `scale(${zoomLevel / 100})`;
        dashboardSection.style.transformOrigin = 'center top';
        dashboardSection.style.transition = 'transform 0.3s ease';
        
        // Adjust container to prevent layout issues
        const scale = zoomLevel / 100;
        if (scale < 1) {
            dashboardSection.style.marginBottom = `${(1 - scale) * 50}vh`;
        } else {
            dashboardSection.style.marginBottom = '0';
        }
        
        // Ensure the dashboard section is visible
        if (dashboardSection.style.display === 'none') {
            console.log('Dashboard section is hidden, zoom not applied');
        }
    } else {
        console.log('Dashboard section not found');
    }
}

function updateZoomDisplay() {
    const adminZoomLevel = document.getElementById('zoom-level');
    const employeeZoomLevel = document.getElementById('zoom-level-employee');
    
    if (adminZoomLevel) {
        adminZoomLevel.textContent = `${currentZoomLevel}%`;
    }
    if (employeeZoomLevel) {
        employeeZoomLevel.textContent = `${currentZoomLevel}%`;
    }
}

function saveZoomLevel() {
    localStorage.setItem('attendancePortalZoom', currentZoomLevel.toString());
}

// Initialize zoom when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeZoom();
});

// Make zoom functions globally available
window.zoomIn = zoomIn;
window.zoomOut = zoomOut;
window.resetZoom = resetZoom;

// Employee Data Modal Functions
async function showEmployeeData(employeeName) {
    try {
        const response = await fetch(`/api/employee-data/${encodeURIComponent(employeeName)}`);
        const result = await response.json();
        
        if (result.success) {
            displayEmployeeData(result.data);
            document.getElementById('employee-data-modal').style.display = 'flex';
        } else {
            showNotification('❌ Failed to load employee data: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error loading employee data:', error);
        showNotification('❌ Error loading employee data', 'error');
    }
}

function displayEmployeeData(data) {
    const content = document.getElementById('employee-data-content');
    if (!content) return;
    
    content.innerHTML = `
        <div class="employee-data-container">
            <div class="employee-info-section">
                <div class="employee-header">
                    <div class="employee-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="employee-details">
                        <h4>${data.employee_name}</h4>
                        <p><i class="fas fa-envelope"></i> ${data.email}</p>
                        <p><i class="fas fa-calendar"></i> ${data.joining_date}</p>
                    </div>
                </div>
            </div>
            
            <div class="employee-stats-section">
                <h5><i class="fas fa-chart-bar"></i> Attendance Statistics</h5>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-label">Total Days</span>
                        <span class="stat-value">${data.total_days}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Working Days</span>
                        <span class="stat-value">${data.working_days}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Present Days</span>
                        <span class="stat-value">${data.present_days}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Absent Days</span>
                        <span class="stat-value">${data.absent_days}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Leave Days</span>
                        <span class="stat-value">${data.leave_days}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Attendance Rate</span>
                        <span class="stat-value">${data.attendance_rate}%</span>
                    </div>
                </div>
            </div>
            
            <div class="employee-leave-breakdown-section">
                <h5><i class="fas fa-calendar-alt"></i> Leave Breakdown</h5>
                <div class="leave-breakdown-grid">
                    <div class="leave-item">
                        <span class="leave-label">W/O Used</span>
                        <span class="leave-value">${data.leave_breakdown.wo_used}</span>
                    </div>
                    <div class="leave-item">
                        <span class="leave-label">PL Used</span>
                        <span class="leave-value">${data.leave_breakdown.pl_used}</span>
                    </div>
                    <div class="leave-item">
                        <span class="leave-label">SL Used</span>
                        <span class="leave-value">${data.leave_breakdown.sl_used}</span>
                    </div>
                    <div class="leave-item">
                        <span class="leave-label">FL Used</span>
                        <span class="leave-value">${data.leave_breakdown.fl_used}</span>
                    </div>
                    <div class="leave-item">
                        <span class="leave-label">HL Used</span>
                        <span class="leave-value">${data.leave_breakdown.hl_used}</span>
                    </div>
                    <div class="leave-item">
                        <span class="leave-label">PAT Used</span>
                        <span class="leave-value">${data.leave_breakdown.pat_used}</span>
                    </div>
                    <div class="leave-item">
                        <span class="leave-label">MAT Used</span>
                        <span class="leave-value">${data.leave_breakdown.mat_used}</span>
                    </div>
                </div>
            </div>
            
            <div class="recent-records-section">
                <h5><i class="fas fa-history"></i> Recent Attendance Records</h5>
                <div class="records-table">
                    <div class="record-header">
                        <span>Date</span>
                        <span>Punch In</span>
                        <span>Punch Out</span>
                        <span>Status</span>
                    </div>
                    ${data.recent_records.map(record => `
                        <div class="record-row ${getStatusClass(record.Status)}">
                            <span>${formatDate(record.Date)}</span>
                            <span>${record['Punch-In'] || '-'}</span>
                            <span>${record['Punch-Out'] || '-'}</span>
                            <span>${record.Status}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function getStatusClass(status) {
    if (status === 'Present') return 'status-present';
    if (status === 'Absent') return 'status-absent';
    if (status.includes('Late')) return 'status-late';
    return '';
}

function closeEmployeeDataModal() {
    document.getElementById('employee-data-modal').style.display = 'none';
}


