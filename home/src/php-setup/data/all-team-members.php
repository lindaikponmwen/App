<?php
/**
 * Get All Available Team Members
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

    $db = getDatabase();

    $stmt = $db->prepare("
        SELECT
            u.id,
            u.name,
            u.email,
            u.initials,
            u.avatar,
            u.role,
            u.department,
            u.title,
            u.is_online as isOnline
        FROM users u
        WHERE u.role IN ('user', 'manager', 'admin')
        ORDER BY u.name
    ");

    $stmt->execute();
    $teamMembers = $stmt->fetchAll();

    foreach ($teamMembers as &$member) {
        $member['isOnline'] = (bool)$member['isOnline'];
    }

    sendJsonResponse([
        'success' => true,
        'teamMembers' => $teamMembers
    ]);

} catch (Exception $e) {
    error_log("Get all team members error: " . $e->getMessage());
    sendErrorResponse('An error occurred', 500);
}
