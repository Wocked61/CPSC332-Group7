let selectedMember = null;
let selectedBook = null;
let selectedIssue = null;

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
        } else if (tab === 'members') {
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
        } else if (tab === 'register') {
            // Focus on first name input when switching to register tab
            setTimeout(() => document.getElementById('regFirstName').focus(), 100);
        }
    });
});

// Action tab switching
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
    updateSelectedMemberInfo();
    searchMembers();

    const activeAction = document.querySelector('.action-tab.active').dataset.action;
    if (activeAction === 'return' && selectedMember) {
        loadIssuedBooks();
    }

    // Update issue button state when member is selected
    const issueBtn = document.getElementById('issueBtn');
    issueBtn.disabled = !(selectedMember && selectedBook);
}

function updateSelectedMemberInfo() {
    const container = document.getElementById('selectedMemberInfo');
    const issueBtn = document.getElementById('issueBtn');
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
        issueBtn.disabled = true;
        returnBtn.disabled = true;
    }
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

    console.log('Books data:', books); // Debug log

    container.innerHTML = books.map(book => {
        const availableCopies = book.available_copies !== undefined ? book.available_copies : 0;
        const isInStock = availableCopies > 0;

        console.log(`Book: ${book.title}, Available: ${availableCopies}, In Stock: ${isInStock}`); // Debug log

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

    const issueBtn = document.getElementById('issueBtn');
    issueBtn.disabled = !(selectedMember && selectedBook);
}

// Issue book
document.getElementById('issueBtn').addEventListener('click', async () => {
    if (!selectedMember || !selectedBook) return;

    try {
        const response = await fetch('../server/issue_book.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                member_id: selectedMember.member_id,
                isbn: selectedBook.isbn
            })
        });

        const result = await response.json();

        if (result.success) {
            alert('Book issued successfully!');
            selectedBook = null;
            searchIssueBooks();
            searchBooks();
            document.getElementById('issueBtn').disabled = true;
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

    container.innerHTML = issues.map(issue => `
        <div class="issue-item ${selectedIssue?.issue_id === issue.issue_id ? 'selected' : ''}" 
             onclick="selectIssue(${issue.issue_id}, '${issue.isbn}', '${issue.title.replace(/'/g, "\\'")}')">
            <h4>${issue.title}</h4>
            <p>ISBN: ${issue.isbn}</p>
            <p>Issued: ${new Date(issue.issue_date).toLocaleDateString()}</p>
        </div>
    `).join('');
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
        currentBorrowsContainer.innerHTML = currentBorrows.map(borrow => `
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
                    <p>Days Issued: ${borrow.days_issued}</p>
                </div>
            </div>
        `).join('');
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
                        <th>Return Date</th>
                        <th>Days</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${history.map(record => `
                        <tr>
                            <td>${record.first_name} ${record.last_name}</td>
                            <td>${new Date(record.issue_date).toLocaleDateString()}</td>
                            <td>${record.return_date ? new Date(record.return_date).toLocaleDateString() : '-'}</td>
                            <td>${record.days_borrowed}</td>
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