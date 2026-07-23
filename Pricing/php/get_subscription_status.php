
<?php
require_once 'config.php';

// Ensure user is authenticated
$userId = requireAuth();

try {
    $db = getDB();
    
    // Read subscription status from DB
    $stmt = $db->prepare("
        SELECT subscription_status, subscription_plan 
        FROM users 
        WHERE id = ?
    ");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user) {
        jsonResponse(['error' => 'User not found'], 404);
    }

    jsonResponse([
        'plan' => $user['subscription_plan'] ?? 'free',
        'status' => $user['subscription_status'] ?? 'none'
    ]);

} catch (Exception $e) {
    error_log("Status check failed: " . $e->getMessage());
    jsonResponse(['error' => 'Internal server error'], 500);
}