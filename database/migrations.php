<?php
/**
 * Simple migration runner to keep the database schema in sync with the app expectations.
 */
function runMigrations(mysqli $conn): void
{
    ensureIssuesDueDateColumn($conn);
    ensureReservationsTable($conn);
}

/**
 * Ensure the `issues` table has a non-nullable `due_date` column filled with sensible defaults.
 */
function ensureIssuesDueDateColumn(mysqli $conn): void
{
    // Make sure the issues table exists before attempting to alter it.
    $tablesResult = $conn->query("SHOW TABLES LIKE 'issues'");
    if (!$tablesResult || $tablesResult->num_rows === 0) {
        return;
    }

    $columnResult = $conn->query("SHOW COLUMNS FROM issues LIKE 'due_date'");
    if ($columnResult && $columnResult->num_rows > 0) {
        return; // Column already exists, nothing to do.
    }

    // Add the column, backfill data, then enforce NOT NULL.
    $conn->query("ALTER TABLE issues ADD COLUMN due_date DATE DEFAULT NULL");
    $conn->query("UPDATE issues SET due_date = DATE_ADD(issue_date, INTERVAL 14 DAY) WHERE due_date IS NULL");
    $conn->query("ALTER TABLE issues MODIFY due_date DATE NOT NULL");
}

function ensureReservationsTable(mysqli $conn): void
{
    $tablesResult = $conn->query("SHOW TABLES LIKE 'reservations'");
    if ($tablesResult && $tablesResult->num_rows > 0) {
        return;
    }

    $createSql = "CREATE TABLE reservations (
        reservation_id INT AUTO_INCREMENT PRIMARY KEY,
        member_id INT NOT NULL,
        isbn VARCHAR(20) NOT NULL,
        status ENUM('pending', 'ready', 'fulfilled', 'cancelled') DEFAULT 'pending',
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (member_id) REFERENCES members(member_id),
        FOREIGN KEY (isbn) REFERENCES books(isbn)
    )";

    $conn->query($createSql);
}
