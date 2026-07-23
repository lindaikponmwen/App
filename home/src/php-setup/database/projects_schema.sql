-- Projects and Configuration Schema Extension
--
-- This extends the authentication database with project management
-- and application configuration capabilities.

USE u747707511_run03;

-- Projects table (experiments)
CREATE TABLE IF NOT EXISTS projects (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('active', 'completed', 'paused') NOT NULL DEFAULT 'active',
  start_date DATE NOT NULL,
  end_date DATE,
  created_by INT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_created_by (created_by),
  INDEX idx_start_date (start_date),
  FULLTEXT INDEX idx_title_description (title, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Project members (many-to-many relationship)
CREATE TABLE IF NOT EXISTS project_members (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  role ENUM('owner', 'member', 'viewer') DEFAULT 'member',
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_project_user (project_id, user_id),
  INDEX idx_project_id (project_id),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Project keywords
CREATE TABLE IF NOT EXISTS project_keywords (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id INT UNSIGNED NOT NULL,
  keyword VARCHAR(100) NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  INDEX idx_project_id (project_id),
  INDEX idx_keyword (keyword)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Project analysis types
CREATE TABLE IF NOT EXISTS project_analysis_types (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id INT UNSIGNED NOT NULL,
  analysis_type VARCHAR(100) NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  INDEX idx_project_id (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Project files
CREATE TABLE IF NOT EXISTS project_files (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id INT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL,
  type ENUM('model', 'data', 'script') NOT NULL,
  content LONGTEXT,
  file_path VARCHAR(512),
  file_size INT UNSIGNED,
  mime_type VARCHAR(100),
  uploaded_by INT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_project_id (project_id),
  INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Application configurations table
CREATE TABLE IF NOT EXISTS app_configurations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value TEXT NOT NULL,
  config_type ENUM('string', 'json', 'boolean', 'number') DEFAULT 'string',
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_config_key (config_key),
  INDEX idx_is_public (is_public)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Analysis types master table
CREATE TABLE IF NOT EXISTS analysis_types (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  category VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_category (category),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Project activity log
CREATE TABLE IF NOT EXISTS project_activity_log (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  action ENUM('created', 'updated', 'deleted', 'member_added', 'member_removed', 'file_uploaded', 'file_deleted', 'status_changed') NOT NULL,
  details JSON,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_project_id (project_id),
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default analysis types
INSERT INTO analysis_types (name, category, display_order) VALUES
('Non-compartmental Analysis', 'Pharmacokinetics', 1),
('Population PK', 'Pharmacokinetics', 2),
('Bioequivalence', 'Statistical', 3),
('Safety Analysis', 'Clinical', 4),
('Covariate Analysis', 'Statistical', 5),
('Dosing Simulation', 'Modeling', 6),
('Model Validation', 'Quality', 7),
('Statistical Analysis', 'Statistical', 8),
('Regulatory Submission', 'Compliance', 9),
('PKPD Modeling', 'Pharmacokinetics', 10),
('Monte Carlo Simulation', 'Modeling', 11),
('Bayesian Analysis', 'Statistical', 12),
('Meta-Analysis', 'Statistical', 13),
('Exposure-Response Analysis', 'Pharmacokinetics', 14),
('Drug-Drug Interaction', 'Clinical', 15),
('Renal Impairment Study', 'Clinical', 16),
('Hepatic Impairment Study', 'Clinical', 17),
('Pediatric Modeling', 'Specialized', 18),
('Geriatric Analysis', 'Specialized', 19),
('Food Effect Study', 'Clinical', 20),
('Biomarker Analysis', 'Biostatistics', 21),
('Pharmacogenomics', 'Genetics', 22),
('Allometric Scaling', 'Modeling', 23),
('Model-Based Drug Development', 'Development', 24),
('Clinical Trial Simulation', 'Modeling', 25)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Insert default app configurations
INSERT INTO app_configurations (config_key, config_value, config_type, description, is_public) VALUES
('app_name', 'DrLevy.Ai', 'string', 'Application name', TRUE),
('app_version', '1.0.0', 'string', 'Application version', TRUE),
('default_project_name', 'Pharmacokinetic Research Platform', 'string', 'Default project name', TRUE),
('max_file_upload_size', '52428800', 'number', 'Maximum file upload size in bytes (50MB)', FALSE),
('allowed_file_types', '["model", "data", "script"]', 'json', 'Allowed file types', TRUE),
('session_timeout', '86400', 'number', 'Session timeout in seconds (24 hours)', FALSE),
('inactivity_timeout', '300', 'number', 'Inactivity timeout in seconds (5 minutes)', FALSE),
('enable_notifications', 'true', 'boolean', 'Enable system notifications', TRUE),
('enable_analytics', 'true', 'boolean', 'Enable analytics tracking', TRUE),
('default_project_status', 'active', 'string', 'Default status for new projects', TRUE)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Create views for easier data retrieval

-- View: Projects with member count
CREATE OR REPLACE VIEW projects_with_stats AS
SELECT
  p.*,
  COUNT(DISTINCT pm.user_id) as member_count,
  COUNT(DISTINCT pf.id) as file_count,
  GROUP_CONCAT(DISTINCT pk.keyword ORDER BY pk.keyword SEPARATOR ', ') as keywords,
  GROUP_CONCAT(DISTINCT pat.analysis_type ORDER BY pat.analysis_type SEPARATOR ', ') as analysis_types
FROM projects p
LEFT JOIN project_members pm ON p.id = pm.project_id
LEFT JOIN project_files pf ON p.id = pf.id
LEFT JOIN project_keywords pk ON p.id = pk.project_id
LEFT JOIN project_analysis_types pat ON p.id = pat.project_id
GROUP BY p.id;

-- View: User projects with details
CREATE OR REPLACE VIEW user_projects AS
SELECT
  u.id as user_id,
  u.username,
  u.name as user_name,
  p.*,
  pm.role as user_role_in_project,
  creator.name as created_by_name
FROM users u
JOIN project_members pm ON u.id = pm.user_id
JOIN projects p ON pm.project_id = p.id
JOIN users creator ON p.created_by = creator.id;
