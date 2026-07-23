<?php
/**
 * Get Projects List - Optimized with Caching & Compression
 *
 * Returns all projects accessible to the current user with full details
 * Features: Query caching, response compression, ETag support, rate limiting
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

$startTime = microtime(true);

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

    if (!checkRateLimit('projects_list_' . $sessionUser['id'], 30, 60)) {
        sendErrorResponse('Too many requests. Please try again later.', 429);
        exit;
    }

    $cacheKey = 'projects_list_user_' . $sessionUser['id'];
    $cachedData = Cache::get($cacheKey);

    if ($cachedData !== null) {
        $etag = generateETag($cachedData);

        if (checkClientCache($etag)) {
            send304NotModified($etag);
        }

        header('ETag: ' . $etag);
        header('Cache-Control: private, max-age=300');
        sendJsonResponse($cachedData);
        exit;
    }

    $db = getDatabase();

    $projectIds = $db->prepare("
        SELECT DISTINCT p.id
        FROM projects p
        INNER JOIN project_members pm_user ON p.id = pm_user.project_id
        WHERE pm_user.user_id = ?
    ");
    $projectIds->execute([$sessionUser['id']]);
    $ids = array_column($projectIds->fetchAll(), 'id');

    if (empty($ids)) {
        $responseData = [
            'success' => true,
            'projects' => []
        ];

        Cache::set($cacheKey, $responseData, 300);
        sendJsonResponse($responseData);
        exit;
    }

    $placeholders = implode(',', array_fill(0, count($ids), '?'));

    $stmt = $db->prepare("
        SELECT DISTINCT
            p.id,
            p.title,
            p.description,
            p.status,
            p.start_date as startDate,
            p.end_date as endDate,
            p.created_at as createdAt,
            p.updated_at as updatedAt,
            creator.name as createdByName,
            (SELECT pm.role FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = ?) as userRole,
            (SELECT COUNT(*) FROM project_files pf WHERE pf.project_id = p.id) as fileCount
        FROM projects p
        LEFT JOIN users creator ON p.created_by = creator.id
        WHERE p.id IN ($placeholders)
        ORDER BY p.updated_at DESC, p.created_at DESC
    ");

    $params = array_merge([$sessionUser['id']], $ids);
    $stmt->execute($params);
    $projects = $stmt->fetchAll();

    $allMembers = $db->prepare("
        SELECT pm.project_id, u.id, u.name, u.email, u.initials, u.avatar
        FROM users u
        INNER JOIN project_members pm ON u.id = pm.user_id
        WHERE pm.project_id IN ($placeholders)
    ");
    $allMembers->execute($ids);
    $membersByProject = [];
    foreach ($allMembers->fetchAll() as $member) {
        $membersByProject[$member['project_id']][] = [
            'id' => $member['id'],
            'name' => $member['name'],
            'email' => $member['email'],
            'initials' => $member['initials'],
            'avatar' => $member['avatar']
        ];
    }

    $allKeywords = $db->prepare("
        SELECT project_id, keyword
        FROM project_keywords
        WHERE project_id IN ($placeholders)
    ");
    $allKeywords->execute($ids);
    $keywordsByProject = [];
    foreach ($allKeywords->fetchAll() as $row) {
        $keywordsByProject[$row['project_id']][] = $row['keyword'];
    }

    $allAnalysisTypes = $db->prepare("
        SELECT project_id, analysis_type
        FROM project_analysis_types
        WHERE project_id IN ($placeholders)
    ");
    $allAnalysisTypes->execute($ids);
    $analysisTypesByProject = [];
    foreach ($allAnalysisTypes->fetchAll() as $row) {
        $analysisTypesByProject[$row['project_id']][] = $row['analysis_type'];
    }

    foreach ($projects as &$project) {
        $projectId = $project['id'];
        $project['members'] = $membersByProject[$projectId] ?? [];
        $project['selectedMembers'] = array_column($project['members'], 'id');
        $project['keywords'] = $keywordsByProject[$projectId] ?? [];
        $project['analysisTypes'] = $analysisTypesByProject[$projectId] ?? [];
        $project['fileCount'] = (int)$project['fileCount'];
    }

    $responseData = [
        'success' => true,
        'projects' => $projects
    ];

    Cache::set($cacheKey, $responseData, 300);

    $duration = microtime(true) - $startTime;
    logPerformance('projects_list', $duration, ['user_id' => $sessionUser['id'], 'count' => count($projects)]);

    $etag = generateETag($responseData);
    header('ETag: ' . $etag);
    header('Cache-Control: private, max-age=300');
    header('X-Response-Time: ' . round($duration * 1000, 2) . 'ms');

    sendJsonResponse($responseData);

} catch (Exception $e) {
    error_log("Get projects error: " . $e->getMessage());
    sendErrorResponse('An error occurred', 500);
}
