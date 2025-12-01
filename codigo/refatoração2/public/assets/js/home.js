
const DOM_SELECTORS = {
  SIDEBAR: '.sidebar',
  TOGGLE_SIDEBAR_BTN: '#toggleSidebar',
  SLIDER: '#custo',
  SLIDER_VALUE: '#custo-value',
  BAIRRO_FILTER: '#bairro',
  CONSTRUTORA_FILTER: '#construtora',
  STATUS_FILTER: '#status',
  NOME_FILTER: '#nome',
  CLEAR_FILTERS_BTN: '#clearFilters',
  OBRAS_GRID: '#obrasGrid',
  USER_DROPDOWN_TOGGLE: '#userDropdownToggle',
  USER_DROPDOWN: '#userDropdown',
  USER_NAME_SPAN: '.user span',
  LOGOUT_BTN: '#logoutBtn',
  TOGGLE_FONT_BTN: '#toggleFont',
  MAPS_BOX: '.maps-box',
  MAP_CONTAINER: '#map',
  DETALHES_BTN_CLASS: '.detalhesBtn',
};

const PATHS_AND_CONSTANTS = {
  API: 'http://localhost:3000/obras',
  IMG_PLACEHOLDER_PATH: 'assets/images/Logo2.png',
  LOGIN_REDIRECT_PATH: '/public/login.html', 
  LOCAL_STORAGE_USER_KEY: 'obraPrimaUser',
  LOCAL_STORAGE_FONT_KEY: 'fontLarge',
};

const $ = (selector) => document.querySelector(selector);
const $id = (id) => document.getElementById(id.substring(1));

const sidebar = $(DOM_SELECTORS.SIDEBAR);
const toggleSidebarBtn = $id(DOM_SELECTORS.TOGGLE_SIDEBAR_BTN);
const slider = $id(DOM_SELECTORS.SLIDER);
const sliderValue = $id(DOM_SELECTORS.SLIDER_VALUE);
const bairroFilter = $id(DOM_SELECTORS.BAIRRO_FILTER);
const construtoraFilter = $id(DOM_SELECTORS.CONSTRUTORA_FILTER);
const statusFilter = $id(DOM_SELECTORS.STATUS_FILTER);
const nomeFilter = $id(DOM_SELECTORS.NOME_FILTER);
const clearFiltersBtn = $id(DOM_SELECTORS.CLEAR_FILTERS_BTN);
const obrasGrid = $id(DOM_SELECTORS.OBRAS_GRID);
const userDropdownToggle = $id(DOM_SELECTORS.USER_DROPDOWN_TOGGLE);
const userDropdown = $id(DOM_SELECTORS.USER_DROPDOWN);
const userNameSpan = $(DOM_SELECTORS.USER_NAME_SPAN);
const logoutBtn = $id(DOM_SELECTORS.LOGOUT_BTN);
const toggleFontBtn = $id(DOM_SELECTORS.TOGGLE_FONT_BTN);
const mapsBox = $(DOM_SELECTORS.MAPS_BOX);
const mapContainer = $id(DOM_SELECTORS.MAP_CONTAINER);

let obrasData = [];
let allBairros = [];
let allConstrutoras = [];
let allStatus = [];
let mapInstance = null;
let markersLayer = null;

const formatCurrency = (value) => 'R$ ' + Number(value).toLocaleString('pt-BR');
const normalize = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase() : '';

// === TOGGLE SIDEBAR ===
toggleSidebarBtn?.addEventListener('click', () => {
  if (window.innerWidth <= 768) sidebar?.classList.toggle('open');
  else sidebar?.classList.toggle('closed');
});

// === SLIDER ===
if (slider && sliderValue) {
    slider.value = slider.max;
    sliderValue.textContent = formatCurrency(slider.value);
    slider.addEventListener('input', () => {
      sliderValue.textContent = formatCurrency(slider.value);
      filterObras();
    });
}

// === POPULAR SELECTS ===
function populateSelect(selectId, items) {
  const select = $id(selectId);
  if (!select) return;
  select.innerHTML = '<option value="Todas">Todas</option>';
  Array.from(new Set(items.filter(Boolean))).sort().forEach(item => {
    const option = document.createElement('option');
    option.value = item;
    option.textContent = item;
    select.appendChild(option);
  });
}

