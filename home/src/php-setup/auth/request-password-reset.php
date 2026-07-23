<?php
/**
 * Request Password Reset
 *
 * Generates a password reset token and sends reset instructions via email.
 * Tokens expire after 1 hour for security.
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
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../config/email.php';

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

    // Generate secure reset token
    $resetToken = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', strtotime('+1 hour'));

    // Invalidate any existing password reset tokens for this email
    $deleteQuery = "DELETE FROM password_resets WHERE email = ?";
    $db->execute($deleteQuery, [$user['email']]);

    // Store reset token in password_resets table
    $insertQuery = "INSERT INTO password_resets (email, token, expires_at, used)
                    VALUES (?, ?, ?, FALSE)";

    $db->execute($insertQuery, [$user['email'], $resetToken, $expiresAt]);

    // Build reset link
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $resetLink = "{$protocol}://{$host}/reset-password?token={$resetToken}";

    // Send password reset email
    $emailSent = sendPasswordResetEmail($user['email'], $user['name'], $resetLink);

    // Log for development/debugging
    error_log("Password reset requested for user: {$user['name']} ({$user['email']})");
    error_log("Reset token: {$resetToken}");
    error_log("Reset link: {$resetLink}");
    error_log("Email sent: " . ($emailSent ? 'Yes' : 'No'));

    echo json_encode([
        'success' => true,
        'message' => 'Password reset instructions have been sent to your email',
        'emailSent' => $emailSent
    ]);

} catch (Exception $e) {
    error_log('Password reset request error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'An error occurred while processing your request'
    ]);
}
