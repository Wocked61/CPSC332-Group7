let selectedMember = null;
let selectedBook = null;
let selectedIssue = null;
let selectedDueDate = null;
const DEFAULT_LOAN_DAYS = 14;
const reportsSelectors = {
    table: document.getElementById('reportsTable'),
    borrowedBadge: document.getElementById('borrowedCountBadge'),
    overdueBadge: document.getElementById('overdueCountBadge'),
    message: document.getElementById('reportsMessage'),
    refreshBtn: document.getElementById('refreshReportsBtn'),
    exportBtn: document.getElementById('exportReportsBtn'),
    overdueToggleBtn: document.getElementById('overdueToggleBtn')
};
let hasLoadedReports = false;
let reportsData = { borrowed: [], overdue: [] };
let showOverdueOnly = false;

function formatDateInputValue(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function dateFromYMD(value) {
    if (!value) return null;
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
}

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`${tab}-tab`).classList.add('active');

        if (tab === 'books') {
            searchBooks();
        } else if (tab === 'issues') {
            searchMembers();
            loadAllIssueBooks(); // Auto-load books for issuing
            selectedMember = null;
            selectedBook = null;
            selectedIssue = null;
            updateSelectedMemberInfo();
        } else if (tab === 'history') {
            // Focus on first member search input when switching to history tab
            loadAllHistoryMembers();
            setTimeout(() => document.getElementById('historyMemberSearch').focus(), 100);
        } else if (tab === 'inventory') {
            // Load inventory when switching to inventory tab
            loadInventoryBooks();
        } else if (tab === 'manage-members') {
            // Load member list when switching to manage members tab
            loadMembersList();
        } else if (tab === 'reports') {
            loadReports({ silent: hasLoadedReports });
        }
    });
});

// Action tab switching for issues
document.querySelectorAll('.action-tab').forEach(btn => {
    btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        document.querySelectorAll('.action-tab').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.action-section').forEach(s => s.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`${action}-section`).classList.add('active');

        if (action === 'issue') {
            loadAllIssueBooks(); // Auto-load books when switching to issue
        } else if (action === 'return' && selectedMember) {
            loadIssuedBooks();
        }
    });
});


function initializeDueDateControls() {
    const dateInput = document.getElementById('issueDueDate');
    const quickButtons = document.querySelectorAll('.due-quick-btn');

    if (!dateInput) {
        return;
    }

    dateInput.min = addDaysToToday(1);

    const defaultDate = addDaysToToday(DEFAULT_LOAN_DAYS);
    setDueDate(defaultDate);

    dateInput.addEventListener('change', () => {
        const value = dateInput.value;
        if (!value) {
            selectedDueDate = null;
            showDueDateError('Please select a due date');
        } else if (!isFutureDate(value)) {
            selectedDueDate = null;
            showDueDateError('Due date must be after today');
        } else {
            selectedDueDate = value;
            hideDueDateError();
        }
        updateDueDateSummary();
        refreshIssueButtonState();
    });

    quickButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const days = parseInt(btn.dataset.days, 10);
            if (!isNaN(days)) {
                setDueDate(addDaysToToday(days));
            }
        });
    });
}

function addDaysToToday(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return formatDateInputValue(date);
}

function setDueDate(dateString) {
    const dateInput = document.getElementById('issueDueDate');
    if (!dateInput) return;
    dateInput.value = dateString;
    selectedDueDate = dateString;
    hideDueDateError();
    updateDueDateSummary();
    refreshIssueButtonState();
}

function isFutureDate(dateString) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateString);
    target.setHours(0, 0, 0, 0);
    return target > today;
}

function updateDueDateSummary() {
    const summaryEl = document.getElementById('issueDueSummary');
    if (!summaryEl) return;

    if (!selectedDueDate) {
        summaryEl.textContent = 'Select a due date before issuing.';
        return;
    }

    const due = dateFromYMD(selectedDueDate);
    if (!due) {
        summaryEl.textContent = 'Select a valid due date before issuing.';
        return;
    }
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    summaryEl.textContent = `Due on ${due.toLocaleDateString()} (${diffDays} day${diffDays !== 1 ? 's' : ''} from today)`;
}

function showDueDateError(message) {
    const errorEl = document.getElementById('dueDateError');
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.style.display = 'block';
}

function hideDueDateError() {
    const errorEl = document.getElementById('dueDateError');
    if (!errorEl) return;
    errorEl.style.display = 'none';
    errorEl.textContent = '';
}

