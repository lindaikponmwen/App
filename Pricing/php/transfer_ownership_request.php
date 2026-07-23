<?php
require_once 'config.php';

$userId = requireAuth();

$data = json_decode(file_get_contents('php://input'), true);
$newOwnerId = $data['newOwnerId'] ?? null;

if (!$newOwnerId) {
    jsonResponse(['error' => 'New owner ID is required.'], 400);
}

try {
    $db = getDB();

    // 1. Verify current user is the owner and check team status
    $stmt = $db->prepare("
        SELECT u.team_id, u.team_role, t.status as team_status 
        FROM users u
        JOIN teams t ON u.team_id = t.id
        WHERE u.id = ?
    ");
    $stmt->execute([$userId]);
    $currentUser = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$currentUser || $currentUser['team_role'] !== 'owner') {
        jsonResponse(['error' => 'Unauthorized: Only the team owner can initiate a transfer.'], 403);
    }

    if (in_array($currentUser['team_status'], ['transferred', 'past_due', 'over_limit'])) {
        if ($currentUser['team_status'] === 'over_limit') {
            $error = 'Transfer restricted: This team has exceeded its seat limit. Please upgrade your plan to return the team to "Active" status before transferring ownership.';
        } else {
            $error = ($currentUser['team_status'] === 'transferred') 
                ? 'Transfer restricted: This team is currently in a grace period. You must set up a new billing plan to return the team to "Active" status before transferring ownership again.'
                : 'Transfer restricted: This team has a past due balance. Please update your payment method to return the team to "Active" status before transferring ownership.';
        }
        jsonResponse(['error' => $error], 400);
    }

    // 2. Verify new owner is an admin in the same team
    $stmt = $db->prepare("SELECT team_id, team_role, email FROM users WHERE id = ?");
    $stmt->execute([$newOwnerId]);
    $newOwner = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$newOwner || $newOwner['team_id'] !== $currentUser['team_id'] || $newOwner['team_role'] !== 'admin') {
        jsonResponse(['error' => 'Invalid target: The new owner must be an admin in your team.'], 400);
    }

    // 3. Create transfer request
    $token = bin2hex(random_bytes(32));
    
    // Deactivate any existing pending requests for this team
    $stmt = $db->prepare("UPDATE team_transfer_requests SET status = 'cancelled' WHERE team_id = ? AND status = 'pending'");
    $stmt->execute([$currentUser['team_id']]);

    $stmt = $db->prepare("
        INSERT INTO team_transfer_requests (team_id, old_owner_id, new_owner_id, token)
        VALUES (?, ?, ?, ?)
    ");
    $stmt->execute([$currentUser['team_id'], $userId, $newOwnerId, $token]);

    jsonResponse([
        'success' => true,
        'message' => 'Ownership transfer request sent to ' . $newOwner['email'] . '.',
        'token' => $token // In a real app, this would be sent via email
    ]);

} catch (Exception $e) {
    jsonResponse(['error' => 'Internal server error: ' . $e->getMessage()], 500);
}
?>