function showTab(tabId, btn) {
  document.querySelectorAll(".tab-content").forEach((tab) => {
    tab.style.display = "none";
    tab.classList.remove("active");
  });

  document.querySelectorAll(".nav-tab").forEach((b) => b.classList.remove("active"));

  const activeTab = document.getElementById(tabId);
  if (activeTab) {
    activeTab.style.display = "block";
    activeTab.classList.add("active");
  }

  if (btn) btn.classList.add("active");

  if (tabId === "books") loadBooks();
}

document.addEventListener("DOMContentLoaded", () => showTab("home", document.querySelector(".nav-tab")));



async function addBook(e) {
  e.preventDefault();

  const title = document.getElementById("bookTitle").value.trim();
  const author = document.getElementById("author").value.trim();
  const category = document.getElementById("category").value.trim();
  const isbn = document.getElementById("isbn").value.trim();

  const form = new FormData();
  form.append("title", title);
  form.append("author", author);
  form.append("category", category);
  form.append("isbn", isbn);

  const res = await fetch("../server/books_create.php", { method: "POST", body: form });
  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.ok) {
    alert(data.error || "Failed to add book");
    return;
  }

  document.getElementById("bookTitle").value = "";
  document.getElementById("author").value = "";
  document.getElementById("category").value = "";
  document.getElementById("isbn").value = "";

  await loadBooks();
  alert("Book added!");
}

async function searchBooks() {
  await loadBooks();
}

async function loadBooks() {
  const q = document.getElementById("searchBookInput").value.trim();
  const res = await fetch(`../server/books_list.php?q=${encodeURIComponent(q)}`);
  const data = await res.json();

  if (!data.ok) {
    alert("Failed to load books");
    return;
  }

  const tbody = document.getElementById("bookTableBody");
  tbody.innerHTML = data.books
    .map(
      (b) => `
      <tr>
        <td>${escapeHtml(b.title)}</td>
        <td>${escapeHtml(b.author)}</td>
        <td>${escapeHtml(b.category)}</td>
        <td>${escapeHtml(b.isbn)}</td>
        <td>${escapeHtml(b.status)}</td>
        <td>
          <button class="btn btn-edit" onclick="editBook(${b.book_id})">Edit</button>
          <button class="btn btn-delete" onclick="deleteBook(${b.book_id})">Delete</button>
        </td>
      </tr>
    `
    )
    .join("");
}


function editBook(id) { alert("editBook not wired yet (id=" + id + ")"); }
function deleteBook(id) { alert("deleteBook not wired yet (id=" + id + ")"); }


function addMember(e) { if(e) e.preventDefault(); alert("addMember not wired yet"); }
function searchMembers() { alert("searchMembers not wired yet"); }
function editMember() { alert("editMember not wired yet"); }
function deleteMember() { alert("deleteMember not wired yet"); }


function issueBook(e) { if(e) e.preventDefault(); alert("issueBook not wired yet"); }
function returnBook(e) { if(e) e.preventDefault(); alert("returnBook not wired yet"); }


