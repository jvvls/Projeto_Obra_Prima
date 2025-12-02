// ======================================================
// CONFIGURAÇÕES E VARIÁVEIS GLOBAIS
// ======================================================

const API = "http://localhost:3000/obras";

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
const mapContainer = document.getElementById('map');
const mapsBox = document.querySelector('.maps-box');

const userDropdownToggle = document.getElementById('userDropdownToggle');
const userDropdown = document.getElementById('userDropdown');
const toggleFontBtn = document.getElementById('toggleFont');

const detalhesSidebar = document.getElementById('detalhesSidebar');
const detalhesContent = document.getElementById('detalhesContent');
const closeDetalhes = document.getElementById('closeDetalhes');

let obrasData = [];
let mapInstance = null;
let markersLayer = null;

const formatCurrency = (value) => 'R$ ' + Number(value).toLocaleString('pt-BR');
const normalize = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase() : '';


// ======================================================
// SIDEBAR PRINCIPAL
// ======================================================

toggleSidebarBtn.addEventListener('click', () => {
  if (window.innerWidth <= 768) sidebar.classList.toggle('open');
  else sidebar.classList.toggle('closed');
});


// ======================================================
// SLIDER
// ======================================================

slider.value = slider.max;
sliderValue.textContent = formatCurrency(slider.value);

slider.addEventListener('input', () => {
  sliderValue.textContent = formatCurrency(slider.value);
  filterObras();
});


// ======================================================
// POPULAR SELECTS
// ======================================================

function populateSelect(selectId, items) {
  const select = document.getElementById(selectId);
  select.innerHTML = '<option value="Todas">Todas</option>';

  [...new Set(items.filter(Boolean))]
    .sort()
    .forEach(item => {
      const option = document.createElement('option');
      option.value = item;
      option.textContent = item;
      select.appendChild(option);
    });
}


// ======================================================
// FILTROS
// ======================================================

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
      (!nome || obraNome.includes(nome)) &&
      (!bairro || obraBairro.includes(bairro)) &&
      (!construtora || obraConstrutora.includes(construtora)) &&
      (!status || obraStatus.includes(status)) &&
      obraValor <= custoMax
    );
  });

  updateView(filtered);
}


// ======================================================
// TROCA ENTRE GRID E MAPA
// ======================================================

function updateView(obras) {
  if (mapContainer.style.display === 'block') renderMap(obras);
  else renderGrid(obras);
}


// ======================================================
// GRID
// ======================================================

function renderGrid(obras) {
  obrasGrid.innerHTML = '';

  if (!obras.length) {
    obrasGrid.innerHTML = '<p>Nenhuma obra encontrada.</p>';
    return;
  }

  obras.forEach(obra => {
    const card = document.createElement('div');
    card.classList.add('card');

    const imgSrc = obra.anexos?.length ? obra.anexos[0] : '../assets/images/Logo2.png';

    card.innerHTML = `
      <img src="${imgSrc}" alt="obra" 
           onerror="this.onerror=null; this.src='../assets/images/Logo2.png'">
      <h3>${obra.titulo}</h3>
      <button class="detalhesBtn">Ver detalhes</button>
    `;

    obrasGrid.appendChild(card);

    card.querySelector('.detalhesBtn').addEventListener('click', () => {
      showDetalhesSidebar(obra);
    });
  });
}


// ======================================================
// SIDEBAR DE DETALHES
// ======================================================

