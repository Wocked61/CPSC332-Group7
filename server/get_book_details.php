<?php
session_start();
require_once '../database/db_connect.php';

header('Content-Type: application/json');

if (!isset($_SESSION['employee_id'])) {
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

$isbn = $_GET['isbn'] ?? '';

if (empty($isbn)) {
    echo json_encode(['error' => 'ISBN is required']);
    exit();
}

// Get book details
$stmt = $conn->prepare("SELECT isbn, title, author, category, quantity FROM books WHERE isbn = ?");
$stmt->bind_param("s", $isbn);
$stmt->execute();
$result = $stmt->get_result();
$book = $result->fetch_assoc();
$stmt->close();

if (!$book) {
    echo json_encode(['error' => 'Book not found']);
    exit();
}

// Get inventory stats
$stmt = $conn->prepare("
    SELECT 
        COUNT(CASE WHEN status = 'issued' THEN 1 END) as checked_out,
        COUNT(*) as ever_issued
    FROM issues
    WHERE isbn = ?
");
$stmt->bind_param("s", $isbn);
$stmt->execute();
$result = $stmt->get_result();
$stats = $result->fetch_assoc();
$stmt->close();

$total_quantity = $book['quantity'];
$checked_out = $stats['checked_out'];
$available = $total_quantity - $checked_out;

// Get current borrowing info (who has it checked out)
$stmt = $conn->prepare("
    SELECT 
        i.issue_id, 
        i.member_id, 
        m.first_name, 
        m.last_name, 
        i.issue_date,
        i.due_date,
        DATEDIFF(CURDATE(), i.issue_date) as days_issued,
        DATEDIFF(i.due_date, CURDATE()) as days_until_due,
        CASE 
            WHEN i.due_date < CURDATE() THEN 'overdue'
            ELSE 'current'
        END as status
    FROM issues i
    JOIN members m ON i.member_id = m.member_id
    WHERE i.isbn = ? AND i.status = 'issued'
    ORDER BY i.issue_date DESC
");
$stmt->bind_param("s", $isbn);
$stmt->execute();
$result = $stmt->get_result();
$currentBorrows = [];
while ($row = $result->fetch_assoc()) {
    $currentBorrows[] = $row;
}
$stmt->close();

// Get borrowing history (last 20 records)
$stmt = $conn->prepare("
    SELECT 
        i.issue_id,
        i.member_id,
        m.first_name,
        m.last_name,
        i.issue_date,
        i.due_date,
        i.return_date,
        i.status,
        DATEDIFF(COALESCE(i.return_date, CURDATE()), i.issue_date) as days_borrowed,
        GREATEST(DATEDIFF(COALESCE(i.return_date, CURDATE()), i.due_date), 0) as overdue_days
    FROM issues i
    JOIN members m ON i.member_id = m.member_id
    WHERE i.isbn = ?
    ORDER BY i.issue_date DESC
    LIMIT 20
");
$stmt->bind_param("s", $isbn);
$stmt->execute();
$result = $stmt->get_result();
$history = [];
while ($row = $result->fetch_assoc()) {
    $history[] = $row;
}
$stmt->close();

$conn->close();

echo json_encode([
    'success' => true,
    'book' => $book,
    'stats' => [
        'total' => (int)$total_quantity,
        'available' => (int)$available,
        'checked_out' => (int)$checked_out,
        'ever_issued' => (int)$stats['ever_issued']
    ],
    'current_borrows' => $currentBorrows,
    'history' => $history
]);
?>
