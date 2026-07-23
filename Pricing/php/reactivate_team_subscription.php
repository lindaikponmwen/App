<?php
require_once 'config.php';

$userId = requireAuth();

try {
    $db = getDB();

    // 1. Verify current user is the owner
    $stmt = $db->prepare("SELECT team_id, team_role FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $currentUser = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$currentUser || $currentUser['team_role'] !== 'owner') {
        jsonResponse(['error' => 'Unauthorized: Only the team owner can reactivate the subscription.'], 403);
    }

    // 2. Get Team and Subscription
    $stmt = $db->prepare("SELECT id, stripe_subscription_id FROM teams WHERE id = ?");
    $stmt->execute([$currentUser['team_id']]);
    $team = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$team || !$team['stripe_subscription_id']) {
        jsonResponse(['error' => 'No active team subscription found.'], 404);
    }

    // 3. Update Stripe
    $stripe = new \Stripe\StripeClient(STRIPE_SECRET_KEY);
    $stripe->subscriptions->update($team['stripe_subscription_id'], [
        'cancel_at_period_end' => false
    ]);

    // 4. Update Database
    $db->prepare("UPDATE teams SET status = 'active', cancel_at_period_end = 0 WHERE id = ?")->execute([$team['id']]);
    $db->prepare("UPDATE users SET cancel_at_period_end = 0 WHERE id = ?")->execute([$userId]);

    jsonResponse([
        'success' => true,
        'message' => 'Team subscription reactivated successfully.'
    ]);

} catch (Exception $e) {
    jsonResponse(['error' => 'Reactivation failed: ' . $e->getMessage()], 500);
}
?>
