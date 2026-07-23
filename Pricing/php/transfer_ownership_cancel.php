<?php
require_once 'config.php';

$userId = requireAuth();

$data = json_decode(file_get_contents('php://input'), true);
$token = $data['token'] ?? null;

if (!$token) {
    jsonResponse(['error' => 'Token is required.'], 400);
}

try {
    $db = getDB();

    // 1. Verify the request exists and the current user is the old owner
    $stmt = $db->prepare("
        SELECT id FROM team_transfer_requests 
        WHERE token = ? AND old_owner_id = ? AND status = 'pending'
    ");
    $stmt->execute([$token, $userId]);
    $request = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$request) {
        jsonResponse(['error' => 'No pending transfer request found for this token.'], 404);
    }

    // 2. Cancel the request
    $stmt = $db->prepare("UPDATE team_transfer_requests SET status = 'cancelled' WHERE id = ?");
    $stmt->execute([$request['id']]);

    jsonResponse([
        'success' => true,
        'message' => 'Ownership transfer request cancelled successfully.'
    ]);

} catch (Exception $e) {
    jsonResponse(['error' => 'Internal server error: ' . $e->getMessage()], 500);
}
?>
