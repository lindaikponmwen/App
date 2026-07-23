<?php
/**
 * Update Project
 *
 * Updates an existing project's details
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: ' . ($_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:5173'));
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';

Session::start();

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
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

    if (!isset($input['id'])) {
        throw new Exception('Project ID is required');
    }

    $sessionUser = Session::getUser();
    $db = getDatabase();

    // Check if user is owner or has permission to update
    $accessStmt = $db->prepare("
        SELECT pm.role
        FROM project_members pm
        WHERE pm.project_id = ? AND pm.user_id = ?
    ");
    $accessStmt->execute([$input['id'], $sessionUser['id']]);
    $access = $accessStmt->fetch();

    if (!$access || !in_array($access['role'], ['owner', 'admin'])) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Insufficient permissions']);
        exit;
    }

    // Start transaction
    $db->beginTransaction();

    try {
        // Build update query dynamically
        $updates = [];
        $params = [];

        if (isset($input['title'])) {
            $updates[] = "title = ?";
            $params[] = Sanitize::string($input['title']);
        }
        if (isset($input['description'])) {
            $updates[] = "description = ?";
            $params[] = Sanitize::string($input['description']);
        }
        if (isset($input['status'])) {
            $updates[] = "status = ?";
            $params[] = $input['status'];
        }
        if (isset($input['startDate'])) {
            $updates[] = "start_date = ?";
            $params[] = $input['startDate'];
        }
        if (isset($input['endDate'])) {
            $updates[] = "end_date = ?";
            $params[] = $input['endDate'];
        }

        if (count($updates) > 0) {
            $params[] = $input['id'];
            $stmt = $db->prepare("
                UPDATE projects
                SET " . implode(', ', $updates) . "
                WHERE id = ?
            ");
            $stmt->execute($params);
        }

        // Update members if provided
        if (isset($input['selectedMembers']) && is_array($input['selectedMembers'])) {
            // Remove all existing members except owner
            $db->prepare("
                DELETE FROM project_members
                WHERE project_id = ? AND role != 'owner'
            ")->execute([$input['id']]);

            // Add new members
            $memberStmt = $db->prepare("
                INSERT IGNORE INTO project_members (project_id, user_id, role)
                VALUES (?, ?, 'member')
            ");

            foreach ($input['selectedMembers'] as $memberId) {
                $memberStmt->execute([$input['id'], $memberId]);
            }
        }

        // Update keywords if provided
        if (isset($input['keywords']) && is_array($input['keywords'])) {
            $db->prepare("DELETE FROM project_keywords WHERE project_id = ?")->execute([$input['id']]);

            $keywordStmt = $db->prepare("
                INSERT INTO project_keywords (project_id, keyword)
                VALUES (?, ?)
            ");

            foreach ($input['keywords'] as $keyword) {
                $keywordStmt->execute([$input['id'], Sanitize::string($keyword)]);
            }
        }

        // Update analysis types if provided
        if (isset($input['analysisTypes']) && is_array($input['analysisTypes'])) {
            $db->prepare("DELETE FROM project_analysis_types WHERE project_id = ?")->execute([$input['id']]);

            $analysisStmt = $db->prepare("
                INSERT INTO project_analysis_types (project_id, analysis_type)
                VALUES (?, ?)
            ");

            foreach ($input['analysisTypes'] as $analysisType) {
                $analysisStmt->execute([$input['id'], Sanitize::string($analysisType)]);
            }
        }

        // Log activity
        $logStmt = $db->prepare("
            INSERT INTO project_activity_log (project_id, user_id, action, ip_address)
            VALUES (?, ?, 'updated', ?)
        ");
        $logStmt->execute([$input['id'], $sessionUser['id'], $_SERVER['REMOTE_ADDR'] ?? 'unknown']);

        $db->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Project updated successfully',
            'csrfToken' => CSRF::generateToken()
        ]);

    } catch (Exception $e) {
        $db->rollBack();
        throw $e;
    }

} catch (Exception $e) {
    error_log("Update project error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
