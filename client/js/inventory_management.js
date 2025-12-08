// Inventory Management Handler
let inventoryBooks = [];
let currentEditingIsbn = null;

// Load all books on tab switch
async function loadInventoryBooks() {
    try {
        const response = await fetch('../server/manage_inventory.php?action=get_all');
        const data = await response.json();

        if (data.success) {
            inventoryBooks = data.books;
            displayInventoryBooks(data.books);
        } else {
            console.error('Error loading inventory:', data.error);
        }
    } catch (error) {
        console.error('Error fetching inventory:', error);
    }
}

function displayInventoryBooks(books) {
    const container = document.getElementById('inventoryResults');

    if (books.length === 0) {
        container.innerHTML = '<div class="empty-state">No books in inventory. <a href="javascript:openNewBookModal()">Add a new book</a></div>';
        return;
    }

    container.innerHTML = `
        <table class="inventory-table">
            <thead>
                <tr>
                    <th>ISBN</th>
                    <th>Title</th>
                    <th>Author</th>
                    <th>Category</th>
                    <th class="text-center">Total</th>
                    <th class="text-center">Available</th>
                    <th class="text-center">Checked Out</th>
                    <th class="text-center">Actions</th>
                </tr>
            </thead>
            <tbody>
                ${books.map(book => `
                    <tr>
                        <td><code>${book.isbn}</code></td>
                        <td><strong>${book.title}</strong></td>
                        <td>${book.author}</td>
                        <td>${book.category}</td>
                        <td class="text-center"><strong>${book.total_copies}</strong></td>
                        <td class="text-center"><span class="badge-success">${book.available_copies}</span></td>
                        <td class="text-center"><span class="badge-warning">${book.checked_out}</span></td>
                        <td class="text-center inventory-actions">
                            <button class="btn-small btn-add-copy" title="Add another copy" onclick="addBookCopy('${book.isbn}', '${book.title.replace(/'/g, "\\'")}')">
                                + Add
                            </button>
                            <button class="btn-small btn-edit" title="Edit details" onclick="openEditBookModal('${book.isbn}', '${book.title.replace(/'/g, "\\'")}', '${book.author.replace(/'/g, "\\'")}', '${book.category.replace(/'/g, "\\'")}')">
                                ✎ Edit
                            </button>
                            <button class="btn-small btn-remove" title="Remove a copy" onclick="removeBookCopy('${book.isbn}', '${book.title.replace(/'/g, "\\'")}', ${book.total_copies})">
                                − Remove
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function addBookCopy(isbn, title) {
    if (!confirm(`Add another copy of "${title}"?`)) {
        return;
    }

    try {
        const formData = new FormData();
        formData.append('isbn', isbn);
        formData.append('action', 'add_copy');

        const response = await fetch('../server/manage_inventory.php', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            alert('Copy added successfully!');
            loadInventoryBooks(); // Reload the table
        } else {
            alert(result.message || 'Failed to add copy');
        }
    } catch (error) {
        alert('An error occurred while adding the copy');
        console.error(error);
    }
}

async function removeBookCopy(isbn, title, totalCopies) {
    if (totalCopies <= 0) {
        alert('No copies available to remove');
        return;
    }

    if (!confirm(`Remove one copy of "${title}"? (${totalCopies} copies total)`)) {
        return;
    }

    try {
        const formData = new FormData();
        formData.append('isbn', isbn);
        formData.append('action', 'remove_copy');

        const response = await fetch('../server/manage_inventory.php', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            alert('Copy removed successfully!');
            loadInventoryBooks(); // Reload the table
        } else {
            alert(result.message || 'Failed to remove copy');
        }
    } catch (error) {
        alert('An error occurred while removing the copy');
        console.error(error);
    }
}

function openNewBookModal() {
    const modal = document.getElementById('newBookModal');
    if (!modal) {
        console.error('New book modal not found');
        return;
    }
    modal.style.display = 'flex';
    document.getElementById('newBookForm').reset();
    document.getElementById('newBookIsbn').focus();
}

function closeNewBookModal() {
    const modal = document.getElementById('newBookModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function submitNewBook(event) {
    event.preventDefault();

    const isbn = document.getElementById('newBookIsbn').value.trim();
    const title = document.getElementById('newBookTitle').value.trim();
    const author = document.getElementById('newBookAuthor').value.trim();
    const category = document.getElementById('newBookCategory').value.trim();
    const copies = parseInt(document.getElementById('newBookCopies').value) || 1;

    if (!isbn || !title || !author || !category) {
        alert('Please fill in all required fields');
        return;
    }

    if (copies < 1) {
        alert('Copies must be at least 1');
        return;
    }

    try {
        const formData = new FormData();
        formData.append('isbn', isbn);
        formData.append('title', title);
        formData.append('author', author);
        formData.append('category', category);
        formData.append('copies', copies);
        formData.append('action', 'add_new_book');

        const response = await fetch('../server/manage_inventory.php', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            alert(result.message);
            closeNewBookModal();
            loadInventoryBooks(); // Reload the table
        } else {
            alert(result.message || 'Failed to add new book');
        }
    } catch (error) {
        alert('An error occurred while adding the book');
        console.error(error);
    }
}

function openEditBookModal(isbn, title, author, category) {
    currentEditingIsbn = isbn;
    document.getElementById('editBookIsbn').value = isbn;
    document.getElementById('editBookTitle').value = title;
    document.getElementById('editBookAuthor').value = author;
    document.getElementById('editBookCategory').value = category;

    const modal = document.getElementById('editBookModal');
    if (!modal) {
        console.error('Edit book modal not found');
        return;
    }
    modal.style.display = 'flex';
    document.getElementById('editBookTitle').focus();
}

function closeEditBookModal() {
    const modal = document.getElementById('editBookModal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentEditingIsbn = null;
}

async function submitEditBook(event) {
    event.preventDefault();

    if (!currentEditingIsbn) {
        alert('No book selected for editing');
        return;
    }

    const title = document.getElementById('editBookTitle').value.trim();
    const author = document.getElementById('editBookAuthor').value.trim();
    const category = document.getElementById('editBookCategory').value.trim();

    if (!title || !author || !category) {
        alert('Please fill in all required fields');
        return;
    }

    try {
        const formData = new FormData();
        formData.append('isbn', currentEditingIsbn);
        formData.append('title', title);
        formData.append('author', author);
        formData.append('category', category);
        formData.append('action', 'edit_book');

        const response = await fetch('../server/manage_inventory.php', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            alert('Book details updated successfully!');
            closeEditBookModal();
            loadInventoryBooks(); // Reload the table
        } else {
            alert(result.message || 'Failed to update book details');
        }
    } catch (error) {
        alert('An error occurred while updating the book');
        console.error(error);
    }
}

// Close modals when clicking outside
document.addEventListener('DOMContentLoaded', function () {
    const newBookModal = document.getElementById('newBookModal');
    const editBookModal = document.getElementById('editBookModal');

    if (newBookModal) {
        newBookModal.addEventListener('click', function (event) {
            if (event.target === this) {
                closeNewBookModal();
            }
        });
    }

    if (editBookModal) {
        editBookModal.addEventListener('click', function (event) {
            if (event.target === this) {
                closeEditBookModal();
            }
        });
    }
});

