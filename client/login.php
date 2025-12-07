<?php
session_start();

if (isset($_SESSION['employee_id'])) {
    header('Location: dashboard.php');
    exit();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LMS - Login</title>
    <link rel="stylesheet" href="css/login.css">
</head>
<body>
    <div class="container">
        <div class="login-box">
            <h1>Library Management System</h1>
            <form id="loginForm">
                <div class="form-group">
                    <label for="employee_id">Employee ID</label>
                    <input type="text" id="employee_id" name="employee_id" required>
                </div>
                <button type="submit" class="btn-login">Login</button>
                <div id="error-message"></div>
            </form>
            <p style="margin-top:16px;font-size:14px;color:#666;">Members should use the login toggle on the <a href="index.php">public catalog</a>.</p>
        </div>
    </div>
    <script src="js/login.js"></script>
</body>
</html>