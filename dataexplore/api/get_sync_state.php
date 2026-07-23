
<?php
// api/get_sync_state.php
require_once 'config.php';
require_once 'db.php';

// Validate Request Method
validateRequestMethod('GET');

// Get and sanitize input
$project_id = isset($_GET['project_id']) ? $_GET['project_id'] : null;

if (!$project_id) {
    sendError('Missing project_id');
}

try {
    $stmt = $pdo->prepare("SELECT project_id, sync_hash, last_synced_at FROM project_sync_state WHERE project_id = ?");
    $stmt->execute([$project_id]);
    $result = $stmt->fetch();

    if ($result) {
        echo json_encode($result);
    } else {
        // Return 404 if no record found (client interprets this as no remote state)
        http_response_code(404);
        echo json_encode(['error' => 'No sync state found for this project']);
    }

} catch (PDOException $e) {
    sendError('Database error: ' . $e->getMessage(), 500);
}
?>
