<?php
session_start();

if (isset($_SESSION['employee_id'])) {
    header('Location: dashboard.php');
    exit();
}

if (isset($_SESSION['member_id'])) {
    header('Location: member/portal.php');
    exit();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Library Catalog</title>
    <link rel="stylesheet" href="css/home.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <script src="js/public_catalog.js" defer></script>
</head>
<body>
    <header class="masthead">
        <div class="brand">
            <p class="eyebrow">Library Management System</p>
            <h1>Browse the shelves in real time</h1>
            <p class="lede">Search by title, author, or category to see exactly how many copies are available before you visit.</p>
        </div>

        <div class="login-suite">
            <button class="login-toggle" id="memberLoginToggle" aria-haspopup="true" aria-expanded="false">
                Member login
                <span aria-hidden="true">▾</span>
            </button>
            <div class="login-dropdown hidden" id="memberLoginDropdown" role="dialog" aria-label="Member login">
                <p class="dropdown-lede">Sign in with the member ID on your library card to manage holds and loans.</p>
                <form id="inlineMemberLogin">
                    <label for="inlineMemberId">Member ID</label>
                    <input type="text" id="inlineMemberId" name="member_id" placeholder="e.g., 101" required autocomplete="off">
                    <button type="submit" class="primary-cta">Continue</button>
                    <p id="inlineMemberError" class="inline-error" role="status"></p>
                </form>
            </div>
        </div>
    </header>

    <main class="catalog-shell">
        <section class="search-panel" aria-labelledby="search-heading">
            <div class="panel-header">
                <p class="eyebrow">Public catalog</p>
                <h2 id="search-heading">Plan your next checkout.</h2>
                <p class="helper">Members can reserve books and see their loans once signed in.</p>
            </div>

            <form id="searchForm" class="search-form">
                <label class="field" for="searchInput">
                    <span>Keyword</span>
                    <input type="search" id="searchInput" name="q" placeholder="Try &quot;Python&quot; or an ISBN" autocomplete="off">
                </label>

                <label class="field" for="filterSelect">
                    <span>Focus on</span>
                    <select id="filterSelect" name="filter">
                        <option value="all" selected>All fields</option>
                        <option value="title">Title only</option>
                        <option value="author">Author</option>
                        <option value="category">Category</option>
                        <option value="isbn">ISBN</option>
                    </select>
                </label>

                <label class="toggle">
                    <input type="checkbox" id="availableToggle">
                    <span>Show books with copies ready to borrow</span>
                </label>

                <button type="submit" class="primary-cta">Search catalog</button>
            </form>
        </section>

        <section class="results-panel" aria-live="polite">
            <div class="results-header">
                <h2>Catalog results</h2>
                <p id="resultsSummary">Loading…</p>
            </div>
            <div id="resultsList" class="catalog-grid" role="list"></div>
            <div id="emptyState" class="empty-state hidden">
                <h3>No matches yet</h3>
                <p>Try a different keyword or remove filters to see more of the collection.</p>
            </div>
        </section>
    </main>

    <footer>
        <p>Library Management System · Team 7 · CPSC 332</p>
        <a class="staff-link" href="login.php">Employee login</a>
    </footer>
</body>
</html>
