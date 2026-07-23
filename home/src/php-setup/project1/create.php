<?php
/**
 * Create Project
 *
 * Creates a new project with members, keywords, and analysis types
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: ' . ($_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:5173'));
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';

Session::start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        throw new Exception('Invalid JSON input');
    }

    // Validate CSRF token
    $csrfToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!CSRF::validateToken($csrfToken)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Invalid CSRF token. Refresh the page and try again.']);
        exit;
    }

    if (!Session::isLoggedIn()) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Unauthorized']);
        exit;
    }

    // Validate required fields
    if (!isset($input['title']) || empty(trim($input['title']))) {
        throw new Exception('Title is required');
    }

    if (!isset($input['startDate'])) {
        throw new Exception('Start date is required');
    }

    $sessionUser = Session::getUser();
    $db = getDatabase();

    // Start transaction
    $db->beginTransaction();

    try {
        // Insert project
        $stmt = $db->prepare("
            INSERT INTO projects (title, description, status, start_date, end_date, created_by)
            VALUES (?, ?, ?, ?, ?, ?)
        ");

        $stmt->execute([
            Sanitize::string($input['title']),
            isset($input['description']) ? Sanitize::string($input['description']) : null,
            isset($input['status']) ? $input['status'] : 'active',
            $input['startDate'],
            isset($input['endDate']) ? $input['endDate'] : null,
            $sessionUser['id']
        ]);

        $projectId = $db->lastInsertId();

        // Add creator as owner
        $memberStmt = $db->prepare("
            INSERT INTO project_members (project_id, user_id, role)
            VALUES (?, ?, 'owner')
        ");
        $memberStmt->execute([$projectId, $sessionUser['id']]);

        // Add other members
        if (isset($input['selectedMembers']) && is_array($input['selectedMembers'])) {
            $memberStmt = $db->prepare("
                INSERT INTO project_members (project_id, user_id, role)
                VALUES (?, ?, 'member')
            ");

            foreach ($input['selectedMembers'] as $memberId) {
                if ($memberId != $sessionUser['id']) { // Don't add creator again
                    $memberStmt->execute([$projectId, $memberId]);
                }
            }
        }

        // Add keywords
        if (isset($input['keywords']) && is_array($input['keywords'])) {
            $keywordStmt = $db->prepare("
                INSERT INTO project_keywords (project_id, keyword)
                VALUES (?, ?)
            ");

            foreach ($input['keywords'] as $keyword) {
                $keywordStmt->execute([$projectId, Sanitize::string($keyword)]);
            }
        }

        // Add analysis types
        if (isset($input['analysisTypes']) && is_array($input['analysisTypes'])) {
            $analysisStmt = $db->prepare("
                INSERT INTO project_analysis_types (project_id, analysis_type)
                VALUES (?, ?)
            ");

            foreach ($input['analysisTypes'] as $analysisType) {
                $analysisStmt->execute([$projectId, Sanitize::string($analysisType)]);
            }
        }

        // Log activity
        $logStmt = $db->prepare("
            INSERT INTO project_activity_log (project_id, user_id, action, ip_address)
            VALUES (?, ?, 'created', ?)
        ");
        $logStmt->execute([$projectId, $sessionUser['id'], $_SERVER['REMOTE_ADDR'] ?? 'unknown']);

        $db->commit();

        // Get the created project
        $projectStmt = $db->prepare("
            SELECT * FROM projects WHERE id = ?
        ");
        $projectStmt->execute([$projectId]);
        $project = $projectStmt->fetch();

        echo json_encode([
            'success' => true,
            'project' => $project,
            'csrfToken' => CSRF::generateToken()
        ]);

    } catch (Exception $e) {
        $db->rollBack();
        throw $e;
    }

} catch (Exception $e) {
    error_log("Create project error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
