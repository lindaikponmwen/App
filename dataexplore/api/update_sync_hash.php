
<?php
// api/update_sync_hash.php
require_once 'config.php';
require_once 'db.php';

// Validate Request Method
validateRequestMethod('POST');

// Get JSON input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    sendError('Invalid JSON input');
}

// Validate required fields
if (!isset($data['project_id']) || !isset($data['sync_hash'])) {
    sendError('Missing project_id or sync_hash');
}

$project_id = $data['project_id'];
$sync_hash = $data['sync_hash'];

try {
    // Insert or Update the sync hash for the project
    $stmt = $pdo->prepare("
        INSERT INTO project_sync_state (project_id, sync_hash, last_synced_at) 
        VALUES (?, ?, NOW())
        ON DUPLICATE KEY UPDATE 
            sync_hash = VALUES(sync_hash),
            last_synced_at = NOW()
    ");
    
    $stmt->execute([$project_id, $sync_hash]);

    echo json_encode(['message' => 'Sync hash updated successfully', 'hash' => $sync_hash]);

} catch (PDOException $e) {
    sendError('Database operation failed: ' . $e->getMessage(), 500);
}
?>
