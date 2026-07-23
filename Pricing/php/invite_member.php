<?php
require_once 'config.php';

$userId = requireAuth();

// Only owners or admins can invite
$db = getDB();
$stmt = $db->prepare("SELECT team_id, team_role FROM users WHERE id = ?");
$stmt->execute([$userId]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user || !$user['team_id'] || !in_array($user['team_role'], ['owner', 'admin'])) {
    jsonResponse(['error' => 'Unauthorized: Only team owners or admins can invite members.'], 403);
}

$data = json_decode(file_get_contents('php://input'), true);
$emails = $data['emails'] ?? [];

if (!is_array($emails) || empty($emails)) {
    jsonResponse(['error' => 'At least one email address is required.'], 400);
}

try {
    // 1. Check if team has seats left
    $stmt = $db->prepare("SELECT total_seats, used_seats, status FROM teams WHERE id = ?");
    $stmt->execute([$user['team_id']]);
    $team = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$team || $team['status'] === 'deleted') {
        jsonResponse(['error' => 'This team no longer exists.'], 404);
    }

    $availableSeats = $team['total_seats'] - $team['used_seats'];
    if ($availableSeats <= 0) {
        jsonResponse(['error' => 'No seats available. Please upgrade your plan to add more members.'], 400);
    }

    $results = [];
    $errors = [];
    $processedCount = 0;

    foreach ($emails as $email) {
        $email = strtolower(trim($email));
        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors[] = "Invalid email: $email";
            continue;
        }

        if ($processedCount >= $availableSeats) {
            $errors[] = "Could not invite $email: No more seats available.";
            continue;
        }

        // 2. Check if user is already a member of THIS team
        $stmt = $db->prepare("SELECT id FROM users WHERE LOWER(TRIM(email)) = ? AND team_id = ?");
        $stmt->execute([$email, $user['team_id']]);
        if ($stmt->fetch()) {
            $errors[] = "$email is already a member of your team.";
            continue;
        }

        // 3. Check if there's already a pending invite
        $stmt = $db->prepare("SELECT token, expires_at FROM team_invites WHERE LOWER(TRIM(email)) = ? AND team_id = ? AND status = 'pending'");
        $stmt->execute([$email, $user['team_id']]);
        $existingInvite = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($existingInvite) {
            $now = new DateTime();
            $expiresAt = new DateTime($existingInvite['expires_at']);

            if ($expiresAt > $now) {
                $results[] = [
                    'email' => $email,
                    'url' => "https://" . $_SERVER['HTTP_HOST'] . "/team?token=" . $existingInvite['token']
                ];
                $processedCount++;
                continue;
            } else {
                $stmt = $db->prepare("UPDATE team_invites SET status = 'expired' WHERE token = ?");
                $stmt->execute([$existingInvite['token']]);
            }
        }

        // Generate token
        $token = bin2hex(random_bytes(16));
        $expiresAt = (new DateTime())->add(new DateInterval('P3D'))->format('Y-m-d H:i:s');

        // Save invite
        $stmt = $db->prepare("INSERT INTO team_invites (team_id, email, token, status, expires_at) VALUES (?, ?, ?, 'pending', ?)");
        $stmt->execute([$user['team_id'], $email, $token, $expiresAt]);

        $results[] = [
            'email' => $email,
            'url' => "https://" . $_SERVER['HTTP_HOST'] . "/team?token=" . $token
        ];
        $processedCount++;
    }

    if (empty($results) && !empty($errors)) {
        jsonResponse(['error' => implode(' ', $errors)], 400);
    }

    jsonResponse([
        'success' => true,
        'message' => 'Invitations processed.',
        'invites' => $results,
        'errors' => $errors
    ]);

} catch (Exception $e) {
    jsonResponse(['error' => 'Internal server error: ' . $e->getMessage()], 500);
}
?>

