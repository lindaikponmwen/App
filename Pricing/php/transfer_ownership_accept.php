<?php
require_once 'config.php';

$userId = requireAuth();

$data = json_decode(file_get_contents('php://input'), true);
$token = $data['token'] ?? null;

if (!$token) {
    jsonResponse(['error' => 'Token is required.'], 400);
}

try {
    $db = getDB();

    // 1. Verify token and get request details
    $stmt = $db->prepare("
        SELECT tr.*, t.stripe_subscription_id, t.total_seats, t.status as team_status
        FROM team_transfer_requests tr
        JOIN teams t ON tr.team_id = t.id
        WHERE tr.token = ? AND tr.status = 'pending' AND tr.new_owner_id = ?
    ");
    $stmt->execute([$token, $userId]);
    $request = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$request || $request['team_status'] === 'deleted') {
        jsonResponse(['error' => 'Invalid, expired, or cancelled transfer request.'], 404);
    }

    if (in_array($request['team_status'], ['transferred', 'past_due', 'over_limit'])) {
        if ($request['team_status'] === 'over_limit') {
            $error = 'Transfer restricted: This team has exceeded its seat limit. The current owner must upgrade their plan before ownership can be transferred.';
        } else {
            $error = ($request['team_status'] === 'transferred') 
                ? 'Transfer restricted: This team is already in a grace period. The current owner must set up a new billing plan before ownership can be transferred again.'
                : 'Transfer restricted: This team has a past due balance. The current owner must update their payment method before ownership can be transferred.';
        }
        jsonResponse(['error' => $error], 400);
    }

    // 2. Get New Owner's Stripe Customer ID (or create one if missing)
    $stmt = $db->prepare("SELECT stripe_customer_id, email FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $newOwner = $stmt->fetch(PDO::FETCH_ASSOC);

    // Get Old Owner's subscription info to transfer to team record
    $stmt = $db->prepare("SELECT stripe_customer_id, stripe_subscription_id, subscription_ends_at, recently_canceled FROM users WHERE id = ?");
    $stmt->execute([$request['old_owner_id']]);
    $oldOwnerSub = $stmt->fetch(PDO::FETCH_ASSOC);

    $stripe = new \Stripe\StripeClient(STRIPE_SECRET_KEY);
    $newOwnerStripeId = $newOwner['stripe_customer_id'];

    if (!$newOwnerStripeId) {
        $customer = $stripe->customers->create([
            'email' => $newOwner['email'],
            'metadata' => ['user_id' => $userId]
        ]);
        $newOwnerStripeId = $customer->id;
        $db->prepare("UPDATE users SET stripe_customer_id = ? WHERE id = ?")->execute([$newOwnerStripeId, $userId]);
    }

    // 3. Update Stripe Subscription
    // Explicitly set cancel_at_period_end to true on Stripe
    try {
        $stripe->subscriptions->update($request['stripe_subscription_id'], [
            'cancel_at_period_end' => true
        ]);
    } catch (Exception $e) {
        error_log("Stripe update failed in transfer: " . $e->getMessage());
    }

    $endsAt = $oldOwnerSub['subscription_ends_at'];
    $newTeamStatus = ($request['team_status'] === 'canceled') ? 'canceled' : 'transferred';
    $cancelAtPeriodEnd = ($newTeamStatus === 'canceled') ? 0 : 1;

    // Fallback: If endsAt is missing, fetch from Stripe
    if (!$endsAt && $oldOwnerSub['stripe_subscription_id']) {
        try {
            $sub = $stripe->subscriptions->retrieve($oldOwnerSub['stripe_subscription_id']);
            $rawEnd = $sub->current_period_end ?? $sub->cancel_at ?? 0;
            if ($rawEnd) {
                $endsAt = date('Y-m-d H:i:s', (int)$rawEnd);
            }
        } catch (Exception $e) {
            error_log("Stripe fetch failed in transfer: " . $e->getMessage());
        }
    }

    // 4. Update Database
    $db->beginTransaction();

    // Update Team: Store the Stripe IDs here now
    $stmt = $db->prepare("
        UPDATE teams 
        SET owner_id = ?, 
            status = ?,
            cancel_at_period_end = ?,
            subscription_ends_at = ?,
            stripe_customer_id = ?,
            stripe_subscription_id = ?
        WHERE id = ?
    ");
    $stmt->execute([
        $userId, 
        $newTeamStatus,
        $cancelAtPeriodEnd,
        $endsAt, 
        $oldOwnerSub['stripe_customer_id'], 
        $oldOwnerSub['stripe_subscription_id'], 
        $request['team_id']
    ]);

    // Update New Owner (User record)
    // We clear their individual sub IDs because they are now covered by the team
    $stmt = $db->prepare("
        UPDATE users 
        SET team_role = 'owner',
            stripe_customer_id = ?,
            stripe_subscription_id = NULL,
            subscription_plan = 'team',
            subscription_status = ?,
            subscription_ends_at = ?,
            cancel_at_period_end = ?
        WHERE id = ?
    ");
    $stmt->execute([$newOwnerStripeId, $newTeamStatus, $endsAt, $cancelAtPeriodEnd, $userId]);

    // Update Old Owner (User record)
    // Clear their sub IDs immediately as planned
    $stmt = $db->prepare("
        UPDATE users 
        SET team_role = 'member',
            stripe_customer_id = NULL,
            stripe_subscription_id = NULL,
            subscription_plan = 'team',
            subscription_status = ?,
            cancel_at_period_end = ?,
            subscription_ends_at = ?
        WHERE id = ?
    ");
    $stmt->execute([$newTeamStatus, $cancelAtPeriodEnd, $endsAt, $request['old_owner_id']]);

    // 🔄 BULK UPDATE: Sync all team members to 'transferred' status
    // Update Request Status
    $db->prepare("UPDATE team_transfer_requests SET status = 'accepted' WHERE id = ?")->execute([$request['id']]);

    $db->commit();
    
    // Call updateTeamStatus to sync everyone else
    updateTeamStatus($db, $request['team_id']);

    jsonResponse([
        'success' => true,
        'message' => 'Ownership transferred successfully. You are now the team owner.'
    ]);

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) $db->rollBack();
    jsonResponse(['error' => 'Transfer failed: ' . $e->getMessage()], 500);
}
?>
