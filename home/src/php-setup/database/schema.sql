-- Database Schema for DrLevy.Ai Authentication System
--
-- This file contains the database schema for the authentication system.
-- Run this SQL script to create the necessary tables.

-- Create database (if not exists)
CREATE DATABASE IF NOT EXISTS u747707511_run03
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE u747707511_run03;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uid VARCHAR(15) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  initials VARCHAR(5),
  avatar VARCHAR(255),
  role ENUM('administrator', 'owner', 'member','unsubscribed') NOT NULL DEFAULT 'member',
  department VARCHAR(100),
  title VARCHAR(100),
  phone VARCHAR(20),
  address TEXT,
  date_of_birth DATE,
  hire_date DATE,
  is_active BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verification_token VARCHAR(255),
  email_verification_expires TIMESTAMP NULL,
  is_online BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_uid (uid),
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_email_verification_token (email_verification_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User permissions table
CREATE TABLE IF NOT EXISTS user_permissions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  permission VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_permission (user_id, permission),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sessions table (for enhanced security and session management)
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(128) PRIMARY KEY,
  user_id INT UNSIGNED,
  ip_address VARCHAR(45),
  user_agent TEXT,
  payload TEXT NOT NULL,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_last_activity (last_activity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Login attempts table (for rate limiting and security monitoring)
CREATE TABLE IF NOT EXISTS login_attempts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50),
  ip_address VARCHAR(45) NOT NULL,
  success BOOLEAN NOT NULL,
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_ip_address (ip_address),
  INDEX idx_attempted_at (attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Password resets table
CREATE TABLE IF NOT EXISTS password_resets (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  INDEX idx_email (email),
  INDEX idx_token (token),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default demo users (passwords are hashed using bcrypt)
-- Default password for all demo users: command12
INSERT INTO users (uid, username, email, password_hash, name, initials, role, department, title, phone, address, date_of_birth, hire_date, is_active, email_verified, is_online) VALUES
('USR001', 'sarah', 'sarah.chen@research.com', '$2y$12$8cY.vZ5cRQxqJPZXz5pYN.X8GKqK5lM5vF8qJ3XYZ5pYN.X8GKqK5l', 'Dr. Sarah Chen', 'SC', 'owner', 'Clinical Pharmacology', 'Principal Investigator', '(629) 555-0123', '990 Market Street, Suite 200, San Francisco CA 94102', '1988-09-26', '2023-01-05', TRUE, TRUE, FALSE),
('USR002', 'william', 'fabber4christ@research.com', '$2y$12$8cY.vZ5cRQxqJPZXz5pYN.X8GKqK5lM5vF8qJ3XYZ5pYN.X8GKqK5l', 'Dr. William Hane', 'WH', 'administrator', 'Information Technology', 'System Administrator', '(629) 555-0124', '1200 Tech Drive, Suite 100, San Francisco CA 94105', '1985-03-15', '2022-06-01', TRUE, TRUE, FALSE),
('USR003', 'curtis', 'curtis.lee@research.com', '$2y$12$8cY.vZ5cRQxqJPZXz5pYN.X8GKqK5lM5vF8qJ3XYZ5pYN.X8GKqK5l', 'Dr. Curtis Lee', 'CL', 'member', 'Clinical Pharmacology', 'Research Associate', '(629) 555-0125', '456 Research Blvd, Apt 12, San Francisco CA 94103', '1992-11-08', '2024-03-15', TRUE, TRUE, FALSE)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Insert default permissions
INSERT INTO user_permissions (user_id, permission) VALUES
-- Sarah (Owner) permissions
(1, 'read'),
(1, 'write'),
(1, 'delete'),
(1, 'manage_projects'),
(1, 'manage_team'),
(1, 'export'),
-- William (Administrator) permissions
(2, 'read'),
(2, 'write'),
(2, 'delete'),
(2, 'admin'),
(2, 'manage_users'),
(2, 'manage_system'),
(2, 'analytics'),
(2, 'compliance'),
-- Curtis (Member) permissions
(3, 'read'),
(3, 'write')
ON DUPLICATE KEY UPDATE created_at = created_at;

-- Auto-cleanup old login attempts (optional, can be run via cron)
-- DELETE FROM login_attempts WHERE attempted_at < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Auto-cleanup expired password resets (optional, can be run via cron)
-- DELETE FROM password_resets WHERE expires_at < NOW();

-- Auto-cleanup old sessions (optional, can be run via cron)
-- DELETE FROM sessions WHERE last_activity < DATE_SUB(NOW(), INTERVAL 7 DAY);
