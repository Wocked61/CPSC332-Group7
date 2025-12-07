<?php
session_start();
require_once '../database/db_connect.php';

header('Content-Type: application/json');

if (!isset($_SESSION['employee_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

$payload = json_decode(file_get_contents('php://input'), true) ?? [];
$reservationId = (int) ($payload['reservation_id'] ?? 0);
$newStatus = trim($payload['status'] ?? '');

$allowedStatuses = ['pending', 'ready', 'fulfilled', 'cancelled'];

if (!$reservationId || !in_array($newStatus, $allowedStatuses, true)) {
    http_response_code(422);
    echo json_encode(['error' => 'Invalid reservation update request.']);
    exit();
}

$stmt = $conn->prepare("UPDATE reservations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE reservation_id = ?");

if ($stmt === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Unable to prepare update statement.']);
    exit();
}

$stmt->bind_param('si', $newStatus, $reservationId);
$stmt->execute();

if ($stmt->affected_rows === 0) {
    http_response_code(404);
    echo json_encode(['error' => 'Reservation not found or already set to that status.']);
    $stmt->close();
    $conn->close();
    exit();
}

$stmt->close();
$conn->close();

echo json_encode(['success' => true, 'status' => $newStatus]);
