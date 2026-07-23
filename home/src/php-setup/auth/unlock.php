<?php
/**
 * Unlock Session Endpoint
 *
 * Verifies password to unlock a locked session (after inactivity)
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

    // Check if user session exists
    if (!Session::isLoggedIn()) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'No active session']);
        exit;
    }

    // Validate required fields
    if (!isset($input['password'])) {
        throw new Exception('Password is required');
    }

    $password = $input['password'];

    // Get user from session
    $sessionUser = Session::getUser();

    if (!$sessionUser || !isset($sessionUser['id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Invalid session']);
        exit;
    }

    // Get database connection
    $db = getDatabase();

    // Get user from database
    $stmt = $db->prepare("SELECT password_hash FROM users WHERE id = ?");
    $stmt->execute([$sessionUser['id']]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'User not found']);
        exit;
    }

    // Verify password
    if (!PasswordHash::verify($password, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Incorrect password']);
        exit;
    }

    // Update last activity
    $_SESSION['last_activity'] = time();

    // Generate new CSRF token
    $newCsrfToken = CSRF::generateToken();

    echo json_encode([
        'success' => true,
        'csrfToken' => $newCsrfToken
    ]);

} catch (Exception $e) {
    error_log("Unlock error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'An error occurred']);
}
