<?php
session_start();

if (!isset($_SESSION['employee_id'])) {
    header('Location: login.php');
    exit();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LMS - Dashboard</title>
    <link rel="stylesheet" href="css/dashboard.css">
</head>
<body>
    <div class="header">
        <h1>Library Management System</h1>
        <div class="user-info">
            <span>Employee: <?php echo htmlspecialchars($_SESSION['employee_id']); ?></span>
            <button id="logoutBtn" class="btn-logout">Logout</button>
        </div>
    </div>

    <div class="main-container">
        <div class="tabs">
            <button class="tab-btn active" data-tab="books">Browse Books</button>
            <button class="tab-btn" data-tab="issues">Manage Issues</button>
            <button class="tab-btn" data-tab="history">Borrowing History</button>
            <button class="tab-btn" data-tab="inventory">Inventory</button>
            <button class="tab-btn" data-tab="manage-members">Manage Members</button>
        </div>

        <!-- Books Tab -->
        <div id="books-tab" class="tab-content active">
            <div class="search-section">
                <input type="text" id="bookSearch" placeholder="Search by ISBN, Title, Author, or Category...">
                <select id="bookFilter">
                    <option value="all">All Fields</option>
                    <option value="isbn">ISBN</option>
                    <option value="title">Title</option>
                    <option value="author">Author</option>
                    <option value="category">Category</option>
                </select>
            </div>
            <div id="booksResults" class="results-grid"></div>
        </div>

        <!-- Issues Tab -->
        <div id="issues-tab" class="tab-content">
            <div class="two-column">
                <div class="left-panel">
                    <h3>Select Member</h3>
                    <div class="search-section">
                        <input type="text" id="memberSearch" placeholder="Search by Name or Member ID...">
                    </div>
                    <div id="membersResults" class="results-list"></div>
                    <div id="selectedMemberInfo" class="selected-info"></div>
                </div>
                
                <div class="right-panel">
                    <div class="action-tabs">
                        <button class="action-tab active" data-action="issue">Issue Book</button>
                        <button class="action-tab" data-action="return">Return Book</button>
                    </div>

                    <!-- Issue Book Section -->
                    <div id="issue-section" class="action-section active">
                        <h3>Issue Book</h3>
                        <div class="search-section">
                            <input type="text" id="issueBookSearch" placeholder="Search books...">
                        </div>
                        <div class="due-date-controls">
                            <div class="due-date-input">
                                <label for="issueDueDate">Due Date</label>
                                <input type="date" id="issueDueDate">
                                <div id="dueDateError" class="form-message error" style="display: none;"></div>
                            </div>
                            <div class="due-date-quick">
                                <span>Quick picks:</span>
                                <div class="quick-buttons">
                                    <button type="button" class="due-quick-btn" data-days="7">7 days</button>
                                    <button type="button" class="due-quick-btn" data-days="14">14 days</button>
                                    <button type="button" class="due-quick-btn" data-days="21">21 days</button>
                                </div>
                            </div>
                        </div>
                        <div id="issueDueSummary" class="due-summary"></div>
                        <div id="issueBooksResults" class="results-list"></div>
                        <button id="issueBtn" class="btn-action" disabled>Issue Selected Book</button>
                    </div>

                    <!-- Return Book Section -->
                    <div id="return-section" class="action-section">
                        <h3>Return Book</h3>
                        <div id="issuedBooksResults" class="results-list"></div>
                        <button id="returnBtn" class="btn-action" disabled>Return Selected Book</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Manage Members Tab -->
        <div id="manage-members-tab" class="tab-content">
            <h2>Manage Members</h2>
            <div class="members-toolbar">
                <input type="text" id="memberSearchFilter" placeholder="Search members by name or ID...">
                <button class="btn btn-primary" onclick="openRegisterMemberModal()">+ Register Member</button>
            </div>
            <div id="membersListResults" class="members-list"></div>
        </div>

        <!-- Borrowing History Tab -->
        <div id="history-tab" class="tab-content">
            <h2>Borrowing History</h2>
            <div class="history-container">
                <div class="history-left-panel">
                    <h3>Select Member</h3>
                    <div class="search-section">
                        <input type="text" id="historyMemberSearch" placeholder="Search by Name or Member ID...">
                    </div>
                    <div id="historyMembersResults" class="results-list"></div>
                    <div id="selectedHistoryMemberInfo" class="selected-info"></div>
                </div>

                <div class="history-right-panel">
                    <div class="history-filter-section">
                        <button class="history-filter active" data-filter="all">All Records</button>
                        <button class="history-filter" data-filter="issued">Currently Issued</button>
                        <button class="history-filter" data-filter="returned">Returned</button>
                    </div>
                    <div id="historyResults" class="history-results"></div>
                </div>
            </div>
        </div>

        <!-- Inventory Management Tab -->
        <div id="inventory-tab" class="tab-content">
            <h2>Inventory Management</h2>
            <div class="inventory-toolbar">
                <button class="btn btn-primary" id="newBookBtn" onclick="openNewBookModal()">+ New Book</button>
            </div>
            <div class="inventory-info">
                <p>Manage library book inventory. Add new books, remove copies, or edit existing entries.</p>
            </div>
            <div id="inventoryResults" class="inventory-results"></div>
        </div>
    </div>

    <script src="js/dashboard.js"></script>
    <script src="js/register_member.js"></script>
    <script src="js/borrowing_history.js"></script>
    <script src="js/book_details.js"></script>
    <script src="js/inventory_management.js"></script>
    <script src="js/manage_members.js"></script>

    <!-- Book Details Modal -->
    <div id="bookModal" class="modal">
        <div class="modal-content">
            <button class="modal-close">&times;</button>
            
            <div class="modal-header">
                <h2 id="modalBookTitle"></h2>
                <p class="modal-isbn" id="modalBookIsbn"></p>
            </div>

            <div class="modal-body">
                <!-- Book Info Section -->
                <div class="modal-section">
                    <h3>Book Information</h3>
                    <div class="book-info-grid">
                        <div class="info-item">
                            <span class="info-label">ISBN:</span>
                            <span class="info-value" id="modalIsbn"></span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Author:</span>
                            <span class="info-value" id="modalAuthor"></span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Category:</span>
                            <span class="info-value" id="modalCategory"></span>
                        </div>
                    </div>
                </div>

                <!-- Inventory Section -->
                <div class="modal-section">
                    <h3>Inventory</h3>
                    <div class="inventory-grid">
                        <div class="inventory-card total">
                            <div class="inventory-number" id="modalTotalQty">0</div>
                            <div class="inventory-label">Total Copies</div>
                        </div>
                        <div class="inventory-card available">
                            <div class="inventory-number" id="modalAvailableQty">0</div>
                            <div class="inventory-label">Available</div>
                        </div>
                        <div class="inventory-card checked-out">
                            <div class="inventory-number" id="modalCheckedOutQty">0</div>
                            <div class="inventory-label">Checked Out</div>
                        </div>
                    </div>
                </div>

                <!-- Current Borrowing Section -->
                <div class="modal-section">
                    <h3>Currently Borrowed By</h3>
                    <div id="modalCurrentBorrows" class="borrowing-list">
                        <div class="empty-state">No one currently has this book</div>
                    </div>
                </div>

                <!-- Borrowing History Section -->
                <div class="modal-section">
                    <h3>Borrowing History (Last 20)</h3>
                    <div id="modalHistoryTable" class="history-scroll">
                        <div class="empty-state">No borrowing history</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- New Book Modal -->
    <div id="newBookModal" class="modal">
        <div class="modal-content modal-form">
            <button class="modal-close" onclick="closeNewBookModal()">&times;</button>
            
            <div class="modal-header">
                <h2>Add New Book</h2>
            </div>

            <div class="modal-body">
                <form id="newBookForm" onsubmit="submitNewBook(event)">
                    <div class="form-group">
                        <label for="newBookIsbn">ISBN *</label>
                        <input type="text" id="newBookIsbn" required placeholder="e.g., 978-0-13-468599-1">
                    </div>

                    <div class="form-group">
                        <label for="newBookTitle">Title *</label>
                        <input type="text" id="newBookTitle" required placeholder="Book Title">
                    </div>

                    <div class="form-group">
                        <label for="newBookAuthor">Author *</label>
                        <input type="text" id="newBookAuthor" required placeholder="Author Name">
                    </div>

                    <div class="form-group">
                        <label for="newBookCategory">Category *</label>
                        <input type="text" id="newBookCategory" required placeholder="e.g., Programming">
                    </div>

                    <div class="form-group">
                        <label for="newBookCopies">Number of Copies</label>
                        <input type="number" id="newBookCopies" min="1" value="1">
                    </div>

                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Add Book</button>
                        <button type="button" class="btn btn-secondary" onclick="closeNewBookModal()">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Edit Book Modal -->
    <div id="editBookModal" class="modal">
        <div class="modal-content modal-form">
            <button class="modal-close" onclick="closeEditBookModal()">&times;</button>
            
            <div class="modal-header">
                <h2>Edit Book Details</h2>
            </div>

            <div class="modal-body">
                <form id="editBookForm" onsubmit="submitEditBook(event)">
                    <div class="form-group">
                        <label for="editBookIsbn">ISBN (Read-only)</label>
                        <input type="text" id="editBookIsbn" readonly disabled>
                    </div>

                    <div class="form-group">
                        <label for="editBookTitle">Title *</label>
                        <input type="text" id="editBookTitle" required placeholder="Book Title">
                    </div>

                    <div class="form-group">
                        <label for="editBookAuthor">Author *</label>
                        <input type="text" id="editBookAuthor" required placeholder="Author Name">
                    </div>

                    <div class="form-group">
                        <label for="editBookCategory">Category *</label>
                        <input type="text" id="editBookCategory" required placeholder="e.g., Programming">
                    </div>

                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Save Changes</button>
                        <button type="button" class="btn btn-secondary" onclick="closeEditBookModal()">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Edit Member Modal -->
    <div id="editMemberModal" class="modal">
        <div class="modal-content modal-form">
            <button class="modal-close" onclick="closeEditMemberModal()">&times;</button>
            
            <div class="modal-header">
                <h2>Edit Member Details</h2>
            </div>

            <div class="modal-body">
                <form id="editMemberForm">
                    <div class="form-group">
                        <label for="editMemberFirstName">First Name *</label>
                        <input type="text" id="editMemberFirstName" required placeholder="First Name">
                    </div>

                    <div class="form-group">
                        <label for="editMemberLastName">Last Name *</label>
                        <input type="text" id="editMemberLastName" required placeholder="Last Name">
                    </div>

                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Save Changes</button>
                        <button type="button" class="btn btn-secondary" onclick="closeEditMemberModal()">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Register Member Modal -->
    <div id="registerMemberModal" class="modal">
        <div class="modal-content modal-form">
            <button class="modal-close" onclick="closeRegisterMemberModal()">&times;</button>
            
            <div class="modal-header">
                <h2>Register New Member</h2>
            </div>

            <div class="modal-body">
                <form id="registerForm">
                    <div class="form-group">
                        <label for="regFirstName">First Name *</label>
                        <input type="text" id="regFirstName" name="first_name" placeholder="Enter first name" required>
                    </div>

                    <div class="form-group">
                        <label for="regLastName">Last Name *</label>
                        <input type="text" id="regLastName" name="last_name" placeholder="Enter last name" required>
                    </div>

                    <div id="register-message" class="form-message"></div>

                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Register Member</button>
                        <button type="button" class="btn btn-secondary" onclick="closeRegisterMemberModal()">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div id="deleteConfirmModal" class="modal">
        <div class="modal-content modal-form modal-confirm">
            <div class="modal-header">
                <h2>Confirm Delete</h2>
            </div>

            <div class="modal-body">
                <p id="deleteConfirmMessage" class="confirm-message"></p>
                
                <div class="form-actions">
                    <button id="confirmDeleteBtn" class="btn btn-danger">Delete</button>
                    <button type="button" class="btn btn-secondary" onclick="closeDeleteConfirmModal()">Cancel</button>
                </div>
            </div>
        </div>
    </div>
</body>
</html>