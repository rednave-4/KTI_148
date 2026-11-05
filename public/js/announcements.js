document.addEventListener('DOMContentLoaded', () => {
  loadAllAnnouncements();
});

async function loadAllAnnouncements() {
  const container = document.getElementById('announcements-list');
  try {
    const response = await fetch('/api/public/announcements');
    const result = await response.json();

    if (result.success && result.data.length > 0) {
      container.innerHTML = '';
      result.data.forEach(item => {
        const dateStr = new Date(item.event_date).toLocaleDateString('id-ID', {
          day: 'numeric', month: 'long', year: 'numeric'
        });

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
          ${item.image_path ? `<img src="${item.image_path}" alt="Poster" style="width: 100%; height: 180px; object-fit: cover; border-radius: 4px; margin-bottom: 1rem;">` : ''}
          <h3 style="margin-bottom: 0.5rem; color: var(--primary);">${escapeHtml(item.title)}</h3>
          <p style="font-size: 0.85rem; color: var(--text-light); margin-bottom: 1rem;">
            📅 ${dateStr} | ⏰ ${item.start_time} ${item.end_time ? '- ' + item.end_time : ''} <br>
            📍 ${escapeHtml(item.location_name || 'Area Sekolah')}
          </p>
          <p style="margin-bottom: 1.5rem; font-size: 0.95rem;">${escapeHtml(item.description.substring(0, 120))}...</p>
          <a href="/announcement-detail.html?id=${item.announcement_id}" class="btn" style="font-size: 0.85rem;">Lihat Detail & Lokasi</a>
        `;
        container.appendChild(card);
      });
    } else {
      container.innerHTML = '<p>Tidak ada pengumuman saat ini.</p>';
    }
  } catch (error) {
    container.innerHTML = '<p style="color: red;">Gagal memuat data pengumuman.</p>';
  }
}

function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}