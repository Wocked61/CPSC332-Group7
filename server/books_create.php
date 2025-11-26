<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../db_connect.php';

$title    = trim($_POST['title'] ?? '');
$author   = trim($_POST['author'] ?? '');
$category = trim($_POST['category'] ?? '');
$isbn     = trim($_POST['isbn'] ?? '');

if ($title === '' || $author === '' || $category === '' || $isbn === '') {
  http_response_code(400);
  echo json_encode(["ok" => false, "error" => "All fields are required."]);
  exit;
}


$stmt = $conn->prepare("INSERT INTO books (title, author, category, isbn) VALUES (?, ?, ?, ?)");
$stmt->bind_param("ssss", $title, $author, $category, $isbn);

if (!$stmt->execute()) {
  http_response_code(400);
  echo json_encode(["ok" => false, "error" => $stmt->error]);
  exit;
}

echo json_encode(["ok" => true, "book_id" => $stmt->insert_id]);
