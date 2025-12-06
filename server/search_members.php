<?php
session_start();
require_once '../database/db_connect.php';

header('Content-Type: application/json');

if (!isset($_SESSION['employee_id'])) {
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

$query = $_GET['query'] ?? '';

$sql = "SELECT member_id, first_name, last_name FROM members WHERE 1=1";
$params = [];
$types = "";

if (!empty($query)) {
    $sql .= " AND (CONCAT(first_name, ' ', last_name) LIKE ? OR member_id LIKE ?)";
    $searchTerm = "%$query%";
    $params = [$searchTerm, $searchTerm];
    $types = "ss";
}

$sql .= " ORDER BY last_name, first_name";

$stmt = $conn->prepare($sql);
if (!empty($params)) {
    $stmt->bind_param($types, ...$params);
}
$stmt->execute();
$result = $stmt->get_result();

$members = [];
while ($row = $result->fetch_assoc()) {
    $members[] = $row;
}

echo json_encode($members);

$stmt->close();
$conn->close();
?>