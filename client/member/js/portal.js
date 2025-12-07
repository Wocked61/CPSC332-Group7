const memberState = {
    catalog: [],
    reservations: [],
    loans: {
        active: [],
        history: []
    },
    search: '',
    filter: 'all',
    availableOnly: false
};

let catalogDebounce;

function setAlert(element, type, message) {
    if (!element) return;
    if (!message) {
        element.className = 'alert';
        element.textContent = '';
        return;
    }
    element.className = `alert show ${type || ''}`.trim();
    element.textContent = message;
}

async function fetchWithAuth(url, options = {}) {
    const response = await fetch(url, options);

    if (response.status === 401) {
        window.location.href = '../index.php?expired=1';
        return null;
    }

    return response;
}

function tabSetup() {
    const buttons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            buttons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`${tab}-tab`).classList.add('active');

            if (tab === 'requests') {
                loadReservations();
            } else if (tab === 'borrowing') {
                loadLoans();
            }
        });
    });
}

function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString();
}

function formatStatusBadge(book) {
    if (book.available_copies > 0) {
        return '<span class="badge available">Available</span>';
    }
    return '<span class="badge unavailable">Unavailable</span>';
}

function hasOpenReservation(isbn) {
    return memberState.reservations.some(res => res.isbn === isbn && res.status !== 'cancelled' && res.status !== 'fulfilled');
}

function formatLoanBadge(loan) {
    if (loan.is_overdue) {
        return '<span class="badge unavailable">Overdue</span>';
    }
    const days = Number(loan.days_remaining);
    if (!Number.isNaN(days) && days <= 2) {
        if (days === 0) {
            return '<span class="badge warning">Due today</span>';
        }
        return `<span class="badge warning">Due in ${days} day${days !== 1 ? 's' : ''}</span>`;
    }
    if (!Number.isNaN(days)) {
        return `<span class="badge available">Due in ${days} day${days !== 1 ? 's' : ''}</span>`;
    }
    return '<span class="badge available">Issued</span>';
}

function renderCatalog() {
    const container = document.getElementById('catalogResults');
    const messageEl = document.getElementById('catalogMessage');

    if (!container) return;

    if (memberState.catalog.length === 0) {
        container.innerHTML = '<div class="empty-state">No books match your search.</div>';
        setAlert(messageEl, '', '');
        return;
    }

    container.innerHTML = memberState.catalog.map(book => `
        <div class="book-card">
            <div>
                <h4>${book.title}</h4>
                <p>${book.author}</p>
                <p class="text-muted">${book.category}</p>
            </div>
            <div>${formatStatusBadge(book)} <span class="text-muted">${book.available_copies} available</span></div>
            <button class="btn primary" data-isbn="${book.isbn}" ${hasOpenReservation(book.isbn) ? 'disabled' : ''}>
                ${hasOpenReservation(book.isbn) ? 'Pending' : 'Reserve'}
            </button>
        </div>
    `).join('');

    container.querySelectorAll('button[data-isbn]').forEach(btn => {
        btn.addEventListener('click', () => placeReservation(btn.dataset.isbn));
    });
}

