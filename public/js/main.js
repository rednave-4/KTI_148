// Cek preferensi tema sedini mungkin agar tidak berkedip saat pindah halaman
const currentTheme = localStorage.getItem('theme') || 'light';
if (currentTheme === 'dark') {
  document.documentElement.classList.add('dark');
}

document.addEventListener('DOMContentLoaded', () => {
  fetchLatestAnnouncements();
  injectAdminNavLink();
  setupThemeToggle();
});

async function injectAdminNavLink() {
  try {
    const res = await fetch('/api/admin/auth/me');
    if (!res.ok) return;

    const data = await res.json();
    if (!data.loggedIn) return;

    const nav = document.querySelector('.nav-links');
    if (!nav) return;

    // Hindari duplikat jika link Dashboard sudah ada
    if (document.getElementById('admin-dashboard-link')) return;

    const existingDashboardLink = nav.querySelector('a[href="/admin/dashboard.html"]');
    if (existingDashboardLink) return;

    const li = document.createElement('li');
    li.id = 'admin-dashboard-link';
    li.innerHTML = `<a href="/admin/dashboard.html" style="font-weight: 600;">Dashboard</a>`;
    nav.appendChild(li);
  } catch (err) {
    // Diam saja jika gagal mengecek status login
  }
}

function setupThemeToggle() {
  const themeToggleBtn = document.getElementById('theme-toggle');
  if (!themeToggleBtn) return;

  const updateThemeIcon = () => {
    const isDark = document.documentElement.classList.contains('dark');
    if (themeToggleBtn.textContent.includes('🌙') || themeToggleBtn.textContent.includes('☀️')) {
      themeToggleBtn.textContent = isDark ? '☀️' : '🌙';
    }
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