<?php
require_once 'config.php';

$userId = requireAuth();

try {
    $db = getDB();

    // 1. Get User and Subscription
    $stmt = $db->prepare("SELECT stripe_subscription_id, subscription_plan FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || $user['subscription_plan'] !== 'pro' || !$user['stripe_subscription_id']) {
        jsonResponse(['error' => 'No active Pro subscription found.'], 404);
    }

    // 2. Update Stripe
    $stripe = new \Stripe\StripeClient(STRIPE_SECRET_KEY);
    $stripe->subscriptions->update($user['stripe_subscription_id'], [
        'cancel_at_period_end' => true
    ]);

    // 3. Update Database
    $db->prepare("UPDATE users SET subscription_status = 'canceling', cancel_at_period_end = 1 WHERE id = ?")->execute([$userId]);

    jsonResponse([
        'success' => true,
        'message' => 'Pro subscription will be canceled at the end of the billing period.'
    ]);

} catch (Exception $e) {
    jsonResponse(['error' => 'Cancellation failed: ' . $e->getMessage()], 500);
}
?>
