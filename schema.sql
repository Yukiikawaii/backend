-- Run this once against your MySQL/XAMPP instance to create the database
-- and the customers table.
--
-- Example (from the MySQL client or phpMyAdmin's SQL tab):
--   SOURCE schema.sql;

CREATE DATABASE IF NOT EXISTS aqua_grace
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE aqua_grace;

CREATE TABLE IF NOT EXISTS customers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(32) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,

  -- An account starts unverified and stays that way until email
  -- verification succeeds. It is never auto-deleted on code expiry.
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,

  -- Verification code is stored hashed, never in plain text.
  verification_code_hash VARCHAR(255) NULL,
  verification_code_expires_at DATETIME NULL,
  verification_last_sent_at DATETIME NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  -- The email column must remain unique: a verified account, an
  -- unverified account, or room for a brand-new registration after an
  -- unverified account is explicitly deleted — never two rows at once.
  UNIQUE KEY uq_customers_email (email)
);