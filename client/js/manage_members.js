// Manage Members functionality

// Register Member Modal
function openRegisterMemberModal() {
    document.getElementById('registerMemberModal').style.display = 'block';
    document.getElementById('registerForm').reset();
    document.getElementById('register-message').innerHTML = '';
    setTimeout(() => document.getElementById('regFirstName').focus(), 100);
}

function closeRegisterMemberModal() {
    document.getElementById('registerMemberModal').style.display = 'none';
    document.getElementById('registerForm').reset();
    document.getElementById('register-message').innerHTML = '';
}

// Load all members
async function loadMembersList() {
    try {
        const response = await fetch('../server/manage_members.php?action=get_all');
        const result = await response.json();

        if (result.success) {
            displayMembersList(result.members);
        } else {
            document.getElementById('membersListResults').innerHTML =
                `<div class="empty-state">${result.error || 'Failed to load members'}</div>`;
        }
    } catch (error) {
        console.error('Error loading members:', error);
        document.getElementById('membersListResults').innerHTML =
            '<div class="empty-state">Error loading members</div>';
    }
}

// Display members list
function displayMembersList(members) {
    const container = document.getElementById('membersListResults');

    if (!members || members.length === 0) {
        container.innerHTML = '<div class="empty-state">No members registered yet</div>';
        return;
    }

    container.innerHTML = `
        <table class="members-table">
            <thead>
                <tr>
                    <th>Member ID</th>
                    <th>Name</th>
                    <th>Join Date</th>
                    <th>Currently Issued</th>
                    <th>Total Borrowed</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${members.map(member => `
                    <tr>
                        <td>${member.member_id}</td>
                        <td>${member.first_name} ${member.last_name}</td>
                        <td>${new Date(member.join_date).toLocaleDateString()}</td>
                        <td>${member.currently_issued}</td>
                        <td>${member.total_borrowed}</td>
                        <td class="actions-cell">
                            <button class="btn-edit" onclick="openEditMemberModal(${member.member_id}, '${member.first_name}', '${member.last_name}')">
                                Edit
                            </button>
                            <button class="btn-delete" onclick="confirmDeleteMember(${member.member_id}, '${member.first_name} ${member.last_name}', ${member.currently_issued})">
                                Delete
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Search/filter members
document.getElementById('memberSearchFilter')?.addEventListener('input', async function () {
    const searchTerm = this.value.toLowerCase();

    try {
        const response = await fetch('../server/manage_members.php?action=get_all');
        const result = await response.json();

        if (result.success) {
            const filtered = result.members.filter(member => {
                const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();
                const memberId = member.member_id.toString();
                return fullName.includes(searchTerm) || memberId.includes(searchTerm);
            });
            displayMembersList(filtered);
        }
    } catch (error) {
        console.error('Error filtering members:', error);
    }
});

// Edit member modal
let editingMemberId = null;

function openEditMemberModal(memberId, firstName, lastName) {
    editingMemberId = memberId;
    document.getElementById('editMemberFirstName').value = firstName;
    document.getElementById('editMemberLastName').value = lastName;
    document.getElementById('editMemberModal').style.display = 'block';
}

function closeEditMemberModal() {
    editingMemberId = null;
    document.getElementById('editMemberModal').style.display = 'none';
    document.getElementById('editMemberForm').reset();
}

// Submit edit member form
document.getElementById('editMemberForm')?.addEventListener('submit', async function (e) {
    e.preventDefault();

    const firstName = document.getElementById('editMemberFirstName').value;
    const lastName = document.getElementById('editMemberLastName').value;

    try {
        const formData = new FormData();
        formData.append('action', 'edit_member');
        formData.append('member_id', editingMemberId);
        formData.append('first_name', firstName);
        formData.append('last_name', lastName);

        const response = await fetch('../server/manage_members.php', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            closeEditMemberModal();
            loadMembersList();
            showNotification('Member updated successfully', 'success');
        } else {
            showNotification(result.error || 'Failed to update member', 'error');
        }
    } catch (error) {
        console.error('Error updating member:', error);
        showNotification('Error updating member', 'error');
    }
});

// Delete Confirmation Modal
let pendingDeleteMemberId = null;

function confirmDeleteMember(memberId, memberName, currentlyIssued) {
    if (currentlyIssued > 0) {
        showNotification(`Cannot delete ${memberName}. They have ${currentlyIssued} book(s) currently issued.`, 'error');
        return;
    }

    pendingDeleteMemberId = memberId;
    document.getElementById('deleteConfirmMessage').innerHTML =
        `Are you sure you want to delete member <strong>"${memberName}"</strong>?<br><br>This action cannot be undone.`;
    document.getElementById('deleteConfirmModal').style.display = 'block';
}

function closeDeleteConfirmModal() {
    pendingDeleteMemberId = null;
    document.getElementById('deleteConfirmModal').style.display = 'none';
}

// Handle delete confirmation
document.getElementById('confirmDeleteBtn')?.addEventListener('click', function () {
    if (pendingDeleteMemberId) {
        deleteMember(pendingDeleteMemberId);
        closeDeleteConfirmModal();
    }
});

async function deleteMember(memberId) {
    try {
        const formData = new FormData();
        formData.append('action', 'delete_member');
        formData.append('member_id', memberId);

        const response = await fetch('../server/manage_members.php', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            loadMembersList();
            showNotification('Member deleted successfully', 'success');
        } else {
            showNotification(result.error || 'Failed to delete member', 'error');
        }
    } catch (error) {
        console.error('Error deleting member:', error);
        showNotification('Error deleting member', 'error');
    }
}

// Notification helper
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        border-radius: 4px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Close modals when clicking outside
window.addEventListener('click', function (event) {
    if (event.target.classList.contains('modal')) {
        if (event.target.id === 'editMemberModal') {
            closeEditMemberModal();
        } else if (event.target.id === 'registerMemberModal') {
            closeRegisterMemberModal();
        } else if (event.target.id === 'deleteConfirmModal') {
            closeDeleteConfirmModal();
        }
    }
});
