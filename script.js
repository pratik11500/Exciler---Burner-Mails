const API_BASE = 'https://api.mail.tm';

// State management
const state = {
    burner: {
        email: null,
        password: null,
        token: null,
        refreshInterval: null,
        timerInterval: null,
        createdTime: null,
        messages: [],
        currentMessageId: null
    },
    custom: {
        email: null,
        password: null,
        token: null,
        refreshInterval: null,
        isLoggedIn: false,
        messages: [],
        currentMessageId: null
    },
    availableDomains: []
};

// Utility Functions
const utils = {
    generateRandomString(length = 10) {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    getAvatarUrl(email) {
        const name = email.split('@')[0];
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=ff6b35&color=fff&size=40`;
    },

    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },

    generateQRCode(text, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Simple QR code using Google Charts API
        container.innerHTML = `<img src="https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encodeURIComponent(text)}&choe=UTF-8" alt="QR Code" style="max-width: 100%; height: auto;">`;
    }
};

// Toast Notification System
const toast = {
    show(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toastEl = document.createElement('div');
        toastEl.className = `toast toast-${type}`;
        
        const icons = {
            success: '<path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
            error: '<path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
            warning: '<path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2"/>',
            info: '<path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2"/>'
        };
        
        toastEl.innerHTML = `
            <svg class="toast-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                ${icons[type]}
            </svg>
            <div class="toast-content">
                <div class="toast-message">${utils.escapeHtml(message)}</div>
            </div>
        `;
        
        container.appendChild(toastEl);
        
        setTimeout(() => {
            toastEl.style.opacity = '0';
            setTimeout(() => toastEl.remove(), 300);
        }, 3000);
    },

    success(message) {
        this.show(message, 'success');
    },

    error(message) {
        this.show(message, 'error');
    },

    warning(message) {
        this.show(message, 'warning');
    },

    info(message) {
        this.show(message, 'info');
    }
};

// Loading overlay
const loadingOverlay = document.getElementById('loading-overlay');

function showLoading() {
    loadingOverlay.style.display = 'flex';
}

function hideLoading() {
    loadingOverlay.style.display = 'none';
}

// LocalStorage functions for session persistence
const storage = {
    saveBurnerSession() {
        if (state.burner.email && state.burner.token) {
            const sessionData = {
                email: state.burner.email,
                password: state.burner.password,
                token: state.burner.token,
                createdTime: state.burner.createdTime
            };
            localStorage.setItem('burner_session', JSON.stringify(sessionData));
        }
    },

    loadBurnerSession() {
        const sessionData = localStorage.getItem('burner_session');
        if (sessionData) {
            try {
                return JSON.parse(sessionData);
            } catch (e) {
                return null;
            }
        }
        return null;
    },

    clearBurnerSession() {
        localStorage.removeItem('burner_session');
    },

    hasBurnerSession() {
        return localStorage.getItem('burner_session') !== null;
    }
};

// API Functions
async function fetchDomains() {
    try {
        const response = await fetch(`${API_BASE}/domains`);
        if (!response.ok) throw new Error('Failed to fetch domains');
        const data = await response.json();
        state.availableDomains = data['hydra:member'].map(d => d.domain);
        return state.availableDomains;
    } catch (error) {
        console.error('Error fetching domains:', error);
        throw error;
    }
}

async function createAccount(email, password) {
    try {
        const response = await fetch(`${API_BASE}/accounts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: email, password: password })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create account');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error creating account:', error);
        throw error;
    }
}

