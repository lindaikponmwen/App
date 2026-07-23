<?php
/**
 * Create Experiment
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

    $title = Sanitize::string($input['title'] ?? '');
    $description = Sanitize::string($input['description'] ?? '');
    $status = Sanitize::string($input['status'] ?? 'active');
    $priority = Sanitize::string($input['priority'] ?? 'medium');
    $progress = Sanitize::int($input['progress'] ?? 0);

    if (empty($title)) {
        throw new Exception('Title is required');
    }

    $stmt = $db->prepare("
        INSERT INTO experiments (title, description, status, priority, progress, created_by)
        VALUES (?, ?, ?, ?, ?, ?)
    ");

    $stmt->execute([
        $title,
        $description,
        $status,
        $priority,
        $progress,
        $sessionUser['id']
    ]);

    $experimentId = $db->lastInsertId();

    $memberStmt = $db->prepare("
        INSERT INTO experiment_members (experiment_id, user_id)
        VALUES (?, ?)
    ");
    $memberStmt->execute([$experimentId, $sessionUser['id']]);

    $getStmt = $db->prepare("
        SELECT
            id,
            title,
            description,
            status,
            priority,
            progress,
            start_date as startDate,
            end_date as endDate,
            created_at as createdAt,
            updated_at as updatedAt
        FROM experiments
        WHERE id = ?
    ");
    $getStmt->execute([$experimentId]);
    $experiment = $getStmt->fetch();

    $newCsrfToken = CSRF::generateToken();

    echo json_encode([
        'success' => true,
        'experiment' => $experiment,
        'csrfToken' => $newCsrfToken
    ]);

} catch (Exception $e) {
    error_log("Create experiment error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
