<?php
require_once 'config.php';

$userId = requireAuth();

try {
    $db = getDB();

    // 1. Get User's Team Info
    $stmt = $db->prepare("
        SELECT 
            u.email, u.team_id, u.team_role, 
            t.id as t_id, t.name as team_name, t.total_seats, t.used_seats, t.owner_id, 
            t.status as team_status, t.cancel_at_period_end as team_cancel_at_period_end,
            t.subscription_ends_at as team_subscription_ends_at,
            t.recently_canceled as team_recently_canceled,
            o.name as owner_name
        FROM users u
        LEFT JOIN teams t ON u.team_id = t.id
        LEFT JOIN users o ON t.owner_id = o.id
        WHERE u.id = ?
    ");
    $stmt->execute([$userId]);
    $userData = $stmt->fetch(PDO::FETCH_ASSOC);

    // 🔄 AUTO-EXPIRATION CHECK: If transferred team has passed its end date
    if ($userData && $userData['team_status'] === 'transferred' && $userData['team_subscription_ends_at']) {
        $endsAt = new DateTime($userData['team_subscription_ends_at']);
        $now = new DateTime();
        
        if ($now > $endsAt) {
            $db->beginTransaction();
            try {
                // Update Team Status
                $db->prepare("UPDATE teams SET status = 'canceled', recently_canceled = 1 WHERE id = ?")
                   ->execute([$userData['team_id']]);
                
                // Update All Members Status
                $db->prepare("UPDATE users SET subscription_status = 'canceled', recently_canceled = 1 WHERE team_id = ?")
                   ->execute([$userData['team_id']]);
                
                $db->commit();
                
                // Refresh userData for the response
                $userData['team_status'] = 'canceled';
                $userData['team_recently_canceled'] = 1;
            } catch (Exception $e) {
                $db->rollBack();
                error_log("Auto-expiration failed: " . $e->getMessage());
            }
        }
    }

    if (!$userData || !$userData['team_id'] || !$userData['t_id']) {
        // Check if user has a pending invite
        $stmt = $db->prepare("SELECT token, team_id FROM team_invites WHERE email = ? AND status = 'pending' AND (expires_at IS NULL OR expires_at > NOW()) LIMIT 1");
        $stmt->execute([$userData['email'] ?? '']);
        $pendingInvite = $stmt->fetch(PDO::FETCH_ASSOC);

        $teamName = null;
        if ($pendingInvite) {
            $stmt = $db->prepare("SELECT name, status, cancel_at_period_end FROM teams WHERE id = ?");
            $stmt->execute([$pendingInvite['team_id']]);
            $team = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($team && $team['status'] !== 'deleted') {
                $teamName = $team['name'] ?? 'a team';
                $teamCancelAtPeriodEnd = (bool)$team['cancel_at_period_end'];
            } else {
                $pendingInvite = null;
            }
        }

        jsonResponse([
            'hasTeam' => false,
            'pendingInvite' => $pendingInvite ? [
                'token' => $pendingInvite['token'],
                'teamName' => $teamName,
                'teamCancelAtPeriodEnd' => $teamCancelAtPeriodEnd ?? false
            ] : null,
            'message' => 'You are not part of an active team.'
        ]);
    }

    // 2. Get Team Members
    $stmt = $db->prepare("
        SELECT id, email, name, team_role, created_at
        FROM users
        WHERE team_id = ?
        ORDER BY (CASE WHEN team_role = 'owner' THEN 1 WHEN team_role = 'admin' THEN 2 ELSE 3 END), created_at ASC
    ");
    $stmt->execute([$userData['team_id']]);
    $members = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 3. Get Pending Invites
    $invites = [];
    if (in_array($userData['team_role'], ['owner', 'admin'])) {
        $stmt = $db->prepare("
            SELECT id, email, status, created_at, token
            FROM team_invites
            WHERE team_id = ? AND status = 'pending'
            ORDER BY created_at DESC
        ");
        $stmt->execute([$userData['team_id']]);
        $invites = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // 4. Get Transfer Request
    $stmt = $db->prepare("
        SELECT tr.*, u.email as new_owner_email
        FROM team_transfer_requests tr
        JOIN users u ON tr.new_owner_id = u.id
        WHERE tr.team_id = ? 
        ORDER BY tr.created_at DESC
        LIMIT 1
    ");
    $stmt->execute([$userData['team_id']]);
    $transferRequest = $stmt->fetch(PDO::FETCH_ASSOC);

    jsonResponse([
        'hasTeam' => true,
        'team' => [
            'id' => $userData['team_id'],
            'name' => $userData['team_name'],
            'role' => $userData['team_role'],
            'total_seats' => (int)$userData['total_seats'],
            'used_seats' => (int)$userData['used_seats'],
            'is_over_limit' => (int)$userData['used_seats'] > (int)$userData['total_seats'],
            'isOwner' => (int)$userData['owner_id'] === (int)$userId,
            'owner_name' => $userData['owner_name'],
            'status' => $userData['team_status'],
            'cancel_at_period_end' => (bool)$userData['team_cancel_at_period_end'],
            'subscription_ends_at' => $userData['team_subscription_ends_at'],
            'recently_canceled' => (bool)$userData['team_recently_canceled']
        ],
        'members' => $members,
        'invites' => $invites,
        'transferRequest' => $transferRequest
    ]);

} catch (Exception $e) {
    jsonResponse(['error' => 'Internal server error: ' . $e->getMessage()], 500);
}
?>
