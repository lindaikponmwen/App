<?php
/**
 * Session Verification Endpoint
 *
 * Checks if user session is valid and returns user data
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: ' . ($_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:5173'));
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';

// Start session
Session::start();

// Only accept GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    // Check if user is logged in
    if (!Session::isLoggedIn()) {
        echo json_encode([
            'authenticated' => false,
            'csrfToken' => CSRF::getToken()
        ]);
        exit;
    }

    // Get user session data
    $sessionUser = Session::getUser();

    if (!$sessionUser || !isset($sessionUser['id'])) {
        echo json_encode([
            'authenticated' => false,
            'csrfToken' => CSRF::getToken()
        ]);
        exit;
    }

    // Get full user data from database
    $db = getDatabase();
    $stmt = $db->prepare("
        SELECT u.*, GROUP_CONCAT(up.permission) as permissions
        FROM users u
        LEFT JOIN user_permissions up ON u.id = up.user_id
        WHERE u.uid = ?
        GROUP BY u.id
    ");

    $stmt->execute([$sessionUser['id']]);
    $user = $stmt->fetch();

    if (!$user) {
        Session::destroy();
        echo json_encode([
            'authenticated' => false,
            'csrfToken' => CSRF::getToken()
        ]);
        exit;
    }

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

    echo json_encode([
        'authenticated' => true,
        'user' => $userData,
        'csrfToken' => CSRF::getToken()
    ]);

} catch (Exception $e) {
    error_log("Verify session error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'authenticated' => false,
        'error' => 'An error occurred',
        'csrfToken' => CSRF::getToken()
    ]);
}
