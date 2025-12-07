<?php
session_start();
require_once '../database/db_connect.php';

header('Content-Type: application/json');

if (!isset($_SESSION['employee_id'])) {
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

try {
    $borrowedSql = "SELECT 
            i.issue_id,
            i.member_id,
            m.first_name,
            m.last_name,
            i.isbn,
            b.title,
            b.author,
            i.issue_date,
            i.due_date,
            DATEDIFF(i.due_date, CURDATE()) AS days_remaining,
            CASE WHEN i.due_date < CURDATE() THEN 1 ELSE 0 END AS is_overdue
        FROM issues i
        JOIN members m ON i.member_id = m.member_id
        JOIN books b ON i.isbn = b.isbn
        WHERE i.status = 'issued'
        ORDER BY i.due_date ASC";

    $borrowedResult = $conn->query($borrowedSql);
    $borrowedBooks = [];
    while ($row = $borrowedResult->fetch_assoc()) {
        $row['is_overdue'] = (bool)$row['is_overdue'];
        $borrowedBooks[] = $row;
    }
    $borrowedResult->close();

    $overdueBooks = array_values(array_filter($borrowedBooks, function ($row) {
        return $row['is_overdue'];
    }));

    echo json_encode([
        'success' => true,
        'borrowed_books' => $borrowedBooks,
        'overdue_books' => $overdueBooks
    ]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

$conn->close();
?>
