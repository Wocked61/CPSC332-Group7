<?php
session_start();
require_once '../database/db_connect.php';

header('Content-Type: application/json');

if (!isset($_SESSION['employee_id'])) {
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

$memberId = $_GET['member_id'] ?? 0;

if (empty($memberId)) {
    echo json_encode([]);
    exit();
}

$sql = "SELECT 
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
    ORDER BY i.issue_date DESC";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $memberId);
$stmt->execute();
$result = $stmt->get_result();

$issues = [];
while ($row = $result->fetch_assoc()) {
    $row['is_overdue'] = (bool)$row['is_overdue'];
    $issues[] = $row;
}

echo json_encode($issues);

$stmt->close();
$conn->close();
?>