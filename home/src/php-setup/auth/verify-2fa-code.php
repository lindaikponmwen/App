<?php
/**
 * Verify 2FA Code and Complete Login
 *
 * Step 2 of two-factor authentication:
 * - Validates the 10-digit verification code
 * - Checks code expiry and attempt limits
 * - Completes user login if code is valid
 * - Returns user session data
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

    if (!isset($input['username']) || !isset($input['code'])) {
        throw new Exception('Username and verification code are required');
    }

    $username = Sanitize::string($input['username']);
    $code = Sanitize::string($input['code']);

    // Check if 2FA session exists
    if (!isset($_SESSION['2fa_username']) || !isset($_SESSION['2fa_code'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'No verification session found. Please try logging in again.'
        ]);
        exit;
    }

    // Verify username matches session
    if ($_SESSION['2fa_username'] !== $username) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Invalid verification session. Please try logging in again.'
        ]);
        exit;
    }

    // Check if code is expired
    if (time() > $_SESSION['2fa_expiry']) {
        // Clean up session
        unset($_SESSION['2fa_username']);
        unset($_SESSION['2fa_code']);
        unset($_SESSION['2fa_expiry']);
        unset($_SESSION['2fa_attempts']);

        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Verification code has expired. Please try logging in again.'
        ]);
        exit;
    }

    // Check attempt limit
    if ($_SESSION['2fa_attempts'] >= 3) {
        // Clean up session
        unset($_SESSION['2fa_username']);
        unset($_SESSION['2fa_code']);
        unset($_SESSION['2fa_expiry']);
        unset($_SESSION['2fa_attempts']);

        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Too many failed attempts. Please try logging in again.'
        ]);
        exit;
    }

    // Verify the code
    if ($_SESSION['2fa_code'] !== $code) {
        $_SESSION['2fa_attempts']++;

        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'Invalid verification code. Please try again.'
        ]);
        exit;
    }

    // Code is valid - complete login
    $db = getDatabase();

    $stmt = $db->prepare("
        SELECT u.*, GROUP_CONCAT(up.permission) as permissions
        FROM users u
        LEFT JOIN user_permissions up ON u.id = up.user_id
        WHERE u.username = ?
        GROUP BY u.id
    ");

    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'User not found']);
        exit;
    }

    // Update user's last login and online status
    $updateStmt = $db->prepare("
        UPDATE users
        SET last_login = NOW(), is_online = TRUE, updated_at = NOW()
        WHERE id = ?
    ");
    $updateStmt->execute([$user['id']]);

    // Log successful login
    $logStmt = $db->prepare("
        INSERT INTO login_attempts (username, ip_address, success)
        VALUES (?, ?, TRUE)
    ");
    $logStmt->execute([$username, $_SERVER['REMOTE_ADDR'] ?? 'unknown']);

    // Reset rate limit
    $identifier = $username . '_' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
    RateLimit::reset($identifier, 'login');

    // Clean up 2FA session data
    unset($_SESSION['2fa_username']);
    unset($_SESSION['2fa_code']);
    unset($_SESSION['2fa_expiry']);
    unset($_SESSION['2fa_attempts']);

    // Set user session data
    Session::setUser([
        'id' => $user['uid'],
        'username' => $user['username'],
        'role' => $user['role']
    ]);

    // Prepare user data for response
    $userData = [
        'id' => $user['uid'],
        'username' => $user['username'],
        'email' => $user['email'],
        'name' => $user['name'],
        'initials' => $user['initials'],
        'avatar' => $user['avatar'],
        'role' => $user['role'],
        'department' => $user['department'],
        'title' => $user['title'],
        'phone' => $user['phone'],
        'address' => $user['address'],
        'dateOfBirth' => $user['date_of_birth'],
        'hireDate' => $user['hire_date'],
        'isOnline' => (bool)$user['is_online'],
        'lastLogin' => $user['last_login'],
        'permissions' => $user['permissions'] ? explode(',', $user['permissions']) : [],
        'createdAt' => $user['created_at'],
        'updatedAt' => $user['updated_at']
    ];

    // Calculate session expiry (24 hours)
    $sessionExpiry = date('Y-m-d\TH:i:s\Z', strtotime('+24 hours'));

    $newCsrfToken = CSRF::generateToken();

    echo json_encode([
        'success' => true,
        'user' => $userData,
        'sessionExpiry' => $sessionExpiry,
        'csrfToken' => $newCsrfToken
    ]);

} catch (Exception $e) {
    error_log("Verify 2FA code error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'An error occurred during verification']);
}
