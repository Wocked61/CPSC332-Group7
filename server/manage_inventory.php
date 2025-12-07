<?php
session_start();
require_once '../database/db_connect.php';

header('Content-Type: application/json');

if (!isset($_SESSION['employee_id'])) {
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

$action = $_GET['action'] ?? $_POST['action'] ?? '';

if ($action === 'get_all') {
    // Get all books with their inventory stats
    $sql = "SELECT 
                b.isbn, 
                b.title, 
                b.author, 
                b.category,
                b.quantity as total_copies,
                COUNT(CASE WHEN i.status = 'issued' THEN 1 END) as checked_out
            FROM books b
            LEFT JOIN issues i ON b.isbn = i.isbn AND i.status = 'issued'
            GROUP BY b.isbn, b.title, b.author, b.category, b.quantity
            ORDER BY b.title ASC";
    
    $result = $conn->query($sql);
    $books = [];
    
    while ($row = $result->fetch_assoc()) {
        $row['available_copies'] = $row['total_copies'] - $row['checked_out'];
        $books[] = $row;
    }
    
    echo json_encode(['success' => true, 'books' => $books]);
    
} elseif ($action === 'add_copy') {
    // Add a copy of an existing book (increment quantity)
    $isbn = $_POST['isbn'] ?? '';
    
    if (empty($isbn)) {
        echo json_encode(['success' => false, 'message' => 'ISBN is required']);
        exit();
    }
    
    // Check if book exists
    $stmt = $conn->prepare("SELECT isbn FROM books WHERE isbn = ? LIMIT 1");
    $stmt->bind_param("s", $isbn);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();
    
    if ($result->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'Book not found']);
        exit();
    }
    
    // Increment the quantity
    $stmt = $conn->prepare("UPDATE books SET quantity = quantity + 1 WHERE isbn = ?");
    $stmt->bind_param("s", $isbn);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Copy added successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to add copy: ' . $stmt->error]);
    }
    
    $stmt->close();
    
} elseif ($action === 'add_new_book') {
    // Add a completely new book
    $isbn = trim($_POST['isbn'] ?? '');
    $title = trim($_POST['title'] ?? '');
    $author = trim($_POST['author'] ?? '');
    $category = trim($_POST['category'] ?? '');
    $copies = intval($_POST['copies'] ?? 1);
    
    if (empty($isbn) || empty($title) || empty($author) || empty($category)) {
        echo json_encode(['success' => false, 'message' => 'All fields are required']);
        exit();
    }
    
    if ($copies < 1) {
        echo json_encode(['success' => false, 'message' => 'Copies must be at least 1']);
        exit();
    }
    
    // Check if book already exists
    $stmt = $conn->prepare("SELECT isbn FROM books WHERE isbn = ? LIMIT 1");
    $stmt->bind_param("s", $isbn);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();
    
    if ($result->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'Book with this ISBN already exists']);
        exit();
    }
    
    // Insert the new book with quantity
    $stmt = $conn->prepare("INSERT INTO books (isbn, title, author, category, quantity) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("ssssi", $isbn, $title, $author, $category, $copies);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => "New book added with $copies copies"]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to add new book']);
    }
    
    $stmt->close();
    
} elseif ($action === 'remove_copy') {
    // Remove a copy of a book (decrement quantity, don't go below 0)
    $isbn = $_POST['isbn'] ?? '';
    
    if (empty($isbn)) {
        echo json_encode(['success' => false, 'message' => 'ISBN is required']);
        exit();
    }
    
    // Get current quantity and checked out count
    $stmt = $conn->prepare("SELECT b.quantity, COUNT(CASE WHEN i.status = 'issued' THEN 1 END) as checked_out
                            FROM books b
                            LEFT JOIN issues i ON b.isbn = i.isbn AND i.status = 'issued'
                            WHERE b.isbn = ?
                            GROUP BY b.isbn, b.quantity");
    $stmt->bind_param("s", $isbn);
    $stmt->execute();
    $result = $stmt->get_result();
    $book = $result->fetch_assoc();
    $stmt->close();
    
    if (!$book) {
        echo json_encode(['success' => false, 'message' => 'Book not found']);
        exit();
    }
    
    $available = $book['quantity'] - $book['checked_out'];
    
    if ($available <= 0) {
        echo json_encode(['success' => false, 'message' => 'No available copies to remove (all are checked out)']);
        exit();
    }
    
    // Decrement the quantity
    $stmt = $conn->prepare("UPDATE books SET quantity = quantity - 1 WHERE isbn = ?");
    $stmt->bind_param("s", $isbn);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Copy removed successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to remove copy']);
    }
    
    $stmt->close();
    
} elseif ($action === 'edit_book') {
    // Edit book details (title, author, category)
    $isbn = $_POST['isbn'] ?? '';
    $title = trim($_POST['title'] ?? '');
    $author = trim($_POST['author'] ?? '');
    $category = trim($_POST['category'] ?? '');
    
    if (empty($isbn) || empty($title) || empty($author) || empty($category)) {
        echo json_encode(['success' => false, 'message' => 'All fields are required']);
        exit();
    }
    
    // Update all copies of this book
    $stmt = $conn->prepare("UPDATE books SET title = ?, author = ?, category = ? WHERE isbn = ?");
    $stmt->bind_param("ssss", $title, $author, $category, $isbn);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Book details updated successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update book details']);
    }
    
    $stmt->close();
    
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid action']);
}

$conn->close();
?>
