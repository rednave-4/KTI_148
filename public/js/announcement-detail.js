document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    document.getElementById('detail-container').innerHTML = '<p>ID pengumuman tidak valid.</p>';
    return;
  }

  fetchAnnouncementDetail(id);
});

const categoryLabels = {
  umum: 'Umum',
  osis: 'OSIS',
  akademik: 'Akademik',
  lomba: 'Lomba',
  ekstrakurikuler: 'Ekstrakurikuler',
  lainnya: 'Lainnya'
};

async function fetchAnnouncementDetail(id) {
  const container = document.getElementById('detail-container');
  try {
    const response = await fetch(`/api/announcements/${id}`);
    const result = await response.json();

    if (result.success) {
      const item = result.data;
      const dateStr = new Date(item.event_date).toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });

      const cat = (item.category || 'umum').toLowerCase();
      const catLabel = categoryLabels[cat] || cat;
      const shareUrl = window.location.href;
      const shareText = encodeURIComponent(`${item.title} - SMARIDASA`);

      container.innerHTML = `
        ${item.image_path ? `<img src="${item.image_path}" alt="Poster Kegiatan" style="width: 100%; max-height: 400px; object-fit: contain; background: #000; border-radius: 4px; margin-bottom: 1.5rem;">` : ''}
        
        <div style="margin-bottom: 0.75rem;">
          <span class="category-badge cat-${cat}" style="display:inline-block;padding:0.2rem 0.55rem;border-radius:20px;font-size:0.75rem;font-weight:600;text-transform:uppercase;">
            ${catLabel}
          </span>
        </div>

        <h1 style="color: var(--primary); margin-bottom: 1rem;">${escapeHtml(item.title)}</h1>
        
        <div style="background: #f1f5f9; padding: 1rem; border-radius: var(--radius); margin-bottom: 1.5rem;" class="detail-meta">
          <p><strong>📅 Tanggal:</strong> ${dateStr}</p>
          <p><strong>⏰ Waktu:</strong> ${item.start_time || '-'} ${item.end_time ? 's.d. ' + item.end_time : ''}</p>
          <p><strong>📍 Lokasi:</strong> ${escapeHtml(item.location_name || 'Area Sekolah')} 
             ${item.location_id ? `<a href="/map.html?location_id=${item.location_id}" class="btn" style="margin-left: 1rem; padding: 0.3rem 0.8rem; font-size: 0.8rem;">Lihat Lokasi di Denah</a>` : ''}
          </p>
        </div>

        <div style="line-height: 1.8; white-space: pre-line; margin-bottom: 2rem;">
          ${escapeHtml(item.description)}
        </div>

        <div style="border-top: 1px solid var(--border); padding-top: 1.25rem;">
          <p style="font-weight: 600; margin-bottom: 0.75rem; font-size: 0.95rem;">Bagikan Pengumuman:</p>
          <div style="display: flex; flex-wrap: wrap; gap: 0.6rem;">
            <a href="https://wa.me/?text=${shareText}%20${encodeURIComponent(shareUrl)}" 
               target="_blank" rel="noopener"
               class="btn" style="background:#25D366; font-size:0.85rem; padding:0.45rem 0.9rem;">
              WhatsApp
            </a>
            <button type="button" id="copy-link-btn" class="btn btn-secondary" style="font-size:0.85rem; padding:0.45rem 0.9rem;">
              Salin Link
            </button>
            <a href="https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(shareUrl)}" 
               target="_blank" rel="noopener"
               class="btn btn-secondary" style="font-size:0.85rem; padding:0.45rem 0.9rem;">
              X / Twitter
            </a>
          </div>
          <p id="copy-feedback" style="font-size:0.8rem; color:#16a34a; margin-top:0.5rem; display:none;">Link berhasil disalin!</p>
        </div>
      `;

      const copyBtn = document.getElementById('copy-link-btn');
      if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(shareUrl);
            const feedback = document.getElementById('copy-feedback');
            if (feedback) {
              feedback.style.display = 'block';
              setTimeout(() => feedback.style.display = 'none', 2000);
            }
          } catch (err) {
            const temp = document.createElement('input');
            temp.value = shareUrl;
            document.body.appendChild(temp);
            temp.select();
            document.execCommand('copy');
            document.body.removeChild(temp);
            const feedback = document.getElementById('copy-feedback');
            if (feedback) {
              feedback.style.display = 'block';
              setTimeout(() => feedback.style.display = 'none', 2000);
            }
          }
        });
      }
    } else {
      container.innerHTML = '<p>Pengumuman tidak ditemukan atau sudah dihapus.</p>';
    }
  } catch (error) {
    container.innerHTML = '<p style="color: red;">Gagal memuat detail pengumuman.</p>';
  }
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}