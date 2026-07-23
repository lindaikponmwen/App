<?php
/**
 * Update Experiment
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: ' . ($_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:5173'));
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';

Session::start();

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    if (!Session::isLoggedIn()) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Unauthorized']);
        exit;
    }

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

    $sessionUser = Session::getUser();
    $db = getDatabase();

    $experimentId = Sanitize::string($input['id'] ?? '');
    if (empty($experimentId)) {
        throw new Exception('Experiment ID is required');
    }

    $verifyStmt = $db->prepare("
        SELECT 1 FROM experiment_members
        WHERE experiment_id = ? AND user_id = ?
    ");
    $verifyStmt->execute([$experimentId, $sessionUser['id']]);
    if (!$verifyStmt->fetch()) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Access denied']);
        exit;
    }

    $updates = [];
    $params = [];

    if (isset($input['title'])) {
        $updates[] = "title = ?";
        $params[] = Sanitize::string($input['title']);
    }
    if (isset($input['description'])) {
        $updates[] = "description = ?";
        $params[] = Sanitize::string($input['description']);
    }
    if (isset($input['status'])) {
        $updates[] = "status = ?";
        $params[] = Sanitize::string($input['status']);
    }
    if (isset($input['priority'])) {
        $updates[] = "priority = ?";
        $params[] = Sanitize::string($input['priority']);
    }
    if (isset($input['progress'])) {
        $updates[] = "progress = ?";
        $params[] = Sanitize::int($input['progress']);
    }

    if (!empty($updates)) {
        $updates[] = "updated_at = NOW()";
        $params[] = $experimentId;

        $sql = "UPDATE experiments SET " . implode(', ', $updates) . " WHERE id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
    }

    $newCsrfToken = CSRF::generateToken();

    echo json_encode([
        'success' => true,
        'csrfToken' => $newCsrfToken
    ]);

} catch (Exception $e) {
    error_log("Update experiment error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
