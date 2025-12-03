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

const placeholder = '/codigo/public/assets/images/Logo2.png'; 
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
// DROPDOWN DO USUÁRIO
// ======================================================

userDropdownToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  userDropdown.style.display = userDropdown.style.display === 'flex' ? 'none' : 'flex';
});

document.addEventListener('click', (e) => {
  if (!userDropdown.contains(e.target) && !userDropdownToggle.contains(e.target)) {
    userDropdown.style.display = 'none';
  }
});

document.getElementById('homeBtn').addEventListener('click', () => {
  window.location.href = 'index.html';
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('usuarioLogado');
  window.location.href = 'login.html';
});

toggleFontBtn.addEventListener('click', () => {
  document.body.classList.toggle('font-large');
  userDropdown.style.display = 'none';
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
// FUNÇÃO AUXILIAR PARA PEGAR IMAGEM
// ======================================================

function getFirstImageUrl(anexos) {
  if (!anexos || anexos.length === 0) return placeholder;
  const imagens = anexos.flat().filter(a => a.tipo === 'imagem');
  return imagens.length ? imagens[0].url : placeholder;
}

// ======================================================
// FUNÇÃO PARA GERAR THUMBNAILS
// ======================================================
const thumbCache = new Map(); 

async function createThumbnail(url, maxWidth = 400) {
  if (!url) return placeholder;
  if (thumbCache.has(url)) return thumbCache.get(url);

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; 
    img.onload = () => {
      const scale = maxWidth / img.width;
      const canvas = document.createElement('canvas');
      canvas.width = maxWidth;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const thumbData = canvas.toDataURL('image/jpeg', 0.9); 
      thumbCache.set(url, thumbData); 
      resolve(thumbData);
    };
    img.onerror = () => resolve(placeholder);
    img.src = url;
  });
}

// ======================================================
// RENDER GRID ATUALIZADO
// ======================================================
async function renderGrid(obras) {
  obrasGrid.innerHTML = '';

  if (!obras.length) {
    obrasGrid.innerHTML = '<p>Nenhuma obra encontrada.</p>';
    return;
  }

  for (const obra of obras) {
    const card = document.createElement('div');
    card.classList.add('card');

    const imgUrl = getFirstImageUrl(obra.anexos);

    const thumbSrc = await createThumbnail(imgUrl);

    card.innerHTML = `
      <img src="${thumbSrc}" alt="obra" loading="lazy"
           onerror="this.onerror=null; this.src='${placeholder}'">
      <h3>${obra.titulo}</h3>
      <button class="detalhesBtn">Ver detalhes</button>
    `;

    obrasGrid.appendChild(card);

    card.querySelector('.detalhesBtn').addEventListener('click', () => {
      showDetalhesSidebar(obra);
    });
  }
}


// ======================================================
// SIDEBAR DE DETALHES
// ======================================================

function closeDetalhesSidebar() {
  detalhesSidebar.classList.remove('open');
}

closeDetalhes.addEventListener('click', closeDetalhesSidebar);

function renderImagesGallery(anexos) {
  const imagens = anexos?.flat().filter(a => a.tipo === 'imagem') || [];
  if (!imagens.length) return `<img src="${placeholder}" alt="Sem imagem">`;

  return imagens.map(img => `
    <img src="${img.url}" alt="${img.nomeArquivo}" 
         onerror="this.onerror=null; this.src='${placeholder}'">
  `).join('');
}

