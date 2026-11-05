document.addEventListener('DOMContentLoaded', () => {
  fetchLatestAnnouncements();
});

async function fetchLatestAnnouncements() {
  const container = document.getElementById('latest-announcements-container');
  if (!container) return;

  try {
    const response = await fetch('/api/public/announcements');
    const result = await response.json();

    if (result.success && result.data.length > 0) {
      container.innerHTML = '';
      // Tampilkan maksimal 3 pengumuman terbaru
      const latest = result.data.slice(0, 3);
      
      latest.forEach(item => {
        const dateStr = new Date(item.event_date).toLocaleDateString('id-ID', {
          day: 'numeric', month: 'long', year: 'numeric'
        });

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
          <h3 style="margin-bottom: 0.5rem; color: var(--primary);">${escapeHtml(item.title)}</h3>
          <p style="font-size: 0.85rem; color: var(--text-light); margin-bottom: 1rem;">
            📅 ${dateStr} | 📍 ${escapeHtml(item.location_name || 'Area Sekolah')}
          </p>
          <p style="margin-bottom: 1.5rem; font-size: 0.95rem;">${escapeHtml(item.description.substring(0, 100))}...</p>
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
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}