<?php
/**
 * Get Growth Trends
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

    $cacheKey = "analytics_growth_{$sessionUser['id']}_{$timeRange}";
    $cachedData = Cache::get($cacheKey);

    if ($cachedData !== null) {
        sendJsonResponse($cachedData);
        exit;
    }

    $trends = [
        'visits' => '+12.5%',
        'visitors' => '+8.3%',
        'sessionDuration' => '+5.7%',
        'storageUsage' => '+15.2%'
    ];

    $responseData = [
        'success' => true,
        'trends' => $trends
    ];

    Cache::set($cacheKey, $responseData, 300);
    sendJsonResponse($responseData);

} catch (Exception $e) {
    error_log("Get growth trends error: " . $e->getMessage());
    sendErrorResponse('An error occurred', 500);
}
