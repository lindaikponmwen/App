<?php
/**
 * Resend Email Confirmation Endpoint
 *
 * Resends verification email to user
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: ' . ($_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:5173'));
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../config/email.php';

Session::start();

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        throw new Exception('Invalid JSON input');
    }

    if (empty($input['email'])) {
        throw new Exception('Email is required');
    }

    $email = Sanitize::email($input['email']);

    if (!Sanitize::isValidEmail($email)) {
        throw new Exception('Invalid email address');
    }

    // Get database connection
    $db = getDatabase();

    // Find user by email
    $stmt = $db->prepare("
        SELECT id, email, name, email_verified
        FROM users
        WHERE email = ?
    ");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        throw new Exception('No account found with this email address');
    }

    // Check if already verified
    if ($user['email_verified']) {
        throw new Exception('This email has already been verified');
    }

    // Generate new verification token
    $verificationToken = bin2hex(random_bytes(32));
    $verificationExpires = date('Y-m-d H:i:s', strtotime('+24 hours'));

    // Update user with new token
    $updateStmt = $db->prepare("
        UPDATE users
        SET email_verification_token = ?,
            email_verification_expires = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ");
    $updateStmt->execute([$verificationToken, $verificationExpires, $user['id']]);

    // Send verification email
    $frontendUrl = getenv('FRONTEND_URL') ?: 'http://localhost:5173';
    $verificationLink = $frontendUrl . '/verify-email?token=' . $verificationToken;

    $emailSent = sendEmailVerificationEmail($email, $user['name'], $verificationLink);

    if (!$emailSent) {
        error_log("Failed to resend verification email to: {$email}");
        throw new Exception('Failed to send verification email. Please try again later.');
    }

    // Generate new CSRF token
    $newCsrfToken = CSRF::generateToken();

    echo json_encode([
        'success' => true,
        'message' => 'Verification email has been resent. Please check your inbox.',
        'csrfToken' => $newCsrfToken
    ]);

} catch (Exception $e) {
    error_log("Resend confirmation error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
