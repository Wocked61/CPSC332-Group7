async function handleRegisterMemberSubmit(e) {
    if (e) {
        e.preventDefault();
    }

    const firstNameInput = document.getElementById('regFirstName');
    const lastNameInput = document.getElementById('regLastName');
    const messageDiv = document.getElementById('register-message');

    if (!firstNameInput || !lastNameInput || !messageDiv) {
        return;
    }

    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();

    messageDiv.textContent = '';
    messageDiv.className = '';

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
            showNotification(`Member registered successfully! Member ID: ${data.member_id}`, 'success');
            closeRegisterMemberModal();

            const manageMembersTab = document.getElementById('manage-members-tab');
            if (manageMembersTab?.classList.contains('active')) {
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
}

function initializeRegisterMemberForm() {
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegisterMemberSubmit);
    }

    const registerButton = document.getElementById('registerMemberBtn');
    if (registerButton) {
        registerButton.addEventListener('click', handleRegisterMemberSubmit);
    }
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', initializeRegisterMemberForm);
