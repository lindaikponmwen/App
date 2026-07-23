
<?php
require_once 'config.php';

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

// Ensure user is authenticated
$userId = requireAuth();

// Get input
$data = json_decode(file_get_contents('php://input'), true);
$plan = filter_var($data['plan'] ?? 'pro', FILTER_SANITIZE_STRING);

try {
    $db = getDB();
    
    // Log intent to subscribe. 
    // This allows tracking users who abandoned checkout.
    $stmt = $db->prepare("
        INSERT INTO subscription_attempts (user_id, plan, created_at) 
        VALUES (?, ?, NOW())
    ");
    $stmt->execute([$userId, $plan]);

    jsonResponse(['success' => true, 'message' => 'Intent logged']);
} catch (Exception $e) {
    error_log("Subscription attempt log failed: " . $e->getMessage());
    jsonResponse(['error' => 'Internal server error'], 500);
}
