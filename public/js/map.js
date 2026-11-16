document.addEventListener('DOMContentLoaded', () => {
  initMapSystem();
});

let currentActiveElement = null;

async function initMapSystem() {
  const mapSelect = document.getElementById('map-select');
  const searchInput = document.getElementById('map-search-input');

  const initialSvgPath = mapSelect.options[mapSelect.selectedIndex].getAttribute('data-svg');
  await loadSvgMap(initialSvgPath);

  mapSelect.addEventListener('change', async (e) => {
    const svgPath = e.target.options[e.target.selectedIndex].getAttribute('data-svg');
    await loadSvgMap(svgPath);
  });

  setupSearch(searchInput);
  setupZoomAndPan();

  const urlParams = new URLSearchParams(window.location.search);
  const targetLocationId = urlParams.get('location_id');
  if (targetLocationId) {
    navigateToLocationId(targetLocationId);
  }
}

async function loadSvgMap(svgPath) {
  const container = document.getElementById('svg-container');
  container.innerHTML = '<p style="color: var(--text-light);">Memuat denah...</p>';

  try {
    const response = await fetch(svgPath);
    if (!response.ok) throw new Error('File SVG tidak ditemukan.');

    const svgContent = await response.text();
    container.innerHTML = svgContent;
    resetZoom();
    currentActiveElement = null;
    await bindSvgElements();
  } catch (error) {
    console.error('Gagal memuat peta SVG:', error);
    container.innerHTML = `
      <div style="text-align: center; color: #dc2626;">
        <p>⚠️ Denah SVG belum tersedia untuk tampilan ini.</p>
        <small style="color: var(--text-light);">Pastikan file SVG ada di folder public${svgPath}</small>
      </div>
    `;
  }
}

async function bindSvgElements() {
  try {
    const svgRoot = document.querySelector('#svg-container svg');
    if (!svgRoot) return;

    const allElements = svgRoot.querySelectorAll('[id]');

    allElements.forEach((el) => {
      const elementId = el.getAttribute('id');
      if (!elementId) return;

      // Skip ID generik dari Inkscape
      if (
        elementId.startsWith('path') ||
        elementId.startsWith('rect') ||
        elementId.startsWith('layer') ||
        elementId.startsWith('svg') ||
        elementId.startsWith('defs') ||
        elementId.startsWith('clipPath') ||
        elementId.startsWith('filter') ||
        elementId.startsWith('linearGradient') ||
        elementId.startsWith('stop') ||
        elementId.startsWith('lpe_') ||
        (elementId.startsWith('g') && elementId.length <= 5)
      ) {
        return;
      }

      el.classList.add('map-location');

      el.addEventListener('click', (e) => {
        e.stopPropagation();

        let targetEl = el;

        // Jika yang diklik path anak, naik ke group bermakna
        if (el.tagName.toLowerCase() !== 'g') {
          const parentGroup = el.closest('g[id]');
          if (parentGroup) {
            const parentId = parentGroup.getAttribute('id') || '';
            const isGeneric =
              parentId.startsWith('path') ||
              parentId.startsWith('layer') ||
              (parentId.startsWith('g') && parentId.length <= 5);

            if (parentId && !isGeneric) {
              targetEl = parentGroup;
            }
          }
        }

        const meaningful =
          targetEl.closest('[id^="Gedung-"], [id^="building-"], [id^="room-"], [id^="facility-"], [id^="Lapangan-"], [id^="Masjid-"], [id^="Parkiran-"], [id^="Pos-"], [id^="Wisma-"]') ||
          targetEl;

        highlightSvgElement(meaningful);
        fetchLocationDetailBySvgId(meaningful.getAttribute('id'));
      });
    });
  } catch (err) {
    console.error('Gagal binding elemen SVG:', err);
  }
}

function highlightSvgElement(el) {
  if (currentActiveElement) {
    currentActiveElement.classList.remove('active');
  }

  if (el) {
    el.classList.add('active');
    currentActiveElement = el;
    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
  }
}

