<?php
require_once 'config.php';

$userId = requireAuth();

$data = json_decode(file_get_contents('php://input'), true);
$targetUserIds = $data['userIds'] ?? null;

if (!$targetUserIds || !is_array($targetUserIds)) {
    jsonResponse(['error' => 'User IDs array is required.'], 400);
}

try {
    $db = getDB();

    // 1. Get current user's team info
    $stmt = $db->prepare("SELECT team_id, team_role, email FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $currentUser = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$currentUser || !$currentUser['team_id']) {
        jsonResponse(['error' => 'You are not a member of any team.'], 403);
    }

    $db->beginTransaction();
    $removedCount = 0;

    foreach ($targetUserIds as $targetUserId) {
        // 2. Get target user's team info
        $stmt = $db->prepare("SELECT team_id, team_role, email FROM users WHERE id = ?");
        $stmt->execute([$targetUserId]);
        $targetUser = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$targetUser || $targetUser['team_id'] !== $currentUser['team_id']) {
            continue; // Skip users not in the team
        }

        // 3. Permission Check
        $isSelfRemoval = ($userId == $targetUserId);
        $isOwnerKicking = ($currentUser['team_role'] === 'owner' && !$isSelfRemoval);
        $isAdminKicking = ($currentUser['team_role'] === 'admin' && !$isSelfRemoval && $targetUser['team_role'] !== 'owner');

        if (!$isSelfRemoval && !$isOwnerKicking && !$isAdminKicking) {
            continue; // Skip unauthorized removals
        }

        // 4. Prevent owner from removing themselves (they must delete the team or transfer ownership)
        if ($isSelfRemoval && $currentUser['team_role'] === 'owner') {
            continue; // Skip self-removal for owners
        }

        // 5. Perform Removal
        // Reset User
        $stmt = $db->prepare("
            UPDATE users 
            SET team_id = NULL, 
                team_role = NULL, 
                subscription_plan = 'free', 
                subscription_status = 'none' 
            WHERE id = ?
        ");
        $stmt->execute([$targetUserId]);

        // Decrement Team Seats
        $stmt = $db->prepare("UPDATE teams SET used_seats = used_seats - 1 WHERE id = ?");
        $stmt->execute([$currentUser['team_id']]);

        // Cleanup Invite Record (Soft Delete)
        $status = $isSelfRemoval ? 'left' : 'removed';
        $stmt = $db->prepare("UPDATE team_invites SET status = ? WHERE LOWER(TRIM(email)) = ? AND team_id = ? AND status = 'accepted'");
        $stmt->execute([$status, strtolower(trim($targetUser['email'])), $currentUser['team_id']]);
        
        $removedCount++;
    }

    $db->commit();

    // Update Team Status
    updateTeamStatus($db, $currentUser['team_id']);

    jsonResponse([
        'success' => true,
        'message' => $removedCount > 1 ? "$removedCount members removed." : "Member removed."
    ]);

} catch (Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    jsonResponse(['error' => 'Internal server error: ' . $e->getMessage()], 500);
}
?>

