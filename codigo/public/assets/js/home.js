// =================================================================
// 🧱 CONFIGURAÇÃO DE CAMINHOS, SELECTORS E CONSTANTES
// =================================================================

/**
 * Mapeamento dos IDs/Classes de elementos do DOM.
 * Centraliza os 'caminhos' para encontrar os elementos na página.
 */
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

/**
 * Constantes para URLs de API, caminhos de arquivos e chaves de armazenamento local.
 * Centraliza valores que podem mudar em diferentes ambientes ou refatorações.
 */
const PATHS_AND_CONSTANTS = {
  API: 'http://localhost:3000/obras',
  IMG_PLACEHOLDER_PATH: '../assets/images/Logo2.png',
  LOGIN_REDIRECT_PATH: '..',
  LOCAL_STORAGE_USER_KEY: 'obraPrimaUser',
  LOCAL_STORAGE_FONT_KEY: 'fontLarge',
};

// =================================================================
// 🔍 REFERÊNCIAS DO DOM (Obtidas a partir dos SELECTORS)
// =================================================================

const sidebar = document.querySelector(DOM_SELECTORS.SIDEBAR);
const toggleSidebarBtn = document.getElementById(DOM_SELECTORS.TOGGLE_SIDEBAR_BTN.substring(1));
const slider = document.getElementById(DOM_SELECTORS.SLIDER.substring(1));
const sliderValue = document.getElementById(DOM_SELECTORS.SLIDER_VALUE.substring(1));
const bairroFilter = document.getElementById(DOM_SELECTORS.BAIRRO_FILTER.substring(1));
const construtoraFilter = document.getElementById(DOM_SELECTORS.CONSTRUTORA_FILTER.substring(1));
const statusFilter = document.getElementById(DOM_SELECTORS.STATUS_FILTER.substring(1));
const nomeFilter = document.getElementById(DOM_SELECTORS.NOME_FILTER.substring(1));
const clearFiltersBtn = document.getElementById(DOM_SELECTORS.CLEAR_FILTERS_BTN.substring(1));
const obrasGrid = document.getElementById(DOM_SELECTORS.OBRAS_GRID.substring(1));
const userDropdownToggle = document.getElementById(DOM_SELECTORS.USER_DROPDOWN_TOGGLE.substring(1));
const userDropdown = document.getElementById(DOM_SELECTORS.USER_DROPDOWN.substring(1));
const userNameSpan = document.querySelector(DOM_SELECTORS.USER_NAME_SPAN);
const logoutBtn = document.getElementById(DOM_SELECTORS.LOGOUT_BTN.substring(1));
const toggleFontBtn = document.getElementById(DOM_SELECTORS.TOGGLE_FONT_BTN.substring(1));
const mapsBox = document.querySelector(DOM_SELECTORS.MAPS_BOX);
const mapContainer = document.getElementById(DOM_SELECTORS.MAP_CONTAINER.substring(1));

// =================================================================
// ⚙️ VARIÁVEIS DE ESTADO E FUNÇÕES AUXILIARES
// =================================================================

let obrasData = [];
let allBairros = [];
let allConstrutoras = [];
let allStatus = [];
let mapInstance = null;
let markersLayer = null;

const formatCurrency = (value) => 'R$ ' + Number(value).toLocaleString('pt-BR');
const normalize = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase() : '';

// =================================================================
// 🔄 FUNCIONALIDADES
// =================================================================

// === TOGGLE SIDEBAR ===
toggleSidebarBtn.addEventListener('click', () => {
  if (window.innerWidth <= 768) sidebar.classList.toggle('open');
  else sidebar.classList.toggle('closed');
});

// === SLIDER ===
slider.value = slider.max;
sliderValue.textContent = formatCurrency(slider.value);
slider.addEventListener('input', () => {
  sliderValue.textContent = formatCurrency(slider.value);
  filterObras();
});

