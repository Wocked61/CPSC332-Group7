document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const firstName = document.getElementById('regFirstName').value.trim();
    const lastName = document.getElementById('regLastName').value.trim();
    const messageDiv = document.getElementById('register-message');
    const successDiv = document.getElementById('registerSuccess');

    // Clear previous messages
    messageDiv.textContent = '';
    messageDiv.className = '';
    successDiv.innerHTML = '';

    // Validation
    if (!firstName || !lastName) {
        messageDiv.textContent = 'Please enter both first and last name';
        messageDiv.className = 'error';
        return;
    }

    try {
        const response = await fetch('../server/register_member.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                first_name: firstName,
                last_name: lastName
            })
        });

        const data = await response.json();

        if (data.success) {
            messageDiv.textContent = data.message;
            messageDiv.className = 'success';

            successDiv.innerHTML = `
                <h4>Member Successfully Registered!</h4>
                <p><strong>Member ID:</strong> ${data.member_id}</p>
                <p><strong>Name:</strong> ${data.first_name} ${data.last_name}</p>
            `;
            successDiv.style.display = 'block';

            // Clear form
            document.getElementById('registerForm').reset();

            // Auto-clear success message after 5 seconds
            setTimeout(() => {
                messageDiv.textContent = '';
                messageDiv.className = '';
                successDiv.innerHTML = '';
                successDiv.style.display = 'none';
                document.getElementById('regFirstName').focus();
            }, 5000);
        } else {
            messageDiv.textContent = data.message || 'Failed to register member';
            messageDiv.className = 'error';
        }
    } catch (error) {
        messageDiv.textContent = 'An error occurred. Please try again.';
        messageDiv.className = 'error';
        console.error('Error:', error);
    }
});
