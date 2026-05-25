-- ============================================================
-- NexaPay MySQL Database Initialization
-- Reporting & Analytics Service Database
-- ============================================================

CREATE DATABASE IF NOT EXISTS nexapay_reporting
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'nexapay'@'%' IDENTIFIED BY 'nexapay_pass';
GRANT ALL PRIVILEGES ON nexapay_reporting.* TO 'nexapay'@'%';

USE nexapay_reporting;

-- Set session variables
SET session sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- Create reporting schemas (MySQL uses databases, but we can organize with prefixes)
CREATE TABLE IF NOT EXISTS report_definitions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  report_type ENUM('transaction_volume', 'revenue', 'user_growth', 'loan_portfolio', 'fraud_analysis', 'custom') NOT NULL,
  query_config JSON NOT NULL,
  schedule_cron VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_report_type (report_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS report_schedules (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  report_definition_id BIGINT NOT NULL,
  schedule_type ENUM('hourly', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly') NOT NULL,
  schedule_config JSON NOT NULL,
  last_run_at TIMESTAMP NULL,
  next_run_at TIMESTAMP NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (report_definition_id) REFERENCES report_definitions(id) ON DELETE CASCADE,
  INDEX idx_next_run (next_run_at, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS report_generations (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  report_definition_id BIGINT NOT NULL,
  status ENUM('pending', 'running', 'completed', 'failed') DEFAULT 'pending',
  output_format ENUM('csv', 'pdf', 'json', 'xlsx') DEFAULT 'csv',
  output_path VARCHAR(1000),
  error_message TEXT,
  records_count BIGINT DEFAULT 0,
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_definition_id) REFERENCES report_definitions(id) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS analytics_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  event_type VARCHAR(255) NOT NULL,
  event_source VARCHAR(100) NOT NULL,
  event_data JSON NOT NULL,
  user_id VARCHAR(100),
  session_id VARCHAR(100),
  ip_address VARCHAR(45),
  user_agent TEXT,
  occurred_at TIMESTAMP NOT NULL,
  ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_event_type (event_type),
  INDEX idx_occurred_at (occurred_at),
  INDEX idx_user_id (user_id),
  INDEX idx_source (event_source)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
PARTITION BY RANGE (TO_DAYS(occurred_at)) (
  PARTITION p_max VALUES LESS THAN MAXVALUE
);

CREATE TABLE IF NOT EXISTS daily_aggregates (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  aggregate_date DATE NOT NULL,
  metric_name VARCHAR(255) NOT NULL,
  metric_value DECIMAL(20, 4) NOT NULL,
  dimensions JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_metric_date (aggregate_date, metric_name, dimensions(100)),
  INDEX idx_aggregate_date (aggregate_date),
  INDEX idx_metric_name (metric_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

FLUSH PRIVILEGES;
