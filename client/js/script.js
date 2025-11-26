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
}


document.addEventListener("DOMContentLoaded", () => showTab("home", document.querySelector(".nav-tab")));



function addBook(e){ if(e) e.preventDefault(); alert("addBook not wired yet"); }
function searchBooks(){ alert("searchBooks not wired yet"); }
function editBook(){ alert("editBook not wired yet"); }
function deleteBook(){ alert("deleteBook not wired yet"); }

function addMember(e){ if(e) e.preventDefault(); alert("addMember not wired yet"); }
function searchMembers(){ alert("searchMembers not wired yet"); }

function issueBook(e){ if(e) e.preventDefault(); alert("issueBook not wired yet"); }
function returnBook(e){ if(e) e.preventDefault(); alert("returnBook not wired yet"); }


