<?php
require_once 'config.php';

$userId = requireAuth();

try {
    $db = getDB();

    // 1. Check if user is owner of the team
    $stmt = $db->prepare("SELECT team_id, team_role FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !$user['team_id'] || $user['team_role'] !== 'owner') {
        jsonResponse(['error' => 'Unauthorized: Only the team owner can delete the team.'], 403);
    }

    $teamId = $user['team_id'];

    // Fetch subscription ID
    $stmt = $db->prepare("SELECT stripe_subscription_id FROM teams WHERE id = ?");
    $stmt->execute([$teamId]);
    $team = $stmt->fetch(PDO::FETCH_ASSOC);
    $subscriptionId = $team['stripe_subscription_id'] ?? null;

    // 2. Perform Deletion
    $db->beginTransaction();

    // Cancel Stripe subscription immediately if it exists
    if ($subscriptionId) {
        $stripe = new \Stripe\StripeClient(STRIPE_SECRET_KEY);
        $stripe->subscriptions->cancel($subscriptionId);
    }

    // Reset all members
    $stmt = $db->prepare("
        UPDATE users 
        SET team_id = NULL, 
            team_role = NULL, 
            subscription_plan = 'free', 
            subscription_status = 'none',
            recently_canceled = 1
        WHERE team_id = ?
    ");
    $stmt->execute([$teamId]);

    // Delete invites
    $stmt = $db->prepare("DELETE FROM team_invites WHERE team_id = ?");
    $stmt->execute([$teamId]);

    // Soft delete team record
    $stmt = $db->prepare("UPDATE teams SET status = 'deleted' WHERE id = ?");
    $stmt->execute([$teamId]);

    $db->commit();

    jsonResponse([
        'success' => true,
        'message' => 'Team deleted successfully.'
    ]);

} catch (Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    jsonResponse(['error' => 'Internal server error: ' . $e->getMessage()], 500);
}
?>
