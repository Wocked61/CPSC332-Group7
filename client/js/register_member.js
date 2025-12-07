document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const firstName = document.getElementById('regFirstName').value.trim();
    const lastName = document.getElementById('regLastName').value.trim();
    const messageDiv = document.getElementById('register-message');

    // Clear previous messages
    messageDiv.textContent = '';
    messageDiv.className = '';

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
            // Show success notification
            showNotification(`Member registered successfully! Member ID: ${data.member_id}`, 'success');

            // Close modal
            closeRegisterMemberModal();

            // Reload members list if on manage members tab
            if (document.getElementById('manage-members-tab').classList.contains('active')) {
                loadMembersList();
            }
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
