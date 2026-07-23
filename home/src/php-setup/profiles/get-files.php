<?php
/**
 * Get User Personal Files
 *
 * Returns all personal files for the authenticated user
 *
 * Security: Requires authentication, only returns files owned by user
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../config/helpers.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Credentials: true');

session_start();

try {
    // Verify user is authenticated
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'Authentication required'
        ]);
        exit;
    }

    $userId = $_SESSION['user_id'];
    $db = Database::getInstance()->getConnection();

    // Get personal files for user
    $stmt = $db->prepare("
        SELECT
            id,
            file_name,
            file_type,
            file_size,
            category,
            file_path,
            created_at,
            updated_at
        FROM user_files
        WHERE user_id = :user_id
        ORDER BY updated_at DESC
    ");

    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();

    $files = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format files
    $formattedFiles = array_map(function($file) {
        return [
            'id' => $file['id'],
            'name' => $file['file_name'],
            'type' => strtoupper($file['file_type']),
            'size' => formatFileSize($file['file_size']),
            'category' => $file['category'],
            'path' => $file['file_path'],
            'modified' => $file['updated_at']
        ];
    }, $files);

    echo json_encode([
        'success' => true,
        'files' => $formattedFiles
    ]);

} catch (Exception $e) {
    error_log("Files fetch error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to fetch files'
    ]);
}

/**
 * Format file size to human readable format
 */
function formatFileSize($bytes) {
    if ($bytes >= 1073741824) {
        return number_format($bytes / 1073741824, 2) . ' GB';
    } elseif ($bytes >= 1048576) {
        return number_format($bytes / 1048576, 2) . ' MB';
    } elseif ($bytes >= 1024) {
        return number_format($bytes / 1024, 2) . ' KB';
    } else {
        return $bytes . ' bytes';
    }
}