function refreshIssueButtonState() {
    const issueBtn = document.getElementById('issueBtn');
    if (!issueBtn) return;
    const ready = selectedMember && selectedBook && !!selectedDueDate;
    issueBtn.disabled = !ready;
}



// Search books
document.getElementById('bookSearch').addEventListener('input', searchBooks);
document.getElementById('bookFilter').addEventListener('change', searchBooks);

async function searchBooks() {
    const query = document.getElementById('bookSearch').value;
    const filter = document.getElementById('bookFilter').value;

    try {
        const response = await fetch(`../server/search_books.php?query=${encodeURIComponent(query)}&filter=${filter}`);
        const books = await response.json();
        displayBooks(books);
    } catch (error) {
        console.error('Error searching books:', error);
    }
}

function displayBooks(books) {
    const container = document.getElementById('booksResults');

    if (books.length === 0) {
        container.innerHTML = '<div class="empty-state">No books found</div>';
        return;
    }

    container.innerHTML = books.map(book => `
        <div class="book-card" onclick="openBookDetails('${book.isbn}')">
            <h4>${book.title}</h4>
            <p><strong>ISBN:</strong> ${book.isbn}</p>
            <p><strong>Author:</strong> ${book.author}</p>
            <p><strong>Category:</strong> ${book.category}</p>
            <div class="book-stock-status">
                <span class="stock-badge ${book.available ? 'in-stock' : 'out-of-stock'}">
                    ${book.available ? '✓ ' + book.available_copies + ' available' : '✗ Out of stock'}
                </span>
                <span class="total-copies">${book.quantity} total</span>
            </div>
        </div>
    `).join('');
}

// Search members
document.getElementById('memberSearch').addEventListener('input', searchMembers);

async function searchMembers() {
    const query = document.getElementById('memberSearch').value;

    try {
        const response = await fetch(`../server/search_members.php?query=${encodeURIComponent(query)}`);
        const members = await response.json();
        displayMembers(members);
    } catch (error) {
        console.error('Error searching members:', error);
    }
}

function displayMembers(members) {
    const container = document.getElementById('membersResults');

    if (members.length === 0) {
        container.innerHTML = '<div class="empty-state">No members found</div>';
        return;
    }

    container.innerHTML = members.map(member => `
        <div class="member-card ${selectedMember?.member_id === member.member_id ? 'selected' : ''}" 
             onclick="selectMember(${member.member_id}, '${member.first_name}', '${member.last_name}')">
            <h4>${member.first_name} ${member.last_name}</h4>
            <p>Member ID: ${member.member_id}</p>
        </div>
    `).join('');
}

function selectMember(id, firstName, lastName) {
    if (selectedMember?.member_id === id) {
        selectedMember = null;
    } else {
        selectedMember = { member_id: id, first_name: firstName, last_name: lastName };
    }
    selectedIssue = null;
    const returnBtn = document.getElementById('returnBtn');
    if (returnBtn) {
        returnBtn.disabled = true;
    }
    if (!selectedMember) {
        const issuedContainer = document.getElementById('issuedBooksResults');
        if (issuedContainer) {
            issuedContainer.innerHTML = '<div class="empty-state">Select a member to view issued books</div>';
        }
    }
    updateSelectedMemberInfo();
    searchMembers();

    const activeAction = document.querySelector('.action-tab.active').dataset.action;
    if (activeAction === 'return' && selectedMember) {
        loadIssuedBooks();
    }
    refreshIssueButtonState();
}

function updateSelectedMemberInfo() {
    const container = document.getElementById('selectedMemberInfo');
    const returnBtn = document.getElementById('returnBtn');

    if (selectedMember) {
        container.innerHTML = `
            <h4>Selected Member</h4>
            <p><strong>${selectedMember.first_name} ${selectedMember.last_name}</strong></p>
            <p>Member ID: ${selectedMember.member_id}</p>
        `;
        container.style.display = 'block';
    } else {
        container.innerHTML = '';
        container.style.display = 'none';
        returnBtn.disabled = true;
    }

    refreshIssueButtonState();
}

// Search books for issuing
document.getElementById('issueBookSearch').addEventListener('input', searchIssueBooks);

async function searchIssueBooks() {
    const query = document.getElementById('issueBookSearch').value;

    try {
        const response = await fetch(`../server/search_books.php?query=${encodeURIComponent(query)}`);
        const books = await response.json();
        displayIssueBooks(books);
    } catch (error) {
        console.error('Error searching books:', error);
    }
}

