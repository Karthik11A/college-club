document.addEventListener('DOMContentLoaded', function() {
    const eventsListDiv = document.getElementById('eventsList');
    const myRegistrationsDiv = document.getElementById('myRegistrations');
    const userInfoSpan = document.getElementById('userInfo');
    const logoutBtn = document.getElementById('logoutBtn');
    
    let events = [];
    let myRegistrations = [];
    
    // Check authentication
    checkAuth();
    
    // Event listeners
    logoutBtn.addEventListener('click', handleLogout);
    
    // Load initial data
    loadEvents();
    loadMyRegistrations();
    
    async function checkAuth() {
        try {
            const response = await fetch('/api/user');
            const data = await response.json();
            
            if (data.user) {
                userInfoSpan.textContent = `Welcome, ${data.user.fullName} (${data.user.rollNumber})`;
            } else {
                window.location.href = '/';
            }
        } catch (error) {
            window.location.href = '/';
        }
    }
    
    async function loadEvents() {
        try {
            const response = await fetch('/api/events');
            events = await response.json();
            displayEvents();
        } catch (error) {
            console.error('Error loading events:', error);
        }
    }
    
    async function loadMyRegistrations() {
        try {
            const response = await fetch('/api/registrations');
            myRegistrations = await response.json();
            displayMyRegistrations();
        } catch (error) {
            console.error('Error loading registrations:', error);
        }
    }
    
    function displayEvents() {
        eventsListDiv.innerHTML = '';
        
        // Filter upcoming events (not past)
        const upcomingEvents = events.filter(event => new Date(event.startDateTime) > new Date());
        
        if (upcomingEvents.length === 0) {
            eventsListDiv.innerHTML = '<div class="empty-state"><h3>No upcoming events</h3><p>Check back later for new events.</p></div>';
            return;
        }
        
        // Sort by start date
        upcomingEvents.sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));
        
        upcomingEvents.forEach(event => {
            const eventDiv = document.createElement('div');
            eventDiv.className = 'event-card';
            
            const startDate = new Date(event.startDateTime).toLocaleString();
            const endDate = new Date(event.endDateTime).toLocaleString();
            const deadline = new Date(event.registrationDeadline).toLocaleString();
            const isDeadlinePassed = new Date() > new Date(event.registrationDeadline);
            
            // Check if already registered
            const existingRegistration = myRegistrations.find(r => r.eventId === event.id);
            
            let actionButton = '';
            if (existingRegistration) {
                actionButton = `<span class="status ${existingRegistration.status}">${existingRegistration.status}</span>`;
            } else if (isDeadlinePassed) {
                actionButton = '<span class="status" style="background: #95a5a6; color: white;">Registration Closed</span>';
            } else {
                actionButton = `<button onclick="registerForEvent('${event.id}')" class="btn-secondary">🎯 Register</button>`;
            }
            
            eventDiv.innerHTML = `
                <div class="event-header">
                    <div>
                        <div class="event-title">${event.title}</div>
                        <div class="event-venue">${event.venue}</div>
                    </div>
                    <div class="event-actions">
                        ${actionButton}
                    </div>
                </div>
                <div class="event-description">${event.description}</div>
                <div class="event-meta">
                    <div class="event-meta-item"><strong>⏰ Start:</strong> ${startDate}</div>
                    <div class="event-meta-item"><strong>⏰ End:</strong> ${endDate}</div>
                    <div class="event-meta-item"><strong>📅 Deadline:</strong> ${deadline}</div>
                    <div class="event-meta-item"><strong>👥 Capacity:</strong> ${event.capacity}</div>
                </div>
            `;
            
            eventsListDiv.appendChild(eventDiv);
        });
    }
    
    function displayMyRegistrations() {
        myRegistrationsDiv.innerHTML = '';
        
        if (myRegistrations.length === 0) {
            myRegistrationsDiv.innerHTML = '<div class="empty-state"><h3>No registrations yet</h3><p>Register for events to see them here.</p></div>';
            return;
        }
        
        myRegistrations.forEach(registration => {
            const event = events.find(e => e.id === registration.eventId);
            if (!event) return;
            
            const registrationDiv = document.createElement('div');
            registrationDiv.className = 'registration-item';
            
            const registeredDate = new Date(registration.registeredAt).toLocaleString();
            
            registrationDiv.innerHTML = `
                <div class="registration-header">
                    <div>
                        <strong>${event.title}</strong>
                        <div style="font-size: 14px; color: #666;">${event.venue}</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span class="status ${registration.status}">${registration.status}</span>
                        ${registration.status !== 'cancelled' ? `<button onclick="cancelRegistration('${registration.id}')" class="btn-danger">❌ Cancel</button>` : ''}
                    </div>
                </div>
                <div style="font-size: 14px; color: #666;">
                    Registered on: ${registeredDate}
                </div>
            `;
            
            myRegistrationsDiv.appendChild(registrationDiv);
        });
    }
    
    window.registerForEvent = async function(eventId) {
        try {
            const response = await fetch('/api/registrations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ eventId })
            });
            
            const result = await response.json();
            
            if (result.success) {
                await loadMyRegistrations();
                displayEvents(); // Refresh to update button states
                
                if (result.registration.status === 'waitlisted') {
                    alert('You have been added to the waitlist for this event.');
                } else {
                    alert('Successfully registered for the event!');
                }
            } else {
                alert('Error: ' + result.error);
            }
        } catch (error) {
            alert('An error occurred. Please try again.');
        }
    };
    
    window.cancelRegistration = async function(registrationId) {
        if (!confirm('Are you sure you want to cancel this registration?')) return;
        
        try {
            const response = await fetch(`/api/registrations/${registrationId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                await loadMyRegistrations();
                displayEvents(); // Refresh to update button states
                alert('Registration cancelled successfully.');
            } else {
                alert('Error cancelling registration.');
            }
        } catch (error) {
            alert('An error occurred. Please try again.');
        }
    };
    
    async function handleLogout() {
        try {
            await fetch('/api/logout', { method: 'POST' });
            window.location.href = '/';
        } catch (error) {
            window.location.href = '/';
        }
    }
});