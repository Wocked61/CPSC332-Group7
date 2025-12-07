# CPSC332: File Structures and Databases - Team 7
Library Management System

## Project Description
The Library Management System is a full-stack application designed to automate and streamline library operations by providing tools for managing books, users, and borrowing activity. It allows administrators to add, update, and track books, manage patron accounts, and monitor inventory, while users can search the catalog, check availability, and borrow or return items through their accounts. The system replaces manual record-keeping with a centralized, efficient, and user-friendly platform that improves accuracy, reduces workload, and supports features like due-date tracking, overdue reminders, and borrowing history. Overall, it demonstrates practical skills in database design, CRUD functionality, user authentication, and responsive interface development.

## Tech Stack
Frontend: html, css, js
Backend: php 
Database: mysql

## Features
Employee Login
Browsing Books (isbn, book_title, author, category)
Browse Library Members
Select library member and issue/return books

## Pre-Requisites
Before you begin, install the following: 
1. XAMPP (includes mySQL,php, and apache)
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
click "go" to import

step 6: In the CPSC332-Group7 directory create a .env
Copy and paste the contents of the .env.example

step 7: Access the application
In your browser type "http://localhost/library_system/CPSC332-Group7/client/login.php" 
Type in our demo employee ID (EMP001)

## Project Structure:

```
petadoptionplatform/
├── public/             web-accessible files
│   ├── login.php       employee login
│   ├── dashboard.php   user dashboard (protected)
│   ├── css/            stylesheets
|       |--login.css
|       |--dashboard.css
│   ├── js/             javascript files
|       |--login.js
|       |--dashboard.js
│
├── server/           backend PHP files (not web-accessible)
│   ├── login.php      
│   ├── logout.php  
│   └── issue_book.php
│   └── get_issued_books.php
│   └── return_book.php
│   └── search_books.php
│   └── search_members.php   
│
├── database/           database files
│   └── schema.sql      database schema
│   └── db_connect.php 
│
├── .env                environment variables (do not commit)
├── .env.example        example environment file
└── README.md           this file
```


## authors
Team 7:
Annik Pol, Eliot Park, Dylan Phan, Nicholas Reardon, Ryan Lee