// Auto-load books when tab is switched to issue
function loadAllIssueBooks() {
    searchIssueBooks();
}

function displayIssueBooks(books) {
    const container = document.getElementById('issueBooksResults');

    if (books.length === 0) {
        container.innerHTML = '<div class="empty-state">No available books found</div>';
        return;
    }

    container.innerHTML = books.map(book => {
        const availableCopies = book.available_copies !== undefined ? book.available_copies : 0;
        const isInStock = availableCopies > 0;

        return `
            <div class="book-item ${selectedBook?.isbn === book.isbn ? 'selected' : ''}" 
                 onclick="selectBook('${book.isbn}', '${book.title.replace(/'/g, "\\'")}')">
                <h4>${book.title}</h4>
                <p>ISBN: ${book.isbn}</p>
                <p>Author: ${book.author}</p>
                <p class="stock-info ${isInStock ? 'in-stock' : 'out-of-stock'}">
                    ${isInStock ? '✓ ' + availableCopies + ' available' : '✗ Out of stock'}
                </p>
            </div>
        `;
    }).join('');
}

function selectBook(isbn, title) {
    if (selectedBook?.isbn === isbn) {
        selectedBook = null;
    } else {
        selectedBook = { isbn, title };
    }
    searchIssueBooks();
    refreshIssueButtonState();
}

// Issue book
document.getElementById('issueBtn').addEventListener('click', async () => {
    if (!selectedMember || !selectedBook || !selectedDueDate) {
        showDueDateError('Select a member, book, and due date before issuing.');
        return;
    }

    try {
        const response = await fetch('../server/issue_book.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                member_id: selectedMember.member_id,
                isbn: selectedBook.isbn,
                due_date: selectedDueDate
            })
        });

        const result = await response.json();

        if (result.success) {
            const dueDateDisplay = dateFromYMD(selectedDueDate)?.toLocaleDateString() ?? selectedDueDate;
            alert(`Book issued successfully! Due ${dueDateDisplay}.`);
            selectedBook = null;
            refreshIssueButtonState();
            searchIssueBooks();
            searchBooks();
            if (selectedMember) {
                loadIssuedBooks();
            }
        } else {
            alert(result.message || 'Failed to issue book');
        }
    } catch (error) {
        alert('An error occurred while issuing the book');
        console.error(error);
    }
});

// Load issued books for return
async function loadIssuedBooks() {
    if (!selectedMember) return;

    try {
        const response = await fetch(`../server/get_issued_books.php?member_id=${selectedMember.member_id}`);
        const issues = await response.json();
        displayIssuedBooks(issues);
    } catch (error) {
        console.error('Error loading issued books:', error);
    }
}

function displayIssuedBooks(issues) {
    const container = document.getElementById('issuedBooksResults');

    if (issues.length === 0) {
        container.innerHTML = '<div class="empty-state">No issued books for this member</div>';
        return;
    }

    container.innerHTML = issues.map(issue => {
        const dueDate = dateFromYMD(issue.due_date);
        const daysRemaining = issue.days_remaining ?? null;
        const overdue = issue.is_overdue;
        let statusText = '';
        let badgeClass = 'on-track';

        if (overdue) {
            const overdueDays = daysRemaining !== null ? Math.abs(daysRemaining) : '';
            statusText = `Overdue${overdueDays ? ` by ${overdueDays} day${overdueDays !== 1 ? 's' : ''}` : ''}`;
            badgeClass = 'overdue';
        } else if (daysRemaining !== null) {
            if (daysRemaining <= 2) {
                badgeClass = 'due-soon';
            }
            statusText = daysRemaining === 0
                ? 'Due today'
                : `Due in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`;
        }

        return `
            <div class="issue-item ${selectedIssue?.issue_id === issue.issue_id ? 'selected' : ''}" 
                 onclick="selectIssue(${issue.issue_id}, '${issue.isbn}', '${issue.title.replace(/'/g, "\\'")}')">
                <h4>${issue.title}</h4>
                <p>ISBN: ${issue.isbn}</p>
                <p>Issued: ${new Date(issue.issue_date).toLocaleDateString()}</p>
                ${dueDate ? `<p>Due: ${dueDate.toLocaleDateString()}</p>` : ''}
                ${statusText ? `<span class="due-badge ${badgeClass}">${statusText}</span>` : ''}
            </div>
        `;
    }).join('');
}