async function getAuthToken(email, password) {
    try {
        const response = await fetch(`${API_BASE}/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: email, password: password })
        });
        
        if (!response.ok) throw new Error('Failed to authenticate');
        
        const data = await response.json();
        return data.token;
    } catch (error) {
        console.error('Error getting auth token:', error);
        throw error;
    }
}

async function getMessages(token) {
    try {
        const response = await fetch(`${API_BASE}/messages`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch messages');
        
        const data = await response.json();
        return data['hydra:member'];
    } catch (error) {
        console.error('Error fetching messages:', error);
        throw error;
    }
}

async function getMessage(messageId, token) {
    try {
        const response = await fetch(`${API_BASE}/messages/${messageId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch message');
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching message:', error);
        throw error;
    }
}

async function deleteMessage(messageId, token) {
    try {
        const response = await fetch(`${API_BASE}/messages/${messageId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to delete message');
        
        return true;
    } catch (error) {
        console.error('Error deleting message:', error);
        throw error;
    }
}

// Display Functions
function displayMessages(messages, containerId, mode) {
    const container = document.getElementById(containerId);
    const countEl = document.getElementById(`${mode}-email-count`);
    
    // Update count
    if (countEl) {
        countEl.textContent = messages.length;
    }
    
    // Show/hide delete all button
    const deleteAllBtn = document.getElementById(`${mode}-delete-all-btn`);
    if (deleteAllBtn) {
        deleteAllBtn.style.display = messages.length > 0 ? 'flex' : 'none';
    }
    
    if (messages.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg class="empty-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" stroke-width="2"/>
                    <path d="M22 6L12 13L2 6" stroke="currentColor" stroke-width="2"/>
                </svg>
                <p>No emails yet</p>
                <span>Inbox refreshes every 5 seconds</span>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    state[mode].messages = messages;
    
    messages.reverse().forEach(message => {
        const messageItem = document.createElement('div');
        messageItem.className = 'message-item';
        if (!message.seen) {
            messageItem.classList.add('unread');
        }
        
        const date = new Date(message.createdAt);
        const dateStr = date.toLocaleDateString();
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const senderEmail = message.from?.address || 'Unknown sender';
        const avatarUrl = utils.getAvatarUrl(senderEmail);
        
        // Get email preview
        const preview = utils.truncateText(message.intro || 'No preview available', 100);
        
        messageItem.innerHTML = `
            <div class="message-header">
                <div class="message-from">
                    <img src="${avatarUrl}" alt="${utils.escapeHtml(senderEmail)}" class="message-avatar">
                    ${utils.escapeHtml(senderEmail)}
                </div>
                <div class="message-actions">
                    <button class="message-action-btn delete-btn" data-id="${message.id}" title="Delete email">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="message-subject">${utils.escapeHtml(message.subject || 'No Subject')}</div>
            <div class="message-preview">${utils.escapeHtml(preview)}</div>
            <div class="message-date">${dateStr} ${timeStr}</div>
        `;
        
        // Click to view (but not on action buttons)
        messageItem.addEventListener('click', (e) => {
            if (!e.target.closest('.message-action-btn')) {
                viewEmail(message.id, mode);
            }
        });
        
        // Delete button
        const deleteBtn = messageItem.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteEmailPrompt(message.id, mode);
        });
        
        container.appendChild(messageItem);
    });
}

function searchMessages(mode) {
    const searchTerm = document.getElementById(`${mode}-search`).value.toLowerCase();
    const messages = state[mode].messages;
    
    if (!searchTerm) {
        displayMessages(messages, `${mode}-inbox`, mode);
        return;
    }
    
    const filtered = messages.filter(msg => {
        const from = msg.from?.address?.toLowerCase() || '';
        const subject = msg.subject?.toLowerCase() || '';
        const intro = msg.intro?.toLowerCase() || '';
        return from.includes(searchTerm) || subject.includes(searchTerm) || intro.includes(searchTerm);
    });
    
    displayMessages(filtered, `${mode}-inbox`, mode);
}

async function viewEmail(messageId, mode) {
    showLoading();
    
    try {
        const message = await getMessage(messageId, state[mode].token);
        
        state[mode].currentMessageId = messageId;
        
        document.getElementById(`${mode}-email-from`).textContent = message.from.address;
        document.getElementById(`${mode}-email-subject`).textContent = message.subject || 'No Subject';
        document.getElementById(`${mode}-email-date`).textContent = new Date(message.createdAt).toLocaleString();
        
        const content = message.text || message.html || 'No content available';
        document.getElementById(`${mode}-email-content`).textContent = content;
        
        document.getElementById(`${mode}-viewer`).style.display = 'block';
        document.getElementById(`${mode}-viewer`).scrollIntoView({ behavior: 'smooth' });
        
        // Refresh inbox to update read status
        setTimeout(() => {
            if (mode === 'burner') {
                refreshBurnerInbox();
            } else {
                refreshCustomInbox();
            }
        }, 1000);
        
    } catch (error) {
        toast.error('Error loading email');
    } finally {
        hideLoading();
    }
}

async function deleteEmailPrompt(messageId, mode) {
    if (!confirm('Are you sure you want to delete this email?')) {
        return;
    }
    
    showLoading();
    
    try {
        await deleteMessage(messageId, state[mode].token);
        toast.success('Email deleted successfully');
        
        // Close viewer if this was the current message
        if (state[mode].currentMessageId === messageId) {
            document.getElementById(`${mode}-viewer`).style.display = 'none';
            state[mode].currentMessageId = null;
        }
        
        // Refresh inbox
        if (mode === 'burner') {
            await refreshBurnerInbox();
        } else {
            await refreshCustomInbox();
        }
    } catch (error) {
        toast.error('Failed to delete email');
    } finally {
        hideLoading();
    }
}

async function deleteAllEmails(mode) {
    if (!confirm('Are you sure you want to delete ALL emails? This cannot be undone.')) {
        return;
    }
    
    showLoading();
    
    try {
        const messages = state[mode].messages;
        let deleted = 0;
        
        for (const message of messages) {
            try {
                await deleteMessage(message.id, state[mode].token);
                deleted++;
            } catch (e) {
                console.error('Failed to delete message:', message.id);
            }
        }
        
        toast.success(`Deleted ${deleted} email(s)`);
        
        // Close viewer
        document.getElementById(`${mode}-viewer`).style.display = 'none';
        state[mode].currentMessageId = null;
        
        // Refresh inbox
        if (mode === 'burner') {
            await refreshBurnerInbox();
        } else {
            await refreshCustomInbox();
        }
    } catch (error) {
        toast.error('Failed to delete all emails');
    } finally {
        hideLoading();
    }
}

// Navigation
const navItems = document.querySelectorAll('.nav-item');
navItems.forEach(item => {
    item.addEventListener('click', () => {
        const pageName = item.dataset.page;
        
        navItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(`${pageName}-page`).classList.add('active');
        
        // Close mobile menu
        const sidebar = document.querySelector('.sidebar');
        const backdrop = document.getElementById('sidebar-backdrop');
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('mobile-active');
            backdrop.classList.remove('active');
        }
    });
});

// Mobile menu
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
const sidebar = document.querySelector('.sidebar');
const sidebarBackdrop = document.getElementById('sidebar-backdrop');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-active');
        sidebarBackdrop.classList.toggle('active');
    });
}

if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener('click', () => {
        sidebar.classList.remove('mobile-active');
        sidebarBackdrop.classList.remove('active');
    });
}

// Burner Email Functions
document.getElementById('burner-generate-btn').addEventListener('click', async () => {
    showLoading();
    updateBurnerStatus('Generating new email address...');
    
    try {
        // Clear previous session
        if (state.burner.refreshInterval) {
            clearInterval(state.burner.refreshInterval);
        }
        
        if (state.burner.timerInterval) {
            clearInterval(state.burner.timerInterval);
        }
        
        if (state.availableDomains.length === 0) {
            await fetchDomains();
        }
        
        const domain = state.availableDomains[0];
        const username = utils.generateRandomString(12);
        state.burner.email = `${username}@${domain}`;
        state.burner.password = utils.generateRandomString(16);
        
        await createAccount(state.burner.email, state.burner.password);
        
        state.burner.token = await getAuthToken(state.burner.email, state.burner.password);
        
        document.getElementById('burner-email').value = state.burner.email;
        document.getElementById('burner-copy-btn').disabled = false;
        document.getElementById('burner-qr-btn').disabled = false;
        document.getElementById('burner-refresh-btn').disabled = false;
        
        state.burner.createdTime = Date.now();
        updateBurnerTimer();
        state.burner.timerInterval = setInterval(updateBurnerTimer, 1000);
        
        // Save session
        storage.saveBurnerSession();
        document.getElementById('burner-resume-btn').style.display = 'none';
        
        updateBurnerStatus('Email generated successfully!');
        toast.success('Email generated successfully!');
        
        state.burner.refreshInterval = setInterval(refreshBurnerInbox, 5000);
        
        await refreshBurnerInbox();
        
    } catch (error) {
        updateBurnerStatus('Error: ' + error.message, true);
        toast.error('Failed to generate email');
    } finally {
        hideLoading();
    }
});

// Resume session
document.getElementById('burner-resume-btn').addEventListener('click', async () => {
    const session = storage.loadBurnerSession();
    if (!session) {
        toast.error('No saved session found');
        return;
    }
    
    showLoading();
    
    try {
        // Try to get messages with saved token
        const messages = await getMessages(session.token);
        
        // Session is valid
        state.burner.email = session.email;
        state.burner.password = session.password;
        state.burner.token = session.token;
        state.burner.createdTime = session.createdTime;
        
        document.getElementById('burner-email').value = state.burner.email;
        document.getElementById('burner-copy-btn').disabled = false;
        document.getElementById('burner-qr-btn').disabled = false;
        document.getElementById('burner-refresh-btn').disabled = false;
        
        updateBurnerTimer();
        state.burner.timerInterval = setInterval(updateBurnerTimer, 1000);
        
        document.getElementById('burner-resume-btn').style.display = 'none';
        
        updateBurnerStatus('Session resumed successfully!');
        toast.success('Session resumed!');
        
        displayMessages(messages, 'burner-inbox', 'burner');
        
        state.burner.refreshInterval = setInterval(refreshBurnerInbox, 5000);
        
    } catch (error) {
        toast.error('Session expired. Please generate a new email.');
        storage.clearBurnerSession();
        document.getElementById('burner-resume-btn').style.display = 'none';
    } finally {
        hideLoading();
    }
});

const debouncedRefreshBurner = utils.debounce(() => {
    refreshBurnerInbox();
}, 300);

document.getElementById('burner-refresh-btn').addEventListener('click', debouncedRefreshBurner);

document.getElementById('burner-copy-btn').addEventListener('click', () => {
    const input = document.getElementById('burner-email');
    input.select();
    document.execCommand('copy');
    
    toast.success('Email copied to clipboard!');
});

document.getElementById('burner-qr-btn').addEventListener('click', () => {
    const email = state.burner.email;
    if (!email) return;
    
    utils.generateQRCode(email, 'qr-code');
    document.getElementById('qr-email-text').textContent = email;
    document.getElementById('qr-modal').style.display = 'flex';
});

document.getElementById('burner-close-viewer').addEventListener('click', () => {
    document.getElementById('burner-viewer').style.display = 'none';
});

document.getElementById('burner-delete-email-btn').addEventListener('click', () => {
    if (state.burner.currentMessageId) {
        deleteEmailPrompt(state.burner.currentMessageId, 'burner');
    }
});

document.getElementById('burner-delete-all-btn').addEventListener('click', () => {
    deleteAllEmails('burner');
});

// Search
document.getElementById('burner-search').addEventListener('input', utils.debounce(() => {
    searchMessages('burner');
}, 300));

async function refreshBurnerInbox() {
    if (!state.burner.token) return;
    
    try {
        const messages = await getMessages(state.burner.token);
        displayMessages(messages, 'burner-inbox', 'burner');
        updateBurnerStatus(`Inbox refreshed - ${messages.length} message(s)`);
    } catch (error) {
        console.error('Error refreshing inbox:', error);
        updateBurnerStatus('Error refreshing inbox', true);
    }
}

function updateBurnerStatus(message, isError = false) {
    const statusText = document.getElementById('burner-status');
    statusText.textContent = message;
    statusText.parentElement.style.color = isError ? 'var(--accent-danger)' : 'var(--accent-success)';
}

function updateBurnerTimer() {
    if (state.burner.createdTime) {
        const now = Date.now();
        const elapsed = Math.floor((now - state.burner.createdTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        document.getElementById('burner-timer').textContent = `Active: ${minutes}m ${seconds}s`;
    }
}

// Custom Email Functions
const authTabs = document.querySelectorAll('.auth-tab');
authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        
        authTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        document.getElementById(`${tabName}-tab`).classList.add('active');
    });
});

document.getElementById('signup-btn').addEventListener('click', async () => {
    const username = document.getElementById('signup-username').value.trim();
    const password = document.getElementById('signup-password').value;
    const domain = document.getElementById('signup-domain').value;
    
    if (!username || !password) {
        toast.warning('Please fill in all fields');
        return;
    }
    
    if (username.length < 3) {
        toast.warning('Username must be at least 3 characters');
        return;
    }
    
    if (password.length < 6) {
        toast.warning('Password must be at least 6 characters');
        return;
    }
    
    showLoading();
    
    try {
        const email = `${username}@${domain}`;
        
        await createAccount(email, password);
        
        state.custom.token = await getAuthToken(email, password);
        state.custom.email = email;
        state.custom.password = password;
        state.custom.isLoggedIn = true;
        
        showCustomInboxSection();
        
        updateCustomStatus('Account created successfully!');
        toast.success('Account created!');
        
        state.custom.refreshInterval = setInterval(refreshCustomInbox, 5000);
        await refreshCustomInbox();
        
    } catch (error) {
        toast.error('Error: ' + error.message);
    } finally {
        hideLoading();
    }
});

document.getElementById('login-btn').addEventListener('click', async () => {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        toast.warning('Please fill in all fields');
        return;
    }
    
    showLoading();
    
    try {
        state.custom.token = await getAuthToken(email, password);
        state.custom.email = email;
        state.custom.password = password;
        state.custom.isLoggedIn = true;
        
        showCustomInboxSection();
        
        updateCustomStatus('Logged in successfully!');
        toast.success('Logged in successfully!');
        
        state.custom.refreshInterval = setInterval(refreshCustomInbox, 5000);
        await refreshCustomInbox();
        
    } catch (error) {
        toast.error('Invalid email or password');
    } finally {
        hideLoading();
    }
});

document.getElementById('custom-logout-btn').addEventListener('click', () => {
    if (state.custom.refreshInterval) {
        clearInterval(state.custom.refreshInterval);
    }
    
    state.custom.email = null;
    state.custom.password = null;
    state.custom.token = null;
    state.custom.isLoggedIn = false;
    state.custom.messages = [];
    state.custom.currentMessageId = null;
    
    document.getElementById('custom-auth-section').style.display = 'block';
    document.getElementById('custom-inbox-section').style.display = 'none';
    
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
    
    document.getElementById('custom-inbox').innerHTML = `
        <div class="empty-state">
            <svg class="empty-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" stroke-width="2"/>
                <path d="M22 6L12 13L2 6" stroke="currentColor" stroke-width="2"/>
            </svg>
            <p>No emails yet</p>
            <span>Login to start receiving messages</span>
        </div>
    `;
    
    toast.info('Logged out successfully');
});

const debouncedRefreshCustom = utils.debounce(() => {
    refreshCustomInbox();
}, 300);

document.getElementById('custom-refresh-btn').addEventListener('click', debouncedRefreshCustom);

document.getElementById('custom-copy-btn').addEventListener('click', () => {
    const input = document.getElementById('custom-email');
    input.select();
    document.execCommand('copy');
    
    toast.success('Email copied to clipboard!');
});

document.getElementById('custom-qr-btn').addEventListener('click', () => {
    const email = state.custom.email;
    if (!email) return;
    
    utils.generateQRCode(email, 'qr-code');
    document.getElementById('qr-email-text').textContent = email;
    document.getElementById('qr-modal').style.display = 'flex';
});

document.getElementById('custom-close-viewer').addEventListener('click', () => {
    document.getElementById('custom-viewer').style.display = 'none';
});

document.getElementById('custom-delete-email-btn').addEventListener('click', () => {
    if (state.custom.currentMessageId) {
        deleteEmailPrompt(state.custom.currentMessageId, 'custom');
    }
});

document.getElementById('custom-delete-all-btn').addEventListener('click', () => {
    deleteAllEmails('custom');
});

// Search
document.getElementById('custom-search').addEventListener('input', utils.debounce(() => {
    searchMessages('custom');
}, 300));

function showCustomInboxSection() {
    document.getElementById('custom-auth-section').style.display = 'none';
    document.getElementById('custom-inbox-section').style.display = 'block';
    document.getElementById('custom-email').value = state.custom.email;
}

async function refreshCustomInbox() {
    if (!state.custom.token) return;
    
    try {
        const messages = await getMessages(state.custom.token);
        displayMessages(messages, 'custom-inbox', 'custom');
        updateCustomStatus(`Inbox refreshed - ${messages.length} message(s)`);
    } catch (error) {
        console.error('Error refreshing inbox:', error);
        updateCustomStatus('Error refreshing inbox', true);
    }
}

function updateCustomStatus(message, isError = false) {
    const statusText = document.getElementById('custom-status');
    statusText.textContent = message;
    statusText.parentElement.style.color = isError ? 'var(--accent-danger)' : 'var(--accent-success)';
}

// QR Modal
document.getElementById('qr-close-btn').addEventListener('click', () => {
    document.getElementById('qr-modal').style.display = 'none';
});

document.getElementById('qr-modal').addEventListener('click', (e) => {
    if (e.target.id === 'qr-modal') {
        document.getElementById('qr-modal').style.display = 'none';
    }
});

// Initialize App
async function initializeApp() {
    try {
        const domains = await fetchDomains();
        
        const domainSelect = document.getElementById('signup-domain');
        domainSelect.innerHTML = domains.map(d => `<option value="${d}">${d}</option>`).join('');
        
        // Check for saved burner session
        if (storage.hasBurnerSession()) {
            document.getElementById('burner-resume-btn').style.display = 'flex';
        }
        
        toast.success('App initialized successfully');
        
    } catch (error) {
        console.error('Error initializing app:', error);
        toast.error('Failed to initialize app');
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Escape to close modals/viewers
    if (e.key === 'Escape') {
        document.getElementById('qr-modal').style.display = 'none';
        document.getElementById('burner-viewer').style.display = 'none';
        document.getElementById('custom-viewer').style.display = 'none';
    }
});

// Initialize
initializeApp();
