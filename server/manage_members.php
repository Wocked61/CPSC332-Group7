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
    // Get all members with their activity stats
    $sql = "SELECT 
                m.member_id,
                m.first_name,
                m.last_name,
                m.created_at AS join_date,
                COUNT(CASE WHEN i.status = 'issued' THEN 1 END) as currently_issued,
                COUNT(CASE WHEN i.status = 'issued' AND i.due_date < CURDATE() THEN 1 END) as overdue_issues,
                COUNT(i.issue_id) as total_borrowed
            FROM members m
            LEFT JOIN issues i ON m.member_id = i.member_id
            GROUP BY m.member_id, m.first_name, m.last_name, m.created_at
            ORDER BY m.last_name, m.first_name";
    
    $result = $conn->query($sql);
    $members = [];
    
    while ($row = $result->fetch_assoc()) {
        $members[] = $row;
    }
    
    echo json_encode(['success' => true, 'members' => $members]);
    
} elseif ($action === 'edit_member') {
    // Edit member details
    $memberId = intval($_POST['member_id'] ?? 0);
    $firstName = trim($_POST['first_name'] ?? '');
    $lastName = trim($_POST['last_name'] ?? '');
    
    if (empty($memberId) || empty($firstName) || empty($lastName)) {
        echo json_encode(['success' => false, 'message' => 'All fields are required']);
        exit();
    }
    
    // Update member
    $stmt = $conn->prepare("UPDATE members SET first_name = ?, last_name = ? WHERE member_id = ?");
    $stmt->bind_param("ssi", $firstName, $lastName, $memberId);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Member updated successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update member']);
    }
    
    $stmt->close();
    
} elseif ($action === 'delete_member') {
    // Delete member (only if no active issues)
    $memberId = intval($_POST['member_id'] ?? 0);
    
    if (empty($memberId)) {
        echo json_encode(['success' => false, 'message' => 'Member ID is required']);
        exit();
    }
    
    // Check if member has active issues
    $stmt = $conn->prepare("SELECT COUNT(*) as active_issues FROM issues WHERE member_id = ? AND status = 'issued'");
    $stmt->bind_param("i", $memberId);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $stmt->close();
    
    if ($row['active_issues'] > 0) {
        echo json_encode(['success' => false, 'message' => 'Cannot delete member with active issues. Please return all books first.']);
        exit();
    }
    
    // Delete member
    $stmt = $conn->prepare("DELETE FROM members WHERE member_id = ?");
    $stmt->bind_param("i", $memberId);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Member deleted successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to delete member']);
    }
    
    $stmt->close();
    
} elseif ($action === 'get_member_details') {
    // Get detailed member info including borrowing stats
    $memberId = intval($_GET['member_id'] ?? 0);
    
    if (empty($memberId)) {
        echo json_encode(['error' => 'Member ID is required']);
        exit();
    }
    
    // Get member info
    $stmt = $conn->prepare("SELECT member_id, first_name, last_name, created_at FROM members WHERE member_id = ?");
    $stmt->bind_param("i", $memberId);
    $stmt->execute();
    $result = $stmt->get_result();
    $member = $result->fetch_assoc();
    $stmt->close();
    
    if (!$member) {
        echo json_encode(['error' => 'Member not found']);
        exit();
    }
    
    // Get borrowing stats
    $stmt = $conn->prepare("SELECT 
                                COUNT(*) as total_borrowed,
                                COUNT(CASE WHEN status = 'issued' THEN 1 END) as currently_issued,
                                COUNT(CASE WHEN status = 'returned' THEN 1 END) as returned,
                                COUNT(CASE WHEN status = 'issued' AND due_date < CURDATE() THEN 1 END) as overdue,
                                COUNT(CASE WHEN status = 'returned' AND return_date > due_date THEN 1 END) as returned_late
                            FROM issues WHERE member_id = ?");
    $stmt->bind_param("i", $memberId);
    $stmt->execute();
    $result = $stmt->get_result();
    $stats = $result->fetch_assoc();
    $stmt->close();
    
    echo json_encode([
        'success' => true,
        'member' => $member,
        'stats' => $stats
    ]);
    
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid action']);
}

$conn->close();
?>
