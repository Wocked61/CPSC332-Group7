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
            selectedMember = null;
            selectedBook = null;
            selectedIssue = null;
            updateSelectedMemberInfo();
        } else if (tab === 'history') {
            // Focus on first member search input when switching to history tab
            setTimeout(() => document.getElementById('historyMemberSearch').focus(), 100);
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

        if (action === 'return' && selectedMember) {
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
        <div class="book-card">
            <h4>${book.title}</h4>
            <p><strong>ISBN:</strong> ${book.isbn}</p>
            <p><strong>Author:</strong> ${book.author}</p>
            <p><strong>Category:</strong> ${book.category}</p>
            <span class="status ${book.available ? 'available' : 'unavailable'}">
                ${book.available ? 'Available' : 'Issued'}
            </span>
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
        const response = await fetch(`../server/search_books.php?query=${encodeURIComponent(query)}&available=true`);
        const books = await response.json();
        displayIssueBooks(books);
    } catch (error) {
        console.error('Error searching books:', error);
    }
}

function displayIssueBooks(books) {
    const container = document.getElementById('issueBooksResults');

    if (books.length === 0) {
        container.innerHTML = '<div class="empty-state">No available books found</div>';
        return;
    }

    container.innerHTML = books.map(book => `
        <div class="book-item ${selectedBook?.isbn === book.isbn ? 'selected' : ''}" 
             onclick="selectBook('${book.isbn}', '${book.title.replace(/'/g, "\\'")}')">
            <h4>${book.title}</h4>
            <p>ISBN: ${book.isbn}</p>
            <p>Author: ${book.author}</p>
        </div>
    `).join('');
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