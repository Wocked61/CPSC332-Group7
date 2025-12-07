<?php
session_start();
require_once '../../database/db_connect.php';

header('Content-Type: application/json');

if (!isset($_SESSION['member_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

$query = $_GET['query'] ?? '';
$filter = $_GET['filter'] ?? 'all';
$availableOnly = isset($_GET['availableOnly']) && $_GET['availableOnly'] === 'true';

$allowedFilters = ['all', 'isbn', 'title', 'author', 'category'];
if (!in_array($filter, $allowedFilters, true)) {
    $filter = 'all';
}

$sql = "SELECT 
            b.isbn,
            b.title,
            b.author,
            b.category,
            b.quantity,
            COUNT(CASE WHEN i.status = 'issued' THEN 1 END) as checked_out
        FROM books b
        LEFT JOIN issues i ON b.isbn = i.isbn AND i.status = 'issued'
        WHERE 1=1";

$params = [];
$types = '';

if (!empty($query)) {
    if ($filter === 'all') {
        $sql .= " AND (b.isbn LIKE ? OR b.title LIKE ? OR b.author LIKE ? OR b.category LIKE ?)";
        $searchTerm = "%$query%";
        $params = [$searchTerm, $searchTerm, $searchTerm, $searchTerm];
        $types = 'ssss';
    } else {
        $sql .= " AND b.$filter LIKE ?";
        $params = ["%$query%"];
        $types = 's';
    }
}

$sql .= " GROUP BY b.isbn, b.title, b.author, b.category, b.quantity";

if ($availableOnly) {
    $sql .= " HAVING (b.quantity - checked_out) > 0";
}

$sql .= " ORDER BY b.title";

$stmt = $conn->prepare($sql);
if (!empty($params)) {
    $stmt->bind_param($types, ...$params);
}
$stmt->execute();
$result = $stmt->get_result();

$books = [];
while ($row = $result->fetch_assoc()) {
    $row['available'] = ($row['quantity'] - $row['checked_out']) > 0;
    $row['available_copies'] = max($row['quantity'] - $row['checked_out'], 0);
    $books[] = $row;
}

$stmt->close();
$conn->close();

echo json_encode($books);
?>
