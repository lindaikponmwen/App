<?php
require_once __DIR__ . '/config.php';

$userId = requireAuth();

try {
    $db = getDB();

    // Fetch user details
    $stmt = $db->prepare("SELECT email, stripe_customer_id FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || empty($user['email'])) {
        jsonResponse(['success' => false, 'error' => 'User not found'], 404);
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

    // 🔎 Check Stripe for any subscriptions (active, past_due, trialing, unpaid)
    $subscriptions = $stripe->subscriptions->all([
        'customer' => $customerId,
        'status' => 'all', 
        'limit' => 10
    ]);

    $hasValidSub = false;
    foreach ($subscriptions->data as $sub) {
        // We accept any subscription that isn't fully canceled or expired
        if (in_array($sub->status, ['active', 'past_due', 'trialing', 'unpaid', 'incomplete'])) {
            $hasValidSub = true;
            break;
        }
    }

    if ($hasValidSub) {
        // 1. HAS SUBSCRIPTION -> Send to Billing Portal
        $session = $stripe->billingPortal->sessions->create([
            'customer' => $customerId,
            'return_url' => 'https://' . $_SERVER['HTTP_HOST'] . '/',
        ]);
        jsonResponse(['success' => true, 'url' => $session->url]);
    } else {
        // 2. NO SUBSCRIPTION -> Error (User must use Pricing Page to subscribe)
        jsonResponse([
            'success' => false, 
            'error' => 'No active subscription found. Please subscribe via the Pricing page.'
        ], 400);
    }

} catch (\Stripe\Exception\ApiErrorException $e) {
    jsonResponse(['success' => false, 'error' => 'Stripe API error: ' . $e->getMessage()], 500);
} catch (Exception $e) {
    jsonResponse(['success' => false, 'error' => 'Server error: ' . $e->getMessage()], 500);
}
?>