<?php
/**
 * Get Project Details
 *
 * Returns detailed information about a specific project
 */

header('Content-Type: application/json');
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

Session::start();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    if (!Session::isLoggedIn()) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Unauthorized']);
        exit;
    }

    $projectId = $_GET['id'] ?? null;

    if (!$projectId) {
        throw new Exception('Project ID is required');
    }

    $sessionUser = Session::getUser();
    $db = getDatabase();

    // Check if user has access to this project
    $accessStmt = $db->prepare("
        SELECT COUNT(*) as has_access
        FROM project_members
        WHERE project_id = ? AND user_id = ?
    ");
    $accessStmt->execute([$projectId, $sessionUser['id']]);
    $access = $accessStmt->fetch();

    if (!$access['has_access']) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Access denied']);
        exit;
    }

    // Get project details
    $stmt = $db->prepare("
        SELECT
            p.*,
            creator.name as createdByName,
            pm.role as userRole
        FROM projects p
        LEFT JOIN users creator ON p.created_by = creator.id
        LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = ?
        WHERE p.id = ?
    ");

    $stmt->execute([$sessionUser['id'], $projectId]);
    $project = $stmt->fetch();

    if (!$project) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Project not found']);
        exit;
    }

    // Get project members
    $membersStmt = $db->prepare("
        SELECT u.id, u.name, u.email, u.initials, u.avatar, pm.role
        FROM users u
        INNER JOIN project_members pm ON u.id = pm.user_id
        WHERE pm.project_id = ?
    ");
    $membersStmt->execute([$projectId]);
    $project['members'] = $membersStmt->fetchAll();
    $project['selectedMembers'] = array_column($project['members'], 'id');

    // Get keywords
    $keywordsStmt = $db->prepare("
        SELECT keyword
        FROM project_keywords
        WHERE project_id = ?
    ");
    $keywordsStmt->execute([$projectId]);
    $project['keywords'] = array_column($keywordsStmt->fetchAll(), 'keyword');

    // Get analysis types
    $analysisStmt = $db->prepare("
        SELECT analysis_type
        FROM project_analysis_types
        WHERE project_id = ?
    ");
    $analysisStmt->execute([$projectId]);
    $project['analysisTypes'] = array_column($analysisStmt->fetchAll(), 'analysis_type');

    // Get files
    $filesStmt = $db->prepare("
        SELECT
            id,
            name,
            type,
            file_size as fileSize,
            mime_type as mimeType,
            created_at as lastModified
        FROM project_files
        WHERE project_id = ?
        ORDER BY created_at DESC
    ");
    $filesStmt->execute([$projectId]);
    $project['files'] = $filesStmt->fetchAll();

    echo json_encode([
        'success' => true,
        'project' => $project
    ]);

} catch (Exception $e) {
    error_log("Get project error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'An error occurred']);
}
