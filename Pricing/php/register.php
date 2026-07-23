<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$data = json_decode(file_get_contents('php://input'), true);
$email = filter_var($data['email'] ?? '', FILTER_VALIDATE_EMAIL);
$name = trim($data['name'] ?? '');
$password = $data['password'] ?? '';

if (!$email || strlen($password) < 8 || empty($name)) {
    jsonResponse(['error' => 'Full name, valid email and password (min 8 chars) required'], 400);
}

try {
    $db = getDB();
    
    // Check if email exists
    $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        jsonResponse(['error' => 'Email already registered'], 409);
    }

    /**
     * Role Logic: Always default to 'user'. 
     * Admin roles must be assigned manually via DB as requested.
     */
    $role = 'user';

    // Hash password
    $hash = password_hash($password, PASSWORD_DEFAULT);

    // Insert user
    $stmt = $db->prepare("INSERT INTO users (email, name, password_hash, role, subscription_plan, subscription_status) VALUES (?, ?, ?, ?, 'free', 'none')");
    $stmt->execute([$email, $name, $hash, $role]);

    jsonResponse([
        'success' => true, 
        'message' => 'Account created successfully. Please sign in.',
        'role_assigned' => $role
    ]);

} catch (Exception $e) {
    error_log("Registration error: " . $e->getMessage());
    jsonResponse(['error' => 'Internal server error'], 500);
}