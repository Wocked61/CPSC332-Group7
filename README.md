# CPSC332: File Structures and Databases - Team 7
Library Management System

## Project Description
The Library Management System is a full-stack application designed to automate and streamline library operations by providing tools for managing books, users, and borrowing activity. It allows administrators to add, update, and track books, manage patron accounts, and monitor inventory, while users can search the catalog, check availability, and borrow or return items through their accounts. The system replaces manual record-keeping with a centralized, efficient, and user-friendly platform that improves accuracy, reduces workload, and supports features like due-date tracking, overdue reminders, and borrowing history. Overall, it demonstrates practical skills in database design, CRUD functionality, user authentication, and responsive interface development.

## Tech Stack
Frontend: html, css, js
Backend: php 
Database: mysql

## Features
- Secure employee login and session handling
- Fast book search by ISBN, title, author, or category with availability indicators
- Member directory with registration, editing, and deletion workflows
- Configurable due-date system with quick-pick durations, calendar input, and real-time validation
- Issue/return management that highlights due-today and overdue items with badges
- Borrowing history with filters plus detailed book-level dashboards
- Inventory dashboard for adding or editing catalog entries
- Reporting workspace that lists all currently borrowed titles, highlights overdue items, offers an overdue-only toggle, and exports CSV snapshots

## Pre-Requisites
Before you begin, install the following: 
1. XAMPP (includes mySQL,php, and apache): https://sourceforge.net/projects/xampp/ 
2. Web browser (google, google chrome, Safari, etc) 
3. git (for version control)
   
## Installation
step 1: Go into the xampp/htdocs directory
Windows (using Command Prompt):

```bash
cd C:/xampp/htdocs
```

MacOS (terminal): 

```bash
cd /Applications/XAMPP/xamppfiles/htdocs
```

step 2: Create a new folder
```bash
mkdir library_system
```
step 3: move into the library_system folder and clone the git repository
https://github.com/Wocked61/CPSC332-Group7.git

```bash
cd library_system
git clone https://github.com/Wocked61/CPSC332-Group7.git
cd CPSC332-Group7
```

step 4: open xampp control panel

Start Apache

Start mySQL

step 5: create database
open your browser and go to "http://localhost/phpmyadmin"
click on the import tab
click "choose file" and select "database/schema.sql" from the CPSC332-Group7 directory
click "go" to import (this schema already includes the new `due_date` column on the `issues` table)

step 6: In the CPSC332-Group7 directory create a .env
Copy and paste the contents of the .env.example

step 7: Access the application
In your browser type "http://localhost/library_system/CPSC332-Group7/client/login.php" 
Type in our demo employee ID (EMP001)

### Upgrading an existing database
If you're updating an earlier deployment that didn't track due dates, run the following SQL before using the new UI so every issue receives a default 14-day window:

```sql
ALTER TABLE issues ADD COLUMN due_date DATE;
UPDATE issues SET due_date = COALESCE(due_date, DATE_ADD(issue_date, INTERVAL 14 DAY));
ALTER TABLE issues MODIFY due_date DATE NOT NULL;
```

You can alternatively re-import `database/schema.sql` if you do not need to preserve data.

## Project Structure

```
CPSC332-Group7/
├── client/                  # Public-facing PHP, CSS, and JS
│   ├── login.php            # Employee login form
│   ├── dashboard.php        # Main application dashboard (tabs for books, issues, history, inventory, members)
│   ├── css/
│   │   ├── login.css
│   │   └── dashboard.css
│   └── js/
│       ├── dashboard.js
│       ├── borrowing_history.js
│       ├── manage_members.js
│       ├── book_details.js
│       ├── inventory_management.js
│       ├── register_member.js
│       └── login.js
├── server/                  # Backend APIs (not web accessible)
│   ├── login.php
│   ├── logout.php
│   ├── issue_book.php
│   ├── get_issued_books.php
│   ├── get_reports.php
│   ├── get_member_history.php
│   ├── get_book_details.php
│   ├── manage_members.php
│   ├── return_book.php
│   ├── search_books.php
│   └── search_members.php
├── database/
│   ├── db_connect.php
│   └── schema.sql
├── .env.example
└── README.md
```

## Due-Date & Loan Duration Controls

- The **Issue Book** panel now requires choosing a due date using the calendar picker or quick-pick buttons (7/14/21 days). Dates earlier than tomorrow are blocked both in the UI and server-side.
- A live summary underneath the picker shows the exact calendar date and the number of days from today, so staff can double-check before issuing.
- Issued items display badges: green for on-track, amber for due soon (≤2 days), and red for overdue, including “Overdue by X days” messaging.
- Returning items immediately refreshes both the member’s issued list and the main catalog, ensuring accurate availability counts.
- Book detail modals and borrowing history tables now include due dates, outstanding days, and overdue durations to give librarians quick context.


## authors
Team 7:
Annik Pol, Eliot Park, Dylan Phan, Nicholas Reardon, Ryan Lee




