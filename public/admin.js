document.addEventListener('DOMContentLoaded', function() {
    const eventForm = document.getElementById('eventForm');
    const eventsListDiv = document.getElementById('eventsList');
    const eventSelect = document.getElementById('eventSelect');
    const participantsListDiv = document.getElementById('participantsList');
    const userInfoSpan = document.getElementById('userInfo');
    const logoutBtn = document.getElementById('logoutBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    let currentEditingEventId = null;
    let events = [];
    let registrations = [];
    
    // Check authentication
    checkAuth();
    
    // Event listeners
    eventForm.addEventListener('submit', handleEventSubmit);
    logoutBtn.addEventListener('click', handleLogout);
    eventSelect.addEventListener('change', handleEventSelectChange);
    
    // Load initial data
    loadEvents();
    loadRegistrations();
    
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
    
    async function handleEventSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(eventForm);
        const data = {
            title: formData.get('title'),
            description: formData.get('description'),
            startDateTime: formData.get('startDateTime'),
            endDateTime: formData.get('endDateTime'),
            venue: formData.get('venue'),
            registrationDeadline: formData.get('registrationDeadline'),
            capacity: parseInt(formData.get('capacity'))
        };
        
        try {
            const url = currentEditingEventId ? `/api/events/${currentEditingEventId}` : '/api/events';
            const method = currentEditingEventId ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
                eventForm.reset();
                currentEditingEventId = null;
                submitBtn.textContent = 'Create Event';
                loadEvents();
                updateEventSelect();
            } else {
                alert('Error: ' + (result.error || 'Failed to save event'));
            }
        } catch (error) {
            alert('An error occurred. Please try again.');
        }
    }
    
    async function loadEvents() {
        try {
            const response = await fetch('/api/events');
            events = await response.json();
            displayEvents();
            updateEventSelect();
        } catch (error) {
            console.error('Error loading events:', error);
        }
    }
    
    async function loadRegistrations() {
        try {
            const response = await fetch('/api/registrations');
            registrations = await response.json();
        } catch (error) {
            console.error('Error loading registrations:', error);
        }
    }
    
    function displayEvents() {
        eventsListDiv.innerHTML = '';
        
        if (events.length === 0) {
            eventsListDiv.innerHTML = '<div class="empty-state"><h3>No events created yet</h3><p>Create your first event using the form above.</p></div>';
            return;
        }
        
        events.forEach(event => {
            const eventDiv = document.createElement('div');
            eventDiv.className = 'event-card';
            
            const startDate = new Date(event.startDateTime).toLocaleString();
            const endDate = new Date(event.endDateTime).toLocaleString();
            const deadline = new Date(event.registrationDeadline).toLocaleString();
            
            eventDiv.innerHTML = `
                <div class="event-header">
                    <div>
                        <div class="event-title">${event.title}</div>
                        <div class="event-venue">${event.venue}</div>
                    </div>
                    <div class="event-actions">
                        <button onclick="editEvent('${event.id}')" class="btn-secondary">✏️ Edit</button>
                        <button onclick="deleteEvent('${event.id}')" class="btn-danger">🗑️ Delete</button>
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
    
    function updateEventSelect() {
        eventSelect.innerHTML = '<option value="">Select an event to view participants</option>';
        
        events.forEach(event => {
            const option = document.createElement('option');
            option.value = event.id;
            option.textContent = event.title;
            eventSelect.appendChild(option);
        });
    }
    
    window.editEvent = function(eventId) {
        const event = events.find(e => e.id === eventId);
        if (!event) return;
        
        document.getElementById('title').value = event.title;
        document.getElementById('description').value = event.description;
        document.getElementById('startDateTime').value = event.startDateTime;
        document.getElementById('endDateTime').value = event.endDateTime;
        document.getElementById('venue').value = event.venue;
        document.getElementById('registrationDeadline').value = event.registrationDeadline;
        document.getElementById('capacity').value = event.capacity;
        
        currentEditingEventId = eventId;
        submitBtn.textContent = 'Update Event';
        
        // Scroll to form
        eventForm.scrollIntoView({ behavior: 'smooth' });
    };
    
    window.deleteEvent = async function(eventId) {
        if (!confirm('Are you sure you want to delete this event?')) return;
        
        try {
            const response = await fetch(`/api/events/${eventId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                loadEvents();
                updateEventSelect();
                participantsListDiv.innerHTML = '';
            } else {
                alert('Error deleting event');
            }
        } catch (error) {
            alert('An error occurred. Please try again.');
        }
    };
    
    function handleEventSelectChange() {
        const selectedEventId = eventSelect.value;
        if (!selectedEventId) {
            participantsListDiv.innerHTML = '';
            return;
        }
        
        displayParticipants(selectedEventId);
    }
    
    function displayParticipants(eventId) {
        const eventRegistrations = registrations.filter(r => r.eventId === eventId);
        
        participantsListDiv.innerHTML = '';
        
        if (eventRegistrations.length === 0) {
            participantsListDiv.innerHTML = '<div class="empty-state"><h3>No participants yet</h3><p>No one has registered for this event.</p></div>';
            return;
        }
        
        const registered = eventRegistrations.filter(r => r.status === 'registered');
        const waitlisted = eventRegistrations.filter(r => r.status === 'waitlisted');
        
        if (registered.length > 0) {
            const registeredDiv = document.createElement('div');
            registeredDiv.innerHTML = '<h3>Registered Participants</h3>';
            
            registered.forEach(reg => {
                const participantDiv = document.createElement('div');
                participantDiv.className = 'participant-item';
                participantDiv.innerHTML = `
                    <div class="participant-info">${reg.fullName} (${reg.rollNumber})</div>
                    <div class="status registered">Registered</div>
                `;
                registeredDiv.appendChild(participantDiv);
            });
            
            participantsListDiv.appendChild(registeredDiv);
        }
        
        if (waitlisted.length > 0) {
            const waitlistedDiv = document.createElement('div');
            waitlistedDiv.innerHTML = '<h3>Waitlisted Participants</h3>';
            
            waitlisted.forEach(reg => {
                const participantDiv = document.createElement('div');
                participantDiv.className = 'participant-item';
                participantDiv.innerHTML = `
                    <div class="participant-info">${reg.fullName} (${reg.rollNumber})</div>
                    <div class="status waitlisted">Waitlisted</div>
                `;
                waitlistedDiv.appendChild(participantDiv);
            });
            
            participantsListDiv.appendChild(waitlistedDiv);
        }
    }
    
    async function handleLogout() {
        try {
            await fetch('/api/logout', { method: 'POST' });
            window.location.href = '/';
        } catch (error) {
            window.location.href = '/';
        }
    }
});