function showDetalhesSidebar(obra) {
  sidebar.classList.remove('open');
  const progressoTotal = calcularProgresso(obra.marcos || []);

  detalhesContent.innerHTML = `
    <h2>${obra.titulo}</h2>

    <div class="tabs">
      <button class="tab active" data-tab="resumo">Resumo</button>
      <button class="tab" data-tab="timeline">Linha do tempo</button>
      <button class="tab" data-tab="publicacoes">Feedbacks</button>
    </div>

    <div class="tab-content active" id="resumo">
      <div class="detalhes-card">
        <div class="detalhes-gallery">
          ${renderImagesGallery(obra.anexos)}
        </div>
        <p><strong>Bairro:</strong> ${obra.endereco?.bairro || '-'}</p>
        <p><strong>Construtora:</strong> ${obra.empresaExecutora || '-'}</p>
        <p><strong>Status:</strong> ${obra.status || '-'}</p>
        <p><strong>Valor Total:</strong> ${formatCurrency(obra.valorContratado || 0)}</p>
        <p>${obra.descricao || ''}</p>
      </div>
    </div>

    <div class="tab-content" id="timeline">
      <div class="detalhes-card">
        <div class="progresso-container">
          <div class="progresso-header">
            <strong>Progresso da Obra</strong>
            <span class="progresso-percentual">${progressoTotal}%</span>
          </div>
          <div class="progresso-barra">
            <div class="progresso-preenchimento" style="width: ${progressoTotal}%"></div>
          </div>
          <div class="progresso-legenda">
            <small>Baseado nos marcos registrados</small>
          </div>
        </div>

        <div class="timeline-separador"></div>

        <h3>Marcos da Obra</h3>
        <ul class="timeline-list">
          ${(obra.marcos || [])
            .sort((a, b) => (a.percentual || 0) - (b.percentual || 0))
            .map(m => `
              <li class="marco-item">
                <div class="marco-header">
                  <strong>${m.titulo}</strong>
                  <span class="marco-percentual">${m.percentual}%</span>
                </div>
                <div class="marco-progresso">
                  <div class="marco-barra">
                    <div class="marco-preenchimento" style="width: ${m.percentual}%"></div>
                  </div>
                </div>
                <div class="marco-detalhes">
                  <p>${m.descricao || ''}</p>
                  ${m.data ? `<small><strong>Data:</strong> ${new Date(m.data).toLocaleDateString("pt-BR")}</small>` : ''}
                </div>
              </li>
            `).join('') || "<li class='sem-marcos'>Nenhum marco registrado</li>"}
        </ul>
      </div>
    </div>

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
            </div>
          `).join('') || "<p>Nenhum feedback registrado</p>"}
      </div>
    </div>
  `;

  detalhesSidebar.classList.add('open');
  setupTabs();
}

// ======================================================
// AUXILIAR PROGRESSO
// ======================================================

function calcularProgresso(marcos) {
  if (!marcos || marcos.length === 0) return 0;
  const soma = marcos.reduce((total, marco) => total + (Number(marco.percentual) || 0), 0);
  return Math.round(Math.max(0, Math.min(100, soma / marcos.length)));
}

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

    markersLayer = L.featureGroup().addTo(mapInstance); 
  }

  if (!markersLayer || !markersLayer.clearLayers) {
    markersLayer = L.featureGroup().addTo(mapInstance); 
  } else {
    markersLayer.clearLayers();
  }

  obras.forEach(obra => {
    const lat = parseFloat(obra.latitude);
    const lng = parseFloat(obra.longitude);

    if (!isNaN(lat) && !isNaN(lng)) {
      const marker = L.marker([lat, lng]);
      marker.bindPopup(`
        <b>${obra.titulo}</b><br>
        ${obra.endereco?.bairro || ''}<br>
        <small>${obra.status}</small>
      `);
      markersLayer.addLayer(marker);
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

nomeFilter.addEventListener('input', filterObras);
[bairroFilter, construtoraFilter, statusFilter].forEach(select => select.addEventListener('change', filterObras));

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

  if (!showingMap && mapInstance) setTimeout(() => mapInstance.invalidateSize(), 200);
});
// ======================================================
// Persistência do login e ajustes do header
// ======================================================

window.addEventListener("DOMContentLoaded", () => {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));

  if (!usuario || !usuario.dadosPessoais || !usuario.dadosPessoais.nomeCompleto) {
    window.location.href = "login.html";
    return;
  }

  const primeiroNome = usuario.dadosPessoais.nomeCompleto.split(" ")[0];
  const spanUsuario = document.querySelector(".user span");
  if (spanUsuario) spanUsuario.textContent = primeiroNome;

  if (usuario.gestor) {
    const rightDiv = document.querySelector(".topbar .right");

    if (rightDiv) {
      const gestorBtn = document.createElement("button");
      gestorBtn.textContent = "Painel do Gestor";
      gestorBtn.id = "gestorBtn";

      gestorBtn.style.marginLeft = "10px";
      gestorBtn.style.padding = "5px 10px";
      gestorBtn.style.cursor = "pointer";
      gestorBtn.style.borderRadius = "5px";
      gestorBtn.style.border = "none";
      gestorBtn.style.backgroundColor = "#3498db";
      gestorBtn.style.color = "#fff";
      gestorBtn.style.fontWeight = "bold";

      gestorBtn.addEventListener("click", () => {
        window.location.href = "/codigo/public/modulos/editorObras.html";
      });

      rightDiv.appendChild(gestorBtn);
    }
  }
});

