<?php
require_once '../database/db_connect.php';

header('Content-Type: application/json');

$query = trim($_GET['query'] ?? '');
$filter = $_GET['filter'] ?? 'all';
$availableOnly = isset($_GET['available']) && $_GET['available'] === 'true';

$sql = "SELECT 
            b.isbn,
            b.title,
            b.author,
            b.category,
            b.quantity,
            COUNT(CASE WHEN i.status = 'issued' THEN 1 END) AS checked_out
        FROM books b
        LEFT JOIN issues i ON b.isbn = i.isbn AND i.status = 'issued'
        WHERE 1 = 1";

$params = [];
$types = '';

if ($query !== '') {
    $searchTerm = "%$query%";

    if ($filter === 'all') {
        $sql .= " AND (b.isbn LIKE ? OR b.title LIKE ? OR b.author LIKE ? OR b.category LIKE ? )";
        $params = [$searchTerm, $searchTerm, $searchTerm, $searchTerm];
        $types = 'ssss';
    } elseif (in_array($filter, ['isbn', 'title', 'author', 'category'], true)) {
        $sql .= " AND b.$filter LIKE ?";
        $params[] = $searchTerm;
        $types = 's';
    }
}

$sql .= " GROUP BY b.isbn, b.title, b.author, b.category, b.quantity";

if ($availableOnly) {
    $sql .= " HAVING (b.quantity - checked_out) > 0";
}

$sql .= " ORDER BY b.title";

$stmt = $conn->prepare($sql);

if ($stmt === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Unable to prepare catalog query.']);
    exit();
}

if (!empty($params)) {
    $stmt->bind_param($types, ...$params);
}

$stmt->execute();
$result = $stmt->get_result();

$books = [];
while ($row = $result->fetch_assoc()) {
    $availableCopies = (int)$row['quantity'] - (int)$row['checked_out'];
    $row['available_copies'] = max($availableCopies, 0);
    $row['available'] = $availableCopies > 0;
    $books[] = $row;
}

$stmt->close();
$conn->close();

echo json_encode($books);
