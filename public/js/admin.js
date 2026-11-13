document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadLocationsDropdown();
  loadAdminStats();
  loadAdminAnnouncements();

  const modal = document.getElementById('announcement-modal');

  document.getElementById('open-modal-btn').addEventListener('click', () => {
    document.getElementById('modal-title').innerText = 'Tambah Pengumuman Baru';
    document.getElementById('announcement-form').reset();
    document.getElementById('announcement-id').value = '';
    document.getElementById('category').value = 'umum';

    const oldNotice = document.getElementById('poster-notice');
    if (oldNotice) oldNotice.remove();

    modal.style.display = 'flex';
  });

  document.getElementById('close-modal-btn').addEventListener('click', () => {
    modal.style.display = 'none';
  });

  document.getElementById('logout-btn').addEventListener('click', async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    }
    window.location.href = '/admin/login.html';
  });

  document.getElementById('announcement-form').addEventListener('submit', handleFormSubmit);
});

async function checkAuth() {
  try {
    const res = await fetch('/api/admin/auth/me');
    const data = await res.json();
    if (!data.loggedIn) {
      window.location.href = '/admin/login.html';
    }
  } catch (err) {
    console.error('Auth check failed:', err);
    window.location.href = '/admin/login.html';
  }
}

async function loadAdminStats() {
  try {
    const res = await fetch('/api/announcements/admin/stats');
    const result = await res.json();
    if (result.success && result.data) {
      document.getElementById('stat-total').textContent = result.data.total;
      document.getElementById('stat-aktif').textContent = result.data.aktif;
      document.getElementById('stat-selesai').textContent = result.data.selesai;
      document.getElementById('stat-draft').textContent = result.data.draft;
    }
  } catch (err) {
    console.error('Gagal memuat statistik:', err);
  }
}

async function loadLocationsDropdown() {
  try {
    const res = await fetch('/api/locations');
    const result = await res.json();
    const selectEl = document.getElementById('location_id');

    selectEl.innerHTML = '<option value="">-- Pilih Lokasi Sekolah --</option>';

    if (result.success && result.data) {
      result.data.forEach(loc => {
        const option = document.createElement('option');
        option.value = loc.location_id;
        option.textContent = `${loc.name} (${loc.location_type})`;
        selectEl.appendChild(option);
      });
    }
  } catch (err) {
    console.error('Gagal memuat dropdown lokasi:', err);
  }
}

const categoryLabels = {
  umum: 'Umum',
  osis: 'OSIS',
  akademik: 'Akademik',
  lomba: 'Lomba',
  ekstrakurikuler: 'Ekstrakurikuler',
  lainnya: 'Lainnya'
};

