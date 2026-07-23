<?php
/**
 * Send Message
 *
 * Creates a new message from the authenticated user
 *
 * Security: Requires authentication, validates recipients exist
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../config/helpers.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

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

    // Verify CSRF token
    $headers = getallheaders();
    $csrfToken = $headers['X-Csrf-Token'] ?? '';

    if (!Security::validateCsrfToken($csrfToken)) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'error' => 'Invalid CSRF token. Refresh the page and try again.'
        ]);
        exit;
    }

    $userId = $_SESSION['user_id'];
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input || !isset($input['recipientId']) || !isset($input['content'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Missing required fields'
        ]);
        exit;
    }

    $recipientId = $input['recipientId'];
    $content = sanitizeInput($input['content']);

    if (empty($content)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Message content cannot be empty'
        ]);
        exit;
    }

    $db = Database::getInstance()->getConnection();

    // Verify recipient exists
    $stmt = $db->prepare("SELECT id FROM users WHERE id = :recipient_id");
    $stmt->bindParam(':recipient_id', $recipientId);
    $stmt->execute();

    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'Recipient not found'
        ]);
        exit;
    }

    // Insert message
    $stmt = $db->prepare("
        INSERT INTO messages (sender_id, recipient_id, content, is_read, created_at)
        VALUES (:sender_id, :recipient_id, :content, 0, NOW())
    ");

    $stmt->bindParam(':sender_id', $userId);
    $stmt->bindParam(':recipient_id', $recipientId);
    $stmt->bindParam(':content', $content);
    $stmt->execute();

    $messageId = $db->lastInsertId();

    // Get sender info for response
    $stmt = $db->prepare("SELECT id, name, avatar FROM users WHERE id = :user_id");
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    $sender = $stmt->fetch(PDO::FETCH_ASSOC);

    $initials = '';
    $nameParts = explode(' ', $sender['name']);
    if (count($nameParts) >= 2) {
        $initials = strtoupper($nameParts[0][0] . $nameParts[1][0]);
    } else if (count($nameParts) === 1) {
        $initials = strtoupper(substr($nameParts[0], 0, 2));
    }

    echo json_encode([
        'success' => true,
        'message' => [
            'id' => $messageId,
            'sender' => [
                'id' => $sender['id'],
                'name' => $sender['name'],
                'initials' => $initials,
                'avatar' => $sender['avatar']
            ],
            'content' => $content,
            'timestamp' => date('Y-m-d H:i:s'),
            'isRead' => false
        ]
    ]);

} catch (Exception $e) {
    error_log("Send message error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to send message'
    ]);
}
