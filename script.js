const API_BASE = 'https://api.mail.tm';

const state = {
    burner: {
        email: null,
        password: null,
        token: null,
        refreshInterval: null,
        timerInterval: null,
        createdTime: null
    },
    custom: {
        email: null,
        password: null,
        token: null,
        refreshInterval: null,
        isLoggedIn: false
    },
    availableDomains: []
};

const loadingOverlay = document.getElementById('loading-overlay');

function showLoading() {
    loadingOverlay.style.display = 'flex';
}

function hideLoading() {
    loadingOverlay.style.display = 'none';
}

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


function generateRandomString(length = 10) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function displayMessages(messages, containerId, viewerCallback) {
    const container = document.getElementById(containerId);
    
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
        const senderName = message.from?.name || senderEmail;
        
        messageItem.innerHTML = `
            <div class="message-from">From: ${escapeHtml(senderEmail)}</div>
            <div class="message-subject">${escapeHtml(message.subject || 'No Subject')}</div>
            <div class="message-date">${dateStr} ${timeStr}</div>
        `;
        
        messageItem.addEventListener('click', () => viewerCallback(message.id));
        
        container.appendChild(messageItem);
    });
}

const navItems = document.querySelectorAll('.nav-item');
navItems.forEach(item => {
    item.addEventListener('click', () => {
        const pageName = item.dataset.page;
        
        navItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(`${pageName}-page`).classList.add('active');
        
        const sidebar = document.querySelector('.sidebar');
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('mobile-active');
        }
    });
});

const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
const sidebar = document.querySelector('.sidebar');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-active');
    });
}

document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && 
        !sidebar.contains(e.target) && 
        !mobileMenuToggle.contains(e.target) &&
        sidebar.classList.contains('mobile-active')) {
        sidebar.classList.remove('mobile-active');
    }
});

document.getElementById('burner-generate-btn').addEventListener('click', async () => {
    showLoading();
    updateBurnerStatus('Generating new email address...');
    
    try {
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
        const username = generateRandomString(12);
        state.burner.email = `${username}@${domain}`;
        state.burner.password = generateRandomString(16);
        
        await createAccount(state.burner.email, state.burner.password);
        
        state.burner.token = await getAuthToken(state.burner.email, state.burner.password);
        
        document.getElementById('burner-email').value = state.burner.email;
        document.getElementById('burner-copy-btn').disabled = false;
        document.getElementById('burner-refresh-btn').disabled = false;
        
        state.burner.createdTime = Date.now();
        updateBurnerTimer();
        state.burner.timerInterval = setInterval(updateBurnerTimer, 1000);
        
        updateBurnerStatus('Email generated successfully!');
        
        state.burner.refreshInterval = setInterval(refreshBurnerInbox, 5000);
        
        await refreshBurnerInbox();
        
    } catch (error) {
        updateBurnerStatus('Error: ' + error.message, true);
    } finally {
        hideLoading();
    }
});

document.getElementById('burner-refresh-btn').addEventListener('click', refreshBurnerInbox);

document.getElementById('burner-copy-btn').addEventListener('click', () => {
    const input = document.getElementById('burner-email');
    input.select();
    document.execCommand('copy');
    
    const btn = document.getElementById('burner-copy-btn');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<span>Copied!</span>';
    btn.style.background = 'var(--accent-success)';
    
    setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.style.background = '';
    }, 2000);
});

document.getElementById('burner-close-viewer').addEventListener('click', () => {
    document.getElementById('burner-viewer').style.display = 'none';
});

async function refreshBurnerInbox() {
    if (!state.burner.token) return;
    
    try {
        const messages = await getMessages(state.burner.token);
        displayMessages(messages, 'burner-inbox', viewBurnerEmail);
        updateBurnerStatus(`Inbox refreshed - ${messages.length} message(s)`);
    } catch (error) {
        console.error('Error refreshing inbox:', error);
        updateBurnerStatus('Error refreshing inbox', true);
    }
}

