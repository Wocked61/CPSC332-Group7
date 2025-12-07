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

// Check if book exists and is available
$stmt = $conn->prepare("SELECT b.quantity, COUNT(CASE WHEN i.status = 'issued' THEN 1 END) as checked_out
                        FROM books b
                        LEFT JOIN issues i ON b.isbn = i.isbn AND i.status = 'issued'
                        WHERE b.isbn = ?
                        GROUP BY b.isbn, b.quantity");
$stmt->bind_param("s", $isbn);
$stmt->execute();
$result = $stmt->get_result();
$book = $result->fetch_assoc();
$stmt->close();

if (!$book) {
    echo json_encode(['success' => false, 'message' => 'Book not found']);
    $conn->close();
    exit();
}

$available = $book['quantity'] - $book['checked_out'];

if ($available <= 0) {
    echo json_encode(['success' => false, 'message' => 'No copies of this book are available']);
    $conn->close();
    exit();
}

// Issue the book
$stmt = $conn->prepare("INSERT INTO issues (member_id, isbn, status) VALUES (?, ?, 'issued')");
$stmt->bind_param("is", $memberId, $isbn);

if ($stmt->execute()) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to issue book']);
}

$stmt->close();
$conn->close();
?>