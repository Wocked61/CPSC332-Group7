-- Create database
CREATE DATABASE
IF NOT EXISTS library_db;
USE library_db;

-- Employees table
CREATE TABLE
IF NOT EXISTS employees
(
    employee_id VARCHAR
(20) PRIMARY KEY,
    first_name VARCHAR
(100) NOT NULL,
    last_name VARCHAR
(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Books table
CREATE TABLE
IF NOT EXISTS books
(
    isbn VARCHAR
(20) PRIMARY KEY,
    title VARCHAR
(255) NOT NULL,
    author VARCHAR
(255) NOT NULL,
    category VARCHAR
(100) NOT NULL,
    quantity INT DEFAULT 1,
    available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Members table
CREATE TABLE
IF NOT EXISTS members
(
    member_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR
(100) NOT NULL,
    last_name VARCHAR
(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Issues table
CREATE TABLE
IF NOT EXISTS issues
(
    issue_id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    isbn VARCHAR
(20) NOT NULL,
    issue_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date DATE NOT NULL,
    return_date TIMESTAMP NULL,
    status ENUM
('issued', 'returned') DEFAULT 'issued',
    FOREIGN KEY
(member_id) REFERENCES members
(member_id),
    FOREIGN KEY
(isbn) REFERENCES books
(isbn)
);

-- Reservations table
CREATE TABLE
IF NOT EXISTS reservations
(
    reservation_id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    isbn VARCHAR
(20) NOT NULL,
    status ENUM
('pending', 'ready', 'fulfilled', 'cancelled') DEFAULT 'pending',
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON
UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY
(member_id) REFERENCES members
(member_id),
    FOREIGN KEY
(isbn) REFERENCES books
(isbn)
);

-- Insert sample employee
INSERT INTO employees
    (employee_id, first_name, last_name)
VALUES
    ('EMP001', 'Alice', 'Johnson');

-- Insert sample books
INSERT INTO books
    (isbn, title, author, category, quantity)
VALUES
    ('978-0-13-468599-1', 'Clean Code', 'Robert C. Martin', 'Programming', 3),
    ('978-0-13-235088-4', 'The C Programming Language', 'Brian W. Kernighan', 'Programming', 2),
    ('978-0-262-03384-8', 'Introduction to Algorithms', 'Thomas H. Cormen', 'Computer Science', 2),
    ('978-0-134-68511-4', 'Design Patterns', 'Erich Gamma', 'Software Engineering', 1),
    ('978-1-449-35573-9', 'Learning Python', 'Mark Lutz', 'Programming', 4);

-- Insert sample members
INSERT INTO members
    (first_name, last_name)
VALUES
    ('John', 'Doe'),
    ('Jane', 'Smith'),
    ('Michael', 'Johnson'),
    ('Emily', 'Brown');