async function fetchLocationDetailBySvgId(svgElementId) {
  const typeBadge = document.getElementById('info-type');
  const titleEl = document.getElementById('info-title');
  const descEl = document.getElementById('info-description');
  const extraEl = document.getElementById('info-extra');

  if (!svgElementId) return;

  try {
    const response = await fetch(`/api/locations/search?q=${encodeURIComponent(svgElementId)}`);
    const result = await response.json();

    if (result.success && result.data && result.data.length > 0) {
      let loc = result.data.find((item) => item.svg_element_id === svgElementId);
      if (!loc) loc = result.data[0];

      typeBadge.innerText = loc.location_type || 'LOKASI';
      titleEl.innerText = loc.name;
      descEl.innerText = loc.description || 'Tidak ada deskripsi tambahan.';
      extraEl.innerHTML = loc.parent_name
        ? `<p style="font-size: 0.85rem; color: var(--text-light);"><strong>Gedung/Area:</strong> ${escapeHtml(loc.parent_name)}</p>`
        : '';
    } else {
      typeBadge.innerText = 'LOKASI';
      titleEl.innerText = svgElementId.replace(/-/g, ' ').toUpperCase();
      descEl.innerText = 'Detail informasi lokasi ini belum terdaftar di database.';
      extraEl.innerHTML = '';
    }
  } catch (err) {
    console.error('Gagal mengambil data detail lokasi:', err);
    typeBadge.innerText = 'LOKASI';
    titleEl.innerText = svgElementId.replace(/-/g, ' ').toUpperCase();
    descEl.innerText = 'Gagal memuat data lokasi dari server.';
    extraEl.innerHTML = '';
  }
}

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
          result.data.forEach((item) => {
            const div = document.createElement('div');
            div.className = 'search-result-item';
            div.innerHTML = `
              <strong>${escapeHtml(item.name)}</strong>
              <small>${item.location_type}${item.parent_name ? ' • ' + escapeHtml(item.parent_name) : ''}</small>
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
          dropdown.innerHTML =
            '<div class="search-result-item" style="color: var(--text-light);">Lokasi tidak ditemukan</div>';
          dropdown.style.display = 'block';
        }
      } catch (err) {
        console.error('Error saat melakukan pencarian:', err);
      }
    }, 300);
  });

  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  });
}

async function navigateToLocationItem(item) {
  if (item.svg_path) {
    const mapSelect = document.getElementById('map-select');
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
    if (el) highlightSvgElement(el);
  }

  document.getElementById('info-type').innerText = item.location_type || 'RUANGAN';
  document.getElementById('info-title').innerText = item.name;
  document.getElementById('info-description').innerText =
    item.description || 'Tidak ada deskripsi tambahan.';
  document.getElementById('info-extra').innerHTML = item.parent_name
    ? `<p style="font-size: 0.85rem; color: var(--text-light);"><strong>Gedung/Area:</strong> ${escapeHtml(item.parent_name)}</p>`
    : '';
}

async function navigateToLocationId(locationId) {
  try {
    const response = await fetch(`/api/locations/${locationId}/navigation`);
    const result = await response.json();

    if (result.success && result.map_info) {
      const mapInfo = result.map_info;
      const loc = result.location;

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
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

let currentScale = 1;
let currentX = 0;
let currentY = 0;
let isDragging = false;
let startX = 0;
let startY = 0;

function applyTransform() {
  const container = document.getElementById('svg-container');
  if (!container) return;
  container.style.transform = `translate(${currentX}px, ${currentY}px) scale(${currentScale})`;
}

function zoomIn() {
  currentScale = Math.min(currentScale + 0.2, 4); // max 4x
  applyTransform();
}

function zoomOut() {
  currentScale = Math.max(currentScale - 0.2, 0.5); // min 0.5x
  applyTransform();
}

function resetZoom() {
  currentScale = 1;
  currentX = 0;
  currentY = 0;
  applyTransform();
}

function setupZoomAndPan() {
  const zoomInBtn = document.getElementById('zoom-in-btn');
  const zoomOutBtn = document.getElementById('zoom-out-btn');
  const zoomResetBtn = document.getElementById('zoom-reset-btn');
  const container = document.getElementById('svg-container');
  const viewport = document.querySelector('.svg-viewport');

  if (zoomInBtn) zoomInBtn.addEventListener('click', zoomIn);
  if (zoomOutBtn) zoomOutBtn.addEventListener('click', zoomOut);
  if (zoomResetBtn) zoomResetBtn.addEventListener('click', resetZoom);

  if (!container || !viewport) return;

  // Scroll untuk zoom
  viewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (e.deltaY < 0) zoomIn();
    else zoomOut();
  }, { passive: false });

  // Drag untuk pan
  container.addEventListener('mousedown', (e) => {
    // Jangan drag kalau klik elemen lokasi
    if (e.target.closest('.map-location')) return;

    isDragging = true;
    startX = e.clientX - currentX;
    startY = e.clientY - currentY;
    container.classList.add('dragging');
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    currentX = e.clientX - startX;
    currentY = e.clientY - startY;
    applyTransform();
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
    container.classList.remove('dragging');
  });

  // Support touch (HP)
  container.addEventListener('touchstart', (e) => {
    if (e.target.closest('.map-location')) return;
    if (e.touches.length !== 1) return;

    isDragging = true;
    startX = e.touches[0].clientX - currentX;
    startY = e.touches[0].clientY - currentY;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    currentX = e.touches[0].clientX - startX;
    currentY = e.touches[0].clientY - startY;
    applyTransform();
  }, { passive: true });

  window.addEventListener('touchend', () => {
    isDragging = false;
  });
}