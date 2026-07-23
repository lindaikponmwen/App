<?php
/**
 * Get Project Usage Data
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
            p.title as name,
            COUNT(DISTINCT pf.id) as fileCount,
            COUNT(DISTINCT pm.user_id) as memberCount,
            SUM(COALESCE(pf.size, 0)) as storageUsed,
            MAX(p.updated_at) as lastActivity
        FROM projects p
        INNER JOIN project_members pm ON p.id = pm.project_id
        LEFT JOIN project_files pf ON p.id = pf.project_id
        WHERE pm.user_id = ?
        GROUP BY p.id, p.title
        ORDER BY lastActivity DESC
        LIMIT 10
    ");

    $stmt->execute([$sessionUser['id']]);
    $projectUsage = $stmt->fetchAll();

    foreach ($projectUsage as &$project) {
        $project['fileCount'] = (int)$project['fileCount'];
        $project['memberCount'] = (int)$project['memberCount'];
        $project['storageUsed'] = formatBytes($project['storageUsed'] ?? 0);
    }

    sendJsonResponse([
        'success' => true,
        'projectUsage' => $projectUsage
    ]);

} catch (Exception $e) {
    error_log("Get project usage error: " . $e->getMessage());
    sendErrorResponse('An error occurred', 500);
}

function formatBytes($bytes, $precision = 2) {
    $units = ['B', 'KB', 'MB', 'GB', 'TB'];

    for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
        $bytes /= 1024;
    }

    return round($bytes, $precision) . ' ' . $units[$i];
}
