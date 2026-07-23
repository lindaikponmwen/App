<?php
/**
 * Delete Experiment
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
        SELECT created_by FROM experiments
        WHERE id = ?
    ");
    $verifyStmt->execute([$experimentId]);
    $experiment = $verifyStmt->fetch();

    if (!$experiment) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Experiment not found']);
        exit;
    }

    if ($experiment['created_by'] !== $sessionUser['id'] && $sessionUser['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Access denied']);
        exit;
    }

    $db->beginTransaction();

    $memberStmt = $db->prepare("DELETE FROM experiment_members WHERE experiment_id = ?");
    $memberStmt->execute([$experimentId]);

    $stmt = $db->prepare("DELETE FROM experiments WHERE id = ?");
    $stmt->execute([$experimentId]);

    $db->commit();

    $newCsrfToken = CSRF::generateToken();

    echo json_encode([
        'success' => true,
        'csrfToken' => $newCsrfToken
    ]);

} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    error_log("Delete experiment error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
