document.addEventListener('DOMContentLoaded', function() {
    const signupForm = document.getElementById('signupForm');
    const messageDiv = document.getElementById('message');
    
    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(signupForm);
        const data = {
            rollNumber: formData.get('rollNumber'),
            fullName: formData.get('fullName'),
            email: formData.get('email'),
            password: formData.get('password'),
            role: formData.get('role'),
            deptCode: formData.get('deptCode')
        };
        
        try {
            const response = await fetch('/api/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
                messageDiv.textContent = 'Account created successfully! You can now login.';
                messageDiv.className = 'message success';
                signupForm.reset();
                
                // Redirect to login after 2 seconds
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
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