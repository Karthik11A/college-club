document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const messageDiv = document.getElementById('message');
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(loginForm);
        const data = {
            rollNumber: formData.get('rollNumber'),
            password: formData.get('password')
        };
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
                messageDiv.textContent = 'Login successful! Redirecting...';
                messageDiv.className = 'message success';
                
                // Redirect based on role
                setTimeout(() => {
                    if (result.user.role === 'ADMIN') {
                        window.location.href = '/admin';
                    } else {
                        window.location.href = '/student';
                    }
                }, 1000);
            } else {
                messageDiv.textContent = result.message;
                messageDiv.className = 'message error';
            }
        } catch (error) {
            messageDiv.textContent = 'An error occurred. Please try again.';
            messageDiv.className = 'message error';
        }
    });
});