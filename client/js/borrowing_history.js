let selectedHistoryMember = null;
let historyFilter = 'all';

// Search members for history
document.getElementById('historyMemberSearch').addEventListener('input', searchHistoryMembers);

async function searchHistoryMembers() {
    const query = document.getElementById('historyMemberSearch').value;

    try {
        const response = await fetch(`../server/search_members.php?query=${encodeURIComponent(query)}`);
        const members = await response.json();
        displayHistoryMembers(members);
    } catch (error) {
        console.error('Error searching members:', error);
    }
}

function displayHistoryMembers(members) {
    const container = document.getElementById('historyMembersResults');

    if (members.length === 0) {
        container.innerHTML = '<div class="empty-state">No members found</div>';
        return;
    }

    container.innerHTML = members.map(member => `
        <div class="member-card ${selectedHistoryMember?.member_id === member.member_id ? 'selected' : ''}" 
             onclick="selectHistoryMember(${member.member_id}, '${member.first_name}', '${member.last_name}')">
            <h4>${member.first_name} ${member.last_name}</h4>
            <p>Member ID: ${member.member_id}</p>
        </div>
    `).join('');
}

function selectHistoryMember(id, firstName, lastName) {
    if (selectedHistoryMember?.member_id === id) {
        selectedHistoryMember = null;
    } else {
        selectedHistoryMember = { member_id: id, first_name: firstName, last_name: lastName };
    }
    updateHistoryMemberInfo();
    searchHistoryMembers();

    if (selectedHistoryMember) {
        loadMemberHistory();
    }
}

function updateHistoryMemberInfo() {
    const container = document.getElementById('selectedHistoryMemberInfo');

    if (selectedHistoryMember) {
        container.innerHTML = `
            <h4>Selected Member</h4>
            <p><strong>${selectedHistoryMember.first_name} ${selectedHistoryMember.last_name}</strong></p>
            <p>Member ID: ${selectedHistoryMember.member_id}</p>
        `;
        container.style.display = 'block';
    } else {
        container.innerHTML = '';
        container.style.display = 'none';
    }
}

// History filter buttons
document.querySelectorAll('.history-filter').forEach(btn => {
    btn.addEventListener('click', () => {
        historyFilter = btn.dataset.filter;
        document.querySelectorAll('.history-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (selectedHistoryMember) {
            loadMemberHistory();
        }
    });
});

// Load member history
async function loadMemberHistory() {
    if (!selectedHistoryMember) return;

    try {
        const response = await fetch(`../server/get_member_history.php?member_id=${selectedHistoryMember.member_id}&filter=${historyFilter}`);
        const history = await response.json();
        displayMemberHistory(history);
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

function displayMemberHistory(history) {
    const container = document.getElementById('historyResults');

    if (history.length === 0) {
        container.innerHTML = '<div class="empty-state">No borrowing history found</div>';
        return;
    }

    container.innerHTML = `
        <div class="history-table-wrapper">
            <table class="history-table">
                <thead>
                    <tr>
                        <th>Book Title</th>
                        <th>ISBN</th>
                        <th>Author</th>
                        <th>Category</th>
                        <th>Issued Date</th>
                        <th>Returned Date</th>
                        <th>Status</th>
                        <th>Days</th>
                    </tr>
                </thead>
                <tbody>
                    ${history.map(record => `
                        <tr class="history-row ${record.display_status}">
                            <td><strong>${record.title}</strong></td>
                            <td>${record.isbn}</td>
                            <td>${record.author}</td>
                            <td>${record.category}</td>
                            <td>${new Date(record.issue_date).toLocaleDateString()}</td>
                            <td>${record.return_date ? new Date(record.return_date).toLocaleDateString() : 'Not returned'}</td>
                            <td>
                                <span class="status-badge ${record.display_status}">
                                    ${record.display_status === 'overdue' ? '⚠️ Overdue' :
            record.display_status === 'current' ? '📖 Current' :
                '✓ Returned'}
                                </span>
                            </td>
                            <td>${record.days_issued || 0}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}
