<?php
/**
 * Get User Document Approvals
 *
 * Returns all document approvals related to the authenticated user
 *
 * Security: Requires authentication
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../config/helpers.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Credentials: true');

session_start();

try {
    // Verify user is authenticated
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'Authentication required'
        ]);
        exit;
    }

    $userId = $_SESSION['user_id'];
    $db = Database::getInstance()->getConnection();

    // Get document approvals for user
    $stmt = $db->prepare("
        SELECT
            a.id,
            a.document_name,
            a.project_name,
            a.status,
            a.comments,
            a.created_at,
            u.name as approver_name
        FROM document_approvals a
        LEFT JOIN users u ON a.approver_id = u.id
        WHERE a.user_id = :user_id
        ORDER BY a.created_at DESC
    ");

    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();

    $approvals = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format approvals
    $formattedApprovals = array_map(function($approval) {
        return [
            'id' => $approval['id'],
            'document' => $approval['document_name'],
            'project' => $approval['project_name'],
            'status' => $approval['status'],
            'approver' => $approval['approver_name'] ?? 'N/A',
            'date' => $approval['created_at'],
            'comments' => $approval['comments'] ?? ''
        ];
    }, $approvals);

    echo json_encode([
        'success' => true,
        'approvals' => $formattedApprovals
    ]);

} catch (Exception $e) {
    error_log("Approvals fetch error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to fetch approvals'
    ]);
}
