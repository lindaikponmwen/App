<?php
/**
 * drlevy AI - Backend Configuration (OFFICIAL SDK VERSION)
 */
ob_start();
date_default_timezone_set('UTC');

// Enable CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_samesite', 'Strict');

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/**
 * GLOBAL JSON ERROR HANDLER
 */
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error !== NULL && ($error['type'] === E_ERROR || $error['type'] === E_PARSE || $error['type'] === E_COMPILE_ERROR)) {
        if (ob_get_length()) ob_clean();
        header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode([
            'error' => 'Critical System Error',
            'details' => $error['message']
        ]);
        exit;
    }
});

/**
 * STRIPE SDK AUTOLOADER
 */
$autoloadPath = __DIR__ . '/vendor/autoload.php';
if (file_exists($autoloadPath)) {
    require_once $autoloadPath;
}

// Hostinger Database Credentials
define('DB_HOST', '127.0.0.1');
define('DB_PORT', '3306');
define('DB_NAME', 'u747707511_test2');
define('DB_USER', 'u747707511_test2');
define('DB_PASS', '~~31*2Equals36'); 

/**
 * Stripe Keys & Configuration
 */
define('STRIPE_SECRET_KEY', 'sk_test_51SswR1FXZurgg8QnCRL9ONAHQAkPcCCX8S7WhOek4uaxMH9sB4xa6oCNRNvIrspa9o8geW6Las6aVusZ1E8VQ3Ig007WKiwr3f');
\Stripe\Stripe::setApiKey(STRIPE_SECRET_KEY);

/**
 * WEBHOOK SIGNING SECRET
 * -------------------------------------------------------------------------
 * ERROR 400 FIX: 
 * 1. Go to Stripe Dashboard -> Developers -> Webhooks.
 * 2. Click your endpoint (ending in stripe_webhook.php).
 * 3. Click "Reveal" under Signing Secret.
 * 4. Paste the 'whsec_...' value below.
 * -------------------------------------------------------------------------
 */
define('STRIPE_WEBHOOK_SECRET', 'whsec_i0J5rgWUhAFj3PofBTZmoLkdxnzLLwhf'); 

/**
 * STRIPE PRICE IDS
 */
define('STRIPE_PRICE_ID', 'price_1T0nD6FXZurgg8Qn3Ch04Bww'); 
define('STRIPE_TEAM_PRICE_ID', 'price_1T3TpZFXZurgg8QnYwpv5knF'); 

/**
 * Helper to delete a team
 */
function deleteTeam($db, $teamId, $cancelStripe = true) {
    $stripe = new \Stripe\StripeClient(STRIPE_SECRET_KEY);

    // Fetch subscription ID
    $stmt = $db->prepare("SELECT stripe_subscription_id FROM teams WHERE id = ?");
    $stmt->execute([$teamId]);
    $team = $stmt->fetch(PDO::FETCH_ASSOC);
    $subscriptionId = $team['stripe_subscription_id'] ?? null;

    $db->beginTransaction();

    // Cancel Stripe subscription immediately if it exists
    if ($cancelStripe && $subscriptionId) {
        try {
            $stripe->subscriptions->cancel($subscriptionId);
        } catch (Exception $e) {
            // Log error but continue with DB deletion
            error_log("Stripe cancellation failed for team $teamId: " . $e->getMessage());
        }
    }

    // Reset all members
    $stmt = $db->prepare("
        UPDATE users 
        SET team_id = NULL, 
            team_role = NULL, 
            subscription_plan = 'free', 
            subscription_status = 'none',
            recently_canceled = 1
        WHERE team_id = ?
    ");
    $stmt->execute([$teamId]);

    // Delete invites
    $stmt = $db->prepare("DELETE FROM team_invites WHERE team_id = ?");
    $stmt->execute([$teamId]);

    // Soft delete team record
    $stmt = $db->prepare("UPDATE teams SET status = 'deleted' WHERE id = ?");
    $stmt->execute([$teamId]);

    $db->commit();
}

/**
 * Helper to create a team
 */
function createTeam($db, $ownerId, $stripeCustomerId, $stripeSubscriptionId, $seats = 5, $name = 'My Team', $endsAt = null, $startDate = null, $cancelAtEnd = 0, $recentlyCanceled = 0, $status = 'active') {
    $db->beginTransaction();
    
    // Create team
    $stmt = $db->prepare("
        INSERT INTO teams (
            name, owner_id, stripe_customer_id, stripe_subscription_id, 
            total_seats, status, subscription_ends_at, 
            subscription_start_date, cancel_at_period_end, recently_canceled
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $name, $ownerId, $stripeCustomerId, $stripeSubscriptionId, 
        $seats, $status, $endsAt, $startDate, $cancelAtEnd, $recentlyCanceled
    ]);
    $teamId = $db->lastInsertId();
    
    // Link user to team
    $stmt = $db->prepare("UPDATE users SET team_id = ?, team_role = 'owner' WHERE id = ?");
    $stmt->execute([$teamId, $ownerId]);
    
    $db->commit();
    return $teamId;
}

/**
 * Get PDO Database Connection
 */
function getDB() {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
            // Force connection charset to match your table's general_ci collation
            $pdo->exec("SET NAMES utf8mb4 COLLATE utf8mb4_general_ci");
        } catch (PDOException $e) {
            error_log("DB Connection Failed: " . $e->getMessage());
            jsonResponse(['error' => 'Database connection failed'], 500);
        }
    }
    return $pdo;
}

