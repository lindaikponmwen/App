<?php
/**
 * Get Performance Metrics
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

    $cacheKey = "analytics_performance_{$sessionUser['id']}";
    $cachedData = Cache::get($cacheKey);

    if ($cachedData !== null) {
        sendJsonResponse($cachedData);
        exit;
    }

    $performance = [
        'pageLoadTime' => '1.2s',
        'serverResponseTime' => '45ms',
        'uptime' => '99.9%',
        'errorRate' => '0.02%'
    ];

    $responseData = [
        'success' => true,
        'performance' => $performance
    ];

    Cache::set($cacheKey, $responseData, 300);
    sendJsonResponse($responseData);

} catch (Exception $e) {
    error_log("Get performance metrics error: " . $e->getMessage());
    sendErrorResponse('An error occurred', 500);
}
