document.addEventListener('DOMContentLoaded', () => {
  initMapSystem();
});

let currentActiveElement = null;

let mapScale = 1;
let mapX = 0;
let mapY = 0;
let isPanning = false;
let startX = 0;
let startY = 0;

function getSvgContainer() {
  return document.getElementById('svg-container');
}

function getViewport() {
  return document.getElementById('map-viewport') || document.querySelector('.svg-viewport') || getSvgContainer()?.parentElement;
}

function applyMapTransform() {
  const el = getSvgContainer();
  if (!el) return;
  el.style.transform = `translate(${mapX}px, ${mapY}px) scale(${mapScale})`;
}

function zoomBy(delta, centerX, centerY) {
  const prev = mapScale;
  mapScale = Math.min(4, Math.max(0.5, mapScale + delta));

  if (centerX != null && centerY != null) {
    const ratio = mapScale / prev;
    mapX = centerX - (centerX - mapX) * ratio;
    mapY = centerY - (centerY - mapY) * ratio;
  }

  applyMapTransform();
}

function resetMapTransform() {
  mapScale = 1;
  mapX = 0;
  mapY = 0;
  applyMapTransform();
}

function setupMapZoom() {
  const viewport = getViewport();
  const container = getSvgContainer();

  const zoomInBtn = document.getElementById('zoom-in') || document.getElementById('zoom-in-btn');
  const zoomOutBtn = document.getElementById('zoom-out') || document.getElementById('zoom-out-btn');
  const zoomResetBtn = document.getElementById('zoom-reset') || document.getElementById('zoom-reset-btn');

  if (zoomInBtn) zoomInBtn.addEventListener('click', () => zoomBy(0.25));
  if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => zoomBy(-0.25));
  if (zoomResetBtn) zoomResetBtn.addEventListener('click', resetMapTransform);

  if (!viewport || !container) return;

  viewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    const rect = viewport.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    zoomBy(e.deltaY < 0 ? 0.15 : -0.15, cx, cy);
  }, { passive: false });

  viewport.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('.map-location')) return;

    isPanning = true;
    startX = e.clientX - mapX;
    startY = e.clientY - mapY;
    viewport.classList.add('is-panning', 'dragging');
    container.classList.add('dragging');
  });

  window.addEventListener('mousemove', (e) => {
    if (!isPanning) return;
    mapX = e.clientX - mapX;
    mapX = e.clientX - startX;
    mapY = e.clientY - startY;
    applyMapTransform();
  });

  window.addEventListener('mouseup', () => {
    if (!isPanning) return;
    isPanning = false;
    viewport.classList.remove('is-panning', 'dragging');
    container.classList.remove('dragging');
  });

  container.addEventListener('touchstart', (e) => {
    if (e.target.closest('.map-location')) return;
    if (e.touches.length !== 1) return;

    isPanning = true;
    startX = e.touches[0].clientX - mapX;
    startY = e.touches[0].clientY - mapY;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!isPanning || e.touches.length !== 1) return;
    mapX = e.touches[0].clientX - startX;
    mapY = e.touches[0].clientY - startY;
    applyMapTransform();
  }, { passive: true });

  window.addEventListener('touchend', () => {
    isPanning = false;
  });
}

async function initMapSystem() {
  const mapSelect = document.getElementById('map-select');
  const searchInput = document.getElementById('map-search-input');

  if (!mapSelect) return;

  const initialSvgPath = mapSelect.options[mapSelect.selectedIndex].getAttribute('data-svg');
  await loadSvgMap(initialSvgPath);

  mapSelect.addEventListener('change', async (e) => {
    const svgPath = e.target.options[e.target.selectedIndex].getAttribute('data-svg');
    await loadSvgMap(svgPath);
  });

  if (searchInput) setupSearch(searchInput);
  setupMapZoom();

  const urlParams = new URLSearchParams(window.location.search);
  const targetLocationId = urlParams.get('location_id');
  if (targetLocationId) {
    navigateToLocationId(targetLocationId);
  }
}

