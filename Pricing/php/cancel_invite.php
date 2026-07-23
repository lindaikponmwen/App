<?php
require_once 'config.php';

$userId = requireAuth();

$data = json_decode(file_get_contents('php://input'), true);
$inviteId = $data['inviteId'] ?? null;

if (!$inviteId) {
    jsonResponse(['error' => 'Invite ID is required.'], 400);
}

try {
    $db = getDB();

    // 1. Get current user's team info
    $stmt = $db->prepare("SELECT team_id, team_role FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !$user['team_id'] || !in_array($user['team_role'], ['owner', 'admin'])) {
        jsonResponse(['error' => 'Unauthorized: Only team owners or admins can cancel invitations.'], 403);
    }

    // 2. Verify invite belongs to this team and is pending
    $stmt = $db->prepare("SELECT id FROM team_invites WHERE id = ? AND team_id = ? AND status = 'pending'");
    $stmt->execute([$inviteId, $user['team_id']]);
    $invite = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$invite) {
        jsonResponse(['error' => 'Invitation not found or already processed.'], 404);
    }

    // 3. Cancel the invite
    $stmt = $db->prepare("UPDATE team_invites SET status = 'canceled' WHERE id = ?");
    $stmt->execute([$inviteId]);

    jsonResponse([
        'success' => true,
        'message' => 'Invitation canceled successfully.'
    ]);

} catch (Exception $e) {
    jsonResponse(['error' => 'Internal server error: ' . $e->getMessage()], 500);
}
?>