function selectIssue(issueId, isbn, title) {
    if (selectedIssue?.issue_id === issueId) {
        selectedIssue = null;
    } else {
        selectedIssue = { issue_id: issueId, isbn, title };
    }
    loadIssuedBooks();

    const returnBtn = document.getElementById('returnBtn');
    returnBtn.disabled = !selectedIssue;
}

// Return book
document.getElementById('returnBtn').addEventListener('click', async () => {
    if (!selectedIssue) return;

    try {
        const response = await fetch('../server/return_book.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ issue_id: selectedIssue.issue_id })
        });

        const result = await response.json();

        if (result.success) {
            alert('Book returned successfully!');
            selectedIssue = null;
            loadIssuedBooks();
            searchBooks();
            document.getElementById('returnBtn').disabled = true;
        } else {
            alert(result.message || 'Failed to return book');
        }
    } catch (error) {
        alert('An error occurred while returning the book');
        console.error(error);
    }
});

function setReportsMessage(type, text) {
    const messageEl = reportsSelectors.message;
    if (!messageEl) return;

    if (!text) {
        messageEl.style.display = 'none';
        messageEl.textContent = '';
        messageEl.classList.remove('error', 'success');
        return;
    }

    messageEl.style.display = 'block';
    messageEl.textContent = text;
    messageEl.classList.remove('error', 'success');
    if (type === 'error' || type === 'success') {
        messageEl.classList.add(type);
    }
}

function setOverdueToggleState() {
    const toggleBtn = reportsSelectors.overdueToggleBtn;
    if (!toggleBtn) return;
    toggleBtn.classList.toggle('active', showOverdueOnly);
    toggleBtn.textContent = showOverdueOnly ? 'Showing: Overdue Only' : 'Overdue Only';
    toggleBtn.setAttribute('aria-pressed', String(showOverdueOnly));
}

function getActiveReportRows() {
    return showOverdueOnly ? reportsData.overdue : reportsData.borrowed;
}

function renderCurrentReports() {
    if (!reportsSelectors.table) return;
    const rows = getActiveReportRows();
    const emptyText = showOverdueOnly ? 'No overdue books 🎉' : 'No borrowed books at the moment.';
    renderReportsTable(reportsSelectors.table, rows, emptyText);

    if (reportsSelectors.exportBtn) {
        reportsSelectors.exportBtn.disabled = rows.length === 0;
    }
}

function formatReportDate(value) {
    if (!value) return '—';
    let date = null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        date = dateFromYMD(value);
    } else {
        date = new Date(value);
    }
    if (!date || isNaN(date.getTime())) return value;
    return date.toLocaleDateString();
}

function getReportStatus(record) {
    const daysRemaining = Number(record.days_remaining);

    if (record.is_overdue) {
        const overdueDays = Number.isFinite(daysRemaining) ? Math.abs(daysRemaining) : null;
        return {
            badgeClass: 'overdue',
            label: overdueDays && overdueDays > 0
                ? `Overdue by ${overdueDays} day${overdueDays !== 1 ? 's' : ''}`
                : 'Overdue'
        };
    }

    if (Number.isFinite(daysRemaining)) {
        if (daysRemaining === 0) {
            return { badgeClass: 'due-soon', label: 'Due today' };
        }
        if (daysRemaining <= 2) {
            return {
                badgeClass: 'due-soon',
                label: `Due in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`
            };
        }
        return {
            badgeClass: 'on-track',
            label: `Due in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`
        };
    }

    return { badgeClass: 'on-track', label: 'Issued' };
}

function renderReportsTable(container, rows, emptyText) {
    if (!container) return;

    if (!rows || rows.length === 0) {
        container.innerHTML = `<div class="empty-state">${emptyText}</div>`;
        return;
    }

    const tableRows = rows.map(record => {
        const status = getReportStatus(record);
        const overdueLabel = record.is_overdue ? 'Yes' : 'No';
        return `
            <tr class="${record.is_overdue ? 'overdue-row' : ''}">
                <td>
                    ${record.first_name} ${record.last_name}
                    <span class="report-subtext">Member ID: ${record.member_id}</span>
                </td>
                <td>
                    ${record.title}
                    <span class="report-subtext">by ${record.author || 'Unknown author'}</span>
                </td>
                <td>${record.isbn}</td>
                <td>${formatReportDate(record.issue_date)}</td>
                <td>${formatReportDate(record.due_date)}</td>
                <td>${overdueLabel}</td>
                <td><span class="status-badge ${status.badgeClass}">${status.label}</span></td>
            </tr>
        `;
    }).join('');

    container.innerHTML = `
        <table class="reports-table">
            <thead>
                <tr>
                    <th>Member</th>
                    <th>Book</th>
                    <th>ISBN</th>
                    <th>Issued</th>
                    <th>Due</th>
                    <th>Overdue</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows}
            </tbody>
        </table>
    `;
}

