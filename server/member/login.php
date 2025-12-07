<?php
session_start();
require_once '../../database/db_connect.php';

header('Content-Type: application/json');

$payload = json_decode(file_get_contents('php://input'), true) ?? [];
$memberId = trim($payload['member_id'] ?? '');

if ($memberId === '') {
    echo json_encode(['success' => false, 'message' => 'Member ID is required.']);
    exit();
}

$stmt = $conn->prepare('SELECT member_id, first_name, last_name FROM members WHERE member_id = ?');
$stmt->bind_param('i', $memberId);
$stmt->execute();
$result = $stmt->get_result();

if ($member = $result->fetch_assoc()) {
    $_SESSION['member_id'] = $member['member_id'];
    $_SESSION['member_name'] = $member['first_name'] . ' ' . $member['last_name'];

    echo json_encode([
        'success' => true,
        'member' => [
            'id' => $member['member_id'],
            'name' => $_SESSION['member_name']
        ]
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Member not found.']);
}

$stmt->close();
$conn->close();
?>
