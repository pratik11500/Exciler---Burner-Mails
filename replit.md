# Burner Mail - Professional Temporary Email Service

## Overview
A premium dark-themed temporary email service with dual modes: Quick Burner (instant random emails) and Custom Account (login/signup with custom username). Built with pure HTML, CSS, and vanilla JavaScript using the Mail.tm API.

**⚠️ Important**: This is a **receive-only** email service. Mail.tm API does not support sending outgoing emails - only receiving and viewing incoming messages.

**Current State**: Fully functional receive-only service with left sidebar navigation, two modes, advanced modern UI with glassmorphism effects, and complete responsive design
**Created**: October 30, 2025
**Last Updated**: October 30, 2025

## Features

### Quick Burner Email
- Generate instant random temporary email addresses
- No registration required
- Real-time inbox with 5-second auto-refresh
- View individual email details
- Copy email to clipboard
- Activity timer showing email lifetime
- Auto-deletion warning

### Custom Email Account
- Create custom email with chosen username
- Set your own password
- Login to existing accounts
- Session persistence until logout
- Same inbox functionality as burner emails
- Account management (logout)

### UI/UX Features
- **Left Sidebar Navigation**: Fixed sidebar with vertical navigation
- **Glassmorphism Design**: Modern translucent glass-like cards with backdrop blur
- **Advanced Gradients**: Purple/blue/pink gradient color palette
- **Smooth Animations**: Floating logo, glow effects, hover transitions
- **SVG Icons**: Custom inline SVG icons throughout
- **Mobile Responsive**: Hamburger menu for mobile devices
- **Loading Overlays**: Professional loading states
- **Status Indicators**: Real-time color-coded feedback

## Technology Stack
- **Frontend**: Pure HTML5, CSS3, Vanilla JavaScript (ES6+)
- **API**: Mail.tm (free temporary email API)
- **Icons**: Inline SVG (mail, lock, user, clock, etc.)
- **Server**: Python's built-in HTTP server on port 5000
- **No frameworks, libraries, or build tools required**

## Project Structure
```
/
├── index.html      # Main HTML with left sidebar and dual-page structure
├── styles.css      # Advanced glassmorphism design with animations
├── script.js       # Complete app logic with mobile menu support
├── svg.svg         # Custom brand logo
├── .gitignore      # Python gitignore
└── replit.md       # Project documentation
```

## API Integration
Uses Mail.tm API endpoints (receive-only service):
- `GET /domains` - Fetch available email domains
- `POST /accounts` - Create temporary email account
- `POST /token` - Get authentication token
- `GET /messages` - Retrieve inbox messages
- `GET /messages/{id}` - Get individual message content

**Note**: Mail.tm does NOT provide endpoints for sending emails. This is a receive-only service designed for testing and temporary email receiving purposes.

## Recent Changes

### October 30, 2025 - Compose Feature Removal
- **Removed Compose Functionality**: Removed all email compose/send features
  - Deleted compose buttons from both Quick Burner and Custom Account modes
  - Removed compose modal and related JavaScript code
  - Removed sendEmail() function
  - **Reason**: Mail.tm API is receive-only and does not support sending emails
  - Attempting to send resulted in HTML error responses from API
  - Updated documentation to clarify receive-only limitation

### October 30, 2025 - Complete UI/UX Redesign
- **Left Sidebar Navigation**:
  - Fixed sidebar positioned on the left
  - Vertical navigation with icon + description layout
  - Brand logo with floating animation
  - Footer with decorative animated bar
  - Mobile hamburger menu with smooth transitions
  
- **Glassmorphism Design System**:
  - Translucent glass cards with backdrop blur effects
  - Modern purple/blue/pink gradient palette
  - Subtle border glows and shadow effects
  - Advanced CSS techniques for depth and hierarchy
  
- **Enhanced Visual Effects**:
  - Floating logo animation (3s ease-in-out)
  - Glow effects on active navigation items
  - Smooth hover transitions with transform effects
  - Gradient color animations and pulses
  - Custom scrollbar with gradient thumb
  
