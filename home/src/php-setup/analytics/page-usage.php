<?php
/**
 * Get Page Usage Data
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

    $cacheKey = "analytics_page_usage_{$sessionUser['id']}_{$timeRange}";
    $cachedData = Cache::get($cacheKey);

    if ($cachedData !== null) {
        sendJsonResponse($cachedData);
        exit;
    }

    $pageUsage = [
        ['page' => 'Projects', 'views' => 8234, 'avgTime' => '3:45'],
        ['page' => 'Analytics', 'views' => 5678, 'avgTime' => '2:34'],
        ['page' => 'Profile', 'views' => 4321, 'avgTime' => '1:56'],
        ['page' => 'Team Members', 'views' => 3456, 'avgTime' => '2:12'],
        ['page' => 'Settings', 'views' => 2345, 'avgTime' => '3:21']
    ];

    $responseData = [
        'success' => true,
        'pageUsage' => $pageUsage
    ];

    Cache::set($cacheKey, $responseData, 300);
    sendJsonResponse($responseData);

} catch (Exception $e) {
    error_log("Get page usage error: " . $e->getMessage());
    sendErrorResponse('An error occurred', 500);
}
