// ======================================================
// CONFIGURAÇÕES E VARIÁVEIS GLOBAIS
// ======================================================

const API = "http://localhost:3000/obras";
const USUARIOS_API = "http://localhost:3000/usuarios";

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
const normalize = (str) =>
  str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase() : '';

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
  window.location.href = '/codigo/public/index.html';
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
if (slider && sliderValue) {
  slider.value = slider.max;
  sliderValue.textContent = formatCurrency(slider.value);
  slider.addEventListener('input', () => {
    sliderValue.textContent = formatCurrency(slider.value);
    filterObras();
  });
}

// ======================================================
// POPULAR SELECTS
// ======================================================
function populateSelect(selectId, items) {
  const select = document.getElementById(selectId);
  if (!select) return;
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
  const nome = normalize(nomeFilter?.value || '');
  const bairro = normalize(bairroFilter?.value !== 'Todas' ? bairroFilter.value : '');
  const construtora = normalize(construtoraFilter?.value !== 'Todas' ? construtoraFilter.value : '');
  const status = normalize(statusFilter?.value !== 'Todas' ? statusFilter.value : '');
  const custoMax = parseInt(slider?.value || '0');

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
  if (!obras) obras = obrasData;
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

// cria o HTML da lista de feedbacks (usada dentro do showDetalhesSidebar)
function renderFeedbacksHtml(feedbacks = []) {
  if (!feedbacks || feedbacks.length === 0) return "<p>Nenhum feedback registrado</p>";

  return (feedbacks || [])
    .map(f => `
      <div class="pub-card" data-feedback-id="${f.id}">
        <h4>${escapeHtml(f.titulo)}</h4>
        <p>${escapeHtml(f.descricao)}</p>
        <div class="fb-info">
          <small><b>${escapeHtml(f.nome)}</b></small>
          <small>${f.dataEnvio ? new Date(f.dataEnvio).toLocaleDateString("pt-BR") : ''}</small>
        </div>
      </div>
    `).join('');
}

// utilitário básico para escapar HTML (evita injeção quando renderizamos strings)
function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// showDetalhesSidebar agora injeta botão dinâmico e mantém referência à obra atual
function showDetalhesSidebar(obra) {
  sidebar.classList.remove('open');
  const progressoTotal = calcularProgresso(obra.marcos || []);

  detalhesContent.innerHTML = `
    <h2>${escapeHtml(obra.titulo)}</h2>

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
        <p><strong>Bairro:</strong> ${escapeHtml(obra.endereco?.bairro || '-')}</p>
        <p><strong>Construtora:</strong> ${escapeHtml(obra.empresaExecutora || '-')}</p>
        <p><strong>Status:</strong> ${escapeHtml(obra.status || '-')}</p>
        <p><strong>Valor Total:</strong> ${formatCurrency(obra.valorContratado || 0)}</p>
        <p>${escapeHtml(obra.descricao || '')}</p>
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
                  <strong>${escapeHtml(m.titulo)}</strong>
                  <span class="marco-percentual">${m.percentual}%</span>
                </div>
                <div class="marco-progresso">
                  <div class="marco-barra">
                    <div class="marco-preenchimento" style="width: ${m.percentual}%"></div>
                  </div>
                </div>
                <div class="marco-detalhes">
                  <p>${escapeHtml(m.descricao || '')}</p>
                  ${m.data ? `<small><strong>Data:</strong> ${new Date(m.data).toLocaleDateString("pt-BR")}</small>` : ''}
                </div>
              </li>
            `).join('') || "<li class='sem-marcos'>Nenhum marco registrado</li>"}
        </ul>
      </div>
    </div>

    <div class="tab-content" id="publicacoes">
      <div class="detalhes-card" id="pubCardContainer">
        ${renderFeedbacksHtml(obra.feedbacks)}
      </div>
    </div>
  `;

  detalhesSidebar.classList.add('open');
  setupTabs();

  // adiciona botão dinamicamente na aba de publicações (apenas 1 vez)
  const pubCardContainer = document.getElementById('pubCardContainer');
  if (pubCardContainer) {
    // remove botão antigo se existir
    const existingBtn = pubCardContainer.querySelector('#btnFeedback');
    if (existingBtn) existingBtn.remove();

    const btnFeedback = document.createElement("button");
    btnFeedback.id = "btnFeedback";
    btnFeedback.textContent = "Adicionar feedback";
    btnFeedback.className = "novo-feedback-btn";
    // estilos inline simples (pode mover para CSS)
    btnFeedback.style.margin = "12px 0 16px";
    btnFeedback.style.padding = "10px 14px";
    btnFeedback.style.background = "#27ae60";
    btnFeedback.style.color = "#fff";
    btnFeedback.style.border = "none";
    btnFeedback.style.borderRadius = "8px";
    btnFeedback.style.cursor = "pointer";
    btnFeedback.style.fontWeight = "700";
    btnFeedback.style.width = "100%";

    btnFeedback.addEventListener('click', () => abrirModalFeedback(obra));

    // insere no topo do container de publicações
    pubCardContainer.insertAdjacentElement('afterbegin', btnFeedback);
  }
}

// ======================================================
// MODAL / FORMULÁRIO DE FEEDBACK
// ======================================================
// abrirModalFeedback(obra) -> abre modal com campos corretos e salva no formato do DB
async function abrirModalFeedback(obra) {
  // garante usuário logado
  const usuarioLocal = JSON.parse(localStorage.getItem('usuarioLogado'));
  if (!usuarioLocal) {
    alert('Você precisa estar logado para enviar feedback.');
    return;
  }

  // obtem dados completos do usuário se possível (para pegar cpf/email)
  let usuarioFull = {};
  try {
    if (usuarioLocal.id) {
      const r = await fetch(`${USUARIOS_API}/${usuarioLocal.id}`);
      if (r.ok) usuarioFull = await r.json();
    }
  } catch (err) {
    // falha silenciosa: usaremos dados do localStorage
    console.warn('Não foi possível obter usuário completo:', err);
  }

  // garante que não existam modais duplicados
  const anterior = document.getElementById('modalFeedback');
  if (anterior) anterior.remove();

  // overlay
  const overlay = document.createElement('div');
  overlay.id = 'modalFeedback';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.background = 'rgba(0,0,0,0.55)';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = '9999';

  // caixa
  const box = document.createElement('div');
  box.style.width = '92%';
  box.style.maxWidth = '520px';
  box.style.background = '#fff';
  box.style.borderRadius = '12px';
  box.style.padding = '20px';
  box.style.boxShadow = '0 6px 18px rgba(0,0,0,0.2)';
  box.style.display = 'flex';
  box.style.flexDirection = 'column';
  box.style.gap = '12px';

  // titulo
  const h2 = document.createElement('h3');
  h2.textContent = 'Enviar feedback';
  h2.style.margin = '0';
  h2.style.color = '#27ae60';

  // info usuario (nome preenchido a partir do localStorage / usuarioFull)
  const nomeInput = document.createElement('input');
  nomeInput.type = 'text';
  nomeInput.value = usuarioFull?.dadosPessoais?.nomeCompleto || usuarioLocal?.dadosPessoais?.nomeCompleto || '';
  nomeInput.readOnly = true;
  nomeInput.style.padding = '10px';
  nomeInput.style.border = '1px solid #ddd';
  nomeInput.style.borderRadius = '8px';
  nomeInput.style.background = '#f7f7f7';

  // select tipo
  const tipoSelect = document.createElement('select');
  ['elogio', 'reclamacao', 'sugestao'].forEach(t => {
    const op = document.createElement('option');
    op.value = t;
    op.textContent = t.charAt(0).toUpperCase() + t.slice(1);
    tipoSelect.appendChild(op);
  });
  tipoSelect.style.padding = '10px';
  tipoSelect.style.border = '1px solid #ddd';
  tipoSelect.style.borderRadius = '8px';

  // titulo do feedback
  const tituloInput = document.createElement('input');
  tituloInput.type = 'text';
  tituloInput.placeholder = 'Título';
  tituloInput.style.padding = '10px';
  tituloInput.style.border = '1px solid #ddd';
  tituloInput.style.borderRadius = '8px';

  // descricao
  const descInput = document.createElement('textarea');
  descInput.placeholder = 'Descrição';
  descInput.style.padding = '10px';
  descInput.style.minHeight = '110px';
  descInput.style.border = '1px solid #ddd';
  descInput.style.borderRadius = '8px';

  // anexo (nome do arquivo será salvo; upload real não implementado aqui)
  const anexoInput = document.createElement('input');
  anexoInput.type = 'file';
  anexoInput.style.padding = '6px 0';

  // botoes
  const actions = document.createElement('div');
  actions.style.display = 'flex';
  actions.style.gap = '10px';

  const sendBtn = document.createElement('button');
  sendBtn.textContent = 'Enviar feedback';
  sendBtn.style.flex = '1';
  sendBtn.style.padding = '10px';
  sendBtn.style.background = '#27ae60';
  sendBtn.style.color = '#fff';
  sendBtn.style.border = 'none';
  sendBtn.style.borderRadius = '8px';
  sendBtn.style.cursor = 'pointer';
  sendBtn.style.fontWeight = '700';

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancelar';
  cancelBtn.style.flex = '1';
  cancelBtn.style.padding = '10px';
  cancelBtn.style.background = '#ddd';
  cancelBtn.style.border = 'none';
  cancelBtn.style.borderRadius = '8px';
  cancelBtn.style.cursor = 'pointer';

  actions.appendChild(sendBtn);
  actions.appendChild(cancelBtn);

  // assemble
  box.appendChild(h2);
  box.appendChild(nomeInput);
  box.appendChild(tipoSelect);
  box.appendChild(tituloInput);
  box.appendChild(descInput);
  box.appendChild(anexoInput);
  box.appendChild(actions);
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  // fechar ao clicar fora da caixa
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) fecharModalFeedback();
  });

  cancelBtn.addEventListener('click', fecharModalFeedback);

  // Enviar feedback: constrói objeto no formato do DB e PATCH na obra
  sendBtn.addEventListener('click', async () => {
    const tituloVal = tituloInput.value.trim();
    const descVal = descInput.value.trim();
    if (!tituloVal || !descVal) {
      alert('Preencha título e descrição.');
      return;
    }

    // monta dados do usuário (fallbacks)
    const nome = usuarioFull?.dadosPessoais?.nomeCompleto
      || usuarioLocal?.dadosPessoais?.nomeCompleto
      || 'Usuário';
    const cpf = usuarioFull?.cpf || usuarioLocal?.cpf || usuarioFull?.dadosPessoais?.cpf || '000.000.000-00';
    const email = usuarioFull?.contato?.email || usuarioLocal?.email || usuarioFull?.email || 'email@nao-informado';

    const novoFeedback = {
      id: String(Date.now()),
      nome,
      cpf,
      email,
      tipo: tipoSelect.value,
      titulo: tituloVal,
      descricao: descVal,
      dataEnvio: new Date().toISOString(),
      anexo: anexoInput.files.length ? anexoInput.files[0].name : null
    };

    try {
      // buscar obra atual (garante versão atualizada)
      const r = await fetch(`${API}/${obra.id}`);
      if (!r.ok) throw new Error('Erro ao buscar obra');
      const obraAtual = await r.json();

      const feedbacksAtualizados = Array.isArray(obraAtual.feedbacks) ? [...obraAtual.feedbacks, novoFeedback] : [novoFeedback];

      // envia PATCH com apenas o campo feedbacks (JSON Server aceita)
      const patchRes = await fetch(`${API}/${obra.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedbacks: feedbacksAtualizados })
      });

      if (!patchRes.ok) throw new Error('Erro ao salvar feedback');

      // atualiza cópia local (obra em lista obrasData)
      const idx = obrasData.findIndex(o => String(o.id) === String(obra.id));
      if (idx !== -1) {
        obrasData[idx].feedbacks = feedbacksAtualizados;
      }

      // atualiza a aba de publicações já aberta sem fechar a sidebar
      const pubCardContainer = document.getElementById('pubCardContainer');
      if (pubCardContainer) {
        pubCardContainer.innerHTML = ''; // limpar
        // re-inserir botão no início
        const btn = document.createElement("button");
        btn.id = "btnFeedback";
        btn.textContent = "Adicionar feedback";
        btn.className = "novo-feedback-btn";
        btn.style.margin = "12px 0 16px";
        btn.style.padding = "10px 14px";
        btn.style.background = "#27ae60";
        btn.style.color = "#fff";
        btn.style.border = "none";
        btn.style.borderRadius = "8px";
        btn.style.cursor = "pointer";
        btn.style.fontWeight = "700";
        btn.style.width = "100%";
        btn.addEventListener('click', () => abrirModalFeedback(obra));
        pubCardContainer.appendChild(btn);

        // adicionar a lista renderizada
        const listaHtml = document.createElement('div');
        listaHtml.innerHTML = renderFeedbacksHtml(feedbacksAtualizados);
        pubCardContainer.appendChild(listaHtml);
      }

      fecharModalFeedback();
      alert('Feedback enviado com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar feedback. Tente novamente.');
    }
  });
}

function fecharModalFeedback() {
  const overlay = document.getElementById('modalFeedback');
  if (overlay) overlay.remove();
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
      const target = document.getElementById(tab.dataset.tab);
      if (target) target.classList.add("active");
    });
  });
}

// ======================================================
// MAPA (CORREÇÃO markersLayer)
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
        <b>${escapeHtml(obra.titulo)}</b><br>
        ${escapeHtml(obra.endereco?.bairro || '')}<br>
        <small>${escapeHtml(obra.status || '')}</small>
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

  if (!showingMap && mapInstance)
    setTimeout(() => mapInstance.invalidateSize(), 200);
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
