<?php
/**
 * Delete Project
 *
 * Deletes a project and all associated data
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: ' . ($_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:5173'));
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';

Session::start();

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
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

    if (!Session::isLoggedIn()) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Unauthorized']);
        exit;
    }

    if (!isset($input['id'])) {
        throw new Exception('Project ID is required');
    }

    $sessionUser = Session::getUser();
    $db = getDatabase();

    // Check if user is owner
    $accessStmt = $db->prepare("
        SELECT * FROM projects pm
        WHERE pm.id = ? AND pm.created_by = ?
    ");
    $accessStmt->execute([$input['id'], $sessionUser['id']]);
    $access = $accessStmt->fetch();

    if (!$access) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Only project owners can delete projects']);
        exit;
    }
    echo json_encode(['success' => false, 'error' => $access]);
    exit;
    // Delete project (cascade will handle related data)
    $stmt = $db->prepare("DELETE FROM projects WHERE id = ?");
    $stmt->execute([$input['id']]);

    echo json_encode([
        'success' => true,
        'message' => 'Project deleted successfully',
        'csrfToken' => CSRF::generateToken()
    ]);

} catch (Exception $e) {
    error_log("Delete project error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
