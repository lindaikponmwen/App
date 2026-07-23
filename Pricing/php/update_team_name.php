<?php
require_once 'config.php';

$userId = requireAuth();

$data = json_decode(file_get_contents('php://input'), true);
$name = $data['name'] ?? '';

if (empty($name) || strlen($name) > 255) {
    jsonResponse(['error' => 'Invalid team name.'], 400);
}

try {
    $db = getDB();

    // 1. Check if user is owner
    $stmt = $db->prepare("SELECT team_id, team_role FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !$user['team_id'] || !in_array($user['team_role'], ['owner', 'admin'])) {
        jsonResponse(['error' => 'Unauthorized: Only team owners or admins can rename the team.'], 403);
    }

    // 2. Update Team Name
    $stmt = $db->prepare("UPDATE teams SET name = ? WHERE id = ?");
    $stmt->execute([$name, $user['team_id']]);

    jsonResponse([
        'success' => true,
        'message' => 'Team name updated successfully.'
    ]);

} catch (Exception $e) {
    jsonResponse(['error' => 'Internal server error: ' . $e->getMessage()], 500);
}
?>

