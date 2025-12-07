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
            <button class="tab-btn" data-tab="members">Manage Issues</button>
            <button class="tab-btn" data-tab="register">Register Member</button>
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

        <!-- Members/Issues Tab -->
        <div id="members-tab" class="tab-content">
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

        <!-- Register Member Tab -->
        <div id="register-tab" class="tab-content">
            <h2>Register New Member</h2>
            <form id="registerForm" class="registration-form">
                <div class="form-group">
                    <label for="regFirstName">First Name</label>
                    <input type="text" id="regFirstName" name="first_name" placeholder="Enter first name" required>
                </div>
                <div class="form-group">
                    <label for="regLastName">Last Name</label>
                    <input type="text" id="regLastName" name="last_name" placeholder="Enter last name" required>
                </div>
                <button type="submit" class="btn-register">Register Member</button>
                <div id="register-message"></div>
            </form>
            <div id="registerSuccess" class="register-success"></div>
        </div>
    </div>

    <script src="js/dashboard.js"></script>
    <script src="js/register_member.js"></script>
</body>
</html>