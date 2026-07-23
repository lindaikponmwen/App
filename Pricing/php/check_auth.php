<?php
require_once 'config.php';

if (isset($_SESSION['user_id'])) {
    try {
        $db = getDB();
        // Include the new columns in the SELECT
        $stmt = $db->prepare("
            SELECT 
                u.id, u.email, u.name, u.role, u.team_id, u.team_role, 
                u.subscription_plan, u.subscription_status, u.cancel_at_period_end, 
                u.subscription_ends_at, u.recently_canceled, u.subscription_start_date,
                t.name as team_name, t.status as team_status, t.cancel_at_period_end as team_cancel_at_period_end,
                t.subscription_ends_at as team_subscription_ends_at,
                t.recently_canceled as team_recently_canceled,
                t.total_seats as team_total_seats,
                t.used_seats as team_used_seats,
                owner.name as team_owner_name
            FROM users u
            LEFT JOIN teams t ON u.team_id = t.id
            LEFT JOIN users owner ON t.owner_id = owner.id
            WHERE u.id = ?
        ");
        $stmt->execute([$_SESSION['user_id']]);
        $user = $stmt->fetch();

        if ($user) {
            jsonResponse([
                'authenticated' => true,
                'user' => [
                    'id' => $user['id'],
                    'email' => $user['email'],
                    'name' => $user['name'],
                    'role' => $user['role'],
                    'team_id' => $user['team_id'],
                    'team_name' => $user['team_name'],
                    'team_role' => $user['team_role'],
                    'team_status' => $user['team_status'],
                    'team_owner_name' => $user['team_owner_name'],
                    'team_cancel_at_period_end' => (bool)$user['team_cancel_at_period_end'],
                    'team_subscription_ends_at' => $user['team_subscription_ends_at'],
                    'team_recently_canceled' => (bool)$user['team_recently_canceled'],
                    'team_total_seats' => (int)$user['team_total_seats'],
                    'team_used_seats' => (int)$user['team_used_seats'],
                    'team_is_over_limit' => (int)$user['team_used_seats'] > (int)$user['team_total_seats'],
                    'plan' => $user['subscription_plan'],
                    'subscription_plan' => $user['subscription_plan'],
                    'subscription_status' => $user['subscription_status'],
                    'cancel_at_period_end' => (bool)$user['cancel_at_period_end'],
                    'subscription_ends_at' => $user['subscription_ends_at'],
                    'recently_canceled' => (bool)$user['recently_canceled'],
                    'subscription_start_date' => $user['subscription_start_date']
                ]
            ]);
        } else {
            session_destroy();
            jsonResponse(['authenticated' => false], 200);
        }
    } catch (Exception $e) {
        jsonResponse(['authenticated' => false, 'error' => 'Auth error'], 500);
    }
} else {
    jsonResponse(['authenticated' => false], 200);
}
?>
