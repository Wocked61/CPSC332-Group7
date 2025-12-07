-- Migration: add reservations table for member holds/requests

START
TRANSACTION;

CREATE TABLE reservations
(
    reservation_id INT
    AUTO_INCREMENT PRIMARY KEY,
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

    COMMIT;