async function loadSvgMap(svgPath) {
  const container = getSvgContainer();
  if (!container) return;

  container.innerHTML = '<p style="color: var(--text-light);">Memuat denah...</p>';

  try {
    const response = await fetch(svgPath);
    if (!response.ok) throw new Error('File SVG tidak ditemukan.');

    const svgContent = await response.text();
    container.innerHTML = svgContent;
    currentActiveElement = null;
    document.querySelectorAll('.map-location-highlight').forEach((n) => n.remove());
    resetMapTransform();
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

function isGenericSvgId(id) {
  if (!id) return true;
  return (
    id.startsWith('path') ||
    id.startsWith('rect') ||
    id.startsWith('layer') ||
    id.startsWith('svg') ||
    id.startsWith('defs') ||
    id.startsWith('clip') ||
    id.startsWith('filter') ||
    id.startsWith('linear') ||
    id.startsWith('stop') ||
    id.startsWith('lpe_') ||
    id.startsWith('text') ||
    id.startsWith('tspan') ||
    id === 'UNIDENTIFIED' ||
    (id.startsWith('g') && id.length <= 5)
  );
}

function findMeaningfulTarget(el) {
  const selector =
    '[id^="Gedung-"], [id^="building-"], [id^="room-"], [id^="Ruang-"], [id^="Ruangan-"], ' +
    '[id^="facility-"], [id^="Lapangan-"], [id^="Masjid-"], [id^="Parkiran-"], [id^="Pos-"], ' +
    '[id^="Wisma-"], [id^="WIsma-"], [id^="Toilet-"], [id^="Tangga-"], [id^="OSN-"], [id^="Unit-"]';

  return el.closest(selector) || el;
}

async function bindSvgElements() {
  try {
    const svgRoot = document.querySelector('#svg-container svg');
    if (!svgRoot) return;

    const allElements = svgRoot.querySelectorAll('[id]');

    allElements.forEach((el) => {
      const elementId = el.getAttribute('id');
      if (isGenericSvgId(elementId)) return;

      el.classList.add('map-location');

      el.addEventListener('click', (e) => {
        e.stopPropagation();

        const meaningful = findMeaningfulTarget(el);
        const id = meaningful.getAttribute('id');
        if (!id || isGenericSvgId(id)) return;

        highlightSvgElement(meaningful);
        fetchLocationDetailBySvgId(id);
      });
    });
  } catch (err) {
    console.error('Gagal binding elemen SVG:', err);
  }
}

function highlightSvgElement(el) {
  document.querySelectorAll('.map-location-highlight').forEach((n) => n.remove());

  if (currentActiveElement) {
    currentActiveElement.classList.remove('active');
  }

  currentActiveElement = el || null;
  if (!el) return;

  el.classList.add('active');

  try {
    const svg = el.ownerSVGElement;
    if (!svg) return;

    const bbox = el.getBBox();
    const ns = 'http://www.w3.org/2000/svg';
    const rect = document.createElementNS(ns, 'rect');

    rect.setAttribute('class', 'map-location-highlight');
    rect.setAttribute('x', String(bbox.x - 6));
    rect.setAttribute('y', String(bbox.y - 6));
    rect.setAttribute('width', String(bbox.width + 12));
    rect.setAttribute('height', String(bbox.height + 12));
    rect.setAttribute('fill', 'none');
    rect.setAttribute('stroke', '#f59e0b');
    rect.setAttribute('stroke-width', '5');
    rect.setAttribute('rx', '6');
    rect.setAttribute('ry', '6');
    rect.setAttribute('pointer-events', 'none');
    rect.style.filter = 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.9))';

    svg.appendChild(rect);
  } catch (err) {
    console.warn('Gagal membuat highlight:', err);
  }
}

async function fetchLocationDetailBySvgId(svgElementId) {
  const typeBadge = document.getElementById('info-type');
  const titleEl = document.getElementById('info-title');
  const descEl = document.getElementById('info-description');
  const extraEl = document.getElementById('info-extra');

  if (!svgElementId) return;

  try {
    // Endpoint yang benar: by-svg
    const response = await fetch(`/api/locations/by-svg/${encodeURIComponent(svgElementId)}`);
    const result = await response.json();

    if (result.success && result.data) {
      const loc = result.data;
      typeBadge.innerText = loc.location_type || 'LOKASI';
      titleEl.innerText = loc.name;
      descEl.innerText = loc.description || 'Tidak ada deskripsi tambahan.';
      renderLocationPhoto(loc.photo_url);

      // Parent: sembunyikan jika hanya nama sekolah
      if (loc.parent_name && loc.parent_name !== 'SMA Negeri 10 Samarinda') {
        extraEl.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-light);"><strong>Bagian dari:</strong> ${escapeHtml(loc.parent_name)}</p>`;
      } else {
        extraEl.innerHTML = '';
      }
    } else {
      typeBadge.innerText = 'LOKASI';
      titleEl.innerText = svgElementId.replace(/-/g, ' ').toUpperCase();
      descEl.innerText = 'Detail informasi lokasi ini belum terdaftar di database.';
      renderLocationPhoto('');
      extraEl.innerHTML = '';
    }
  } catch (err) {
    console.error('Gagal mengambil data detail lokasi:', err);
    typeBadge.innerText = 'LOKASI';
    titleEl.innerText = svgElementId.replace(/-/g, ' ').toUpperCase();
    descEl.innerText = 'Gagal memuat data lokasi dari server.';
    renderLocationPhoto('');
    extraEl.innerHTML = '';
  }
}

