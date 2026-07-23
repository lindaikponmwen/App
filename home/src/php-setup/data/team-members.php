<?php
/**
 * Get Team Members for User
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
        SELECT DISTINCT
            u.id,
            u.name,
            u.email,
            u.initials,
            u.avatar,
            u.role,
            u.department,
            u.title,
            u.is_online as isOnline,
            u.last_login as lastLogin
        FROM users u
        INNER JOIN project_members pm1 ON u.id = pm1.user_id
        INNER JOIN project_members pm2 ON pm1.project_id = pm2.project_id
        WHERE pm2.user_id = ? AND u.id != ?
        ORDER BY u.name
    ");

    $stmt->execute([$sessionUser['id'], $sessionUser['id']]);
    $teamMembers = $stmt->fetchAll();

    foreach ($teamMembers as &$member) {
        $member['isOnline'] = (bool)$member['isOnline'];
    }

    sendJsonResponse([
        'success' => true,
        'teamMembers' => $teamMembers
    ]);

} catch (Exception $e) {
    error_log("Get team members error: " . $e->getMessage());
    sendErrorResponse('An error occurred', 500);
}