// === FILTRAR OBRAS ===
function filterObras() {
  const nome = normalize(nomeFilter?.value || '');
  const bairro = normalize(bairroFilter?.value !== 'Todas' ? bairroFilter.value : '');
  const construtora = normalize(construtoraFilter?.value !== 'Todas' ? construtoraFilter.value : '');
  const status = normalize(statusFilter?.value !== 'Todas' ? statusFilter.value : '');
  const custoMax = parseInt(slider?.value || slider?.max || 0);

  const filtered = obrasData.filter(obra => {
    const obraNome = normalize(obra.titulo);
    const obraBairro = normalize(obra.endereco?.bairro);
    const obraConstrutora = normalize(obra.empresaExecutora);
    const obraStatus = normalize(obra.status);
    const obraValor = obra.valorContratado ?? 0;

    return (
      (nome === '' || obraNome.includes(nome)) &&
      (bairro === '' || obraBairro.includes(bairro)) &&
      (construtora === '' || obraConstrutora.includes(construtora)) &&
      (status === '' || obraStatus.includes(status)) &&
      obraValor <= custoMax
    );
  });

  updateView(filtered);
}

// === ATUALIZA GRID OU MAPA ===
function updateView(obras) {
  const isMapVisible = mapContainer && mapContainer.style.display === 'block';
  if (isMapVisible) renderMap(obras);
  else renderGrid(obras);
}

// === GRID - RESOLVE IMAGEM ===
function resolveImageUrl(rawUrl) {
  const placeholder = PATHS_AND_CONSTANTS.IMG_PLACEHOLDER_PATH;

  if (!rawUrl || typeof rawUrl !== "string" || rawUrl.trim() === "") {
    return placeholder;
  }

  const cleanUrl = rawUrl.trim();

  try {
    // Se for URL externa ou localhost: mantém
    if (
      cleanUrl.startsWith("http://") ||
      cleanUrl.startsWith("https://") ||
      cleanUrl.startsWith("http://localhost")
    ) {
      return cleanUrl;
    }

    // Se for caminho local → força assets/images/<arquivo>
    const fileName = cleanUrl.split("/").pop();
    if (!fileName) return placeholder;
    
    // AQUI USAMOS O CAMINHO CORRETO RELATIVO AO HTML (public/)
    return `assets/images/${fileName}`; 

  } catch (e) {
    return placeholder;
  }
}

// === GRID ===
function renderGrid(obras) {
  if (!obrasGrid) return;

  obrasGrid.innerHTML = '';
  if (!obras.length) {
    obrasGrid.innerHTML = '<p>Nenhuma obra encontrada.</p>';
    return;
  }

  const placeholderImg = PATHS_AND_CONSTANTS.IMG_PLACEHOLDER_PATH;

  obras.forEach(obra => {
    const card = document.createElement('div');
    card.classList.add('card');

    const imgSrc = Array.isArray(obra.anexos)
      ? resolveImageUrl(obra.anexos.find(a => a.tipo === "imagem")?.url)
      : placeholderImg;

    card.innerHTML = `
      <img src="${imgSrc}" alt="obra" onerror="this.onerror=null; this.src='${placeholderImg}'">
      <h3>${obra.titulo}</h3>
      <button class="detalhesBtn">Ver detalhes</button>
    `;

    obrasGrid.appendChild(card);

    const detalhesBtn = card.querySelector(DOM_SELECTORS.DETALHES_BTN_CLASS);
    detalhesBtn?.addEventListener('click', () => showDetalhesSidebar(obra));
  });
}

// === MAPA ===
function renderMap(obras) {
  if (!mapContainer) return;
  
  // L.map é um objeto global (Leaflet) que deve ser carregado.
  if (typeof L === 'undefined') {
     console.error('Leaflet (L) não está carregado. O mapa não pode ser renderizado.');
     return;
  }
  
  if (!mapInstance) {
    mapInstance = L.map('map').setView([-19.9245, -43.935], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapInstance);
    markersLayer = L.layerGroup().addTo(mapInstance);
  }

  markersLayer?.clearLayers();

  obras.forEach(obra => {
    const lat = parseFloat(obra.latitude || obra.endereco?.lat);
    const lng = parseFloat(obra.longitude || obra.endereco?.lng);

    if (!isNaN(lat) && !isNaN(lng)) {
      const marker = L.marker([lat, lng]);
      marker.bindPopup(`
        <b>${obra.titulo}</b><br>
        ${obra.endereco?.bairro || ''}, ${obra.endereco?.cidade || ''}<br>
        <small>${obra.status}</small>
      `);
      markersLayer?.addLayer(marker);
    }
  });

  const markerList = markersLayer?.getLayers ? markersLayer.getLayers() : [];
  if (markerList.length > 0 && mapInstance && markersLayer?.getBounds) {
    mapInstance.fitBounds(markersLayer.getBounds());
  }
}

