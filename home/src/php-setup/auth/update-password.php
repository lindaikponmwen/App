<?php
/**
 * Update Password API
 *
 * Securely updates a user's password using a valid reset token.
 * Validates token, updates password, and marks token as used.
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

    $token = $data['token'] ?? '';
    $newPassword = $data['password'] ?? '';
    $confirmPassword = $data['confirmPassword'] ?? '';

    // Validate required fields
    if (empty($token)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Reset token is required'
        ]);
        exit;
    }

    if (empty($newPassword)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Password is required'
        ]);
        exit;
    }

    // Validate password strength
    if (strlen($newPassword) < 8) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Password must be at least 8 characters long'
        ]);
        exit;
    }

    // Validate password confirmation
    if ($newPassword !== $confirmPassword) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Passwords do not match'
        ]);
        exit;
    }

    // Get database connection
    $db = Database::getInstance();

    // Verify token is valid
    $query = "SELECT pr.id, pr.email, pr.expires_at, pr.used
              FROM password_resets pr
              WHERE pr.token = ?
              LIMIT 1";

    $resetRecord = $db->queryOne($query, [$token]);

    if (!$resetRecord) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'Invalid or expired reset token'
        ]);
        exit;
    }

    if ($resetRecord['used']) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'This reset link has already been used'
        ]);
        exit;
    }

    if (strtotime($resetRecord['expires_at']) < time()) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'This reset link has expired. Please request a new one.'
        ]);
        exit;
    }

    // Begin transaction
    $db->beginTransaction();

    try {
        // Hash the new password with bcrypt
        $passwordHash = password_hash($newPassword, PASSWORD_BCRYPT, ['cost' => 12]);

        // Update user's password
        $updateQuery = "UPDATE users
                       SET password_hash = ?,
                           updated_at = NOW()
                       WHERE email = ?";

        $db->execute($updateQuery, [$passwordHash, $resetRecord['email']]);

        // Mark token as used
        $markUsedQuery = "UPDATE password_resets
                         SET used = TRUE
                         WHERE id = ?";

        $db->execute($markUsedQuery, [$resetRecord['id']]);

        // Commit transaction
        $db->commit();

        error_log("Password reset successful for: {$resetRecord['email']}");

        echo json_encode([
            'success' => true,
            'message' => 'Password has been reset successfully'
        ]);

    } catch (Exception $e) {
        // Rollback on error
        $db->rollback();
        throw $e;
    }

} catch (Exception $e) {
    error_log('Password update error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'An error occurred while updating your password'
    ]);
}
