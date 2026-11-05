document.addEventListener('DOMContentLoaded', () => {
  initMapSystem();
});

let currentActiveElement = null;
let locationsMap = new Map(); // Cache mapping svg_element_id -> location data

async function initMapSystem() {
  const mapSelect = document.getElementById('map-select');
  const searchInput = document.getElementById('map-search-input');

  // Load awal denah berdasarkan opsi pertama
  const initialSvgPath = mapSelect.options[mapSelect.selectedIndex].getAttribute('data-svg');
  await loadSvgMap(initialSvgPath);

  // Listener Perubahan Dropdown Peta
  mapSelect.addEventListener('change', async (e) => {
    const svgPath = e.target.options[e.target.selectedIndex].getAttribute('data-svg');
    await loadSvgMap(svgPath);
  });

  // Setup Live Search Listener
  setupSearch(searchInput);

  // Periksa apakah ada parameter location_id dari URL (contoh: dari pengumuman)
  const urlParams = new URLSearchParams(window.location.search);
  const targetLocationId = urlParams.get('location_id');
  if (targetLocationId) {
    navigateToLocationId(targetLocationId);
  }
}

/**
 * Memuat file SVG secara asinkron menggunakan fetch() dan menyuntikkannya ke DOM
 */
async function loadSvgMap(svgPath) {
  const container = document.getElementById('svg-container');
  container.innerHTML = '<p style="color: var(--text-light);">Memuat denah...</p>';

  try {
    const response = await fetch(svgPath);
    if (!response.ok) throw new Error('File SVG tidak ditemukan.');

    const svgContent = await response.text();
    container.innerHTML = svgContent;

    // Bersihkan rujukan aktif sebelumnya
    currentActiveElement = null;

    // Pasang listener interaksi & binding data pada elemen SVG
    await bindSvgElements();
  } catch (error) {
    console.error('Gagal memuat peta SVG:', error);
    container.innerHTML = `
      <div style="text-align: center; color: #dc2626;">
        <p>⚠️ Denah SVG belum tersedia untuk tampilan ini.</p>
        <small style="color: var(--text-light);">Pastikan file file SVG tersimpan di folder public${svgPath}</small>
      </div>
    `;
  }
}

/**
 * Mengambil data lokasi dari API & memasang Event Listener pada elemen SVG
 */
async function bindSvgElements() {
  try {
    const response = await fetch('/api/locations');
    const result = await response.json();

    if (!result.success) return;

    // Ambil semua elemen berbentuk rect, path, polygon, g di dalam SVG yang memiliki atribut id
    const svgElements = document.querySelectorAll('#svg-container svg [id]');

    svgElements.forEach(el => {
      const elementId = el.getAttribute('id');
      
      // Berikan class CSS interaktif
      el.classList.add('map-location');

      // Pasang Event Listener Klik
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        highlightSvgElement(el);
        fetchLocationDetailBySvgId(elementId);
      });
    });
  } catch (err) {
    console.error('Gagal binding elemen SVG:', err);
  }
}

/**
 * Memberikan class active untuk highlighter visual warna kuning/biru pada SVG
 */
function highlightSvgElement(el) {
  if (currentActiveElement) {
    currentActiveElement.classList.remove('active');
  }

  if (el) {
    el.classList.add('active');
    currentActiveElement = el;

    // Auto-scroll ke elemen yang disorot jika keluar dari viewport
    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
  }
}

/**
 * Mengambil informasi lokasi berdasarkan ID elemen SVG dari API pencarian/navigasi
 */
