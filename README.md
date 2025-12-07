# CPSC332: File Structures and Databases - Team 7
<h1>Library Management System</h1>
<h2>Project Description</h2>
<p>The Library Management System is a full-stack application designed to automate and streamline library operations by providing tools for managing books, users, and borrowing activity. It allows administrators to add, update, and track books, manage patron accounts, and monitor inventory, while users can search the catalog, check availability, and borrow or return items through their accounts. The system replaces manual record-keeping with a centralized, efficient, and user-friendly platform that improves accuracy, reduces workload, and supports features like due-date tracking, overdue reminders, and borrowing history. Overall, it demonstrates practical skills in database design, CRUD functionality, user authentication, and responsive interface development.</p>
<h2>Tech Stack</h2>
<li>Frontend: html, css</li>
<li>Backend: php </li>
<li>Database: mysql</li>
<h2>Features</h2>
<li>Employee Login</li>
<li>Browsing Books (isbn, book_title, author, category) </li>
<li>Browse Library Members</li>
<li>Select library member and issue/return books</li>
<h2>Pre-Requisites</h2>
<p>Before you begin, install the following: </p>
<ol>1. XAMPP (includes mySQL,php, and apache) </ol>
<ol>2. Web browser (google, google chrome, Safari, etc) </ol>
<ol>3. git (for version control) </ol>
<h2>Installation</h2>
<ol>step 1: Go into the xampp/htdocs directory </ol>
<li>Windows (using Command Prompt): </li>
'''
bash
cd C:/xampp/htdocs
'''
<li>MacOS (terminal): </li>
'''
bash
cd /Applications/XAMPP/xamppfiles/htdocs
'''
<ol>step 2: Create a new folder</ol>
```
bash
mkdir library_system
```
<ol>step 3: move into the library_system folder and clone the git repository </ol>
'''
bash
cd library_system
git clone https://github.com/Wocked61/CPSC332-Group7.git
cd CPSC332-Group7
'''
<ol>step 4: open xampp control panel</ol>
<li>Start Apache</li>
<li>Start mySQL</li>
<ol>step 5: create database</ol>
<li>open your browser and go to "http://localhost/phpmyadmin"</li>
<li>click on the import tab</li>
<li>click "choose file" and select "database/schema.sql" from the CPSC332-Group7 directory</li>
<li>click "go" to import</li>
<ol>step 6: In the CPSC332-Group7 directory create a .env</ol>
<p> Copy and paste the contents of the .env.example</p>
<ol>step 7: Access the application</ol>
<p>In your browser type "http://localhost/library_system/CPSC332-Group7/client/login.php" </p><br>
<p>Type in our demo employee ID (EMP001) </p>

##Project Structure:
'''
CPSC332-Group7/
  public/
    login.php
    dashboard.php
    css/
      login.css
      dashboard.css
    js/
      login.js
      dashboard.js
  database/
    db_connect.php
    schema.sql
  server/
    login.php
    etc
  .env
  .env.example
  .gitignore
  .readme
  '''
##authors
Team 7:
Annik Pol
Eliot Park
Dylan Phan
Nicholas Reardon
Ryan Lee




