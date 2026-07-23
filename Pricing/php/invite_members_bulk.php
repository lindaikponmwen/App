<?php
require_once 'config.php';

$userId = requireAuth();

$data = json_decode(file_get_contents('php://input'), true);
$emails = $data['emails'] ?? [];

if (empty($emails) || !is_array($emails)) {
    jsonResponse(['error' => 'At least one email address is required.'], 400);
}

try {
    $db = getDB();
    
    // 1. Get current user's team info
    $stmt = $db->prepare("SELECT team_id, team_role FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !$user['team_id'] || !in_array($user['team_role'], ['owner', 'admin'])) {
        jsonResponse(['error' => 'Unauthorized: Only team owners or admins can invite members.'], 403);
    }

    // 2. Check team seats
    $stmt = $db->prepare("SELECT total_seats, used_seats, status FROM teams WHERE id = ?");
    $stmt->execute([$user['team_id']]);
    $team = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$team || $team['status'] === 'deleted') {
        jsonResponse(['error' => 'This team no longer exists.'], 404);
    }

    $availableSeats = $team['total_seats'] - $team['used_seats'];
    
    // We also need to count pending invites
    $stmt = $db->prepare("SELECT COUNT(*) FROM team_invites WHERE team_id = ? AND status = 'pending' AND expires_at > NOW()");
    $stmt->execute([$user['team_id']]);
    $pendingCount = $stmt->fetchColumn();
    
    $trulyAvailable = $availableSeats - $pendingCount;

    if (count($emails) > $trulyAvailable) {
        jsonResponse(['error' => "Not enough seats available. You have {$trulyAvailable} seats remaining (including pending invites)."], 400);
    }

    $db->beginTransaction();
    $count = 0;
    $errors = [];

    foreach ($emails as $email) {
        $email = strtolower(trim($email));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors[] = "Invalid email: $email";
            continue;
        }

        // Check if already a member
        $stmt = $db->prepare("SELECT id FROM users WHERE LOWER(TRIM(email)) = ? AND team_id = ?");
        $stmt->execute([$email, $user['team_id']]);
        if ($stmt->fetch()) {
            $errors[] = "Already a member: $email";
            continue;
        }

        // Check pending invite
        $stmt = $db->prepare("SELECT token FROM team_invites WHERE LOWER(TRIM(email)) = ? AND team_id = ? AND status = 'pending' AND expires_at > NOW()");
        $stmt->execute([$email, $user['team_id']]);
        if ($stmt->fetch()) {
            $errors[] = "Invite already pending: $email";
            continue;
        }

        // Generate token
        $token = bin2hex(random_bytes(16));
        $expiresAt = (new DateTime())->add(new DateInterval('P3D'))->format('Y-m-d H:i:s');

        // Save invite
        $stmt = $db->prepare("INSERT INTO team_invites (team_id, email, token, status, expires_at) VALUES (?, ?, ?, 'pending', ?)");
        $stmt->execute([$user['team_id'], $email, $token, $expiresAt]);
        $count++;
    }

    $db->commit();

    jsonResponse([
        'success' => true,
        'count' => $count,
        'errors' => $errors,
        'message' => "Successfully sent $count invitations."
    ]);

} catch (Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    jsonResponse(['error' => 'Internal server error: ' . $e->getMessage()], 500);
}
?>
