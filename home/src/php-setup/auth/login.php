<?php
/**
 * Login Endpoint
 *
 * Handles user authentication with security features:
 * - CSRF protection
 * - Rate limiting
 * - Password verification using bcrypt
 * - Secure session management
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: ' . ($_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:5173'));
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';

// Start session
Session::start();

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        throw new Exception('Invalid JSON input');
    }

    // Validate CSRF token
    $csrfToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!CSRF::validateToken($csrfToken)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Invalid CSRF token. Refresh the page and try again.']);
        exit;
    }

    // Validate required fields
    if (!isset($input['username']) || !isset($input['password'])) {
        throw new Exception('Username and password are required');
    }

    $username = Sanitize::string($input['username']);
    $password = $input['password'];

    // Check rate limiting
    $identifier = $username . '_' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
    if (RateLimit::isExceeded($identifier, 'login')) {
        http_response_code(429);
        echo json_encode([
            'success' => false,
            'error' => 'Too many login attempts. Please try again later.'
        ]);
        exit;
    }

    // Get database connection
    $db = getDatabase();

    // Find user by username
    $stmt = $db->prepare("
        SELECT u.*, GROUP_CONCAT(up.permission) as permissions
        FROM users u
        LEFT JOIN user_permissions up ON u.id = up.user_id
        WHERE u.username = ?
        GROUP BY u.id
    ");

    $stmt->execute([$username]);
    $user = $stmt->fetch();

    // Verify password
    if (!$user || !PasswordHash::verify($password, $user['password_hash'])) {
        // Record failed attempt
        RateLimit::recordAttempt($identifier, 'login');

        // Log failed attempt to database
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

    // Check if password needs rehashing
    if (PasswordHash::needsRehash($user['password_hash'])) {
        $newHash = PasswordHash::hash($password);
        $updateStmt = $db->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
        $updateStmt->execute([$newHash, $user['id']]);
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
    RateLimit::reset($identifier, 'login');

    // Set session data
    Session::setUser([
        'id' => $user['uid'],
        'username' => $user['username'],
        'role' => $user['role'],
        'email' => $user['email'],
        'name' => $user['name']
    ]);

    // Prepare user data for response (exclude sensitive data)
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

    // Generate new CSRF token for next request
    $newCsrfToken = CSRF::generateToken();

    echo json_encode([
        'success' => true,
        'user' => $userData,
        'csrfToken' => $newCsrfToken
    ]);

} catch (Exception $e) {
    error_log("Login error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'An error occurred during login']);
}
