<?php
require_once 'config.php';

$userId = requireAuth();

$data = json_decode(file_get_contents('php://input'), true);
$token = $data['token'] ?? '';

if (empty($token)) {
    jsonResponse(['error' => 'Invalid invitation token.'], 400);
}

try {
    $db = getDB();

    // 1. Validate Token
    $stmt = $db->prepare("SELECT id, team_id, email, status, expires_at FROM team_invites WHERE token = ? AND status = 'pending' LIMIT 1");
    $stmt->execute([$token]);
    $invite = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$invite) {
        jsonResponse(['error' => 'Invalid or expired invitation token.'], 404);
    }

    // 2. Check Expiry
    if ($invite['expires_at']) {
        $now = new DateTime();
        $expiresAt = new DateTime($invite['expires_at']);
        if ($expiresAt < $now) {
            $stmt = $db->prepare("UPDATE team_invites SET status = 'expired' WHERE id = ?");
            $stmt->execute([$invite['id']]);
            jsonResponse(['error' => 'This invitation has expired.'], 400);
        }
    }

    // 3. Strict Email Match
    $stmt = $db->prepare("SELECT email, team_id, stripe_subscription_id, subscription_status FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (strtolower(trim($user['email'])) !== strtolower(trim($invite['email']))) {
        jsonResponse(['error' => 'Wrong email address.'], 403);
    }

    if ($user && $user['team_id']) {
        jsonResponse(['error' => 'You are already a member of a team. Please leave your current team before joining a new one.'], 400);
    }

    // 3.5 Cancel Individual Pro Subscription if it exists
    if (!empty($user['stripe_subscription_id'])) {
        try {
            \Stripe\Subscription::retrieve($user['stripe_subscription_id'])->cancel();
            
            $stmt = $db->prepare("UPDATE users SET subscription_status = 'canceled', stripe_subscription_id = NULL WHERE id = ?");
            $stmt->execute([$userId]);
        } catch (Exception $e) {
            // Log error but allow user to join team anyway, or should we block?
            // Blocking is safer to prevent double billing.
            jsonResponse(['error' => 'Failed to cancel your individual subscription: ' . $e->getMessage()], 500);
        }
    }

    // 4. Check if team has seats left
    $stmt = $db->prepare("SELECT total_seats, used_seats, status, cancel_at_period_end FROM teams WHERE id = ?");
    $stmt->execute([$invite['team_id']]);
    $team = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$team || $team['status'] === 'deleted') {
        jsonResponse(['error' => 'This team no longer exists.'], 404);
    }

    if ($team['used_seats'] >= $team['total_seats']) {
        jsonResponse(['error' => 'This team has no seats available. Please contact the team owner.'], 400);
    }

    // 4. Join Team
    $db->beginTransaction();

    // Update User
    // Inherit team's grace period status
    $stmt = $db->prepare("UPDATE users SET team_id = ?, team_role = 'member', subscription_plan = 'team', subscription_status = 'active', cancel_at_period_end = ? WHERE id = ?");
    $stmt->execute([$invite['team_id'], $team['cancel_at_period_end'], $userId]);

    // Update Team Seat Count
    $stmt = $db->prepare("UPDATE teams SET used_seats = used_seats + 1 WHERE id = ?");
    $stmt->execute([$invite['team_id']]);

    // Update Team Status
    updateTeamStatus($db, $invite['team_id']);

    // Update Invite Status
    $stmt = $db->prepare("UPDATE team_invites SET status = 'accepted' WHERE id = ?");
    $stmt->execute([$invite['id']]);

    $db->commit();

    jsonResponse([
        'success' => true,
        'message' => 'Successfully joined the team!'
    ]);

} catch (Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    jsonResponse(['error' => 'Internal server error: ' . $e->getMessage()], 500);
}
?>
