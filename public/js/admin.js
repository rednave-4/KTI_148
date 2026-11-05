document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadLocationsDropdown();
  loadAdminAnnouncements();

  const modal = document.getElementById('announcement-modal');
  document.getElementById('open-modal-btn').addEventListener('click', () => {
    document.getElementById('modal-title').innerText = 'Tambah Pengumuman Baru';
    document.getElementById('announcement-form').reset();
    document.getElementById('announcement-id').value = '';
    modal.style.display = 'flex';
  });

  document.getElementById('close-modal-btn').addEventListener('click', () => {
    modal.style.display = 'none';
  });

  document.getElementById('logout-btn').addEventListener('click', async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    window.location.href = '/admin/login.html';
  });

  document.getElementById('announcement-form').addEventListener('submit', handleFormSubmit);
});

async function checkAuth() {
  const res = await fetch('/api/admin/auth/me');
  const data = await res.json();
  if (!data.loggedIn) {
    window.location.href = '/admin/login.html';
  }
}

// Pastikan fungsi loadLocationsDropdown berbentuk seperti ini:
async function loadLocationsDropdown() {
  try {
    const res = await fetch('/api/locations');
    const result = await res.json();
    const selectEl = document.getElementById('location_id');
    
    // Kosongkan dulu agar tidak duplikat
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

async function loadAdminAnnouncements() {
  const tbody = document.getElementById('admin-tbody');
  try {
    const res = await fetch('/api/admin/announcements');
    const result = await res.json();

    if (result.success && result.data.length > 0) {
      tbody.innerHTML = '';
      result.data.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${escapeHtml(item.title)}</strong><br><small style="color:var(--text-light)">Oleh: ${item.author_name}</small></td>
          <td>${item.event_date.split('T')[0]}</td>
          <td>${item.location_name || '-'}</td>
          <td><span style="padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; background: ${item.status === 'PUBLISHED' ? '#dcfce7; color:#166534' : '#fef9c3; color:#854d0e'}">${item.status}</span></td>
          <td>
            <button onclick="editItem(${item.announcement_id})" class="btn" style="padding: 0.3rem 0.6rem; font-size: 0.75rem; margin-right: 0.3rem;">Edit</button>
            <button onclick="deleteItem(${item.announcement_id})" class="btn btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.75rem; background: #fee2e2; color: #991b1b;">Hapus</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } else {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Belum ada data pengumuman.</td></tr>';
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Gagal memuat data.</td></tr>';
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
  formData.append('end_time', document.getElementById('end_time').value);
  formData.append('location_id', document.getElementById('location_id').value);
  formData.append('status', document.getElementById('status').value);
  
  const posterFile = document.getElementById('poster').files[0];
  if (posterFile) {
    formData.append('poster', posterFile);
  }

  const url = id ? `/api/admin/announcements/${id}` : '/api/admin/announcements';
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, { method, body: formData });
    const result = await res.json();
    if (result.success) {
      document.getElementById('announcement-modal').style.display = 'none';
      loadAdminAnnouncements();
    } else {
      alert(result.message || 'Gagal menyimpan data.');
    }
  } catch (err) {
    alert('Terjadi kesalahan pada server.');
  }
}

async function editItem(id) {
  try {
    // 1. Tunggu sampai dropdown lokasi benar-benar selesai dimuat
    await loadLocationsDropdown();

    const res = await fetch(`/api/admin/announcements`);
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
        document.getElementById('status').value = item.status ? item.status.toUpperCase() : 'DRAFT';

        // 2. Set nilai lokasi setelah dropdown dipastikan terisi
        const locationSelect = document.getElementById('location_id');
        if (item.location_id) {
          locationSelect.value = String(item.location_id);
        } else {
          locationSelect.value = "";
        }

        // Penanganan Poster
        const posterInput = document.getElementById('poster');
        posterInput.value = '';
        let posterNotice = document.getElementById('poster-notice');
        if (!posterNotice) {
          posterNotice = document.createElement('small');
          posterNotice.id = 'poster-notice';
          posterNotice.style.color = 'var(--text-light)';
          posterInput.parentNode.appendChild(posterNotice);
        }
        
        if (item.image_path) {
          posterNotice.innerHTML = `⚠️ Poster saat ini sudah ada. Biarkan kosong jika tidak ingin mengubahnya. (<a href="${item.image_path}" target="_blank">Lihat Poster</a>)`;
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
    const res = await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE' });
    const result = await res.json();
    if (result.success) {
      loadAdminAnnouncements();
    } else {
      alert(result.message || 'Gagal menghapus.');
    }
  } catch (err) {
    alert('Terjadi kesalahan pada server.');
  }
}

function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}