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
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $sql = "SELECT r.reservation_id, r.isbn, r.status, r.created_at, b.title
            FROM reservations r
            JOIN books b ON r.isbn = b.isbn
            WHERE r.member_id = ?
            ORDER BY r.created_at DESC";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('i', $memberId);
    $stmt->execute();
    $result = $stmt->get_result();

    $reservations = [];
    while ($row = $result->fetch_assoc()) {
        $reservations[] = $row;
    }

    $stmt->close();
    $conn->close();
    echo json_encode($reservations);
    exit();
}

if ($method === 'POST') {
    $payload = json_decode(file_get_contents('php://input'), true) ?? [];
    $isbn = trim($payload['isbn'] ?? '');

    if ($isbn === '') {
        echo json_encode(['success' => false, 'message' => 'ISBN is required.']);
        exit();
    }

    $bookStmt = $conn->prepare('SELECT title FROM books WHERE isbn = ?');
    $bookStmt->bind_param('s', $isbn);
    $bookStmt->execute();
    $bookResult = $bookStmt->get_result();

    if (!$bookResult->fetch_assoc()) {
        echo json_encode(['success' => false, 'message' => 'Book not found.']);
        $bookStmt->close();
        exit();
    }
    $bookStmt->close();

    $checkStmt = $conn->prepare("SELECT COUNT(*) as total FROM reservations WHERE member_id = ? AND isbn = ? AND status IN ('pending', 'ready')");
    $checkStmt->bind_param('is', $memberId, $isbn);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result()->fetch_assoc();
    $checkStmt->close();

    if ($checkResult['total'] > 0) {
        echo json_encode(['success' => false, 'message' => 'You already have an active reservation for this book.']);
        exit();
    }

    $insertStmt = $conn->prepare("INSERT INTO reservations (member_id, isbn, status) VALUES (?, ?, 'pending')");
    $insertStmt->bind_param('is', $memberId, $isbn);

    if ($insertStmt->execute()) {
        echo json_encode(['success' => true, 'reservation_id' => $insertStmt->insert_id]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Unable to create reservation.']);
    }

    $insertStmt->close();
    $conn->close();
    exit();
}

if ($method === 'DELETE') {
    $payload = json_decode(file_get_contents('php://input'), true) ?? [];
    $reservationId = (int) ($payload['reservation_id'] ?? 0);

    if (!$reservationId) {
        echo json_encode(['success' => false, 'message' => 'Invalid reservation ID.']);
        exit();
    }

    $stmt = $conn->prepare("UPDATE reservations SET status = 'cancelled' WHERE reservation_id = ? AND member_id = ? AND status = 'pending'");
    $stmt->bind_param('ii', $reservationId, $memberId);
    $stmt->execute();

    if ($stmt->affected_rows > 0) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Reservation cannot be cancelled.']);
    }

    $stmt->close();
    $conn->close();
    exit();
}

echo json_encode(['success' => false, 'message' => 'Unsupported method']);
?>
