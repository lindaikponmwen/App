-- Profile Data Schema
-- This schema extends the base user schema with profile-specific tables

-- ============================================================================
-- PROFILE TABLES
-- ============================================================================

-- User Job Information Table
-- Stores job history and departmental information for users
CREATE TABLE IF NOT EXISTS user_job_info (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    department VARCHAR(100) NOT NULL,
    division VARCHAR(100),
    manager VARCHAR(100),
    hire_date DATE NOT NULL,
    location VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_hire_date (hire_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Activity Table
-- Tracks user activities and actions for audit and activity feed
CREATE TABLE IF NOT EXISTS user_activity (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    action VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Compensation Table
-- Stores compensation history for users
CREATE TABLE IF NOT EXISTS user_compensation (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    period ENUM('hour', 'day', 'week', 'month', 'quarter', 'year') NOT NULL,
    effective_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_effective_date (effective_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Messages Table
-- Stores internal messaging between users
CREATE TABLE IF NOT EXISTS messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sender_id INT NOT NULL,
    recipient_id INT NOT NULL,
    content TEXT NOT NULL,
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_sender_id (sender_id),
    INDEX idx_recipient_id (recipient_id),
    INDEX idx_created_at (created_at),
    INDEX idx_is_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Document Approvals Table
-- Tracks document approval workflows
CREATE TABLE IF NOT EXISTS document_approvals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    project_name VARCHAR(255),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approver_id INT,
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_approver_id (approver_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Files Table
-- Stores metadata for user personal files
CREATE TABLE IF NOT EXISTS user_files (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_category (category),
    INDEX idx_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ADDITIONAL USER COLUMNS
-- Add profile-related columns to existing users table if they don't exist
-- ============================================================================

-- Note: These ALTER TABLE statements use IF NOT EXISTS logic via stored procedure
-- to prevent errors if columns already exist

DELIMITER //

CREATE PROCEDURE IF NOT EXISTS add_profile_columns()
BEGIN
    -- Add phone column
    IF NOT EXISTS (
        SELECT * FROM information_schema.columns
        WHERE table_schema = DATABASE()
        AND table_name = 'users'
        AND column_name = 'phone'
    ) THEN
        ALTER TABLE users ADD COLUMN phone VARCHAR(20);
    END IF;

    -- Add date_of_birth column
    IF NOT EXISTS (
        SELECT * FROM information_schema.columns
        WHERE table_schema = DATABASE()
        AND table_name = 'users'
        AND column_name = 'date_of_birth'
    ) THEN
        ALTER TABLE users ADD COLUMN date_of_birth DATE;
    END IF;

    -- Add national_id column
    IF NOT EXISTS (
        SELECT * FROM information_schema.columns
        WHERE table_schema = DATABASE()
        AND table_name = 'users'
        AND column_name = 'national_id'
    ) THEN
        ALTER TABLE users ADD COLUMN national_id VARCHAR(50);
    END IF;

    -- Add hire_date column
    IF NOT EXISTS (
        SELECT * FROM information_schema.columns
        WHERE table_schema = DATABASE()
        AND table_name = 'users'
        AND column_name = 'hire_date'
    ) THEN
        ALTER TABLE users ADD COLUMN hire_date DATE;
    END IF;

    -- Add address column
    IF NOT EXISTS (
        SELECT * FROM information_schema.columns
        WHERE table_schema = DATABASE()
        AND table_name = 'users'
        AND column_name = 'address'
    ) THEN
        ALTER TABLE users ADD COLUMN address VARCHAR(255);
    END IF;

    -- Add city_state column
    IF NOT EXISTS (
        SELECT * FROM information_schema.columns
        WHERE table_schema = DATABASE()
        AND table_name = 'users'
        AND column_name = 'city_state'
    ) THEN
        ALTER TABLE users ADD COLUMN city_state VARCHAR(100);
    END IF;

    -- Add postcode column
    IF NOT EXISTS (
        SELECT * FROM information_schema.columns
        WHERE table_schema = DATABASE()
        AND table_name = 'users'
        AND column_name = 'postcode'
    ) THEN
        ALTER TABLE users ADD COLUMN postcode VARCHAR(20);
    END IF;

    -- Add avatar column
    IF NOT EXISTS (
        SELECT * FROM information_schema.columns
        WHERE table_schema = DATABASE()
        AND table_name = 'users'
        AND column_name = 'avatar'
    ) THEN
        ALTER TABLE users ADD COLUMN avatar VARCHAR(500);
    END IF;

    -- Add department column
    IF NOT EXISTS (
        SELECT * FROM information_schema.columns
        WHERE table_schema = DATABASE()
        AND table_name = 'users'
        AND column_name = 'department'
    ) THEN
        ALTER TABLE users ADD COLUMN department VARCHAR(100);
    END IF;

    -- Add division column
    IF NOT EXISTS (
        SELECT * FROM information_schema.columns
        WHERE table_schema = DATABASE()
        AND table_name = 'users'
        AND column_name = 'division'
    ) THEN
        ALTER TABLE users ADD COLUMN division VARCHAR(100);
    END IF;

    -- Add manager column
    IF NOT EXISTS (
        SELECT * FROM information_schema.columns
        WHERE table_schema = DATABASE()
        AND table_name = 'users'
        AND column_name = 'manager'
    ) THEN
        ALTER TABLE users ADD COLUMN manager VARCHAR(100);
    END IF;

    -- Add location column
    IF NOT EXISTS (
        SELECT * FROM information_schema.columns
        WHERE table_schema = DATABASE()
        AND table_name = 'users'
        AND column_name = 'location'
    ) THEN
        ALTER TABLE users ADD COLUMN location VARCHAR(200);
    END IF;
END //

DELIMITER ;

-- Execute the procedure to add columns
CALL add_profile_columns();

-- Drop the procedure after use
DROP PROCEDURE IF EXISTS add_profile_columns;

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Sample job information
-- INSERT INTO user_job_info (user_id, department, division, manager, hire_date, location)
-- VALUES
-- (1, 'Clinical Pharmacology', 'Research & Development', 'Dr. Alex Foster', '2024-05-13', 'San Francisco, CA'),
-- (1, 'Biostatistics', 'Data Science', 'Dr. Jack Daniels', '2024-09-05', 'Boston, MA');

-- Sample activity
-- INSERT INTO user_activity (user_id, action)
-- VALUES
-- (1, 'last login on'),
-- (1, 'updated profile section: contact');

-- Sample compensation
-- INSERT INTO user_compensation (user_id, amount, currency, period, effective_date)
-- VALUES
-- (1, 862.00, 'USD', 'month', '2015-05-10'),
-- (1, 1560.00, 'USD', 'quarter', '2022-06-08');
