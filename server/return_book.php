<?php
session_start();
require_once '../database/db_connect.php';

header('Content-Type: application/json');

if (!isset($_SESSION['employee_id'])) {
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);
$issueId = $input['issue_id'] ?? 0;

if (empty($issueId)) {
    echo json_encode(['success' => false, 'message' => 'Issue ID is required']);
    exit();
}

// Get the ISBN for this issue
$stmt = $conn->prepare("SELECT isbn FROM issues WHERE issue_id = ?");
$stmt->bind_param("i", $issueId);
$stmt->execute();
$result = $stmt->get_result();
$issue = $result->fetch_assoc();
$stmt->close();

if (!$issue) {
    echo json_encode(['success' => false, 'message' => 'Issue not found']);
    $conn->close();
    exit();
}

$isbn = $issue['isbn'];

// Update the issue status
$stmt = $conn->prepare("UPDATE issues SET status = 'returned', return_date = NOW() WHERE issue_id = ?");
$stmt->bind_param("i", $issueId);

if ($stmt->execute()) {
    // Update book availability
    $updateStmt = $conn->prepare("UPDATE books SET available = 1 WHERE isbn = ?");
    $updateStmt->bind_param("s", $isbn);
    $updateStmt->execute();
    $updateStmt->close();
    
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to return book']);
}

$stmt->close();
$conn->close();
?>