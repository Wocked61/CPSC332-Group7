<?php
session_start();
require_once '../database/db_connect.php';

header('Content-Type: application/json');

if (!isset($_SESSION['employee_id'])) {
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);
$memberId = $input['member_id'] ?? 0;
$isbn = $input['isbn'] ?? '';
$loanDurationDays = isset($input['loan_duration_days']) ? (int)$input['loan_duration_days'] : null;
$dueDateInput = $input['due_date'] ?? null;

if (empty($memberId) || empty($isbn)) {
    echo json_encode(['success' => false, 'message' => 'Member ID and ISBN are required']);
    exit();
}

$DEFAULT_LOAN_DAYS = 14;

try {
    $today = new DateTime('today');

    if ($dueDateInput) {
        $dueDate = DateTime::createFromFormat('Y-m-d', $dueDateInput);
        if (!$dueDate) {
            throw new Exception('Invalid due date format. Use YYYY-MM-DD.');
        }
    } else {
        $duration = $loanDurationDays && $loanDurationDays > 0 ? $loanDurationDays : $DEFAULT_LOAN_DAYS;
        $dueDate = clone $today;
        $dueDate->modify("+{$duration} days");
    }

    if ($dueDate <= $today) {
        throw new Exception('Due date must be after today.');
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    exit();
}

// Check if book exists and is available
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
    $conn->close();
    exit();
}

$available = $book['quantity'] - $book['checked_out'];

if ($available <= 0) {
    echo json_encode(['success' => false, 'message' => 'No copies of this book are available']);
    $conn->close();
    exit();
}

// Issue the book
$dueDateStr = $dueDate->format('Y-m-d');
$stmt = $conn->prepare("INSERT INTO issues (member_id, isbn, due_date, status) VALUES (?, ?, ?, 'issued')");
$stmt->bind_param("iss", $memberId, $isbn, $dueDateStr);

if ($stmt->execute()) {
    echo json_encode([
        'success' => true,
        'due_date' => $dueDateStr,
        'loan_duration_days' => (int)$dueDate->diff($today)->format('%a')
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to issue book']);
}

$stmt->close();
$conn->close();
?>