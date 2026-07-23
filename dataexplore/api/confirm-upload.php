<?php
require_once 'config.php';

// Validate Request Method
validateRequestMethod('POST');

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['key']) || !isset($data['status'])) {
    sendError('Invalid payload');
}

// Log success or update central DB
// file_put_contents('upload_log.txt', date('Y-m-d H:i:s') . " - Uploaded: " . $data['key'] . "\n", FILE_APPEND);

echo json_encode(['message' => 'Upload confirmed']);
?>