<?php
session_start();
require_once '../database/db_connect.php';

header('Content-Type: application/json');

if (!isset($_SESSION['employee_id'])) {
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

$memberId = $_GET['member_id'] ?? 0;
$filter = $_GET['filter'] ?? 'all'; // all, issued, returned

if (empty($memberId)) {
    echo json_encode([]);
    exit();
}

// Build the query based on filter
$sql = "SELECT i.issue_id, i.isbn, i.issue_date, i.return_date, i.status, 
               b.title, b.author, b.category,
               DATEDIFF(CURDATE(), i.issue_date) as days_issued,
               CASE 
                   WHEN i.status = 'issued' AND DATEDIFF(CURDATE(), i.issue_date) > 30 THEN 'overdue'
                   WHEN i.status = 'issued' THEN 'current'
                   ELSE 'returned'
               END as display_status
        FROM issues i 
        JOIN books b ON i.isbn = b.isbn 
        WHERE i.member_id = ?";

// Apply filter
if ($filter === 'issued') {
    $sql .= " AND i.status = 'issued'";
} elseif ($filter === 'returned') {
    $sql .= " AND i.status = 'returned'";
}

$sql .= " ORDER BY i.issue_date DESC";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $memberId);
$stmt->execute();
$result = $stmt->get_result();

$history = [];
while ($row = $result->fetch_assoc()) {
    $history[] = $row;
}

echo json_encode($history);

$stmt->close();
$conn->close();
?>