async function fetchLocationDetailBySvgId(svgElementId) {
  const typeBadge = document.getElementById('info-type');
  const titleEl = document.getElementById('info-title');
  const descEl = document.getElementById('info-description');
  const extraEl = document.getElementById('info-extra');

  try {
    const response = await fetch(`/api/locations/search?q=${encodeURIComponent(svgElementId)}`);
    const result = await response.json();

    if (result.success && result.data.length > 0) {
      const loc = result.data[0];
      typeBadge.innerText = loc.location_type || 'RUANGAN';
      titleEl.innerText = loc.name;
      descEl.innerText = loc.description || 'Tidak ada deskripsi tambahan.';
      
      extraEl.innerHTML = loc.parent_name ? `<p style="font-size: 0.85rem; color: var(--text-light);"><strong>Gedung/Area:</strong> ${escapeHtml(loc.parent_name)}</p>` : '';
    } else {
      typeBadge.innerText = 'LOKASI';
      titleEl.innerText = svgElementId.replace(/^room-|^bldg-/, '').replace(/-/g, ' ').toUpperCase();
      descEl.innerText = 'Detail informasi lokasi ini belum terdaftar di database MySQL.';
      extraEl.innerHTML = '';
    }
  } catch (err) {
    console.error('Gagal mengambil data detail lokasi:', err);
  }
}

/**
 * Menangani Pencarian Real-Time pada Search Input
 */
function setupSearch(searchInput) {
  const dropdown = document.getElementById('search-results');
  let debounceTimeout = null;

  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimeout);
    const query = e.target.value.trim();

    if (query.length < 2) {
      dropdown.style.display = 'none';
      return;
    }

    debounceTimeout = setTimeout(async () => {
      try {
        const response = await fetch(`/api/locations/search?q=${encodeURIComponent(query)}`);
        const result = await response.json();

        if (result.success && result.data.length > 0) {
          dropdown.innerHTML = '';
          result.data.forEach(item => {
            const div = document.createElement('div');
            div.className = 'search-result-item';
            div.innerHTML = `
              <strong>${escapeHtml(item.name)}</strong>
              <small>${item.location_type} ${item.parent_name ? '• ' + escapeHtml(item.parent_name) : ''}</small>
            `;
            div.addEventListener('click', () => {
              dropdown.style.display = 'none';
              searchInput.value = item.name;
              navigateToLocationItem(item);
            });
            dropdown.appendChild(div);
          });
          dropdown.style.display = 'block';
        } else {
          dropdown.innerHTML = '<div class="search-result-item" style="color: var(--text-light);">Lokasi tidak ditemukan</div>';
          dropdown.style.display = 'block';
        }
      } catch (err) {
        console.error('Error saat melakukan pencarian:', err);
      }
    }, 300);
  });

  // Sembunyikan dropdown ketika mengeklik di luar kolom pencarian
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  });
}

/**
 * Melompat ke lokasi tertentu setelah dipilih dari hasil pencarian
 */
async function navigateToLocationItem(item) {
  if (item.svg_path) {
    const mapSelect = document.getElementById('map-select');
    // Cocokkan Opsi Dropdown Peta jika peta belum terbuka
    for (let i = 0; i < mapSelect.options.length; i++) {
      if (mapSelect.options[i].getAttribute('data-svg') === item.svg_path) {
        mapSelect.selectedIndex = i;
        await loadSvgMap(item.svg_path);
        break;
      }
    }
  }

  if (item.svg_element_id) {
    const el = document.getElementById(item.svg_element_id);
    if (el) {
      highlightSvgElement(el);
    }
  }

  // Tampilkan Informasi
  document.getElementById('info-type').innerText = item.location_type || 'RUANGAN';
  document.getElementById('info-title').innerText = item.name;
  document.getElementById('info-description').innerText = item.description || 'Tidak ada deskripsi tambahan.';
  document.getElementById('info-extra').innerHTML = item.parent_name ? `<p style="font-size: 0.85rem; color: var(--text-light);"><strong>Gedung/Area:</strong> ${escapeHtml(item.parent_name)}</p>` : '';
}

/**
 * Melakukan navigasi otomatis jika URL membawa query string ?location_id=X
 */
async function navigateToLocationId(locationId) {
  try {
    const response = await fetch(`/api/locations/${locationId}/navigation`);
    const result = await response.json();

    if (result.success && result.map_info) {
      const mapInfo = result.map_info;
      const loc = result.location;

      // Navigasikan ke pencarian lokasi yang relevan
      navigateToLocationItem({
        name: loc.name,
        location_type: loc.location_type,
        description: loc.description,
        svg_path: mapInfo.svg_path,
        svg_element_id: mapInfo.svg_element_id
      });
    }
  } catch (err) {
    console.error('Gagal melakukan navigasi otomatis dari URL:', err);
  }
}

function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}