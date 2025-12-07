<?php
session_start();

unset($_SESSION['member_id'], $_SESSION['member_name']);

header('Content-Type: application/json');
echo json_encode(['success' => true]);
?>