/**
 * JSON Helper
 */
function jsonResponse($data, $status = 200) {
    if (ob_get_length()) ob_clean();
    header('Content-Type: application/json; charset=utf-8');
    http_response_code($status);
    echo json_encode($data);
    exit;
}

/**
 * Auth Middleware
 */
function requireAuth() {
    if (!isset($_SESSION['user_id'])) {
        jsonResponse(['error' => 'Unauthorized'], 401);
    }
    return $_SESSION['user_id'];
}

function requireAdmin() {
    $userId = requireAuth();
    $db = getDB();
    $stmt = $db->prepare("SELECT role FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    if (!$user || $user['role'] !== 'admin') {
        jsonResponse(['error' => 'Forbidden: Admin access required'], 403);
    }
    return $userId;
}

function requirePro() {
    $userId = requireAuth();
    $db = getDB();
    $stmt = $db->prepare("SELECT subscription_status FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    if (!$user || $user['subscription_status'] !== 'active') {
        jsonResponse(['error' => 'Payment Required', 'code' => 'UPGRADE_REQUIRED'], 402);
    }
    return $userId;
}

/**
 * Helper to update team status and sync with members
 */
function updateTeamStatus($db, $teamId) {
    // 1. Get team info
    $stmt = $db->prepare("SELECT status, total_seats, used_seats, cancel_at_period_end, subscription_ends_at, subscription_start_date, recently_canceled FROM teams WHERE id = ?");
    $stmt->execute([$teamId]);
    $team = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$team) return;

    $currentStatus = $team['status'];
    $newStatus = ($team['used_seats'] > $team['total_seats']) ? 'over_limit' : 'active';
    
    // If we are NOT over limit, and the status was 'transferred' or 'canceled', 
    // we should probably keep it as is unless it was 'over_limit' and we are moving back.
    if ($team['used_seats'] <= $team['total_seats']) {
        if ($currentStatus === 'over_limit' || $currentStatus === 'none' || $currentStatus === null) {
            $newStatus = 'active'; // Default back to active if we were over limit or status was missing
        } else {
            $newStatus = $currentStatus; // Keep transferred, canceled, etc.
        }
    }
    
    error_log("updateTeamStatus: teamId=$teamId, used={$team['used_seats']}, total={$team['total_seats']}, currentStatus=$currentStatus, newStatus=$newStatus");

    // 2. Update team status
    $stmt = $db->prepare("UPDATE teams SET status = ? WHERE id = ?");
    $stmt->execute([$newStatus, $teamId]);

    // 3. Update all members' subscription fields
    error_log("updateTeamStatus: syncing all subscription fields to users for team $teamId");
    
    $stmt = $db->prepare("
        UPDATE users 
        SET subscription_status = ?,
            subscription_plan = 'team',
            cancel_at_period_end = ?,
            subscription_ends_at = ?,
            subscription_start_date = ?,
            recently_canceled = ?
        WHERE team_id = ?
    ");
    $stmt->execute([
        $newStatus,
        (int)$team['cancel_at_period_end'],
        $team['subscription_ends_at'],
        $team['subscription_start_date'],
        (int)$team['recently_canceled'],
        $teamId
    ]);
}
?>