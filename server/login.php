<?php
session_start();
require_once '../database/db_connect.php';

header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
$employeeId = $input['employee_id'] ?? '';

if (empty($employeeId)) {
    echo json_encode(['success' => false, 'message' => 'Employee ID is required']);
    exit();
}

$stmt = $conn->prepare("SELECT employee_id FROM employees WHERE employee_id = ?");
$stmt->bind_param("s", $employeeId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $_SESSION['employee_id'] = $employeeId;
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid Employee ID']);
}

$stmt->close();
$conn->close();
?>