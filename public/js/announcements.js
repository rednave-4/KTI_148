document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("announcements-list");
  const sortSelect = document.getElementById("sort-select");
  let allAnnouncements = [];

  // Ambil data dari API backend
  async function fetchAnnouncements() {
    try {
      const response = await fetch('/api/announcements'); // Sesuaikan endpoint API Anda
      const result = await response.json();
      
      if (result.success) {
        allAnnouncements = result.data;
        renderAnnouncements(allAnnouncements);
      } else {
        container.innerHTML = `<p style="color: red;">Gagal memuat pengumuman.</p>`;
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
      container.innerHTML = `<p style="color: red;">Terjadi kesalahan koneksi server.</p>`;
    }
  }

  // Fungsi untuk merender kartu pengumuman ke HTML
  function renderAnnouncements(data) {
    if (data.length === 0) {
      container.innerHTML = `<p style="color: var(--text-light);">Belum ada pengumuman tersedia.</p>`;
      return;
    }

    container.innerHTML = data.map(item => {
      // Cek apakah status computed_status bernilai 'done'
      const isDone = item.computed_status === 'done';
      const badgeStyle = isDone 
        ? 'background-color: #64748b; color: white;' 
        : 'background-color: #2563eb; color: white;';
      const statusText = isDone ? 'SELESAI (DONE)' : 'AKTIF';

      return `
        <div class="card" style="border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; background: var(--card-bg, #fff); position: relative; opacity: ${isDone ? '0.85' : '1'};">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
            <h3 style="margin: 0; color: var(--primary); font-size: 1.2rem;">${item.title}</h3>
            <span style="font-size: 0.75rem; padding: 0.25rem 0.6rem; border-radius: 20px; font-weight: 600; ${badgeStyle}">
              ${statusText}
            </span>
          </div>
          <p style="font-size: 0.85rem; color: var(--text-light); margin-bottom: 1rem;">
            📅 ${item.event_date} | 📍 ${item.location_name || 'Area Sekolah'}
          </p>
          <p style="font-size: 0.95rem; margin-bottom: 1.5rem; color: inherit;">
            ${item.description ? item.description.substring(0, 100) + '...' : ''}
          </p>
          <a href="/announcement-detail.html?slug=${item.slug || item.announcement_id}" class="btn" style="display: inline-block; font-size: 0.85rem; padding: 0.5rem 1rem; text-decoration: none; border-radius: 6px; background: #2563eb; color: white;">
            Baca Selengkapnya
          </a>
        </div>
      `;
    }).join('');
  }

  // Fungsi Sorting Berdasarkan Pilihan Dropdown
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      const sortValue = e.target.value;
      let sortedData = [...allAnnouncements];

      if (sortValue === 'newest') {
        sortedData.sort((a, b) => new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at));
      } else if (sortValue === 'oldest') {
        sortedData.sort((a, b) => new Date(a.published_at || a.created_at) - new Date(b.published_at || b.created_at));
      } else if (sortValue === 'event_soon') {
        sortedData.sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
      }

      renderAnnouncements(sortedData);
    });
  }

  // Panggil fungsi saat halaman dimuat
  fetchAnnouncements();
});

function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}