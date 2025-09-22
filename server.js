const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 5000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Serve static files
app.use(express.static('public'));

// Department codes for validation
const DEPT_CODES = {
    ADMIN: 'ADMIN123',
    STUDENT: 'STUDENT123'
};

// Data file paths
const DATA_DIR = 'data';
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');
const REGISTRATIONS_FILE = path.join(DATA_DIR, 'registrations.json');

// Initialize data files
async function initializeDataFiles() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        
        // Initialize users.json
        try {
            await fs.access(USERS_FILE);
        } catch {
            await fs.writeFile(USERS_FILE, JSON.stringify([]));
        }
        
        // Initialize events.json
        try {
            await fs.access(EVENTS_FILE);
        } catch {
            await fs.writeFile(EVENTS_FILE, JSON.stringify([]));
        }
        
        // Initialize registrations.json
        try {
            await fs.access(REGISTRATIONS_FILE);
        } catch {
            await fs.writeFile(REGISTRATIONS_FILE, JSON.stringify([]));
        }
    } catch (error) {
        console.error('Error initializing data files:', error);
    }
}

// Helper functions for data operations
async function readJsonFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return [];
    }
}

async function writeJsonFile(filePath, data) {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error(`Error writing ${filePath}:`, error);
    }
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.get('/admin', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ADMIN') {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/student', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'STUDENT') {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, 'public', 'student.html'));
});

// API Routes
app.post('/api/signup', async (req, res) => {
    const { rollNumber, fullName, email, password, role, deptCode } = req.body;
    
    // Validate department code
    if (DEPT_CODES[role] !== deptCode) {
        return res.status(400).json({ success: false, message: 'Invalid department code' });
    }
    
    // Check if user already exists
    const users = await readJsonFile(USERS_FILE);
    if (users.find(user => user.rollNumber === rollNumber)) {
        return res.status(400).json({ success: false, message: 'User already exists' });
    }
    
    // Create new user
    const newUser = {
        rollNumber,
        fullName,
        email: email || '',
        password, // In production, this should be hashed
        role
    };
    
    users.push(newUser);
    await writeJsonFile(USERS_FILE, users);
    
    res.json({ success: true, message: 'User created successfully' });
});

app.post('/api/login', async (req, res) => {
    const { rollNumber, password } = req.body;
    
    const users = await readJsonFile(USERS_FILE);
    const user = users.find(u => u.rollNumber === rollNumber && u.password === password);
    
    if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    req.session.user = user;
    res.json({ 
        success: true, 
        user: { rollNumber: user.rollNumber, fullName: user.fullName, role: user.role }
    });
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.get('/api/user', (req, res) => {
    if (req.session.user) {
        res.json({ user: req.session.user });
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

// Events API
app.get('/api/events', async (req, res) => {
    const events = await readJsonFile(EVENTS_FILE);
    res.json(events);
});

app.post('/api/events', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const events = await readJsonFile(EVENTS_FILE);
    const newEvent = {
        id: Date.now().toString(),
        ...req.body,
        createdAt: new Date().toISOString()
    };
    
    events.push(newEvent);
    await writeJsonFile(EVENTS_FILE, events);
    
    res.json({ success: true, event: newEvent });
});

app.put('/api/events/:id', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const events = await readJsonFile(EVENTS_FILE);
    const eventIndex = events.findIndex(e => e.id === req.params.id);
    
    if (eventIndex === -1) {
        return res.status(404).json({ error: 'Event not found' });
    }
    
    events[eventIndex] = { ...events[eventIndex], ...req.body };
    await writeJsonFile(EVENTS_FILE, events);
    
    res.json({ success: true, event: events[eventIndex] });
});

app.delete('/api/events/:id', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const events = await readJsonFile(EVENTS_FILE);
    const filteredEvents = events.filter(e => e.id !== req.params.id);
    
    await writeJsonFile(EVENTS_FILE, filteredEvents);
    
    res.json({ success: true });
});

// Registrations API
app.get('/api/registrations', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const registrations = await readJsonFile(REGISTRATIONS_FILE);
    
    if (req.session.user.role === 'ADMIN') {
        res.json(registrations);
    } else {
        const userRegistrations = registrations.filter(r => r.rollNumber === req.session.user.rollNumber);
        res.json(userRegistrations);
    }
});

app.post('/api/registrations', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'STUDENT') {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const { eventId } = req.body;
    const events = await readJsonFile(EVENTS_FILE);
    const registrations = await readJsonFile(REGISTRATIONS_FILE);
    
    const event = events.find(e => e.id === eventId);
    if (!event) {
        return res.status(404).json({ error: 'Event not found' });
    }
    
    // Check registration deadline
    if (new Date() > new Date(event.registrationDeadline)) {
        return res.status(400).json({ error: 'Registration deadline has passed' });
    }
    
    // Check if already registered
    const existingRegistration = registrations.find(r => 
        r.eventId === eventId && r.rollNumber === req.session.user.rollNumber
    );
    
    if (existingRegistration) {
        return res.status(400).json({ error: 'Already registered for this event' });
    }
    
    // Check capacity
    const eventRegistrations = registrations.filter(r => 
        r.eventId === eventId && r.status === 'registered'
    );
    
    const status = eventRegistrations.length < event.capacity ? 'registered' : 'waitlisted';
    
    const newRegistration = {
        id: Date.now().toString(),
        eventId,
        rollNumber: req.session.user.rollNumber,
        fullName: req.session.user.fullName,
        status,
        registeredAt: new Date().toISOString()
    };
    
    registrations.push(newRegistration);
    await writeJsonFile(REGISTRATIONS_FILE, registrations);
    
    res.json({ success: true, registration: newRegistration });
});

app.delete('/api/registrations/:id', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const registrations = await readJsonFile(REGISTRATIONS_FILE);
    const registration = registrations.find(r => r.id === req.params.id);
    
    if (!registration) {
        return res.status(404).json({ error: 'Registration not found' });
    }
    
    // Students can only cancel their own registrations
    if (req.session.user.role === 'STUDENT' && registration.rollNumber !== req.session.user.rollNumber) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const filteredRegistrations = registrations.filter(r => r.id !== req.params.id);
    await writeJsonFile(REGISTRATIONS_FILE, filteredRegistrations);
    
    res.json({ success: true });
});

// Initialize and start server
initializeDataFiles().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`College Club Event Management System running on port ${PORT}`);
    });
});