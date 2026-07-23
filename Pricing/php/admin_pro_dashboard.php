<?php
require_once 'config.php';

// Must be a staff member (Admin) AND have a paid plan (Pro)
requireAdminAndPro();

try {
    $db = getDB();
    $totalRevenue = $db->query("SELECT COUNT(*) * 19.99 FROM users WHERE subscription_status = 'active'")->fetchColumn();

    jsonResponse([
        'admin_pro_metrics' => [
            'estimated_mrr' => (float)$totalRevenue,
            'internal_system_log' => 'Accessing encrypted billing logs...'
        ]
    ]);
} catch (Exception $e) {
    jsonResponse(['error' => 'Admin data access failed'], 500);
}
