<?php
/**
 * Get Visit Data
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
header('Access-Control-Allow-Credentials: true');
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

    $cacheKey = "analytics_visits_{$sessionUser['id']}_{$timeRange}";
    $cachedData = Cache::get($cacheKey);

    if ($cachedData !== null) {
        sendJsonResponse($cachedData);
        exit;
    }

    $visitData = [
        ['date' => date('Y-m-d', strtotime('-6 days')), 'visits' => 1234, 'visitors' => 789],
        ['date' => date('Y-m-d', strtotime('-5 days')), 'visits' => 1456, 'visitors' => 892],
        ['date' => date('Y-m-d', strtotime('-4 days')), 'visits' => 1678, 'visitors' => 945],
        ['date' => date('Y-m-d', strtotime('-3 days')), 'visits' => 1890, 'visitors' => 1023],
        ['date' => date('Y-m-d', strtotime('-2 days')), 'visits' => 2012, 'visitors' => 1156],
        ['date' => date('Y-m-d', strtotime('-1 day')), 'visits' => 2234, 'visitors' => 1278],
        ['date' => date('Y-m-d'), 'visits' => 1567, 'visitors' => 892]
    ];

    $responseData = [
        'success' => true,
        'visitData' => $visitData
    ];

    Cache::set($cacheKey, $responseData, 300);
    sendJsonResponse($responseData);

} catch (Exception $e) {
    error_log("Get visit data error: " . $e->getMessage());
    sendErrorResponse('An error occurred', 500);
}
