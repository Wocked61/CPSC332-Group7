const searchInput = document.getElementById('searchInput');
const filterSelect = document.getElementById('filterSelect');
const availableToggle = document.getElementById('availableToggle');
const searchForm = document.getElementById('searchForm');
const resultsSummary = document.getElementById('resultsSummary');
const resultsList = document.getElementById('resultsList');
const emptyState = document.getElementById('emptyState');

const API_ENDPOINT = '../server/public_catalog.php';
let debounceHandle;

const loginToggle = document.getElementById('memberLoginToggle');
const loginDropdown = document.getElementById('memberLoginDropdown');
const inlineMemberLoginForm = document.getElementById('inlineMemberLogin');
const inlineMemberIdInput = document.getElementById('inlineMemberId');
const inlineMemberError = document.getElementById('inlineMemberError');

function buildQuery() {
    const params = new URLSearchParams();
    const query = searchInput.value.trim();

    if (query.length) {
        params.append('query', query);
    }

    params.append('filter', filterSelect.value || 'all');

    if (availableToggle.checked) {
        params.append('available', 'true');
    }

    return params.toString();
}

function renderBooks(books) {
    resultsList.innerHTML = '';

    if (!books.length) {
        resultsSummary.textContent = 'No books match your filters yet.';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    resultsSummary.textContent = `${books.length} book${books.length === 1 ? '' : 's'} shown`;

    books.forEach((book) => {
        const card = document.createElement('article');
        card.className = 'catalog-card';
        card.setAttribute('role', 'listitem');
        card.innerHTML = `
            <div>
                <h3>${book.title}</h3>
                <p class="meta">${book.author} · ${book.category}</p>
            </div>
            <p class="meta">ISBN: ${book.isbn}</p>
            <div class="availability ${book.available ? 'available' : 'waitlist'}">
                ${book.available ? 'Available now' : 'All copies issued'} · ${book.available_copies} of ${book.quantity} copies
            </div>
        `;
        resultsList.appendChild(card);
    });
}

async function loadBooks() {
    resultsSummary.textContent = 'Loading…';
    resultsList.classList.add('loading');
    emptyState.classList.add('hidden');

    try {
        const response = await fetch(`${API_ENDPOINT}?${buildQuery()}`);
        if (!response.ok) {
            throw new Error('Failed to load catalog');
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error('Unexpected response');
        }

        renderBooks(data);
    } catch (error) {
        console.error(error);
        resultsSummary.textContent = 'Unable to load catalog right now.';
        resultsList.innerHTML = '';
        emptyState.classList.remove('hidden');
        emptyState.querySelector('h3').textContent = 'Temporarily unavailable';
        emptyState.querySelector('p').textContent = 'There was an error retrieving the catalog. Please refresh to try again.';
    } finally {
        resultsList.classList.remove('loading');
    }
}

function scheduleLoad() {
    clearTimeout(debounceHandle);
    debounceHandle = setTimeout(loadBooks, 250);
}

searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    loadBooks();
});

searchInput.addEventListener('input', scheduleLoad);
filterSelect.addEventListener('change', loadBooks);
availableToggle.addEventListener('change', loadBooks);

document.addEventListener('DOMContentLoaded', loadBooks);

function setLoginDropdownVisible(visible) {
    if (!loginDropdown || !loginToggle) return;
    loginDropdown.classList.toggle('hidden', !visible);
    loginToggle.setAttribute('aria-expanded', visible ? 'true' : 'false');
    if (visible && inlineMemberIdInput) {
        inlineMemberIdInput.focus();
    }
}

if (loginToggle && loginDropdown) {
    loginToggle.addEventListener('click', () => {
        const expanded = loginToggle.getAttribute('aria-expanded') === 'true';
        setLoginDropdownVisible(!expanded);
    });

    document.addEventListener('click', (event) => {
        if (!loginDropdown.contains(event.target) && !loginToggle.contains(event.target)) {
            setLoginDropdownVisible(false);
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            setLoginDropdownVisible(false);
        }
    });
}

async function handleInlineMemberLogin(event) {
    event.preventDefault();
    if (!inlineMemberIdInput || !inlineMemberError) return;

    const memberId = inlineMemberIdInput.value.trim();
    if (!memberId) {
        inlineMemberError.textContent = 'Please enter your member ID.';
        inlineMemberIdInput.focus();
        return;
    }

    inlineMemberError.textContent = '';
    const submitButton = inlineMemberLoginForm.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Signing in…';
    }

    try {
        const response = await fetch('../server/member/login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ member_id: memberId })
        });

        const data = await response.json();

        if (data.success) {
            window.location.href = 'member/portal.php';
        } else {
            inlineMemberError.textContent = data.message || 'Unable to sign in right now.';
        }
    } catch (error) {
        inlineMemberError.textContent = 'Network error. Please try again in a moment.';
        console.error(error);
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Continue';
        }
    }
}

if (inlineMemberLoginForm) {
    inlineMemberLoginForm.addEventListener('submit', handleInlineMemberLogin);
}
