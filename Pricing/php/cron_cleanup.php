<?php
/**
 * CRON JOB: Subscription Cleanup
 * Run this every hour to demote users whose subscriptions have expired.
 */
require_once 'config.php';

function logCron($message) {
    $date = date('Y-m-d H:i:s');
    @file_put_contents('cron_debug.log', "[$date] $message" . PHP_EOL, FILE_APPEND);
}

try {
    $db = getDB();
    
    // 1. Find users whose subscription has expired
    // We look for active subscriptions where the ends_at date is in the past
    $stmt = $db->prepare("
        SELECT id, email, stripe_subscription_id 
        FROM users 
        WHERE subscription_status = 'active' 
        AND subscription_ends_at IS NOT NULL 
        AND subscription_ends_at < NOW()
    ");
    $stmt->execute();
    $expiredUsers = $stmt->fetchAll();

    if (count($expiredUsers) > 0) {
        logCron("Found " . count($expiredUsers) . " expired subscriptions.");
        
        foreach ($expiredUsers as $user) {
            // 2. Demote the user
            $update = $db->prepare("
                UPDATE users 
                SET subscription_status = 'canceled',
                    subscription_plan = 'free',
                    cancel_at_period_end = 0,
                    subscription_ends_at = NULL,
                    recently_canceled = 1
                WHERE id = ?
            ");
            $update->execute([$user['id']]);
            
            logCron("Demoted User ID: " . $user['id'] . " (" . $user['email'] . ")");
        }
    } else {
        logCron("No expired subscriptions found.");
    }

} catch (Exception $e) {
    logCron("CRON ERROR: " . $e->getMessage());
}
?>
