-- Migration script to update database schema for multiple book copies support
-- This script converts from the old schema (one book per ISBN) to the new schema (multiple copies)

-- Step 1: Alter the books table to add book_id as primary key and make isbn a regular column
-- First, create a backup of the old books table
CREATE TABLE books_backup AS
SELECT *
FROM books;

-- Step 2: Drop the old books table (this will also drop dependent issues records if not handled carefully)
-- IMPORTANT: Back up issues data first
CREATE TABLE issues_backup AS
SELECT *
FROM issues;

-- Step 3: Recreate books table with new structure
ALTER TABLE issues DROP FOREIGN KEY issues_ibfk_2;
DROP TABLE books;

CREATE TABLE books
(
    book_id INT
    AUTO_INCREMENT PRIMARY KEY,
    isbn VARCHAR
    (20) NOT NULL,
    title VARCHAR
    (255) NOT NULL,
    author VARCHAR
    (255) NOT NULL,
    category VARCHAR
    (100) NOT NULL,
    available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_isbn
    (isbn)
);

    -- Step 4: Recreate issues table with book_id column
    DROP TABLE issues;

    CREATE TABLE issues
    (
        issue_id INT
        AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    book_id INT NOT NULL,
    isbn VARCHAR
        (20) NOT NULL,
    issue_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    return_date TIMESTAMP NULL,
    status ENUM
        ('issued', 'returned') DEFAULT 'issued',
    FOREIGN KEY
        (member_id) REFERENCES members
        (member_id),
    FOREIGN KEY
        (book_id) REFERENCES books
        (book_id),
    FOREIGN KEY
        (isbn) REFERENCES books
        (isbn)
);

        -- Step 5: Migrate data from backup tables
        -- For each unique ISBN in the old books table, create one copy in the new books table
        INSERT INTO books
            (isbn, title, author, category, available, created_at)
        SELECT DISTINCT isbn, title, author, category, 1, created_at
        FROM books_backup;

        -- Step 6: Recreate issues records with book_id
        -- For each issue, find the corresponding book_id from the new books table
        INSERT INTO issues
            (issue_id, member_id, book_id, isbn, issue_date, return_date, status)
        SELECT ib.issue_id, ib.member_id, b.book_id, ib.isbn, ib.issue_date, ib.return_date, ib.status
        FROM issues_backup ib
            JOIN books b ON ib.isbn = b.isbn
        ORDER BY ib.issue_id;

        -- Step 7: Clean up backup tables
        DROP TABLE books_backup;
        DROP TABLE issues_backup;

-- If migration is successful, you can now use the new schema with multiple copies support
-- Verify the migration:
-- SELECT * FROM books LIMIT 5;
-- SELECT * FROM issues LIMIT 5;
