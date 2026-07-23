<?php
/**
 * Update User Role Endpoint
 *
 * Updates a user's role (e.g., after subscription enrollment)
 * Only allows updating to valid roles and requires authentication
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

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    // Check if user is authenticated
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }

    // Verify CSRF token
    CSRF::validateToken();

    // Get input
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        throw new Exception('Invalid JSON input');
    }

    $newRole = $input['role'] ?? '';

    // Validate role
    $validRoles = ['member', 'owner', 'administrator', 'unsubscribed'];
    if (!in_array($newRole, $validRoles)) {
        throw new Exception('Invalid role specified');
    }

    // Get current user ID from session
    $userId = $_SESSION['user_id'];

    // Get database connection
    $db = getDatabase();

    // Get current user information
    $stmt = $db->prepare("
        SELECT id, role, username, email
        FROM users
        WHERE id = ?
    ");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        throw new Exception('User not found');
    }

    // Prevent downgrading from administrator unless explicitly allowed
    if ($user['role'] === 'administrator' && $newRole !== 'administrator') {
        throw new Exception('Cannot change administrator role through this endpoint');
    }

    // Update user role
    $updateStmt = $db->prepare("
        UPDATE users
        SET role = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ");
    $updateStmt->execute([$newRole, $userId]);

    // Update session with new role
    $_SESSION['role'] = $newRole;

    // Log the role change for audit purposes
    error_log("User role updated: user_id={$userId}, old_role={$user['role']}, new_role={$newRole}");

    // Generate new CSRF token
    $newCsrfToken = CSRF::generateToken();

    echo json_encode([
        'success' => true,
        'message' => 'Role updated successfully',
        'role' => $newRole,
        'csrfToken' => $newCsrfToken
    ]);

} catch (Exception $e) {
    error_log("Role update error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
