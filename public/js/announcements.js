document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("announcements-list");
  const sortSelect = document.getElementById("sort-select");
  const searchInput = document.getElementById("search-input");
  const categoryFilter = document.getElementById("category-filter");

  const modal = document.getElementById("ann-modal");
  const modalTitle = document.getElementById("ann-modal-title");
  const modalBadge = document.getElementById("ann-modal-badge");
  const modalMeta = document.getElementById("ann-modal-meta");
  const modalDesc = document.getElementById("ann-modal-desc");
  const modalDenah = document.getElementById("ann-modal-denah");
  const modalDetail = document.getElementById("ann-modal-detail");

  let allAnnouncements = [];
  let annCache = [];
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
        allAnnouncements = result.data || [];
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
    annCache = data;

    if (!data.length) {
      container.innerHTML = `<p style="color: var(--text-light);">Belum ada pengumuman tersedia.</p>`;
      return;
    }

    container.innerHTML = data.map((item) => {
      const isDone = item.computed_status === 'done';
      const badgeStyle = isDone
        ? 'background-color: #64748b; color: white;'
        : 'background-color: #2563eb; color: white;';
      const statusText = isDone ? 'SELESAI' : 'AKTIF';
      const cat = (item.category || 'umum').toLowerCase();
      const catLabel = categoryLabels[cat] || cat;
      const desc = item.description || '';
      const short = desc.length > 110 ? desc.slice(0, 110) + '...' : desc;
      const detailUrl = `/announcement-detail.html?id=${item.announcement_id}`;

      return `
        <article class="card ann-card" data-id="${item.announcement_id}" style="cursor: pointer; opacity: ${isDone ? '0.88' : '1'};">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.5rem; margin-bottom:0.75rem;">
            <h3 style="margin:0; color:var(--primary); font-size:1.15rem;">${escapeHtml(item.title)}</h3>
            <span style="font-size:0.72rem; padding:0.2rem 0.55rem; border-radius:999px; font-weight:700; white-space:nowrap; ${badgeStyle}">
              ${statusText}
            </span>
          </div>
          <div style="margin-bottom:0.75rem;">
            <span class="category-badge cat-${cat}">${catLabel}</span>
          </div>
          <p style="font-size:0.85rem; color:var(--text-light); margin-bottom:0.75rem;">
            📅 ${escapeHtml(String(item.event_date || '-'))} · 📍 ${escapeHtml(item.location_name || 'Area Sekolah')}
          </p>
          <p style="font-size:0.95rem; margin-bottom:1rem;">
            ${escapeHtml(short)}
          </p>
          <a href="${detailUrl}" class="btn btn-detail" style="display:inline-block; font-size:0.85rem; padding:0.45rem 0.9rem; text-decoration:none; border-radius:6px;">
            Baca Selengkapnya
          </a>
          <p style="margin-top:0.65rem; font-size:0.78rem; color:var(--text-light);">Klik kartu untuk ringkasan cepat</p>
        </article>
      `;
    }).join('');

    bindCardClicks();
  }

  function bindCardClicks() {
    container.querySelectorAll('.ann-card').forEach((card) => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-detail') || e.target.closest('a')) return;
        const id = card.dataset.id;
        const item = annCache.find((entry) => String(entry.announcement_id) === String(id));
        if (item) {
          openAnnModal(item);
        }
      });
    });
  }

  function openAnnModal(item) {
    if (!modal) return;
    const isDone = item.computed_status === 'done';
    if (modalBadge) {
      modalBadge.textContent = isDone ? 'SELESAI' : 'AKTIF';
      modalBadge.classList.toggle('done', isDone);
    }
    if (modalTitle) modalTitle.textContent = item.title || '-';

    const jam = [item.start_time, item.end_time].filter(Boolean).join(' – ') || '-';
    if (modalMeta) {
      modalMeta.innerHTML = `
        📅 <strong>Tanggal:</strong> ${escapeHtml(String(item.event_date || '-'))}<br>
        ⏰ <strong>Jam:</strong> ${escapeHtml(jam)}<br>
        📍 <strong>Lokasi:</strong> ${escapeHtml(item.location_name || 'Area Sekolah')}
      `;
    }

    const desc = item.description || 'Tidak ada deskripsi.';
    if (modalDesc) {
      modalDesc.textContent = desc.length > 400 ? desc.slice(0, 400) + '…' : desc;
    }

    if (modalDenah) {
      modalDenah.innerHTML = item.location_id
        ? `<a href="/map.html?location_id=${encodeURIComponent(item.location_id)}">📍 Lihat lokasi di Denah</a>`
        : '';
    }

    if (modalDetail) {
      modalDetail.href = `/announcement-detail.html?id=${encodeURIComponent(item.announcement_id)}`;
    }

    modal.hidden = false;
    document.body.classList.add('modal-open');
  }

  function closeAnnModal() {
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove('modal-open');
  }

  document.querySelectorAll('[data-close-modal]').forEach((el) => {
    el.addEventListener('click', closeAnnModal);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && !modal.hidden) {
      closeAnnModal();
    }
  });

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