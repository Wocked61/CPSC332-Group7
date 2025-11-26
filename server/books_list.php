<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../db_connect.php';

$q = trim($_GET['q'] ?? '');

if ($q !== '') {
  $like = "%{$q}%";
  $stmt = $conn->prepare(
    "SELECT book_id, title, author, category, isbn, status
     FROM books
     WHERE title LIKE ? OR author LIKE ? OR category LIKE ? OR isbn LIKE ?
     ORDER BY book_id DESC"
  );
  $stmt->bind_param("ssss", $like, $like, $like, $like);
  $stmt->execute();
  $res = $stmt->get_result();
} else {
  $res = $conn->query(
    "SELECT book_id, title, author, category, isbn, status
     FROM books
     ORDER BY book_id DESC"
  );
}

$books = [];
while ($row = $res->fetch_assoc()) $books[] = $row;

echo json_encode(["ok" => true, "books" => $books]);
