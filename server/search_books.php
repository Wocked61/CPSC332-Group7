<?php
session_start();
require_once '../database/db_connect.php';

header('Content-Type: application/json');

if (!isset($_SESSION['employee_id'])) {
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

$query = $_GET['query'] ?? '';
$filter = $_GET['filter'] ?? 'all';
$availableOnly = isset($_GET['available']) && $_GET['available'] === 'true';

$sql = "SELECT isbn, title, author, category, available FROM books WHERE 1=1";
$params = [];
$types = "";

if (!empty($query)) {
    if ($filter === 'all') {
        $sql .= " AND (isbn LIKE ? OR title LIKE ? OR author LIKE ? OR category LIKE ?)";
        $searchTerm = "%$query%";
        $params = [$searchTerm, $searchTerm, $searchTerm, $searchTerm];
        $types = "ssss";
    } else {
        $sql .= " AND $filter LIKE ?";
        $params = ["%$query%"];
        $types = "s";
    }
}

if ($availableOnly) {
    $sql .= " AND available = 1";
}

$sql .= " ORDER BY title";

$stmt = $conn->prepare($sql);
if (!empty($params)) {
    $stmt->bind_param($types, ...$params);
}
$stmt->execute();
$result = $stmt->get_result();

$books = [];
while ($row = $result->fetch_assoc()) {
    $row['available'] = (bool)$row['available'];
    $books[] = $row;
}

echo json_encode($books);

$stmt->close();
$conn->close();
?>