<?php
session_start();

if (isset($_SESSION['member_id'])) {
	header('Location: portal.php');
	exit();
}

header('Location: ../index.php');
exit();
?>
