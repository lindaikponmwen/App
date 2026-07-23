<?php
/**
 * Get Team Activity Data
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
            u.name as member,
            u.avatar,
            COUNT(DISTINCT pm.project_id) as projectCount,
            u.last_login as lastActive,
            'active' as status
        FROM users u
        INNER JOIN project_members pm1 ON u.id = pm1.user_id
        INNER JOIN project_members pm2 ON pm1.project_id = pm2.project_id
        LEFT JOIN project_members pm ON u.id = pm.user_id
        WHERE pm2.user_id = ? AND u.id != ?
        GROUP BY u.id, u.name, u.avatar, u.last_login
        ORDER BY u.last_login DESC
        LIMIT 10
    ");

    $stmt->execute([$sessionUser['id'], $sessionUser['id']]);
    $teamActivity = $stmt->fetchAll();

    foreach ($teamActivity as &$activity) {
        $activity['projectCount'] = (int)$activity['projectCount'];
    }

    sendJsonResponse([
        'success' => true,
        'teamActivity' => $teamActivity
    ]);

} catch (Exception $e) {
    error_log("Get team activity error: " . $e->getMessage());
    sendErrorResponse('An error occurred', 500);
}
