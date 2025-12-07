<?php
session_start();

if (!isset($_SESSION['member_id'])) {
    header('Location: ../index.php');
    exit();
}

$memberName = $_SESSION['member_name'] ?? 'Member';
$memberId = $_SESSION['member_id'];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Member Portal</title>
    <link rel="stylesheet" href="css/portal.css">
</head>
<body>
    <header class="member-header">
        <div>
            <p class="welcome">Welcome back,</p>
            <h1><?php echo htmlspecialchars($memberName); ?></h1>
            <p class="member-id">Member ID: <?php echo htmlspecialchars($memberId); ?></p>
        </div>
        <button id="memberLogoutBtn" class="btn secondary">Logout</button>
    </header>

    <main class="member-main">
        <div class="tabs">
            <button class="tab-btn active" data-tab="catalog">Browse Catalog</button>
            <button class="tab-btn" data-tab="requests">My Requests</button>
            <button class="tab-btn" data-tab="borrowing">My Borrowing</button>
        </div>

        <div class="tab-content active" id="catalog-tab">
            <div class="section-header">
                <div>
                    <h2>Browse Books</h2>
                    <p class="subtitle">Search by title, author, genre, or ISBN and reserve items online.</p>
                </div>
                <label class="checkbox">
                    <input type="checkbox" id="availableOnlyToggle">
                    <span>Show available only</span>
                </label>
            </div>
            <div class="search-row">
                <input type="text" id="catalogSearch" placeholder="Search by keyword...">
                <select id="catalogFilter">
                    <option value="all">All fields</option>
                    <option value="title">Title</option>
                    <option value="author">Author</option>
                    <option value="category">Genre</option>
                    <option value="isbn">ISBN</option>
                </select>
            </div>
            <div id="catalogMessage" class="alert" role="alert" aria-live="polite"></div>
            <div id="catalogResults" class="cards-grid"></div>
        </div>

        <div class="tab-content" id="requests-tab">
            <div class="section-header">
                <div>
                    <h2>My Requests</h2>
                    <p class="subtitle">Track the status of your reservations.</p>
                </div>
            </div>
            <div id="requestsMessage" class="alert" role="alert" aria-live="polite"></div>
            <div id="requestsTable" class="table-wrapper"></div>
        </div>

        <div class="tab-content" id="borrowing-tab">
            <div class="section-header">
                <div>
                    <h2>My Borrowing</h2>
                    <p class="subtitle">Check what you currently have out and review your history.</p>
                </div>
                <button id="refreshBorrowingBtn" class="btn tertiary">Refresh</button>
            </div>
            <div id="borrowingMessage" class="alert" role="alert" aria-live="polite"></div>

            <section>
                <h3>Active Loans</h3>
                <div id="activeLoans" class="cards-grid"></div>
            </section>

            <section>
                <h3>Borrowing History</h3>
                <div id="historyTable" class="table-wrapper"></div>
            </section>
        </div>
    </main>

    <script src="js/portal.js"></script>
</body>
</html>
