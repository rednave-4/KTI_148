document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('contacts-list');
  if (!container) return;

  try {
    const res = await fetch('/api/contacts');
    const result = await res.json();

    if (!result.success || !result.data.length) {
      container.innerHTML = '<p style="color: var(--text-light);">Belum ada data kontak.</p>';
      return;
    }

    container.innerHTML = result.data.map(item => `
      <div class="card" style="padding: 1.25rem;">
        <h3 style="color: var(--primary); margin-bottom: 0.25rem;">${escapeHtml(item.unit_name)}</h3>
        <p style="color: var(--text-light); font-size: 0.9rem; margin: 0;">${escapeHtml(item.description || '')}</p>
        ${item.phone ? `<p style="margin-top: 0.5rem; font-weight: 600;">📞 ${escapeHtml(item.phone)}</p>` : ''}
        ${item.email ? `<p style="margin-top: 0.25rem;">✉️ ${escapeHtml(item.email)}</p>` : ''}
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = '<p style="color: red;">Gagal memuat data kontak.</p>';
  }
});

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}