// === POPULAR SELECTS ===
function populateSelect(selectId, items) {
  // Nota: Usamos getElementById pois 'selectId' ainda é a string de ID,
  // mas o ideal seria passar o próprio elemento ou usar DOM_SELECTORS.
  const select = document.getElementById(selectId);
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
  const nome = normalize(nomeFilter.value);
  const bairro = normalize(bairroFilter.value !== 'Todas' ? bairroFilter.value : '');
  const construtora = normalize(construtoraFilter.value !== 'Todas' ? construtoraFilter.value : '');
  const status = normalize(statusFilter.value !== 'Todas' ? statusFilter.value : '');
  const custoMax = parseInt(slider.value);

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
  const isMapVisible = mapContainer.style.display === 'block';
  if (isMapVisible) renderMap(obras);
  else renderGrid(obras);
}

// === GRID - RESOLVE IMAGEM ===
function resolveImageUrl(rawUrl) {
  const placeholder = PATHS_AND_CONSTANTS.IMG_PLACEHOLDER_PATH;

  // Nada enviado / valor inválido
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

    // Se for caminho local → força ../img/<arquivo>
    const fileName = cleanUrl.split("/").pop();
    if (!fileName) return placeholder;

    return `../img/${fileName}`; // Mantém o padrão do seu código original para caminhos locais.

  } catch (e) {
    return placeholder;
  }
}

// === GRID ===
function renderGrid(obras) {
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
    detalhesBtn.addEventListener('click', () => showDetalhesSidebar(obra));
  });
}

// === MAPA ===
function renderMap(obras) {
  if (!mapInstance) {
    mapInstance = L.map('map').setView([-19.9245, -43.935], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapInstance);
    markersLayer = L.layerGroup().addTo(mapInstance);
  }

  markersLayer.clearLayers();

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
      markersLayer.addLayer(marker);
    }
  });

  const markerList = markersLayer.getLayers ? markersLayer.getLayers() : [];
  if (markerList.length > 0 && mapInstance && markersLayer.getBounds) {
    mapInstance.fitBounds(markersLayer.getBounds());
  }
}

// === LIMPAR FILTROS ===
clearFiltersBtn.addEventListener('click', () => {
  nomeFilter.value = '';
  bairroFilter.value = 'Todas';
  construtoraFilter.value = 'Todas';
  statusFilter.value = 'Todas';
  slider.value = slider.max;
  sliderValue.textContent = formatCurrency(slider.value);
  updateView(obrasData);
});

// === EVENTOS DE FILTRO ===
nomeFilter.addEventListener('input', filterObras);
[bairroFilter, construtoraFilter, statusFilter].forEach(select => select.addEventListener('change', filterObras));

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

    // Note que aqui ainda usamos as strings de ID para a função populateSelect
    populateSelect(DOM_SELECTORS.BAIRRO_FILTER.substring(1), allBairros);
    populateSelect(DOM_SELECTORS.CONSTRUTORA_FILTER.substring(1), allConstrutoras);
    populateSelect(DOM_SELECTORS.STATUS_FILTER.substring(1), allStatus);

    updateView(obrasData);
  } catch (err) {
    console.error('Erro ao carregar obras:', err);
  }
}

init();

// === ACESSIBILIDADE ===
userDropdownToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  userDropdown.style.display = userDropdown.style.display === 'flex' ? 'none' : 'flex';
});

document.addEventListener('click', () => userDropdown.style.display = 'none');

if (localStorage.getItem(PATHS_AND_CONSTANTS.LOCAL_STORAGE_FONT_KEY) === 'true') document.body.classList.add('font-large');
toggleFontBtn.addEventListener('click', () => {
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

if (logoutBtn) {
  logoutBtn.addEventListener('click', handleLogout);
}

// === TROCAR ENTRE GRID E MAPA ===
mapsBox.addEventListener('click', () => {
  const isMapVisible = mapContainer.style.display === 'block';
  mapContainer.style.display = isMapVisible ? 'none' : 'block';
  obrasGrid.style.display = isMapVisible ? 'grid' : 'none';

  updateView(obrasData);

  if (!isMapVisible && mapInstance) {
    // Redesenha o mapa para garantir que ele seja exibido corretamente no novo layout
    setTimeout(() => mapInstance.invalidateSize(), 200);
  }
});