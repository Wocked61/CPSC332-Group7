const RESERVATION_SUMMARY_ENABLED = false; // Toggle to true to show status indicators
let reservationsLoaded = false;

const reservationStatusText = {
    pending: 'Pending',
    ready: 'Ready for pickup',
    fulfilled: 'Fulfilled',
    cancelled: 'Cancelled'
};

function formatReservationDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
}

function setReservationsMessage(type, message) {
    const el = document.getElementById('reservationsMessage');
    if (!el) return;
    if (!message) {
        el.style.display = 'none';
        el.textContent = '';
        el.className = 'form-message';
        return;
    }
    el.style.display = 'block';
    el.textContent = message;
    el.className = `form-message ${type}`.trim();
}

async function loadReservations(showToast = false) {
    if (!document.getElementById('reservationsList')) return;

    const filter = document.getElementById('reservationStatusFilter');
    const status = filter ? filter.value : 'all';

    try {
        setReservationsMessage('', 'Loading reservations...');
        const response = await fetch(`../server/get_reservations.php?status=${encodeURIComponent(status)}`);
        if (!response.ok) {
            throw new Error('Unable to load reservations');
        }

        const data = await response.json();
        renderReservationSummary(data);
        renderReservations(data);
        setReservationsMessage(showToast ? 'success' : '', showToast ? 'Reservations refreshed.' : '');
        reservationsLoaded = true;
    } catch (error) {
        console.error(error);
        setReservationsMessage('error', 'Could not load reservations. Please try again.');
    }
}

function renderReservations(list) {
    const container = document.getElementById('reservationsList');
    if (!container) return;

    if (!Array.isArray(list) || list.length === 0) {
        container.innerHTML = '<div class="empty-state">No reservations match this filter.</div>';
        return;
    }

    const rows = list.map((res) => {
        const actionButtons = buildReservationActions(res);
        return `
            <tr>
                <td>
                    <strong>${res.title}</strong>
                    <div class="text-muted">ISBN: ${res.isbn}</div>
                    <div class="text-muted">Copies open: ${res.available_copies}</div>
                </td>
                <td>
                    <strong>${res.member_name}</strong>
                    <div class="text-muted">ID: ${res.member_id}</div>
                </td>
                <td>
                    <span class="reservation-status ${res.status}">${reservationStatusText[res.status] || res.status}</span>
                    <div class="text-muted">Requested ${formatReservationDate(res.created_at)}</div>
                </td>
                <td>${formatReservationDate(res.updated_at)}</td>
                <td class="reservation-actions-cell">${actionButtons}</td>
            </tr>
        `;
    }).join('');

    container.innerHTML = `
        <table class="reservations-table">
            <thead>
                <tr>
                    <th>Book</th>
                    <th>Member</th>
                    <th>Status</th>
                    <th>Last Update</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    `;

    attachReservationActionHandlers();
}

function renderReservationSummary(list = []) {
    const summaryEl = document.getElementById('reservationSummary');
    if (!summaryEl) return;

    if (!RESERVATION_SUMMARY_ENABLED) {
        summaryEl.innerHTML = '';
        summaryEl.style.display = 'none';
        return;
    }

    summaryEl.style.display = '';

    const entries = Array.isArray(list) ? list : [];
    const tallies = entries.reduce((acc, res) => {
        if (acc[res.status] !== undefined) {
            acc[res.status] += 1;
        }
        acc.total += 1;
        return acc;
    }, { total: 0, pending: 0, ready: 0, fulfilled: 0, cancelled: 0 });

    const summaryCards = [
        {
            key: 'total',
            label: 'Total Requests',
            accent: 'accent-primary',
            detail: `${tallies.pending} pending · ${tallies.ready} ready · ${tallies.cancelled} cancelled`
        },
        {
            key: 'pending',
            label: 'Need Prep',
            accent: 'accent-warning',
            detail: 'Waiting for pull/verification'
        },
        {
            key: 'ready',
            label: 'Ready for Pickup',
            accent: 'accent-info',
            detail: 'Staged on hold shelf'
        },
        {
            key: 'fulfilled',
            label: 'Completed',
            accent: 'accent-success',
            detail: 'Picked up or delivered'
        }
    ];

    if (!summaryCards.length) {
        summaryEl.innerHTML = '';
        return;
    }

    summaryEl.innerHTML = summaryCards.map((card) => `
        <article class="reservation-summary-card ${card.accent}">
            <span class="summary-label">${card.label}</span>
            <div class="summary-value">${tallies[card.key] ?? 0}</div>
            <p class="summary-detail">${card.detail}</p>
        </article>
    `).join('');
}

function buildReservationActions(reservation) {
    const buttons = [];
    if (reservation.status === 'pending') {
        buttons.push(`<button class="primary" data-res-action="ready" data-res-id="${reservation.reservation_id}">Mark ready</button>`);
        buttons.push(`<button class="danger" data-res-action="cancelled" data-res-id="${reservation.reservation_id}">Cancel</button>`);
    } else if (reservation.status === 'ready') {
        buttons.push(`<button class="primary" data-res-action="fulfilled" data-res-id="${reservation.reservation_id}">Mark fulfilled</button>`);
        buttons.push(`<button class="danger" data-res-action="cancelled" data-res-id="${reservation.reservation_id}">Cancel</button>`);
    } else {
        buttons.push('<span class="text-muted">No actions</span>');
    }
    return buttons.join('');
}

function attachReservationActionHandlers() {
    document.querySelectorAll('[data-res-action]').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const reservationId = Number(btn.dataset.resId);
            const nextStatus = btn.dataset.resAction;
            if (!reservationId || !nextStatus) return;
            btn.disabled = true;
            await updateReservationStatus(reservationId, nextStatus);
            btn.disabled = false;
        });
    });
}

async function updateReservationStatus(reservationId, status) {
    try {
        const response = await fetch('../server/update_reservation_status.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reservation_id: reservationId, status })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Unable to update reservation');
        }

        await loadReservations(true);
    } catch (error) {
        console.error(error);
        setReservationsMessage('error', error.message);
    }
}

function setupReservationsTab() {
    const tabButton = document.querySelector('.tab-btn[data-tab="reservations"]');
    const refreshBtn = document.getElementById('refreshReservationsBtn');
    const statusFilter = document.getElementById('reservationStatusFilter');

    if (!tabButton || !refreshBtn || !statusFilter) return;

    tabButton.addEventListener('click', () => {
        if (!reservationsLoaded) {
            loadReservations();
        }
    });

    refreshBtn.addEventListener('click', () => loadReservations(true));
    statusFilter.addEventListener('change', () => loadReservations());
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupReservationsTab);
} else {
    setupReservationsTab();
}
