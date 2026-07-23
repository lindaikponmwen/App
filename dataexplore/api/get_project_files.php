
<?php
// api/get_project_files.php
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
    // Retrieve only active files associated with the project
    $stmt = $pdo->prepare("
        SELECT id, uid, file_name, file_path, category, file_size, updated_at 
        FROM user_files 
        WHERE project_id = ? AND active = 1
        ORDER BY category, file_name
    ");
    $stmt->execute([$project_id]);
    $files = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Return empty array if no files found, which is valid JSON
    echo json_encode($files);

} catch (PDOException $e) {
    sendError('Database error: ' . $e->getMessage(), 500);
}
?>
