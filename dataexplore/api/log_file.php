<?php
// api/log_file.php
require_once 'config.php';
require_once 'db.php';

// Validate Request Method
validateRequestMethod('POST');

// Function to generate a random 12-digit alphanumeric string
function generateUid($length = 12) {
    $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $charactersLength = strlen($characters);
    $randomString = '';
    for ($i = 0; $i < $length; $i++) {
        $randomString .= $characters[random_int(0, $charactersLength - 1)];
    }
    return $randomString;
}

// Get JSON input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    sendError('Invalid JSON input');
}

// Validate required fields
$requiredFields = ['user_id', 'project_id', 'file_name', 'file_path', 'category'];
foreach ($requiredFields as $field) {
    if (!isset($data[$field])) {
        sendError("Missing required field: $field");
    }
}

// Extract data
$user_id = $data['user_id'];
$project_id = $data['project_id'];
$file_name = $data['file_name'];
$file_type = isset($data['file_type']) ? $data['file_type'] : '';
$file_size = isset($data['file_size']) ? (int)$data['file_size'] : 0;
$file_path = $data['file_path']; // Full S3 Key or Path
$category = $data['category'];
$active = isset($data['active']) ? (int)$data['active'] : 1; // Default active status to 1 if not provided

try {
    // Check if the file already exists for this user, project, and path
    $stmt = $pdo->prepare("SELECT id, uid FROM user_files WHERE user_id = ? AND project_id = ? AND file_path = ?");
    $stmt->execute([$user_id, $project_id, $file_path]);
    $existingFile = $stmt->fetch();

    if ($active === 0) {
        // DELETE operation requested
        if ($existingFile) {
            $deleteStmt = $pdo->prepare("DELETE FROM user_files WHERE id = ?");
            $deleteStmt->execute([$existingFile['id']]);
            $message = "File record deleted from database";
            $uid = $existingFile['uid'];
        } else {
            $message = "File record not found for deletion";
            $uid = null;
        }
    } else {
        // INSERT or UPDATE operation
        if ($existingFile) {
            // Update existing record
            $updateStmt = $pdo->prepare("
                UPDATE user_files 
                SET 
                    file_name = ?, 
                    file_type = ?, 
                    file_size = ?, 
                    category = ?, 
                    active = ?,
                    updated_at = NOW()
                WHERE id = ?
            ");
            $updateStmt->execute([$file_name, $file_type, $file_size, $category, $active, $existingFile['id']]);
            $message = "File record updated";
            $uid = $existingFile['uid'];
        } else {
            // Insert new record
            $uid = generateUid();
            $insertStmt = $pdo->prepare("
                INSERT INTO user_files (uid, user_id, project_id, file_name, file_type, file_size, file_path, category, active, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ");
            $insertStmt->execute([$uid, $user_id, $project_id, $file_name, $file_type, $file_size, $file_path, $category, $active]);
            $message = "File record inserted";
        }
    }

    echo json_encode(['message' => $message, 'uid' => $uid]);

} catch (PDOException $e) {
    sendError('Database operation failed: ' . $e->getMessage(), 500);
}
?>