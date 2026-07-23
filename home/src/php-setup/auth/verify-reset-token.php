<?php
/**
 * Verify Reset Token API
 *
 * API endpoint to verify if a password reset token is valid.
 * Used by frontend applications.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: ' . ($_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:5173'));
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/database.php';

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    // Get request data
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data) {
        throw new Exception('Invalid request data');
    }

    // Get token from request body
    $token = $data['token'] ?? '';

    if (empty($token)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Token is required'
        ]);
        exit;
    }

    // Get database connection
    $db = Database::getInstance();

    // Check if token exists and is valid
    $query = "SELECT pr.email, pr.expires_at, pr.used, u.name
              FROM password_resets pr
              JOIN users u ON pr.email = u.email
              WHERE pr.token = ?
              LIMIT 1";

    $resetRecord = $db->queryOne($query, [$token]);

    if (!$resetRecord) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'valid' => false,
            'error' => 'Invalid or expired reset token'
        ]);
        exit;
    }

    if ($resetRecord['used']) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'valid' => false,
            'error' => 'This reset link has already been used'
        ]);
        exit;
    }

    if (strtotime($resetRecord['expires_at']) < time()) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'valid' => false,
            'error' => 'This reset link has expired. Please request a new one.'
        ]);
        exit;
    }

    // Token is valid
    echo json_encode([
        'success' => true,
        'valid' => true,
        'email' => $resetRecord['email']
    ]);

} catch (Exception $e) {
    error_log('Token verification error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'An error occurred while verifying the token'
    ]);
}
