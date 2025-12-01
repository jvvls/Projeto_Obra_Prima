const sidebar = document.querySelector('.sidebar');
const toggleSidebarBtn = document.getElementById('toggleSidebar');
const slider = document.getElementById('custo');
const sliderValue = document.getElementById('custo-value');
const bairroFilter = document.getElementById('bairro');
const construtoraFilter = document.getElementById('construtora');
const statusFilter = document.getElementById('status');
const nomeFilter = document.getElementById('nome');
const clearFiltersBtn = document.getElementById('clearFilters');
const obrasGrid = document.getElementById('obrasGrid');
const detalhesBtn = document.querySelector('.detalhes');
const API = "http://localhost:3000/obras";
const userDropdownToggle = document.getElementById('userDropdownToggle');
const userDropdown = document.getElementById('userDropdown');
const toggleFontBtn = document.getElementById('toggleFont');
const mapsBox = document.querySelector('.maps-box');
const mapContainer = document.getElementById('map');

let obrasData = [];
let allBairros = [];
let allConstrutoras = [];
let allStatus = [];
let detalhesBar = false;
let mapInstance = null;
let markersLayer = null;

const formatCurrency = (value) => 'R$ ' + Number(value).toLocaleString('pt-BR');
const normalize = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase() : '';

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

// === GRID ===
function renderGrid(obras) {
  obrasGrid.innerHTML = '';
  if (!obras.length) {
    obrasGrid.innerHTML = '<p>Nenhuma obra encontrada.</p>';
    return;
  }

  obras.forEach(obra => {
    const card = document.createElement('div');
    card.classList.add('card');

    const imgSrc = Array.isArray(obra.anexos)
      ? (obra.anexos.find(a => a.tipo === "imagem")?.url || './img/Logo2.png')
      : './img/Logo2.png';

    card.innerHTML = `
      <img src="${imgSrc}" alt="obra" onerror="this.onerror=null; this.src='./img/Logo2.png'">
      <h3>${obra.titulo}</h3>
      <button class="detalhesBtn">Ver detalhes</button>
    `;

    obrasGrid.appendChild(card);

    // Evento do botão de detalhes
    const detalhesBtn = card.querySelector('.detalhesBtn');
    detalhesBtn.addEventListener('click', () => showDetalhesSidebar(obra));
  });
}
const detalhesSidebar = document.getElementById('detalhesSidebar');
const detalhesContent = document.getElementById('detalhesContent');
const closeDetalhes = document.getElementById('closeDetalhes');

function showDetalhesSidebar(obra) {
  sidebar.classList.remove('open');
  sidebar.classList.add('closed');

  detalhesContent.innerHTML = `
    <h2>${obra.titulo}</h2>

    <div class="tabs">
      <button class="tab active" data-tab="resumo">Resumo</button>
      <button class="tab" data-tab="timeline">Linha do tempo</button>
      <button class="tab" data-tab="publicacoes">Publicações</button>
    </div>

    <div class="tab-content active" id="resumo">
      <div class="detalhes-card">
        <img src="${obra.anexos?.find(a => a.tipo === "imagem")?.url || './img/Logo2.png'}" />
        <p><strong>Bairro:</strong> ${obra.endereco?.bairro || '-'}</p>
        <p><strong>Construtora:</strong> ${obra.empresaExecutora || '-'}</p>
        <p><strong>Status:</strong> ${obra.status || '-'}</p>
        <p><strong>Valor Total:</strong> ${formatCurrency(obra.valorContratado || 0)}</p>
        <p>${obra.descricao || ''}</p>
      </div>
    </div>

    <div class="tab-content" id="timeline">
      <div class="detalhes-card">
        <p><strong>Etapas executadas:</strong></p>
        <ul class="timeline-list">
          ${(obra.etapas || []).map(etapa => `<li>${etapa}</li>`).join('') || "<li>Nenhuma etapa registrada</li>"}
        </ul>
      </div>
    </div>

    <div class="tab-content" id="publicacoes">
      <div class="detalhes-card">
        ${(obra.publicacoes || []).map(pub => `
          <div class="pub-card">
            <img src="${pub.img || './img/placeholder.jpg'}"/>
            <p>${pub.texto || ''}</p>
          </div>
        `).join('') || "<p>Nenhuma publicação registrada</p>"}
      </div>
    </div>
  `;

  detalhesSidebar.classList.add('open');
  setupTabs(); // importante
}

function setupTabs() {
  const tabs = document.querySelectorAll(".tab");
  const contents = document.querySelectorAll(".tab-content");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      contents.forEach(c => c.classList.remove("active"));

      tab.classList.add("active");
      document.getElementById(tab.dataset.tab).classList.add("active");
    });
  });
}


// Fechar sidebar
closeDetalhes.addEventListener('click', () => {
  detalhesSidebar.classList.remove('open');
});



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
      const marker = L.marker([lat, lng]).addTo(markersLayer);
      marker.bindPopup(`
        <b>${obra.titulo}</b><br>
        ${obra.endereco?.bairro || ''}, ${obra.endereco?.cidade || ''}<br>
        <small>${obra.status}</small>
      `);
    }
  });

  if (markersLayer.getLayers().length > 0) {
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

// === EVENTOS ===
nomeFilter.addEventListener('input', filterObras);
[bairroFilter, construtoraFilter, statusFilter].forEach(select => select.addEventListener('change', filterObras));

if(detalhesBtn){
  detalhesBtn.addEventListener('click', () =>{
    detalhesBar = !detalhesBar;
    detalhesBtn.classList.toggle('active', detalhesBar);
    console.log("Clique no detalhes!");
  })
}

// === INIT ===
async function init() {
  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error('Erro na API');
    const data = await res.json();

    obrasData = Array.isArray(data) ? data : [];
    allBairros = obrasData.map(o => o.endereco?.bairro || '');
    allConstrutoras = obrasData.map(o => o.empresaExecutora || '');
    allStatus = obrasData.map(o => o.status || '');

    populateSelect('bairro', allBairros);
    populateSelect('construtora', allConstrutoras);
    populateSelect('status', allStatus);

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

if (localStorage.getItem('fontLarge') === 'true') document.body.classList.add('font-large');
toggleFontBtn.addEventListener('click', () => {
  const isLarge = document.body.classList.toggle('font-large');
  localStorage.setItem('fontLarge', isLarge);
});

// === TROCAR ENTRE GRID E MAPA ===
mapsBox.addEventListener('click', () => {
  const isMapVisible = mapContainer.style.display === 'block';
  mapContainer.style.display = isMapVisible ? 'none' : 'block';
  obrasGrid.style.display = isMapVisible ? 'grid' : 'none';

  updateView(obrasData);

  if (!isMapVisible && mapInstance) {
    setTimeout(() => mapInstance.invalidateSize(), 200);
  }
});



