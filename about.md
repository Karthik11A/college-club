# College Club Event Management System

## Overview
A lightweight web-based system for managing college club events with Admin and Student roles. Built using HTML, CSS, JavaScript frontend with Node.js/Express backend and JSON file storage.

## Project Status
- **Current State**: Core functionality implemented and running
- **Last Updated**: September 22, 2025
- **Server Status**: Running on port 5000

## Recent Changes
- **September 22, 2025**: 
  - Implemented complete backend server with Express
  - Created authentication system with roll number and department code validation
  - Built admin dashboard for event management (create, edit, delete)
  - Developed student board for event viewing and registration
  - Implemented registration system with capacity limits and waitlisting
  - Set up JSON file-based data storage
  - Configured and started application workflow

## Core Features Implemented
### Authentication
- Sign-up with Roll/Register Number, Full Name, Email (optional), Password, Role (Admin/Student), Department Code
- Department code validation (ADMIN123 for Admin, STUDENT123 for Student)
- Session-based authentication
- Role-based access control

### Admin Dashboard
- Create new events with title, description, start/end times, venue, registration deadline, capacity
- Edit and delete existing events
- View event participants (registered and waitlisted)
- Participant management interface

### Student Event Board
- View upcoming events sorted by date
- Register for events with automatic capacity checking
- Waitlist functionality when events are full
- View personal registration status
- Cancel registrations

### Business Rules
- Registration deadline enforcement
- Capacity limits with automatic waitlisting
- Prevention of duplicate registrations
- Registration status tracking (registered/waitlisted/cancelled)

## Technical Architecture
### Backend (Node.js/Express)
- **Server**: `server.js` - Main Express application
- **Authentication**: Session-based with role validation
- **API Routes**: RESTful endpoints for users, events, and registrations
- **Data Storage**: JSON files in `data/` directory

### Frontend
- **HTML Pages**: Login, signup, admin dashboard, student board
- **Styling**: `public/styles.css` - Responsive CSS design
- **JavaScript**: Page-specific JS files for dynamic functionality
- **No External Frameworks**: Pure HTML/CSS/JS as requested

### Data Models
- **Users**: Roll number, full name, email, password, role
- **Events**: Title, description, dates, venue, capacity, deadline
- **Registrations**: User-event relationships with status tracking

## File Structure
```
/
├── server.js              # Main backend server
├── package.json           # Node.js dependencies
├── public/                # Frontend files
│   ├── login.html         # Login page
│   ├── signup.html        # Registration page
│   ├── admin.html         # Admin dashboard
│   ├── student.html       # Student board
│   ├── styles.css         # Global styles
│   ├── login.js           # Login functionality
│   ├── signup.js          # Signup functionality
│   ├── admin.js           # Admin dashboard logic
│   └── student.js         # Student board logic
└── data/                  # JSON data storage
    ├── users.json         # User accounts
    ├── events.json        # Event data
    └── registrations.json # Registration records
```

## Environment Configuration
- **Node.js**: Version 20
- **Dependencies**: express, body-parser, express-session
- **Port**: 5000 (required for Replit)
- **Session Secret**: Uses environment variable SESSION_SECRET

## User Preferences
- Minimal UI with plain HTML/CSS/JS
- No external frameworks or libraries
- Lightweight and fast-loading pages
- Clean, professional design
- JSON-based data storage for simplicity

## Department Codes
- Admin: ADMIN123
- Student: STUDENT123

## Security Notes
- Passwords currently stored in plaintext (development version)
- Session-based authentication
- Role-based access controls
- Department code validation for registration