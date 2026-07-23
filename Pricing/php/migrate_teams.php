<?php
require_once 'config.php';

function runMigration() {
    $db = getDB();
    
    echo "Starting Team Migration...<br>";

    try {
        // 1. Create teams table
        $db->exec("CREATE TABLE IF NOT EXISTS teams (
            id INT AUTO_INCREMENT PRIMARY KEY,
            team_name VARCHAR(255) NOT NULL,
            owner_id INT NOT NULL,
            stripe_customer_id VARCHAR(255),
            stripe_subscription_id VARCHAR(255),
            max_seats INT DEFAULT 10,
            subscription_status VARCHAR(50) DEFAULT 'none',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB;");
        echo "✅ Table 'teams' created or already exists.<br>";

        // 2. Create team_invites table
        $db->exec("CREATE TABLE IF NOT EXISTS team_invites (
            id INT AUTO_INCREMENT PRIMARY KEY,
            team_id INT NOT NULL,
            email VARCHAR(255) NOT NULL,
            token VARCHAR(100) NOT NULL UNIQUE,
            role VARCHAR(50) DEFAULT 'member',
            status ENUM('pending', 'accepted', 'expired') DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL 7 DAY)
        ) ENGINE=InnoDB;");
        echo "✅ Table 'team_invites' created or already exists.<br>";

        // 3. Update users table with team columns
        // Check if columns exist first to prevent errors
        $columns = $db->query("SHOW COLUMNS FROM users")->fetchAll(PDO::FETCH_COLUMN);
        
        if (!in_array('team_id', $columns)) {
            $db->exec("ALTER TABLE users ADD COLUMN team_id INT DEFAULT NULL AFTER stripe_customer_id");
            echo "✅ Column 'team_id' added to 'users'.<br>";
        }
        
        if (!in_array('team_role', $columns)) {
            $db->exec("ALTER TABLE users ADD COLUMN team_role VARCHAR(50) DEFAULT NULL AFTER team_id");
            echo "✅ Column 'team_role' added to 'users'.<br>";
        }

        echo "<br><b>Migration Successful!</b> Your database is now Team-ready.";
    } catch (Exception $e) {
        echo "<br>❌ <b>Migration Failed:</b> " . $e->getMessage();
    }
}

runMigration();
?>
