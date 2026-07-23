<?php
require_once 'config.php';

$userId = requireAuth();

if (STRIPE_PRICE_ID === 'REPLACE_WITH_YOUR_PRICE_ID_HERE' || empty(STRIPE_PRICE_ID)) {
    jsonResponse([
        'error' => 'Stripe Configuration Incomplete'
    ], 500);
}

if (!class_exists('\Stripe\Stripe')) {
    jsonResponse(['error' => 'Stripe SDK not found.'], 500);
}

try {
    $db = getDB();

    $stmt = $db->prepare("SELECT email, stripe_customer_id FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        jsonResponse(['error' => 'User record not found.'], 404);
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

    // 🔎 Check Stripe for any active/past_due subscriptions
    // We ALWAYS send to Checkout in this script because it's for STARTING an upgrade.
    // Reactivation/Management should go through create_portal_session.php.
    
    $expiresAt = time() + 3600;

    $session = $stripe->checkout->sessions->create([
        'payment_method_types' => ['card'],
        'line_items' => [[
            'price' => STRIPE_PRICE_ID,
            'quantity' => 1,
        ]],
        'mode' => 'subscription',
        'success_url' => 'https://' . $_SERVER['HTTP_HOST'] . '/',
        'cancel_url' => 'https://' . $_SERVER['HTTP_HOST'] . '/',
        'customer' => $customerId,
        'client_reference_id' => (string)$userId,
        'expires_at' => $expiresAt,
        'subscription_data' => [
            'metadata' => [
                'user_id' => (string)$userId,
                'plan_type' => 'pro'
            ]
        ]
    ]);

    // Log the checkout attempt for recovery tracking
    try {
        $db->prepare("
            INSERT INTO checkout_recovery (user_id, stripe_checkout_id, plan_type, status)
            VALUES (?, ?, 'pro', 'pending')
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