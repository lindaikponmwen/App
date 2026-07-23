<?php
/**
 * Track Event
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

    $category = Sanitize::string($input['category'] ?? '');
    $action = Sanitize::string($input['action'] ?? '');
    $label = Sanitize::string($input['label'] ?? '');
    $value = Sanitize::int($input['value'] ?? 0);
    $metadata = json_encode($input['metadata'] ?? []);

    $stmt = $db->prepare("
        INSERT INTO analytics_events (user_id, category, action, label, value, metadata)
        VALUES (?, ?, ?, ?, ?, ?)
    ");

    $stmt->execute([
        $sessionUser['id'],
        $category,
        $action,
        $label,
        $value,
        $metadata
    ]);

    $newCsrfToken = CSRF::generateToken();

    echo json_encode([
        'success' => true,
        'csrfToken' => $newCsrfToken
    ]);

} catch (Exception $e) {
    error_log("Track event error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
