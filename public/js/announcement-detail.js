document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    document.getElementById('detail-container').innerHTML = '<p>ID pengumuman tidak valid.</p>';
    return;
  }

  fetchAnnouncementDetail(id);
});

async function fetchAnnouncementDetail(id) {
  const container = document.getElementById('detail-container');
  try {
    const response = await fetch(`/api/public/announcements/${id}`);
    const result = await response.json();

    if (result.success) {
      const item = result.data;
      const dateStr = new Date(item.event_date).toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });

      container.innerHTML = `
        ${item.image_path ? `<img src="${item.image_path}" alt="Poster Kegiatan" style="width: 100%; max-height: 400px; object-fit: contain; background: #000; border-radius: 4px; margin-bottom: 1.5rem;">` : ''}
        <h1 style="color: var(--primary); margin-bottom: 1rem;">${escapeHtml(item.title)}</h1>
        
        <div style="background: #f1f5f9; padding: 1rem; border-radius: var(--radius); margin-bottom: 1.5rem;">
          <p><strong>📅 Tanggal:</strong> ${dateStr}</p>
          <p><strong>⏰ Waktu:</strong> ${item.start_time} ${item.end_time ? 's.d. ' + item.end_time : ''}</p>
          <p><strong>📍 Lokasi:</strong> ${escapeHtml(item.location_name || 'Area Sekolah')} 
             ${item.location_id ? `<a href="/map.html?location_id=${item.location_id}" class="btn" style="margin-left: 1rem; padding: 0.3rem 0.8rem; font-size: 0.8rem;">Lihat Lokasi di Denah</a>` : ''}
          </p>
        </div>

        <div style="line-height: 1.8; white-space: pre-line;">
          ${escapeHtml(item.description)}
        </div>
      `;
    } else {
      container.innerHTML = '<p>Pengumuman tidak ditemukan atau sudah dihapus.</p>';
    }
  } catch (error) {
    container.innerHTML = '<p style="color: red;">Gagal memuat detail pengumuman.</p>';
  }
}

function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}