function escapeCsvValue(value) {
    if (value === null || value === undefined) return '';
    const str = String(value).replace(/"/g, '""');
    return /[",\n]/.test(str) ? `"${str}"` : str;
}

function buildReportsCsv(rows) {
    const headers = ['Member Name', 'Member ID', 'Book Title', 'ISBN', 'Issue Date', 'Due Date', 'Overdue', 'Status'];
    const lines = [headers.join(',')];

    rows.forEach(record => {
        const status = getReportStatus(record);
        const overdueLabel = record.is_overdue ? 'Yes' : 'No';
        const values = [
            `${record.first_name} ${record.last_name}`.trim(),
            record.member_id,
            record.title,
            record.isbn,
            formatReportDate(record.issue_date),
            formatReportDate(record.due_date),
            overdueLabel,
            status.label
        ].map(escapeCsvValue);

        lines.push(values.join(','));
    });

    return lines.join('\n');
}

function downloadCsv(filename, content) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function exportCurrentReport() {
    const rows = getActiveReportRows();
    if (!rows.length) {
        setReportsMessage('error', showOverdueOnly ? 'No overdue rows to export.' : 'No borrowed rows to export.');
        return;
    }

    const filenameBase = showOverdueOnly ? 'overdue_books' : 'borrowed_books';
    const timestamp = new Date().toISOString().split('T')[0];
    const csv = buildReportsCsv(rows);
    downloadCsv(`${filenameBase}_${timestamp}`, csv);
    setReportsMessage('success', `Exported ${rows.length} row${rows.length !== 1 ? 's' : ''} to CSV`);
}

async function loadReports(options = {}) {
    const { silent = false } = options;
    if (!reportsSelectors.table) return;

    if (!silent) {
        setReportsMessage(null, 'Loading the latest data...');
    }

    if (reportsSelectors.refreshBtn) {
        reportsSelectors.refreshBtn.disabled = true;
    }
    if (reportsSelectors.exportBtn) {
        reportsSelectors.exportBtn.disabled = true;
    }

    try {
        const response = await fetch('../server/get_reports.php');
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Unable to load reports');
        }

        const borrowed = Array.isArray(data.borrowed_books) ? data.borrowed_books : [];
        const overdue = Array.isArray(data.overdue_books) ? data.overdue_books : [];

        reportsData = { borrowed, overdue };

        if (reportsSelectors.borrowedBadge) {
            reportsSelectors.borrowedBadge.textContent = borrowed.length;
        }
        if (reportsSelectors.overdueBadge) {
            reportsSelectors.overdueBadge.textContent = overdue.length;
        }

        setOverdueToggleState();
        renderCurrentReports();

        const updatedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setReportsMessage('success', `Reports updated ${updatedAt}`);
        hasLoadedReports = true;
    } catch (error) {
        console.error('Error loading reports:', error);
        setReportsMessage('error', error.message || 'Failed to load reports');
    } finally {
        if (reportsSelectors.refreshBtn) {
            reportsSelectors.refreshBtn.disabled = false;
        }
    }
}

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await fetch('../server/logout.php');
        window.location.href = 'login.php';
    } catch (error) {
        window.location.href = 'login.php';
    }
});

// Initial load
searchBooks();
initializeDueDateControls();
if (reportsSelectors.refreshBtn) {
    reportsSelectors.refreshBtn.addEventListener('click', () => loadReports({ silent: false }));
}
if (reportsSelectors.overdueToggleBtn) {
    reportsSelectors.overdueToggleBtn.addEventListener('click', () => {
        showOverdueOnly = !showOverdueOnly;
        setOverdueToggleState();
        renderCurrentReports();
    });
}
if (reportsSelectors.exportBtn) {
    reportsSelectors.exportBtn.addEventListener('click', exportCurrentReport);
}
if (reportsSelectors.table) {
    setOverdueToggleState();
    loadReports({ silent: true });
}