- **Improved Layout**:
  - Better spacing and visual hierarchy
  - Page headers with icon wrappers and glow effects
  - Benefit items with checkmark icons
  - Enhanced card designs with glass borders
  - Professional typography and letter spacing
  
- **Mobile Responsiveness**:
  - Breakpoints at 768px and 480px
  - Collapsing sidebar to full-screen overlay
  - Mobile menu toggle with backdrop tap-to-close
  - Responsive grid layouts and flexible buttons

### October 30, 2025 - Logo Update
- **Custom SVG Logo**: Integrated svg.svg as brand icon
  - Used as navbar logo
  - Set as page favicon
  - Optimized for all screen sizes

### October 30, 2025 - Major Redesign
- **Navigation System**: Added sticky navigation bar with page switching
- **Dual Mode Structure**:
  - Quick Burner: Instant random email generation
  - Custom Account: Login/signup with username and password
- **Modern Classic Design**:
  - Gradient backgrounds and card-based layout
  - Advanced CSS with smooth transitions
  - Professional color scheme (dark grays with orange accents)
  - Better typography and spacing
- **SVG Icons**: Replaced all emojis with inline SVG icons
  - Mail, lock, user, clock, activity icons
  - Consistent styling across all icons
- **Enhanced JavaScript**:
  - State management for both modes
  - Separate refresh intervals for burner and custom
  - Auth tab switching (login/signup)
  - Domain selection for custom accounts
- **Improved UX**:
  - Better status messages
  - Loading overlays
  - Error handling
  - Copy-to-clipboard feedback
  - Timer interval leak fix (from previous version)

### Initial Version - October 30, 2025
- Basic burner email functionality
- Simple dark theme
- Mail.tm API integration

## Design Elements
- **Color Palette**:
  - Primary Background: #0a0e27 (deep navy)
  - Secondary Background: #151a3d, #1e2749
  - Sidebar: rgba(10, 14, 39, 0.95) with blur
  - Glass Cards: rgba(30, 39, 73, 0.4) with backdrop-filter
  - Text: #ffffff (primary), #b8c5d6 (secondary), #7a8699 (muted)
  - Accents: 
    - Primary: #6366f1 (indigo)
    - Secondary: #8b5cf6 (purple)
    - Tertiary: #ec4899 (pink)
    - Success: #10b981 (emerald)
    - Warning: #f59e0b (amber)
    - Danger: #ef4444 (red)
- **Typography**: Inter, Segoe UI, system fonts (sans-serif)
- **Monospace**: Courier New (for email addresses)
- **Layout**: Fixed sidebar + main content area with glassmorphism cards
- **Effects**: 
  - Glassmorphism with backdrop-filter blur(20px)
  - Radial gradient overlays for ambient lighting
  - Floating animations (translateY)
  - Glow effects with drop-shadow filters
  - Smooth cubic-bezier transitions
  - Custom gradient scrollbars

## User Guide

### Quick Burner Mode
1. Click "Quick Burner" in navigation
2. Click "Generate Email" button
3. Email address is created instantly
4. Copy email using the copy button
5. Inbox auto-refreshes every 5 seconds
6. Click any email to view full content

### Custom Account Mode
1. Click "Custom Account" in navigation
2. **To Create Account**:
   - Switch to "Create Account" tab
   - Enter desired username (min 3 characters)
   - Select domain from dropdown
   - Enter password (min 6 characters)
   - Click "Create Account"
3. **To Login**:
   - Enter full email address
   - Enter password
   - Click "Login"
4. Inbox works same as burner mode
5. Click "Logout" to sign out

## Security & Privacy
- All emails are temporary and auto-deleted by Mail.tm
- Passwords are sent securely via HTTPS to Mail.tm API
- No data is stored locally or on our server
- Each session is independent
- **Receive-only service**: You can only receive emails, not send them
- Do not use for important communications

## User Preferences
None specified yet.

## Technical Notes
- State management using JavaScript object for both modes
- Interval cleanup to prevent memory leaks
- Token-based authentication with Mail.tm
- Error handling for all API calls
- Responsive breakpoints at 1024px and 768px
