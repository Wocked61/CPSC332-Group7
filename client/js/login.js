document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const employeeId = document.getElementById('employee_id').value;
    const errorMsg = document.getElementById('error-message');
    
    try {
        const response = await fetch('../server/login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ employee_id: employeeId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            window.location.href = 'dashboard.php';
        } else {
            errorMsg.textContent = data.message || 'Invalid Employee ID';
            errorMsg.className = 'error show';
        }
    } catch (error) {
        errorMsg.textContent = 'An error occurred. Please try again.';
        errorMsg.className = 'error show';
    }
});