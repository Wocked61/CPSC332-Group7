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

// Get the issue details
$stmt = $conn->prepare("SELECT issue_id, status FROM issues WHERE issue_id = ?");
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

if ($issue['status'] === 'returned') {
    echo json_encode(['success' => false, 'message' => 'This book has already been returned']);
    $conn->close();
    exit();
}

// Update the issue status
$stmt = $conn->prepare("UPDATE issues SET status = 'returned', return_date = NOW() WHERE issue_id = ?");
$stmt->bind_param("i", $issueId);

if ($stmt->execute()) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to return book']);
}

$stmt->close();
$conn->close();
?>