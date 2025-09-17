-- Migration to add new fields to submissions table and create submission_test_results table

-- Add new columns to submissions table
ALTER TABLE submissions 
ADD COLUMN test_cases_passed INT DEFAULT 0,
ADD COLUMN total_test_cases INT DEFAULT 0,
ADD COLUMN error_message TEXT;

-- Create submission_test_results table
CREATE TABLE IF NOT EXISTS submission_test_results (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  submission_id BIGINT NOT NULL,
  test_case_id BIGINT NULL,
  input TEXT,
  expected_output TEXT,
  actual_output TEXT,
  passed BOOLEAN NOT NULL DEFAULT FALSE,
  execution_time INT NULL COMMENT 'Execution time in milliseconds',
  memory_used INT NULL COMMENT 'Memory used in KB',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_submission_id (submission_id),
  INDEX idx_test_case_id (test_case_id),
  INDEX idx_passed (passed),
  
  FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
  FOREIGN KEY (test_case_id) REFERENCES test_cases(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add indices for better performance
CREATE INDEX idx_submissions_test_cases ON submissions(test_cases_passed);
CREATE INDEX idx_submissions_total_test_cases ON submissions(total_test_cases);
CREATE INDEX idx_submissions_user_problem ON submissions(user_id, problem_id);