function setupSearch(searchInput) {
  const dropdown = document.getElementById('search-results');
  if (!dropdown) return;

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
    if (mapSelect) {
      for (let i = 0; i < mapSelect.options.length; i++) {
        if (mapSelect.options[i].getAttribute('data-svg') === item.svg_path) {
          mapSelect.selectedIndex = i;
          await loadSvgMap(item.svg_path);
          break;
        }
      }
    }
  }

  if (item.svg_element_id) {
    await new Promise((r) => requestAnimationFrame(r));
    let el = document.getElementById(item.svg_element_id);
    if (!el) {
      await new Promise((r) => setTimeout(r, 80));
      el = document.getElementById(item.svg_element_id);
    }
    if (el) highlightSvgElement(el);
  }

  const typeEl = document.getElementById('info-type');
  const titleEl = document.getElementById('info-title');
  const descEl = document.getElementById('info-description');
  const extraEl = document.getElementById('info-extra');

  if (typeEl) typeEl.innerText = item.location_type || 'RUANGAN';
  if (titleEl) titleEl.innerText = item.name || 'Lokasi';
  if (descEl) descEl.innerText = item.description || 'Tidak ada deskripsi tambahan.';
  renderLocationPhoto(item.photo_url);
  if (extraEl) {
    if (item.parent_name && item.parent_name !== 'SMA Negeri 10 Samarinda') {
      extraEl.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-light);"><strong>Bagian dari:</strong> ${escapeHtml(item.parent_name)}</p>`;
    } else {
      extraEl.innerHTML = '';
    }
  }
}

async function navigateToLocationId(locationId) {
  if (!locationId) return;

  try {
    const response = await fetch(`/api/locations/${locationId}/navigation`);
    const result = await response.json();

    if (result.success && result.map_info) {
      const mapInfo = result.map_info;
      const loc = result.location;

      await navigateToLocationItem({
        name: loc.name,
        location_type: loc.location_type,
        description: loc.description,
        photo_url: loc.photo_url,
        parent_name: loc.parent_name || null,
        svg_path: mapInfo.svg_path,
        svg_element_id: mapInfo.svg_element_id
      });
      return;
    }

    const res2 = await fetch(`/api/locations/${locationId}`);
    const result2 = await res2.json();
    if (result2.success && result2.data) {
      const loc = result2.data;
      document.getElementById('info-type').innerText = loc.location_type || 'LOKASI';
      document.getElementById('info-title').innerText = loc.name || 'Lokasi';
      document.getElementById('info-description').innerText =
        loc.description || 'Detail lokasi tersedia, tetapi elemen denah belum dipetakan.';
      renderLocationPhoto(loc.photo_url);
      document.getElementById('info-extra').innerHTML =
        loc.parent_name && loc.parent_name !== 'SMA Negeri 10 Samarinda'
          ? `<p style="font-size: 0.85rem; color: var(--text-light);"><strong>Bagian dari:</strong> ${escapeHtml(loc.parent_name)}</p>`
          : '';
    }
  } catch (err) {
    console.error('Gagal melakukan navigasi otomatis dari URL:', err);
  }
}

function renderLocationPhoto(url) {
  const wrap = document.getElementById('info-photo-wrap');
  const img = document.getElementById('info-photo');
  if (!wrap || !img) return;

  if (url) {
    img.src = url;
    img.alt = 'Foto lokasi';
    wrap.style.display = 'block';
  } else {
    img.removeAttribute('src');
    wrap.style.display = 'none';
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