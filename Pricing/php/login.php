
<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$data = json_decode(file_get_contents('php://input'), true);
$email = $data['email'] ?? '';
$password = $data['password'] ?? '';

try {
    $db = getDB();
    $stmt = $db->prepare("SELECT id, email, password_hash, role, subscription_plan, subscription_status FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password_hash'])) {
        // Regenerate session ID for security
        session_regenerate_id(true);
        
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['email'] = $user['email'];

        jsonResponse([
            'success' => true,
            'user' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'role' => $user['role'],
                'plan' => $user['subscription_plan'],
                'subscription_status' => $user['subscription_status']
            ]
        ]);
    } else {
        jsonResponse(['error' => 'Invalid email or password'], 401);
    }

} catch (Exception $e) {
    error_log("Login error: " . $e->getMessage());
    jsonResponse(['error' => 'Internal server error'], 500);
}