async function loadAdminAnnouncements() {
  const tbody = document.getElementById('admin-tbody');
  try {
    const res = await fetch('/api/announcements/admin/list');
    const result = await res.json();

    if (result.success && result.data && result.data.length > 0) {
      tbody.innerHTML = '';

      result.data.forEach(item => {
        const status = (item.status || '').toLowerCase();
        const isPublished = status === 'published';

        // Warna badge status
        let badgeStyle = 'background: #fef9c3; color: #854d0e'; // default draft
        if (isPublished) {
          badgeStyle = 'background: #dcfce7; color: #166534';
        } else if (status === 'archived') {
          badgeStyle = 'background: #f1f5f9; color: #475569';
        }

        const categoryLabels = {
          umum: 'Umum',
          osis: 'OSIS',
          akademik: 'Akademik',
          lomba: 'Lomba',
          ekstrakurikuler: 'Ekstrakurikuler',
          lainnya: 'Lainnya'
        };
        const cat = (item.category || 'umum').toLowerCase();
        const catLabel = categoryLabels[cat] || cat;

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>
            <strong>${escapeHtml(item.title)}</strong><br>
            <small style="color:var(--text-light)">Oleh: ${escapeHtml(item.author_name || '-')}</small>
          </td>
          <td>${catLabel}</td>
          <td>${item.event_date ? item.event_date.split('T')[0] : '-'}</td>
          <td>${escapeHtml(item.location_name || '-')}</td>
          <td>
            <span style="padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; ${badgeStyle}">
              ${status.toUpperCase()}
            </span>
          </td>
          <td>
            <button onclick="editItem(${item.announcement_id})" class="btn" style="padding: 0.3rem 0.6rem; font-size: 0.75rem; margin-right: 0.3rem;">Edit</button>
            <button onclick="deleteItem(${item.announcement_id})" class="btn btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.75rem; background: #fee2e2; color: #991b1b;">Hapus</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } else {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Belum ada data pengumuman.</td></tr>';
    }
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: #dc2626; padding: 1.5rem;">
          Gagal memuat data.<br>
          <small style="color: var(--text-light);">Periksa koneksi atau pastikan Anda masih login.</small>
        </td>
      </tr>`;
  }
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('announcement-id').value;
  const formData = new FormData();

  formData.append('title', document.getElementById('title').value);
  formData.append('description', document.getElementById('description').value);
  formData.append('event_date', document.getElementById('event_date').value);
  formData.append('start_time', document.getElementById('start_time').value);
  formData.append('end_time', document.getElementById('end_time').value || '');
  formData.append('location_id', document.getElementById('location_id').value || '');
  formData.append('status', document.getElementById('status').value.toLowerCase());
  formData.append('category', document.getElementById('category').value.toLowerCase());

  const posterFile = document.getElementById('poster').files[0];
  if (posterFile) {
    formData.append('poster', posterFile);
  }

  const url = id
    ? `/api/announcements/admin/${id}`
    : '/api/announcements/admin';

  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      body: formData
    });

    const result = await res.json();

    if (result.success) {
      document.getElementById('announcement-modal').style.display = 'none';
      loadAdminAnnouncements();
      loadAdminStats();
    } else {
      alert(result.message || 'Gagal menyimpan data.');
    }
  } catch (err) {
    console.error(err);
    alert('Terjadi kesalahan pada server.');
  }
}

async function editItem(id) {
  try {
    await loadLocationsDropdown();

    const res = await fetch('/api/announcements/admin/list');
    const result = await res.json();

    if (result.success) {
      const item = result.data.find(a => a.announcement_id === id);

      if (item) {
        document.getElementById('announcement-id').value = item.announcement_id;
        document.getElementById('title').value = item.title || '';
        document.getElementById('description').value = item.description || '';
        document.getElementById('event_date').value = item.event_date ? item.event_date.split('T')[0] : '';
        document.getElementById('start_time').value = item.start_time || '';
        document.getElementById('end_time').value = item.end_time || '';
        document.getElementById('status').value = (item.status || 'draft').toLowerCase();
        document.getElementById('category').value = (item.category || 'umum').toLowerCase();

        const locationSelect = document.getElementById('location_id');
        locationSelect.value = item.location_id ? String(item.location_id) : '';

        const posterInput = document.getElementById('poster');
        posterInput.value = '';

        let posterNotice = document.getElementById('poster-notice');
        if (!posterNotice) {
          posterNotice = document.createElement('small');
          posterNotice.id = 'poster-notice';
          posterNotice.style.color = 'var(--text-light)';
          posterNotice.style.display = 'block';
          posterNotice.style.marginTop = '0.4rem';
          posterInput.parentNode.appendChild(posterNotice);
        }

        if (item.image_path) {
          posterNotice.innerHTML = `Poster saat ini sudah ada. Biarkan kosong jika tidak ingin mengubahnya. 
            (<a href="${item.image_path}" target="_blank">Lihat Poster</a>)`;
        } else {
          posterNotice.innerText = 'Belum ada poster yang diunggah.';
        }

        document.getElementById('modal-title').innerText = 'Edit Pengumuman';
        document.getElementById('announcement-modal').style.display = 'flex';
      }
    }
  } catch (err) {
    console.error('Gagal mengambil data untuk diedit:', err);
    alert('Gagal memuat data pengumuman.');
  }
}

async function deleteItem(id) {
  if (!confirm('Apakah Anda yakin ingin menghapus pengumuman ini?')) return;

  try {
    const res = await fetch(`/api/announcements/admin/${id}`, {
      method: 'DELETE'
    });
    const result = await res.json();

    if (result.success) {
      loadAdminAnnouncements();
      loadAdminStats();
    } else {
      alert(result.message || 'Gagal menghapus.');
    }
  } catch (err) {
    console.error(err);
    alert('Terjadi kesalahan pada server.');
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