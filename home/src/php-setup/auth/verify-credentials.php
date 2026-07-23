<?php
/**
 * Verify Credentials and Send 2FA Code
 *
 * Step 1 of two-factor authentication:
 * - Validates username and password
 * - Generates 10-digit verification code
 * - Sends code to user's email
 * - Stores code in session with expiry
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

Session::start();

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

    $csrfToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!CSRF::validateToken($csrfToken)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Invalid CSRF token. Refresh the page and try again.']);
        exit;
    }

    if (!isset($input['username']) || !isset($input['password'])) {
        throw new Exception('Username and password are required');
    }

    $username = Sanitize::string($input['username']);
    $password = $input['password'];

    $identifier = $username . '_' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
    if (RateLimit::isExceeded($identifier, 'login')) {
        http_response_code(429);
        echo json_encode([
            'success' => false,
            'error' => 'Too many login attempts. Please try again later.'
        ]);
        exit;
    }

    $db = getDatabase();

    $stmt = $db->prepare("
        SELECT u.*
        FROM users u
        WHERE u.username = ?
    ");

    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if (!$user || !PasswordHash::verify($password, $user['password_hash'])) {
        RateLimit::recordAttempt($identifier, 'login');

        $logStmt = $db->prepare("
            INSERT INTO login_attempts (username, ip_address, success)
            VALUES (?, ?, FALSE)
        ");
        $logStmt->execute([$username, $_SERVER['REMOTE_ADDR'] ?? 'unknown']);

        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Invalid username or password']);
        exit;
    }

    // Check if email is verified
    if (!$user['email_verified']) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'error' => 'Please verify your email address before logging in. Check your inbox for the verification link.'
        ]);
        exit;
    }

    // Check if account is active
    if (!$user['is_active']) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'error' => 'Your account is inactive. Please contact support.'
        ]);
        exit;
    }

    if (PasswordHash::needsRehash($user['password_hash'])) {
        $newHash = PasswordHash::hash($password);
        $updateStmt = $db->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
        $updateStmt->execute([$newHash, $user['id']]);
    }

    // Generate 10-digit verification code
    $verificationCode = str_pad(random_int(0, 9999999999), 10, '0', STR_PAD_LEFT);

    // Store in session with 10-minute expiry
    $_SESSION['2fa_uid'] = $user['uid'];
    $_SESSION['2fa_username'] = $user['username'];
    $_SESSION['2fa_code'] = $verificationCode;
    $_SESSION['2fa_expiry'] = time() + 600; // 10 minutes
    $_SESSION['2fa_attempts'] = 0;

    // Send verification code via email
    $to = $user['email'];
    $subject = 'Your Verification Code - DrLevy.Ai';
    $message = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .code-box { background: #f0f7ff; border: 2px solid #3B82F6; border-radius: 8px;
                       padding: 20px; text-align: center; margin: 20px 0; }
            .code { font-size: 32px; font-weight: bold; color: #3B82F6; letter-spacing: 8px; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class='container'>
            <h2>Two-Factor Authentication</h2>
            <p>Hello {$user['name']},</p>
            <p>You requested to sign in to your DrLevy.Ai account. Please use the verification code below:</p>

            <div class='code-box'>
                <div class='code'>{$verificationCode}</div>
            </div>

            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this code, please ignore this email or contact support if you have concerns.</p>

            <div class='footer'>
                <p>This is an automated message. Please do not reply to this email.</p>
                <p>&copy; " . date('Y') . " DrLevy.Ai. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    ";

    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= "From: noreply@drlevy.ai" . "\r\n";

    // In production, use a proper email service (SendGrid, AWS SES, etc.)
    // For development, log the code
    error_log("2FA Code for {$user['email']}: {$verificationCode}");

    // Uncomment to send actual email in production
    // mail($to, $subject, $message, $headers);

    $newCsrfToken = CSRF::generateToken();

    echo json_encode([
        'success' => true,
        'requiresTwoFactor' => true,
        'email' => $user['email'],
        'csrfToken' => $newCsrfToken
    ]);

} catch (Exception $e) {
    error_log("Verify credentials error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'An error occurred during authentication']);
}
