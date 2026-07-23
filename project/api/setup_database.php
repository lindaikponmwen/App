<?php
// api/setup_database.php
require_once 'config.php';
// Override JSON header for this HTML output script
header('Content-Type: text/html; charset=utf-8');

require_once 'db.php';

try {
    // SQL to create table if not exists
    $sql = "CREATE TABLE IF NOT EXISTS user_files (
        id INT AUTO_INCREMENT PRIMARY KEY,
        uid VARCHAR(12) NOT NULL,
        user_id INT NOT NULL,
        project_id VARCHAR(50) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_type VARCHAR(50),
        file_size BIGINT,
        file_path VARCHAR(500) NOT NULL,
        category VARCHAR(100),
        active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_file_path (user_id, project_id, file_path),
        UNIQUE KEY unique_uid (uid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

    $pdo->exec($sql);
    echo "Table 'user_files' created or checked successfully.<br>";

    // Add columns if they don't exist (Migration logic)
    
    // Check for project_id
    $stmt = $pdo->query("SHOW COLUMNS FROM user_files LIKE 'project_id'");
    if ($stmt->rowCount() == 0) {
        $pdo->exec("ALTER TABLE user_files ADD COLUMN project_id VARCHAR(50) NOT NULL AFTER user_id");
        echo "Column 'project_id' added.<br>";
    }

    // Check for uid
    $stmt = $pdo->query("SHOW COLUMNS FROM user_files LIKE 'uid'");
    if ($stmt->rowCount() == 0) {
        $pdo->exec("ALTER TABLE user_files ADD COLUMN uid VARCHAR(12) NOT NULL AFTER id");
        $pdo->exec("ALTER TABLE user_files ADD UNIQUE KEY unique_uid (uid)");
        echo "Column 'uid' added.<br>";
    }

    // Check for active
    $stmt = $pdo->query("SHOW COLUMNS FROM user_files LIKE 'active'");
    if ($stmt->rowCount() == 0) {
        $pdo->exec("ALTER TABLE user_files ADD COLUMN active TINYINT(1) DEFAULT 1 AFTER category");
        echo "Column 'active' added.<br>";
    }

    // Update Unique Constraint to include project_id if not already
    // This is a bit complex to detect purely via SHOW INDEX in a generic way without parsing, 
    // so we assume if table existed without project_id, we might need to drop old index and add new.
    // For simplicity in this script, we'll try to drop the old potential key based on user_id + file_path if it exists separately
    // But since the CREATE TABLE defines it correctly, new installs are fine. 
    // Existing installs might need manual index adjustment or a more complex migration script.
    
    echo "Database setup complete.";

} catch (PDOException $e) {
    die("DB Setup Error: " . $e->getMessage());
}
?>