<?php
/**
 * Get Experiments for User
 */

header('Access-Control-Allow-Origin: ' . ($_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:5173'));
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../config/cache.php';
require_once __DIR__ . '/../config/helpers.php';

Session::start();
SecurityHeaders::apply();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendErrorResponse('Method not allowed', 405);
    exit;
}

try {
    if (!Session::isLoggedIn()) {
        sendErrorResponse('Unauthorized', 401);
        exit;
    }

    $sessionUser = Session::getUser();
    $db = getDatabase();

    $stmt = $db->prepare("
        SELECT
            e.id,
            e.title,
            e.description,
            e.status,
            e.start_date as startDate,
            e.end_date as endDate,
            e.progress,
            e.priority,
            e.created_at as createdAt,
            e.updated_at as updatedAt
        FROM experiments e
        INNER JOIN experiment_members em ON e.id = em.experiment_id
        WHERE em.user_id = ?
        ORDER BY e.updated_at DESC
    ");

    $stmt->execute([$sessionUser['id']]);
    $experiments = $stmt->fetchAll();

    sendJsonResponse([
        'success' => true,
        'experiments' => $experiments
    ]);

} catch (Exception $e) {
    error_log("Get experiments error: " . $e->getMessage());
    sendErrorResponse('An error occurred', 500);
}
