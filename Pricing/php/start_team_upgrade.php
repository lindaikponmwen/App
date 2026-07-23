<?php
require_once 'config.php';

$userId = requireAuth();

if (!defined('STRIPE_TEAM_PRICE_ID') || STRIPE_TEAM_PRICE_ID === 'REPLACE_WITH_YOUR_PRICE_ID_HERE' || empty(STRIPE_TEAM_PRICE_ID)) {
    jsonResponse([
        'error' => 'Stripe Team Configuration Incomplete'
    ], 500);
}

if (!class_exists('\Stripe\Stripe')) {
    jsonResponse(['error' => 'Stripe SDK not found.'], 500);
}

try {
    $db = getDB();

    $stmt = $db->prepare("SELECT email, stripe_customer_id, team_id FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        jsonResponse(['error' => 'User record not found.'], 404);
    }

    if ($user['team_id']) {
        // Check if team subscription is active
        $stmt = $db->prepare("SELECT status FROM teams WHERE id = ?");
        $stmt->execute([$user['team_id']]);
        $team = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Only block if it's 'active' or 'past_due'. 
        // Allow if 'transferred', 'canceled', or 'over_limit' (if they want to upgrade to more seats)
        if ($team && in_array($team['status'], ['active', 'past_due'])) {
             jsonResponse(['error' => 'You are already in a team with an active subscription.'], 400);
        }
    }

    $stripe = new \Stripe\StripeClient(STRIPE_SECRET_KEY);

    $customerId = $user['stripe_customer_id'];

    // Create Stripe customer if missing
    if (!$customerId) {
        $customer = $stripe->customers->create([
            'email' => $user['email'],
            'metadata' => ['app_user_id' => $userId]
        ]);

        $customerId = $customer->id;

        $db->prepare("UPDATE users SET stripe_customer_id = ? WHERE id = ?")
            ->execute([$customerId, $userId]);
    }

    $expiresAt = time() + 3600;

    // For Teams, we always send to Checkout because it's a new subscription type
    // We enable adjustable_quantity with a minimum of 5
    $session = $stripe->checkout->sessions->create([
        'payment_method_types' => ['card'],
        'line_items' => [[
            'price' => STRIPE_TEAM_PRICE_ID,
            'quantity' => 5,
            'adjustable_quantity' => [
                'enabled' => true,
                'minimum' => 5,
                'maximum' => 100,
            ],
        ]],
        'mode' => 'subscription',
        'success_url' => 'https://' . $_SERVER['HTTP_HOST'] . '/',
        'cancel_url' => 'https://' . $_SERVER['HTTP_HOST'] . '/',
        'customer' => $customerId,
        'client_reference_id' => (string)$userId,
        'expires_at' => $expiresAt,
        'subscription_data' => [
            'metadata' => [
                'subscription_type' => 'team',
                'user_id' => (string)$userId,
                'plan_type' => 'team'
            ]
        ],
        'metadata' => [
            'subscription_type' => 'team',
            'user_id' => (string)$userId,
            'plan_type' => 'team'
        ]
    ]);

    // Log the checkout attempt for recovery tracking
    try {
        $db->prepare("
            INSERT INTO checkout_recovery (user_id, stripe_checkout_id, plan_type, status)
            VALUES (?, ?, 'team', 'pending')
            ON DUPLICATE KEY UPDATE 
                stripe_checkout_id = VALUES(stripe_checkout_id),
                plan_type = VALUES(plan_type),
                status = 'pending', 
                updated_at = CURRENT_TIMESTAMP
        ")->execute([$userId, $session->id]);
    } catch (Exception $e) {
        // Log error but don't block the user from proceeding to checkout
        error_log("RECOVERY LOG ERROR: " . $e->getMessage());
    }

    jsonResponse([
        'success' => true,
        'url' => $session->url
    ]);

} catch (\Stripe\Exception\ApiErrorException $e) {
    jsonResponse([
        'error' => 'Stripe connection failed',
        'details' => $e->getMessage()
    ], 500);
} catch (Exception $e) {
    jsonResponse(['error' => 'Internal server error'], 500);
}
?>