function showDetalhesSidebar(obra) {
  sidebar.classList.remove('open');
  sidebar.classList.add('closed');

  detalhesContent.innerHTML = `
    <h2>${obra.titulo}</h2>

    <div class="tabs">
      <button class="tab active" data-tab="resumo">Resumo</button>
      <button class="tab" data-tab="timeline">Linha do tempo</button>
      <button class="tab" data-tab="publicacoes">Feedbacks</button>
    </div>

    <!-- RESUMO -->
    <div class="tab-content active" id="resumo">
      <div class="detalhes-card">
        <img src="${obra.anexos?.[0] || '../assets/images/Logo2.png'}">
        <p><strong>Bairro:</strong> ${obra.endereco?.bairro || '-'}</p>
        <p><strong>Construtora:</strong> ${obra.empresaExecutora || '-'}</p>
        <p><strong>Status:</strong> ${obra.status || '-'}</p>
        <p><strong>Valor Total:</strong> ${formatCurrency(obra.valorContratado || 0)}</p>
        <p>${obra.descricao || ''}</p>
      </div>
    </div>

    <!-- TIMELINE -->
    <div class="tab-content" id="timeline">
      <div class="detalhes-card">
        <ul class="timeline-list">
          ${(obra.marcos || [])
            .map(m => `
              <li>
                <b>${m.titulo}</b> — ${m.percentual}%<br>
                ${m.descricao}
              </li>
            `)
            .join('') || "<li>Nenhum marco registrado</li>"}
        </ul>
      </div>
    </div>

    <!-- FEEDBACKS (CORRIGIDO) -->
    <div class="tab-content" id="publicacoes">
      <div class="detalhes-card">

        ${(obra.feedbacks || [])
          .map(f => `
            <div class="pub-card">

              <h4>${f.titulo}</h4>
              <p>${f.descricao}</p>

              <div class="fb-info">
                <small><b>${f.nome}</b></small>
                <small>${new Date(f.dataEnvio).toLocaleDateString("pt-BR")}</small>
              </div>

              <div class="fb-actions-mini">
                <span>👍 ${f.likes ?? 0}</span>
                <span>👎 ${f.dislikes ?? 0}</span>
              </div>

            </div>
          `)
          .join('') || "<p>Nenhum feedback registrado</p>"}

      </div>
    </div>
  `;

  detalhesSidebar.classList.add('open');
  setupTabs();
}

closeDetalhes.addEventListener('click', () => {
  detalhesSidebar.classList.remove('open');
});


// ======================================================
// TABS
// ======================================================

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


// ======================================================
// MAPA
// ======================================================

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
    const lat = parseFloat(obra.latitude);
    const lng = parseFloat(obra.longitude);

    if (!isNaN(lat) && !isNaN(lng)) {
      const marker = L.marker([lat, lng]).addTo(markersLayer);
      marker.bindPopup(`
        <b>${obra.titulo}</b><br>
        ${obra.endereco?.bairro || ''}<br>
        <small>${obra.status}</small>
      `);
    }
  });

  if (markersLayer.getLayers().length > 0) {
    mapInstance.fitBounds(markersLayer.getBounds());
  }
}


// ======================================================
// LIMPAR FILTROS
// ======================================================

clearFiltersBtn.addEventListener('click', () => {
  nomeFilter.value = '';
  bairroFilter.value = 'Todas';
  construtoraFilter.value = 'Todas';
  statusFilter.value = 'Todas';
  slider.value = slider.max;
  sliderValue.textContent = formatCurrency(slider.value);

  updateView(obrasData);
});


// ======================================================
// EVENTOS DOS FILTROS
// ======================================================

nomeFilter.addEventListener('input', filterObras);

[bairroFilter, construtoraFilter, statusFilter].forEach(select =>
  select.addEventListener('change', filterObras)
);


// ======================================================
// CARREGAR OBRAS
// ======================================================

async function init() {
  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error('Erro ao buscar obras');

    obrasData = await res.json();

    populateSelect('bairro', obrasData.map(o => o.endereco?.bairro || ''));
    populateSelect('construtora', obrasData.map(o => o.empresaExecutora || ''));
    populateSelect('status', obrasData.map(o => o.status || ''));

    updateView(obrasData);

  } catch (err) {
    console.error("Erro ao carregar API:", err);
  }
}

init();




// ======================================================
// TROCAR ENTRE MAPA E GRID
// ======================================================

mapsBox.addEventListener('click', () => {
  const showingMap = mapContainer.style.display === 'block';

  mapContainer.style.display = showingMap ? 'none' : 'block';
  obrasGrid.style.display = showingMap ? 'grid' : 'none';

  updateView(obrasData);

  if (!showingMap && mapInstance) {
    setTimeout(() => mapInstance.invalidateSize(), 200);
  }
});
