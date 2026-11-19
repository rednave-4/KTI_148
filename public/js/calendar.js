document.addEventListener('DOMContentLoaded', () => {
  initCalendar();
});

let currentDate = new Date();
let announcements = [];

async function initCalendar() {
  try {
    const res = await fetch('/api/announcements');
    const result = await res.json();
    if (result.success) announcements = result.data || [];
  } catch (err) {
    console.error(err);
  }

  renderCalendar();

  document.getElementById('prev-month')?.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  });

  document.getElementById('next-month')?.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  });
}

function renderCalendar() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const title = document.getElementById('current-month-year');
  const grid = document.getElementById('calendar-grid-body');

  if (title) {
    title.textContent = currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  }
  if (!grid) return;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let html = '';
  for (let i = 0; i < firstDay; i++) {
    html += `<div class="calendar-cell empty"></div>`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const events = announcements.filter(a => (a.event_date || '').startsWith(dateStr));

    html += `<div class="calendar-cell">
      <div class="calendar-date">${day}</div>
      ${events.slice(0, 3).map(ev => `
        <a class="calendar-event" href="/announcement-detail.html?id=${ev.announcement_id}" title="${escapeHtml(ev.title)}">
          ${escapeHtml(ev.title)}
        </a>
      `).join('')}
      ${events.length > 3 ? `<small style="color:var(--text-light)">+${events.length - 3} lainnya</small>` : ''}
    </div>`;
  }

  grid.innerHTML = html;
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}