// === LIMPAR FILTROS ===
clearFiltersBtn?.addEventListener('click', () => {
  if (nomeFilter) nomeFilter.value = '';
  if (bairroFilter) bairroFilter.value = 'Todas';
  if (construtoraFilter) construtoraFilter.value = 'Todas';
  if (statusFilter) statusFilter.value = 'Todas';
  
  if (slider && sliderValue) {
      slider.value = slider.max;
      sliderValue.textContent = formatCurrency(slider.value);
  }
  updateView(obrasData);
});

// === EVENTOS DE FILTRO ===
nomeFilter?.addEventListener('input', filterObras);
[bairroFilter, construtoraFilter, statusFilter].forEach(select => select?.addEventListener('change', filterObras));

// === INIT ===
async function init() {
  try {
    const res = await fetch(PATHS_AND_CONSTANTS.API);
    if (!res.ok) throw new Error('Erro na API');
    const data = await res.json();

    obrasData = Array.isArray(data) ? data : [];
    allBairros = obrasData.map(o => o.endereco?.bairro || '');
    allConstrutoras = obrasData.map(o => o.empresaExecutora || '');
    allStatus = obrasData.map(o => o.status || '');

    // Usando os IDs da constante para popular os selects
    populateSelect(DOM_SELECTORS.BAIRRO_FILTER, allBairros);
    populateSelect(DOM_SELECTORS.CONSTRUTORA_FILTER, allConstrutoras);
    populateSelect(DOM_SELECTORS.STATUS_FILTER, allStatus);

    updateView(obrasData);
  } catch (err) {
    console.error('Erro ao carregar obras:', err);
  }
}

init();

// =================================================================
// 🔒 SESSÃO E ACESSIBILIDADE
// =================================================================

// === ACESSIBILIDADE ===
userDropdownToggle?.addEventListener('click', (e) => {
  e.stopPropagation();
  if (userDropdown) {
      userDropdown.style.display = userDropdown.style.display === 'flex' ? 'none' : 'flex';
  }
});

document.addEventListener('click', () => {
    if (userDropdown) userDropdown.style.display = 'none';
});

if (localStorage.getItem(PATHS_AND_CONSTANTS.LOCAL_STORAGE_FONT_KEY) === 'true') document.body.classList.add('font-large');
toggleFontBtn?.addEventListener('click', () => {
  const isLarge = document.body.classList.toggle('font-large');
  localStorage.setItem(PATHS_AND_CONSTANTS.LOCAL_STORAGE_FONT_KEY, isLarge);
});

// === SESSÃO E LOGOUT ===
function redirectToLogin() {
  window.location.href = PATHS_AND_CONSTANTS.LOGIN_REDIRECT_PATH;
}

function loadUserFromSession() {
  try {
    const stored = localStorage.getItem(PATHS_AND_CONSTANTS.LOCAL_STORAGE_USER_KEY);
    if (!stored) {
      redirectToLogin();
      return;
    }
    const user = JSON.parse(stored);
    if (!user || !user.nome) {
      redirectToLogin();
      return;
    }
    if (userNameSpan) {
      userNameSpan.textContent = user.nome;
    }
  } catch (error) {
    console.error('Falha ao carregar sessão:', error);
    redirectToLogin();
  }
}

function handleLogout() {
  localStorage.removeItem(PATHS_AND_CONSTANTS.LOCAL_STORAGE_USER_KEY);
  redirectToLogin();
}

loadUserFromSession();

logoutBtn?.addEventListener('click', handleLogout);


// === TROCAR ENTRE GRID E MAPA ===
mapsBox?.addEventListener('click', () => {
  if (!mapContainer || !obrasGrid) return;
  
  const isMapVisible = mapContainer.style.display === 'block';
  mapContainer.style.display = isMapVisible ? 'none' : 'block';
  obrasGrid.style.display = isMapVisible ? 'grid' : 'none';

  updateView(obrasData);

  if (!isMapVisible && mapInstance) {
    // Força o Leaflet a recalcular o tamanho, corrigindo possíveis problemas de visualização
    setTimeout(() => mapInstance.invalidateSize(), 200);
  }
});