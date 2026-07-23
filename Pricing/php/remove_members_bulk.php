<?php
require_once 'config.php';

$userId = requireAuth();

$data = json_decode(file_get_contents('php://input'), true);
$targetUserIds = $data['userIds'] ?? [];
$removeAll = $data['removeAll'] ?? false;

try {
    $db = getDB();

    // 1. Get current user's team info
    $stmt = $db->prepare("SELECT team_id, team_role FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $currentUser = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$currentUser || !$currentUser['team_id']) {
        jsonResponse(['error' => 'You are not a member of any team.'], 403);
    }

    if ($currentUser['team_role'] === 'member' && !$removeAll) {
        jsonResponse(['error' => 'Unauthorized: Only the owner or admins can remove members.'], 403);
    }

    // 2. Identify target users
    if ($removeAll) {
        $stmt = $db->prepare("SELECT id, email, team_role FROM users WHERE team_id = ? AND id != ?");
        $stmt->execute([$currentUser['team_id'], $userId]);
        $targets = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // If Admin, exclude Owner
        if ($currentUser['team_role'] === 'admin') {
            $targets = array_filter($targets, function($t) {
                return $t['team_role'] !== 'owner';
            });
        }
    } else {
        if (empty($targetUserIds) || !is_array($targetUserIds)) {
            jsonResponse(['error' => 'User IDs are required.'], 400);
        }
        $placeholders = implode(',', array_fill(0, count($targetUserIds), '?'));
        $stmt = $db->prepare("SELECT id, email, team_role FROM users WHERE id IN ($placeholders) AND team_id = ?");
        $stmt->execute(array_merge($targetUserIds, [$currentUser['team_id']]));
        $targets = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // If Admin, filter out Owner
        if ($currentUser['team_role'] === 'admin') {
            $targets = array_filter($targets, function($t) {
                return $t['team_role'] !== 'owner';
            });
        }
    }

    if (empty($targets)) {
        jsonResponse(['success' => true, 'message' => 'No members to remove.', 'count' => 0]);
    }

    // 3. Perform Removal
    $db->beginTransaction();
    $count = 0;

    foreach ($targets as $target) {
        // Reset User
        $stmt = $db->prepare("
            UPDATE users 
            SET team_id = NULL, 
                team_role = NULL, 
                subscription_plan = 'free', 
                subscription_status = 'none' 
            WHERE id = ?
        ");
        $stmt->execute([$target['id']]);

        // Decrement Team Seats
        $stmt = $db->prepare("UPDATE teams SET used_seats = used_seats - 1 WHERE id = ?");
        $stmt->execute([$currentUser['team_id']]);

        // Cleanup Invite Record (Soft Delete)
        $stmt = $db->prepare("UPDATE team_invites SET status = 'removed' WHERE LOWER(TRIM(email)) = ? AND team_id = ? AND status = 'accepted'");
        $stmt->execute([strtolower(trim($target['email'])), $currentUser['team_id']]);
        
        $count++;
    }

    $db->commit();

    // Update Team Status
    updateTeamStatus($db, $currentUser['team_id']);

    jsonResponse([
        'success' => true,
        'count' => $count,
        'message' => "Successfully removed $count members."
    ]);

} catch (Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    jsonResponse(['error' => 'Internal server error: ' . $e->getMessage()], 500);
}
?>
