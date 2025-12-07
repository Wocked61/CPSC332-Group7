<?php
session_start();
require_once '../database/db_connect.php';

header('Content-Type: application/json');

if (!isset($_SESSION['employee_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);
$firstName = trim($input['first_name'] ?? '');
$lastName = trim($input['last_name'] ?? '');

// Validation
if (empty($firstName) || empty($lastName)) {
    echo json_encode(['success' => false, 'message' => 'First name and last name are required']);
    exit();
}

if (strlen($firstName) > 100 || strlen($lastName) > 100) {
    echo json_encode(['success' => false, 'message' => 'Names must be less than 100 characters']);
    exit();
}

// Insert member
$stmt = $conn->prepare("INSERT INTO members (first_name, last_name) VALUES (?, ?)");
$stmt->bind_param("ss", $firstName, $lastName);

if ($stmt->execute()) {
    $memberId = $conn->insert_id;
    echo json_encode([
        'success' => true,
        'message' => 'Member registered successfully',
        'member_id' => $memberId,
        'first_name' => $firstName,
        'last_name' => $lastName
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to register member']);
}

$stmt->close();
$conn->close();
?>
