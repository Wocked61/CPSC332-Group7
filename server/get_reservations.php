<?php
session_start();
require_once '../database/db_connect.php';

header('Content-Type: application/json');

if (!isset($_SESSION['employee_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

$statusFilter = $_GET['status'] ?? 'all';
$validStatuses = ['all', 'pending', 'ready', 'fulfilled', 'cancelled'];
if (!in_array($statusFilter, $validStatuses, true)) {
    $statusFilter = 'all';
}

$sql = "SELECT 
            r.reservation_id,
            r.member_id,
            r.isbn,
            r.status,
            r.created_at,
            r.updated_at,
            b.title,
            b.quantity,
            m.first_name,
            m.last_name,
            (
                SELECT COUNT(*) FROM issues i 
                WHERE i.isbn = r.isbn AND i.status = 'issued'
            ) as checked_out
        FROM reservations r
        INNER JOIN books b ON r.isbn = b.isbn
        INNER JOIN members m ON r.member_id = m.member_id";

$params = [];
$types = '';

if ($statusFilter !== 'all') {
    $sql .= " WHERE r.status = ?";
    $params[] = $statusFilter;
    $types = 's';
}

$sql .= " ORDER BY 
            FIELD(r.status, 'pending', 'ready', 'fulfilled', 'cancelled'),
            r.created_at DESC";

$stmt = $conn->prepare($sql);

if ($stmt === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to prepare reservation query.']);
    exit();
}

if (!empty($params)) {
    $stmt->bind_param($types, ...$params);
}

$stmt->execute();
$result = $stmt->get_result();

$reservations = [];
while ($row = $result->fetch_assoc()) {
    $checkedOut = (int) ($row['checked_out'] ?? 0);
    $quantity = (int) ($row['quantity'] ?? 0);
    $row['available_copies'] = max($quantity - $checkedOut, 0);
    $row['member_name'] = trim($row['first_name'] . ' ' . $row['last_name']);
    unset($row['first_name'], $row['last_name'], $row['quantity'], $row['checked_out']);
    $reservations[] = $row;
}

$stmt->close();
$conn->close();

echo json_encode($reservations);
