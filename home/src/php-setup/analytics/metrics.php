<?php
/**
 * Get Analytics Metrics
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
    $timeRange = $_GET['range'] ?? '7d';
    $db = getDatabase();

    $cacheKey = "analytics_metrics_{$sessionUser['id']}_{$timeRange}";
    $cachedData = Cache::get($cacheKey);

    if ($cachedData !== null) {
        sendJsonResponse($cachedData);
        exit;
    }

    $metrics = [
        'totalVisits' => 15234,
        'uniqueVisitors' => 8945,
        'avgSessionDuration' => '4:32',
        'bounceRate' => '34.2%',
        'pageViews' => 45678,
        'activeProjects' => 12,
        'completedProjects' => 45,
        'storageUsed' => '2.4 GB',
        'storageLimit' => '10 GB',
        'teamMembers' => 24,
        'onlineUsers' => 8
    ];

    $responseData = [
        'success' => true,
        'metrics' => $metrics
    ];

    Cache::set($cacheKey, $responseData, 300);
    sendJsonResponse($responseData);

} catch (Exception $e) {
    error_log("Get analytics metrics error: " . $e->getMessage());
    sendErrorResponse('An error occurred', 500);
}