async function viewBurnerEmail(messageId) {
    showLoading();
    
    try {
        const message = await getMessage(messageId, state.burner.token);
        
        document.getElementById('burner-email-from').textContent = message.from.address;
        document.getElementById('burner-email-subject').textContent = message.subject;
        document.getElementById('burner-email-date').textContent = new Date(message.createdAt).toLocaleString();
        
        const content = message.text || message.html || 'No content available';
        document.getElementById('burner-email-content').textContent = content;
        
        document.getElementById('burner-viewer').style.display = 'block';
        document.getElementById('burner-viewer').scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        updateBurnerStatus('Error loading email', true);
    } finally {
        hideLoading();
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
        updateCustomStatus('Please fill in all fields', true);
        return;
    }
    
    if (username.length < 3) {
        updateCustomStatus('Username must be at least 3 characters', true);
        return;
    }
    
    if (password.length < 6) {
        updateCustomStatus('Password must be at least 6 characters', true);
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
        
        state.custom.refreshInterval = setInterval(refreshCustomInbox, 5000);
        await refreshCustomInbox();
        
    } catch (error) {
        updateCustomStatus('Error: ' + error.message, true);
    } finally {
        hideLoading();
    }
});

document.getElementById('login-btn').addEventListener('click', async () => {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        updateCustomStatus('Please fill in all fields', true);
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
        
        state.custom.refreshInterval = setInterval(refreshCustomInbox, 5000);
        await refreshCustomInbox();
        
    } catch (error) {
        updateCustomStatus('Invalid email or password', true);
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
});

document.getElementById('custom-refresh-btn').addEventListener('click', refreshCustomInbox);

document.getElementById('custom-copy-btn').addEventListener('click', () => {
    const input = document.getElementById('custom-email');
    input.select();
    document.execCommand('copy');
    
    const btn = document.getElementById('custom-copy-btn');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<span>Copied!</span>';
    btn.style.background = 'var(--accent-success)';
    
    setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.style.background = '';
    }, 2000);
});

document.getElementById('custom-close-viewer').addEventListener('click', () => {
    document.getElementById('custom-viewer').style.display = 'none';
});

function showCustomInboxSection() {
    document.getElementById('custom-auth-section').style.display = 'none';
    document.getElementById('custom-inbox-section').style.display = 'block';
    document.getElementById('custom-email').value = state.custom.email;
}

async function refreshCustomInbox() {
    if (!state.custom.token) return;
    
    try {
        const messages = await getMessages(state.custom.token);
        displayMessages(messages, 'custom-inbox', viewCustomEmail);
        updateCustomStatus(`Inbox refreshed - ${messages.length} message(s)`);
    } catch (error) {
        console.error('Error refreshing inbox:', error);
        updateCustomStatus('Error refreshing inbox', true);
    }
}

async function viewCustomEmail(messageId) {
    showLoading();
    
    try {
        const message = await getMessage(messageId, state.custom.token);
        
        document.getElementById('custom-email-from').textContent = message.from.address;
        document.getElementById('custom-email-subject').textContent = message.subject;
        document.getElementById('custom-email-date').textContent = new Date(message.createdAt).toLocaleString();
        
        const content = message.text || message.html || 'No content available';
        document.getElementById('custom-email-content').textContent = content;
        
        document.getElementById('custom-viewer').style.display = 'block';
        document.getElementById('custom-viewer').scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        updateCustomStatus('Error loading email', true);
    } finally {
        hideLoading();
    }
}

function updateCustomStatus(message, isError = false) {
    const statusText = document.getElementById('custom-status');
    statusText.textContent = message;
    statusText.parentElement.style.color = isError ? 'var(--accent-danger)' : 'var(--accent-success)';
}

async function initializeApp() {
    try {
        const domains = await fetchDomains();
        
        const domainSelect = document.getElementById('signup-domain');
        domainSelect.innerHTML = domains.map(d => `<option value="${d}">${d}</option>`).join('');
        
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}


initializeApp();
