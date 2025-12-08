-- Migration: Add due_date column to issues table
-- Default lending period: 14 days

START
TRANSACTION;

-- 1. Add the new column as nullable to avoid locking failures
ALTER TABLE issues
    ADD COLUMN due_date DATE NULL AFTER issue_date;

-- 2. Backfill existing rows (in case historical data exists)
UPDATE issues
SET due_date = DATE(issue_date) + INTERVAL
14 DAY
WHERE due_date IS NULL;

-- 3. Enforce NOT NULL now that every row has data
ALTER TABLE issues
    MODIFY COLUMN due_date DATE NOT NULL;

COMMIT;
