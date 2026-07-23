
<?php
require_once 'config.php';

/**
 * Protect this endpoint - Only admins can continue past this call
 */
requireAdmin();

try {
    $db = getDB();
    
    // Fetch some admin-only statistics
    $totalUsers = $db->query("SELECT COUNT(*) FROM users")->fetchColumn();
    $proUsers = $db->query("SELECT COUNT(*) FROM users WHERE subscription_plan = 'pro'")->fetchColumn();
    $activeSubs = $db->query("SELECT COUNT(*) FROM users WHERE subscription_status = 'active'")->fetchColumn();
    $pastDueSubs = $db->query("SELECT COUNT(*) FROM users WHERE subscription_status = 'past_due'")->fetchColumn();
    $unpaidSubs = $db->query("SELECT COUNT(*) FROM users WHERE subscription_status = 'unpaid'")->fetchColumn();
    
    $recentUsers = $db->query("
        SELECT id, email, created_at, role, subscription_plan, subscription_status, stripe_customer_id, stripe_subscription_id, subscription_ends_at
        FROM users 
        ORDER BY created_at DESC 
        LIMIT 50
    ")->fetchAll(PDO::FETCH_ASSOC);

    // Fetch recent webhooks
    $recentWebhooks = $db->query("
        SELECT event_type, payload, created_at 
        FROM subscription_events 
        ORDER BY created_at DESC 
        LIMIT 20
    ")->fetchAll(PDO::FETCH_ASSOC);

    jsonResponse([
        'stats' => [
            'total_users' => (int)$totalUsers,
            'pro_users' => (int)$proUsers,
            'active_subs' => (int)$activeSubs,
            'past_due_subs' => (int)$pastDueSubs,
            'unpaid_subs' => (int)$unpaidSubs
        ],
        'users' => $recentUsers,
        'webhooks' => $recentWebhooks
    ]);

} catch (Exception $e) {
    jsonResponse(['error' => 'Failed to fetch admin data'], 500);
}