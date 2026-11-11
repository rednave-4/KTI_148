document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("announcements-list");
  const sortSelect = document.getElementById("sort-select");
  const searchInput = document.getElementById("search-input");
  const categoryFilter = document.getElementById("category-filter");

  let allAnnouncements = [];
  let debounceTimer = null;

  const categoryLabels = {
    umum: 'Umum',
    osis: 'OSIS',
    akademik: 'Akademik',
    lomba: 'Lomba',
    ekstrakurikuler: 'Ekstrakurikuler',
    lainnya: 'Lainnya'
  };

  async function fetchAnnouncements() {
    try {
      const params = new URLSearchParams();
      const search = searchInput?.value?.trim() || '';
      const category = categoryFilter?.value || 'all';

      if (search) params.append('search', search);
      if (category && category !== 'all') params.append('category', category);

      const url = '/api/announcements' + (params.toString() ? `?${params.toString()}` : '');
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        allAnnouncements = result.data;
        applySortAndRender();
      } else {
        container.innerHTML = `<p style="color: red;">Gagal memuat pengumuman.</p>`;
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
      container.innerHTML = `<p style="color: red;">Terjadi kesalahan koneksi server.</p>`;
    }
  }

  function applySortAndRender() {
    let sortedData = [...allAnnouncements];
    const sortValue = sortSelect?.value || 'newest';

    if (sortValue === 'newest') {
      sortedData.sort((a, b) => new Date(b.published_at || b.created_at || 0) - new Date(a.published_at || a.created_at || 0));
    } else if (sortValue === 'oldest') {
      sortedData.sort((a, b) => new Date(a.published_at || a.created_at || 0) - new Date(b.published_at || b.created_at || 0));
    } else if (sortValue === 'event_soon') {
      sortedData.sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
    }

    renderAnnouncements(sortedData);
  }

  function renderAnnouncements(data) {
    if (data.length === 0) {
      container.innerHTML = `<p style="color: var(--text-light);">Tidak ada pengumuman yang cocok dengan filter/pencarian.</p>`;
      return;
    }

    container.innerHTML = data.map(item => {
      const isDone = item.computed_status === 'done';
      const badgeStyle = isDone 
        ? 'background-color: #64748b; color: white;' 
        : 'background-color: #2563eb; color: white;';
      const statusText = isDone ? 'SELESAI' : 'AKTIF';
      const cat = (item.category || 'umum').toLowerCase();
      const catLabel = categoryLabels[cat] || cat;

      return `
        <div class="card" style="border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; position: relative; opacity: ${isDone ? '0.85' : '1'};">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; gap: 0.5rem;">
            <h3 style="margin: 0; color: var(--primary); font-size: 1.2rem;">${escapeHtml(item.title)}</h3>
            <span style="font-size: 0.75rem; padding: 0.25rem 0.6rem; border-radius: 20px; font-weight: 600; white-space: nowrap; ${badgeStyle}">
              ${statusText}
            </span>
          </div>
          <div style="margin-bottom: 0.75rem;">
            <span class="category-badge cat-${cat}">${catLabel}</span>
          </div>
          <p style="font-size: 0.85rem; color: var(--text-light); margin-bottom: 1rem;">
            📅 ${item.event_date || '-'} | 📍 ${escapeHtml(item.location_name || 'Area Sekolah')}
          </p>
          <p style="font-size: 0.95rem; margin-bottom: 1.5rem; color: inherit;">
            ${item.description ? escapeHtml(item.description.substring(0, 100)) + '...' : ''}
          </p>
          <a href="/announcement-detail.html?id=${item.announcement_id}" class="btn" style="display: inline-block; font-size: 0.85rem; padding: 0.5rem 1rem; text-decoration: none; border-radius: 6px;">
            Baca Selengkapnya
          </a>
        </div>
      `;
    }).join('');
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', applySortAndRender);
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(fetchAnnouncements, 350);
    });
  }

  if (categoryFilter) {
    categoryFilter.addEventListener('change', fetchAnnouncements);
  }

  fetchAnnouncements();
});

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}