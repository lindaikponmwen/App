-- Database: u747707511_test2

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    subscription_plan VARCHAR(50) DEFAULT 'free',
    subscription_status ENUM('inactive', 'active', 'canceled') DEFAULT 'inactive',
    seats_purchased INT DEFAULT 1,
    seats_used INT DEFAULT 1,
    stripe_customer_id VARCHAR(255) DEFAULT NULL,
    stripe_subscription_id VARCHAR(255) DEFAULT NULL,
    subscription_start_date DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table to prevent processing the same Stripe event twice (Idempotency)
CREATE TABLE IF NOT EXISTS processed_webhooks (
    event_id VARCHAR(255) PRIMARY KEY,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Logging table for audit trails
CREATE TABLE IF NOT EXISTS subscription_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    event_type VARCHAR(100),
    payload TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Standard index creation
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_stripe_sub ON users(stripe_subscription_id);