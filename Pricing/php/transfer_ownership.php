<?php
require_once 'config.php';

$userId = requireAuth();

$data = json_decode(file_get_contents('php://input'), true);
$targetUserId = $data['targetUserId'] ?? null;

if (!$targetUserId) {
    jsonResponse(['error' => 'Target user ID is required.'], 400);
}

try {
    $db = getDB();

    // 1. Get current user's team info (Must be owner)
    $stmt = $db->prepare("
        SELECT team_id, team_role, email, 
               stripe_customer_id, stripe_subscription_id, 
               subscription_plan, subscription_status, 
               subscription_start_date, subscription_ends_at, 
               cancel_at_period_end, recently_canceled
        FROM users WHERE id = ?
    ");
    $stmt->execute([$userId]);
    $currentUser = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$currentUser || $currentUser['team_role'] !== 'owner') {
        jsonResponse(['error' => 'Unauthorized: Only the team owner can transfer ownership.'], 403);
    }

    $teamId = $currentUser['team_id'];

    // 2. Get target user's team info (Must be in same team and be an admin)
    $stmt = $db->prepare("SELECT team_id, team_role, email FROM users WHERE id = ?");
    $stmt->execute([$targetUserId]);
    $targetUser = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$targetUser || $targetUser['team_id'] !== $teamId) {
        jsonResponse(['error' => 'Target user is not in your team.'], 403);
    }

    if ($targetUser['team_role'] !== 'admin') {
        jsonResponse(['error' => 'Successor must be an Admin for safety.'], 400);
    }

    // 3. Perform Transfer
    $db->beginTransaction();

    // A. Update Teams table
    $stmt = $db->prepare("UPDATE teams SET owner_id = ? WHERE id = ?");
    $stmt->execute([$targetUserId, $teamId]);

    // B. Update New Owner (Inherit Stripe metadata)
    $stmt = $db->prepare("
        UPDATE users 
        SET team_role = 'owner',
            stripe_customer_id = ?,
            stripe_subscription_id = ?,
            subscription_plan = ?,
            subscription_status = ?,
            subscription_start_date = ?,
            subscription_ends_at = ?,
            cancel_at_period_end = ?,
            recently_canceled = ?
        WHERE id = ?
    ");
    $stmt->execute([
        $currentUser['stripe_customer_id'],
        $currentUser['stripe_subscription_id'],
        $currentUser['subscription_plan'],
        $currentUser['subscription_status'],
        $currentUser['subscription_start_date'],
        $currentUser['subscription_ends_at'],
        $currentUser['cancel_at_period_end'],
        $currentUser['recently_canceled'],
        $targetUserId
    ]);

    // C. Update Old Owner (Become Member, Clear Stripe metadata)
    $stmt = $db->prepare("
        UPDATE users 
        SET team_role = 'member',
            stripe_customer_id = NULL,
            stripe_subscription_id = NULL,
            subscription_start_date = NULL,
            subscription_ends_at = NULL,
            cancel_at_period_end = 0,
            recently_canceled = 0
        WHERE id = ?
    ");
    $stmt->execute([$userId]);

    // D. Update Stripe Customer Email (if exists)
    if ($currentUser['stripe_customer_id']) {
        try {
            \Stripe\Customer::update($currentUser['stripe_customer_id'], [
                'email' => $targetUser['email'],
                'description' => 'Team Owner: ' . $targetUser['email']
            ]);
        } catch (Exception $e) {
            // Log error but don't fail the whole transaction if Stripe update fails
            // (though it's better if it succeeds)
            error_log("Stripe Customer Update Failed during transfer: " . $e->getMessage());
        }
    }

    $db->commit();

    jsonResponse([
        'success' => true,
        'message' => 'Ownership transferred successfully. You are now a team member.'
    ]);

} catch (Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    jsonResponse(['error' => 'Internal server error: ' . $e->getMessage()], 500);
}
?>
