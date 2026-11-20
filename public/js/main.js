// Cek preferensi tema sedini mungkin agar tidak berkedip saat pindah halaman
const currentTheme = localStorage.getItem('theme') || 'light';
if (currentTheme === 'dark') {
  document.documentElement.classList.add('dark');
}

document.addEventListener('DOMContentLoaded', () => {
  fetchLatestAnnouncements();
  updateAuthNav();
  setupThemeToggle();
});

/**
 * Cek sesi admin, lalu:
 * - jika login  → hapus/sembunyikan "Login", tampilkan "Dashboard"
 * - jika belum  → pastikan "Login" ada, "Dashboard" tidak ada
 */
async function updateAuthNav() {
  const nav = document.querySelector('.nav-links');
  if (!nav) return;

  try {
    const res = await fetch('/api/admin/auth/me', {
      method: 'GET',
      credentials: 'include',
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) return;

    const data = await res.json();

    const loginLi = Array.from(nav.querySelectorAll('li')).find((li) => {
      const a = li.querySelector('a');
      return a && /login\.html/i.test(a.getAttribute('href') || '');
    });

    const oldDash = document.getElementById('admin-dashboard-link');
    if (oldDash) oldDash.remove();

    if (data && data.loggedIn) {
      if (loginLi) loginLi.remove();

      const li = document.createElement('li');
      li.id = 'admin-dashboard-link';
      li.innerHTML = `<a href="/admin/dashboard.html" style="font-weight: 600;">Dashboard</a>`;
      nav.appendChild(li);
    } else {
      if (!loginLi) {
        const li = document.createElement('li');
        li.innerHTML = `<a href="/admin/login.html">Login</a>`;
        nav.appendChild(li);
      }
    }
  } catch (err) {
    console.warn('Gagal cek status login:', err);
  }
}

function setupThemeToggle() {
  const themeToggleBtn = document.getElementById('theme-toggle');
  if (!themeToggleBtn) return;

  // Prevent double-binding if script is included more than once
  if (themeToggleBtn.dataset.themeBound === '1') {
    const isDark = document.documentElement.classList.contains('dark');
    themeToggleBtn.textContent = isDark ? '☀️' : '🌙';
    return;
  }
  themeToggleBtn.dataset.themeBound = '1';

  const updateThemeIcon = () => {
    const isDark = document.documentElement.classList.contains('dark');
    themeToggleBtn.textContent = isDark ? '☀️' : '🌙';
  };

  updateThemeIcon();

  themeToggleBtn.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
    updateThemeIcon();
  });
}

async function fetchLatestAnnouncements() {
  const container = document.getElementById('latest-announcements-container');
  if (!container) return;

  try {
    const response = await fetch('/api/announcements');
    const result = await response.json();

    if (result.success && result.data.length > 0) {
      container.innerHTML = '';
      // Tampilkan maksimal 3 pengumuman terbaru
      const latest = result.data.slice(0, 3);

      latest.forEach((item) => {
        const dateStr = new Date(item.event_date).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
          <h3 style="margin-bottom: 0.5rem; color: var(--primary);">${escapeHtml(item.title)}</h3>
          <p style="font-size: 0.85rem; color: var(--text-light); margin-bottom: 1rem;">
            📅 ${dateStr} | 📍 ${escapeHtml(item.location_name || 'Area Sekolah')}
          </p>
          <p style="margin-bottom: 1.5rem; font-size: 0.95rem;">${escapeHtml((item.description || '').substring(0, 100))}...</p>
          <a href="/announcement-detail.html?id=${item.announcement_id}" class="btn" style="font-size: 0.85rem; padding: 0.4rem 0.8rem;">Baca Selengkapnya</a>
        `;
        container.appendChild(card);
      });
    } else {
      container.innerHTML = '<p style="color: var(--text-light);">Belum ada pengumuman yang diterbitkan.</p>';
    }
  } catch (error) {
    console.error('Gagal memuat pengumuman:', error);
    container.innerHTML = '<p style="color: red;">Gagal terhubung ke server.</p>';
  }
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