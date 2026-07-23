<?php
require_once 'php/config.php';
$db = getDB();
$stmt = $db->query("DESCRIBE users");
$columns = $stmt->fetchAll();
header('Content-Type: application/json');
echo json_encode($columns, JSON_PRETTY_PRINT);
?>
