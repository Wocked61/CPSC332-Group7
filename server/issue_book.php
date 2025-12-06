<?php
session_start();
require_once '../database/db_connect.php';

header('Content-Type: application/json');

if (!isset($_SESSION['employee_id'])) {
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);
$memberId = $input['member_id'] ?? 0;
$isbn = $input['isbn'] ?? '';

if (empty($memberId) || empty($isbn)) {
    echo json_encode(['success' => false, 'message' => 'Member ID and ISBN are required']);
    exit();
}

// Check if book is available
$stmt = $conn->prepare("SELECT available FROM books WHERE isbn = ?");
$stmt->bind_param("s", $isbn);
$stmt->execute();
$result = $stmt->get_result();
$book = $result->fetch_assoc();

if (!$book || !$book['available']) {
    echo json_encode(['success' => false, 'message' => 'Book is not available']);
    $stmt->close();
    $conn->close();
    exit();
}
$stmt->close();

// Issue the book
$stmt = $conn->prepare("INSERT INTO issues (member_id, isbn) VALUES (?, ?)");
$stmt->bind_param("is", $memberId, $isbn);

if ($stmt->execute()) {
    // Update book availability
    $updateStmt = $conn->prepare("UPDATE books SET available = 0 WHERE isbn = ?");
    $updateStmt->bind_param("s", $isbn);
    $updateStmt->execute();
    $updateStmt->close();
    
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to issue book']);
}

$stmt->close();
$conn->close();
?>