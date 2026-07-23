<?php
require_once 'config.php';

$userId = requireAuth();

$data = json_decode(file_get_contents('php://input'), true);
$targetUserId = $data['userId'] ?? null;
$newRole = $data['role'] ?? null;

if (!$targetUserId || !$newRole) {
    jsonResponse(['error' => 'User ID and role are required.'], 400);
}

if (!in_array($newRole, ['admin', 'member'])) {
    jsonResponse(['error' => 'Invalid role. Only admin and member roles can be assigned.'], 400);
}

try {
    $db = getDB();

    // 1. Get current user's team info
    $stmt = $db->prepare("SELECT team_id, team_role FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $currentUser = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$currentUser || !in_array($currentUser['team_role'], ['owner', 'admin'])) {
        jsonResponse(['error' => 'Unauthorized: Only the team owner or admins can change member roles.'], 403);
    }

    // 2. Get target user's team info
    $stmt = $db->prepare("SELECT team_id, team_role FROM users WHERE id = ?");
    $stmt->execute([$targetUserId]);
    $targetUser = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$targetUser || $targetUser['team_id'] !== $currentUser['team_id']) {
        jsonResponse(['error' => 'User is not in your team.'], 403);
    }

    if ($targetUser['team_role'] === 'owner') {
        jsonResponse(['error' => 'Cannot change the role of the team owner.'], 400);
    }

    // 3. Update Role
    $stmt = $db->prepare("UPDATE users SET team_role = ? WHERE id = ?");
    $success = $stmt->execute([$newRole, $targetUserId]);

    if (!$success) {
        jsonResponse(['error' => 'Failed to update member role in database.'], 500);
    }

    // 4. If demoted to member, cancel any pending transfer requests
    if ($newRole === 'member') {
        $stmt = $db->prepare("UPDATE team_transfer_requests SET status = 'cancelled' WHERE new_owner_id = ? AND status = 'pending'");
        $stmt->execute([$targetUserId]);
    }

    // Verify the update (especially for ENUM issues)
    $stmt = $db->prepare("SELECT team_role FROM users WHERE id = ?");
    $stmt->execute([$targetUserId]);
    $updatedUser = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($updatedUser['team_role'] !== $newRole) {
        jsonResponse([
            'error' => "Database mismatch: Role was set to '{$newRole}' but saved as '{$updatedUser['team_role']}'. This usually means the database ENUM needs to be updated to include 'admin'.",
            'debug_role' => $updatedUser['team_role']
        ], 500);
    }

    jsonResponse([
        'success' => true,
        'message' => 'Member role updated successfully.'
    ]);

} catch (Exception $e) {
    jsonResponse(['error' => 'Internal server error: ' . $e->getMessage()], 500);
}
?>


