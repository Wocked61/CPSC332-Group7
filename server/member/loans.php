<?php
session_start();
require_once '../../database/db_connect.php';

header('Content-Type: application/json');

if (!isset($_SESSION['member_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

$memberId = (int) $_SESSION['member_id'];

$activeSql = "SELECT 
        i.issue_id,
        i.isbn,
        i.issue_date,
        i.due_date,
        b.title,
        DATEDIFF(i.due_date, CURDATE()) AS days_remaining,
        CASE WHEN i.due_date < CURDATE() THEN 1 ELSE 0 END AS is_overdue
    FROM issues i
    JOIN books b ON i.isbn = b.isbn
    WHERE i.member_id = ? AND i.status = 'issued'
    ORDER BY i.due_date ASC";

$historySql = "SELECT 
        i.issue_id,
        i.isbn,
        i.issue_date,
        i.due_date,
        i.return_date,
        i.status,
        b.title
    FROM issues i
    JOIN books b ON i.isbn = b.isbn
    WHERE i.member_id = ?
    ORDER BY i.issue_date DESC";

$activeStmt = $conn->prepare($activeSql);
$activeStmt->bind_param('i', $memberId);
$activeStmt->execute();
$activeResult = $activeStmt->get_result();

$activeLoans = [];
while ($row = $activeResult->fetch_assoc()) {
    $row['is_overdue'] = (bool) $row['is_overdue'];
    $activeLoans[] = $row;
}
$activeStmt->close();

$historyStmt = $conn->prepare($historySql);
$historyStmt->bind_param('i', $memberId);
$historyStmt->execute();
$historyResult = $historyStmt->get_result();

$history = [];
while ($row = $historyResult->fetch_assoc()) {
    $history[] = $row;
}
$historyStmt->close();
$conn->close();

echo json_encode([
    'active' => $activeLoans,
    'history' => $history
]);
?>
