<?php
/**
 * Get Storage Breakdown
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

    $cacheKey = "analytics_storage_{$sessionUser['id']}";
    $cachedData = Cache::get($cacheKey);

    if ($cachedData !== null) {
        sendJsonResponse($cachedData);
        exit;
    }

    $storage = [
        ['category' => 'Documents', 'size' => 1.2, 'percentage' => 50, 'color' => '#3B82F6'],
        ['category' => 'Images', 'size' => 0.6, 'percentage' => 25, 'color' => '#10B981'],
        ['category' => 'Videos', 'size' => 0.4, 'percentage' => 17, 'color' => '#F59E0B'],
        ['category' => 'Other', 'size' => 0.2, 'percentage' => 8, 'color' => '#6B7280']
    ];

    $responseData = [
        'success' => true,
        'storage' => $storage
    ];

    Cache::set($cacheKey, $responseData, 600);
    sendJsonResponse($responseData);

} catch (Exception $e) {
    error_log("Get storage breakdown error: " . $e->getMessage());
    sendErrorResponse('An error occurred', 500);
}
