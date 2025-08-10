-- Initialize Beacon Database
CREATE DATABASE IF NOT EXISTS beacon_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE beacon_db;

-- Create a test table
CREATE TABLE IF NOT EXISTS test_table (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO test_table (name) VALUES ('Beacon Test Entry');