// Book Details Modal Handler - Initialize after DOM is ready
function initializeBookModal() {
    const bookModal = document.getElementById('bookModal');
    if (!bookModal) {
        console.error('Book modal element not found');
        return;
    }

    const modalClose = document.querySelector('.modal-close');

    if (modalClose) {
        // Close modal when X is clicked
        modalClose.addEventListener('click', () => {
            bookModal.style.display = 'none';
        });
    }

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === bookModal) {
            bookModal.style.display = 'none';
        }
    });
}

// Call after a brief delay to ensure DOM is fully ready
setTimeout(initializeBookModal, 100);

// Open book details modal
function openBookDetails(isbn) {
    const bookModal = document.getElementById('bookModal');
    if (!bookModal) {
        console.error('Book modal element not found');
        return;
    }
    bookModal.style.display = 'block';
    loadBookDetails(isbn);
}

async function loadBookDetails(isbn) {
    try {
        const response = await fetch(`../server/get_book_details.php?isbn=${encodeURIComponent(isbn)}`);
        const data = await response.json();

        if (data.success) {
            displayBookDetails(data);
        } else {
            console.error('Error loading book details:', data.error);
        }
    } catch (error) {
        console.error('Error fetching book details:', error);
    }
}

function displayBookDetails(data) {
    const book = data.book;
    const stats = data.stats;
    const currentBorrows = data.current_borrows;
    const history = data.history;

    // Update header
    document.getElementById('modalBookTitle').textContent = book.title;
    document.getElementById('modalBookIsbn').textContent = `ISBN: ${book.isbn}`;

    // Update book info
    document.getElementById('modalIsbn').textContent = book.isbn;
    document.getElementById('modalAuthor').textContent = book.author;
    document.getElementById('modalCategory').textContent = book.category;

    // Update inventory
    document.getElementById('modalTotalQty').textContent = stats.total;
    document.getElementById('modalAvailableQty').textContent = stats.available;
    document.getElementById('modalCheckedOutQty').textContent = stats.checked_out;

    // Update current borrowings
    const currentBorrowsContainer = document.getElementById('modalCurrentBorrows');
    if (currentBorrows.length === 0) {
        currentBorrowsContainer.innerHTML = '<div class="empty-state">No one currently has this book</div>';
    } else {
        currentBorrowsContainer.innerHTML = currentBorrows.map(borrow => {
            const dueDate = borrow.due_date ? dateFromYMD(borrow.due_date)?.toLocaleDateString() ?? '—' : '—';
            const daysUntilDue = borrow.days_until_due ?? 0;
            const dueText = borrow.status === 'overdue'
                ? `Overdue by ${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) !== 1 ? 's' : ''}`
                : daysUntilDue === 0
                    ? 'Due today'
                    : `Due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`;

            return `
                <div class="borrow-card ${borrow.status}">
                    <div class="borrow-header">
                        <strong>${borrow.first_name} ${borrow.last_name}</strong>
                        <span class="borrow-status ${borrow.status}">
                            ${borrow.status === 'overdue' ? '⚠️ Overdue' : '📖 Current'}
                        </span>
                    </div>
                    <div class="borrow-details">
                        <p>Member ID: ${borrow.member_id}</p>
                        <p>Issued: ${new Date(borrow.issue_date).toLocaleDateString()}</p>
                        <p>Due: ${dueDate}</p>
                        <p>${dueText}</p>
                        <p>Days Issued: ${borrow.days_issued}</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Update history table
    const historyContainer = document.getElementById('modalHistoryTable');
    if (history.length === 0) {
        historyContainer.innerHTML = '<div class="empty-state">No borrowing history</div>';
    } else {
        historyContainer.innerHTML = `
            <table class="modal-history-table">
                <thead>
                    <tr>
                        <th>Member</th>
                        <th>Issue Date</th>
                        <th>Due Date</th>
                        <th>Return Date</th>
                        <th>Days</th>
                        <th>Overdue Days</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${history.map(record => `
                        <tr>
                            <td>${record.first_name} ${record.last_name}</td>
                            <td>${new Date(record.issue_date).toLocaleDateString()}</td>
                            <td>${record.due_date ? dateFromYMD(record.due_date)?.toLocaleDateString() ?? '-' : '-'}</td>
                            <td>${record.return_date ? new Date(record.return_date).toLocaleDateString() : '-'}</td>
                            <td>${record.days_borrowed}</td>
                            <td>${record.overdue_days}</td>
                            <td>
                                <span class="badge ${record.status}">
                                    ${record.status === 'issued' ? 'Issued' : 'Returned'}
                                </span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
}