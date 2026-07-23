<?php
/**
 * Check if User Exists
 *
 * Validates whether a user exists with the given email and username combination.
 * Used for password reset validation.
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';

header('Content-Type: application/json');

try {
    // Validate CSRF token
    validateCsrfToken();

    // Get request data
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data) {
        throw new Exception('Invalid request data');
    }

    $email = $data['email'] ?? '';
    $username = $data['username'] ?? '';

    // Validate required fields
    if (empty($email) || empty($username)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Email and username are required'
        ]);
        exit;
    }

    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Invalid email format'
        ]);
        exit;
    }

    // Get database connection
    $db = Database::getInstance();

    // Check if user exists with matching email and username
    $query = "SELECT id, email, username, name
              FROM users
              WHERE email = ? AND username = ?
              LIMIT 1";

    $user = $db->queryOne($query, [$email, $username]);

    if (!$user) {
        // Don't reveal which field is incorrect for security
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'No account found with this email and username combination'
        ]);
        exit;
    }

    // User exists
    echo json_encode([
        'success' => true,
        'exists' => true,
        'message' => 'User found'
    ]);

} catch (Exception $e) {
    error_log('Check user exists error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'An error occurred while checking user information'
    ]);
}
