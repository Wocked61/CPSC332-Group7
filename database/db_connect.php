<?php 
$dotenv = parse_ini_file(__DIR__ . '/../.env');
$host = $dotenv['DB_HOST'];
$port = $dotenv['DB_PORT'];
$user = $dotenv['DB_USER'];
$pass = $dotenv['DB_PASSWORD'];
$dbname = $dotenv['DB_NAME'];
$conn = new mysqli($host, $user, $pass, $dbname, $port);
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
return $conn;
?>