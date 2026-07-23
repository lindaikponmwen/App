<?php
/**
 * Get App Configurations
 *
 * Returns application configurations accessible to the user
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: ' . ($_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:5173'));
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';

Session::start();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    if (!Session::isLoggedIn()) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Unauthorized']);
        exit;
    }

    $sessionUser = Session::getUser();
    $db = getDatabase();

    // Get user role to determine access level
    $userStmt = $db->prepare("SELECT role FROM users WHERE id = ?");
    $userStmt->execute([$sessionUser['id']]);
    $user = $userStmt->fetch();

    // Administrators can see all configs, others only public ones
    $isAdmin = $user && $user['role'] === 'administrator';

    $sql = "SELECT config_key, config_value, config_type, description, is_public
            FROM app_configurations";

    if (!$isAdmin) {
        $sql .= " WHERE is_public = TRUE";
    }

    $sql .= " ORDER BY config_key";

    $stmt = $db->query($sql);
    $rawConfigs = $stmt->fetchAll();

    // Parse config values based on type
    $configs = [];
    foreach ($rawConfigs as $config) {
        $value = $config['config_value'];

        // Convert value based on type
        switch ($config['config_type']) {
            case 'json':
                $value = json_decode($value, true);
                break;
            case 'boolean':
                $value = filter_var($value, FILTER_VALIDATE_BOOLEAN);
                break;
            case 'number':
                $value = is_numeric($value) ? ($value + 0) : $value;
                break;
            default:
                // string type, keep as is
                break;
        }

        $configs[$config['config_key']] = [
            'value' => $value,
            'type' => $config['config_type'],
            'description' => $config['description'],
            'isPublic' => (bool)$config['is_public']
        ];
    }

    // Get analysis types
    $analysisStmt = $db->query("
        SELECT name, description, category
        FROM analysis_types
        WHERE is_active = TRUE
        ORDER BY display_order, name
    ");
    $analysisTypes = $analysisStmt->fetchAll(PDO::FETCH_COLUMN);

    echo json_encode([
        'success' => true,
        'configs' => $configs,
        'analysisTypes' => $analysisTypes
    ]);

} catch (Exception $e) {
    error_log("Get configs error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'An error occurred']);
}
