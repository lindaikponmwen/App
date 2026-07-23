<?php
/**
 * Email Confirmation Endpoint
 *
 * Confirms user's email address and activates their account
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: ' . ($_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:5173'));
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';

Session::start();

// Only accept POST and GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    $token = '';

    // Get token from POST or GET
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            throw new Exception('Invalid JSON input');
        }
        $token = $input['token'] ?? '';
    } else {
        $token = $_GET['token'] ?? '';
    }

    if (empty($token)) {
        throw new Exception('Verification token is required');
    }

    // Get database connection
    $db = getDatabase();

    // Find user with this token
    $stmt = $db->prepare("
        SELECT id, email, name, email_verified, email_verification_expires
        FROM users
        WHERE email_verification_token = ?
    ");
    $stmt->execute([$token]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        throw new Exception('Invalid or expired verification token');
    }

    // Check if already verified
    if ($user['email_verified']) {
        throw new Exception('Email has already been verified');
    }

    // Check if token expired
    $expiresAt = strtotime($user['email_verification_expires']);
    if ($expiresAt < time()) {
        throw new Exception('Verification token has expired. Please request a new verification email.');
    }

    // Update user: set email_verified = TRUE, is_active = TRUE, clear verification token
    $updateStmt = $db->prepare("
        UPDATE users
        SET email_verified = TRUE,
            is_active = TRUE,
            email_verification_token = NULL,
            email_verification_expires = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ");
    $updateStmt->execute([$user['id']]);

    // Generate new CSRF token
    $newCsrfToken = CSRF::generateToken();

    echo json_encode([
        'success' => true,
        'message' => 'Email verified successfully. Your account is now active.',
        'csrfToken' => $newCsrfToken
    ]);

} catch (Exception $e) {
    error_log("Email confirmation error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
