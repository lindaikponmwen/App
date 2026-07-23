<?php
/**
 * Get User Messages/Inbox
 *
 * Returns all messages for the authenticated user
 * Supports filtering and pagination
 *
 * Security: Requires authentication, only returns messages for current user
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

    // Get query parameters
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
    $offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;
    $conversationId = $_GET['conversation_id'] ?? null;

    // Build query
    if ($conversationId) {
        // Get messages for specific conversation
        $stmt = $db->prepare("
            SELECT
                m.id,
                m.content,
                m.is_read,
                m.created_at,
                s.id as sender_id,
                s.name as sender_name,
                s.avatar as sender_avatar
            FROM messages m
            JOIN users s ON m.sender_id = s.id
            WHERE (m.sender_id = :conversation_id AND m.recipient_id = :user_id)
               OR (m.sender_id = :user_id AND m.recipient_id = :conversation_id)
            ORDER BY m.created_at DESC
            LIMIT :limit OFFSET :offset
        ");
        $stmt->bindParam(':conversation_id', $conversationId);
        $stmt->bindParam(':user_id', $userId);
    } else {
        // Get all recent messages (one per conversation)
        $stmt = $db->prepare("
            SELECT
                m.id,
                m.content,
                m.is_read,
                m.created_at,
                s.id as sender_id,
                s.name as sender_name,
                s.avatar as sender_avatar
            FROM messages m
            JOIN users s ON m.sender_id = s.id
            WHERE m.recipient_id = :user_id
            GROUP BY m.sender_id
            ORDER BY m.created_at DESC
            LIMIT :limit OFFSET :offset
        ");
        $stmt->bindParam(':user_id', $userId);
    }

    $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format messages
    $formattedMessages = array_map(function($msg) {
        $initials = '';
        $nameParts = explode(' ', $msg['sender_name']);
        if (count($nameParts) >= 2) {
            $initials = strtoupper($nameParts[0][0] . $nameParts[1][0]);
        } else if (count($nameParts) === 1) {
            $initials = strtoupper(substr($nameParts[0], 0, 2));
        }

        return [
            'id' => $msg['id'],
            'sender' => [
                'id' => $msg['sender_id'],
                'name' => $msg['sender_name'],
                'initials' => $initials,
                'avatar' => $msg['sender_avatar']
            ],
            'content' => $msg['content'],
            'timestamp' => $msg['created_at'],
            'isRead' => (bool)$msg['is_read']
        ];
    }, $messages);

    echo json_encode([
        'success' => true,
        'messages' => $formattedMessages
    ]);

} catch (Exception $e) {
    error_log("Messages fetch error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to fetch messages'
    ]);
}