function renderReservations() {
    const wrapper = document.getElementById('requestsTable');
    const messageEl = document.getElementById('requestsMessage');
    if (!wrapper) return;

    if (memberState.reservations.length === 0) {
        wrapper.innerHTML = '<div class="empty-state">You have not submitted any requests yet.</div>';
        return;
    }

    wrapper.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Book</th>
                    <th>Status</th>
                    <th>Requested</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${memberState.reservations.map(res => `
                    <tr>
                        <td>
                            <strong>${res.title}</strong>
                            <div class="text-muted">${res.isbn}</div>
                        </td>
                        <td>${res.status}</td>
                        <td>${formatDate(res.created_at)}</td>
                        <td>
                            ${res.status === 'pending' ? `<button class="btn tertiary" data-cancel="${res.reservation_id}">Cancel</button>` : ''}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    wrapper.querySelectorAll('button[data-cancel]').forEach(btn => {
        btn.addEventListener('click', () => cancelReservation(btn.dataset.cancel));
    });

    setAlert(messageEl, '', '');
}

function renderLoans() {
    const activeContainer = document.getElementById('activeLoans');
    const historyWrapper = document.getElementById('historyTable');

    if (activeContainer) {
        if (memberState.loans.active.length === 0) {
            activeContainer.innerHTML = '<div class="empty-state">You have no active loans.</div>';
        } else {
            activeContainer.innerHTML = memberState.loans.active.map(loan => `
                <div class="loan-card">
                    <h4>${loan.title}</h4>
                    <p>ISBN: ${loan.isbn}</p>
                    <p>Due: ${formatDate(loan.due_date)}</p>
                    ${formatLoanBadge(loan)}
                </div>
            `).join('');
        }
    }

    if (historyWrapper) {
        if (memberState.loans.history.length === 0) {
            historyWrapper.innerHTML = '<div class="empty-state">No borrowing history yet.</div>';
        } else {
            historyWrapper.innerHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Book</th>
                            <th>Issue Date</th>
                            <th>Due Date</th>
                            <th>Return Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${memberState.loans.history.map(item => `
                            <tr>
                                <td>
                                    <strong>${item.title}</strong>
                                    <div class="text-muted">${item.isbn}</div>
                                </td>
                                <td>${formatDate(item.issue_date)}</td>
                                <td>${formatDate(item.due_date)}</td>
                                <td>${formatDate(item.return_date)}</td>
                                <td>${item.status === 'issued' ? 'Issued' : 'Returned'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    }
}

async function loadCatalog() {
    const params = new URLSearchParams();
    if (memberState.search) params.append('query', memberState.search);
    if (memberState.filter) params.append('filter', memberState.filter);
    if (memberState.availableOnly) params.append('availableOnly', 'true');

    const messageEl = document.getElementById('catalogMessage');
    setAlert(messageEl, '', 'Searching...');

    const response = await fetchWithAuth(`../../server/member/catalog.php?${params.toString()}`);
    if (!response) return;

    const data = await response.json();
    memberState.catalog = data;
    renderCatalog();
    setAlert(messageEl, '', '');
}

async function loadReservations() {
    const response = await fetchWithAuth('../../server/member/reservations.php');
    if (!response) return;
    memberState.reservations = await response.json();
    renderReservations();
    renderCatalog();
}

async function loadLoans() {
    const response = await fetchWithAuth('../../server/member/loans.php');
    if (!response) return;
    memberState.loans = await response.json();
    renderLoans();
    setAlert(document.getElementById('borrowingMessage'), 'success', 'Borrowing data refreshed.');
    setTimeout(() => setAlert(document.getElementById('borrowingMessage'), '', ''), 2000);
}

async function placeReservation(isbn) {
    const response = await fetchWithAuth('../../server/member/reservations.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isbn })
    });

    const messageEl = document.getElementById('catalogMessage');

    if (!response) return;

    const data = await response.json();
    if (data.success) {
        setAlert(messageEl, 'success', 'Reservation submitted. We will notify you when it is ready.');
        loadReservations();
    } else {
        setAlert(messageEl, 'error', data.message || 'Unable to submit reservation.');
    }
}

async function cancelReservation(reservationId) {
    if (!confirm('Cancel this reservation?')) return;

    const response = await fetchWithAuth('../../server/member/reservations.php', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reservation_id: reservationId })
    });

    if (!response) return;

    const data = await response.json();
    const messageEl = document.getElementById('requestsMessage');

    if (data.success) {
        setAlert(messageEl, 'success', 'Reservation cancelled.');
        loadReservations();
    } else {
        setAlert(messageEl, 'error', data.message || 'Unable to cancel reservation.');
    }
}

function setupSearchHandlers() {
    const searchInput = document.getElementById('catalogSearch');
    const filterSelect = document.getElementById('catalogFilter');
    const availableToggle = document.getElementById('availableOnlyToggle');

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(catalogDebounce);
            catalogDebounce = setTimeout(() => {
                memberState.search = searchInput.value.trim();
                loadCatalog();
            }, 300);
        });
    }

    if (filterSelect) {
        filterSelect.addEventListener('change', () => {
            memberState.filter = filterSelect.value;
            loadCatalog();
        });
    }

    if (availableToggle) {
        availableToggle.addEventListener('change', () => {
            memberState.availableOnly = availableToggle.checked;
            loadCatalog();
        });
    }
}

function setupLogout() {
    const btn = document.getElementById('memberLogoutBtn');
    if (!btn) return;

    btn.addEventListener('click', async () => {
        await fetchWithAuth('../../server/member/logout.php');
        window.location.href = '../index.php';
    });
}

function setupBorrowingRefresh() {
    const btn = document.getElementById('refreshBorrowingBtn');
    if (!btn) return;
    btn.addEventListener('click', () => loadLoans());
}

window.addEventListener('DOMContentLoaded', () => {
    tabSetup();
    setupSearchHandlers();
    setupLogout();
    setupBorrowingRefresh();
    loadCatalog();
    loadReservations();
    loadLoans();
});
