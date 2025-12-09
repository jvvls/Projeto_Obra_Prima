const API = "http://localhost:3000/obras";

let obras = [];

async function carregarObras() {
  try {
    const res = await fetch(API);
    obras = await res.json();
    preencherFiltros();
    aplicarFiltros();
  } catch (e) {
    console.error("Erro ao buscar obras:", e);
  }
}

function preencherFiltros() {
  const statusSel = document.getElementById("status");
  const bairroSel = document.getElementById("bairro");
  const construtoraSel = document.getElementById("construtora");

  statusSel.innerHTML = `<option>Todas</option>`;
  bairroSel.innerHTML = `<option>Todas</option>`;
  construtoraSel.innerHTML = `<option>Todas</option>`;

  const statusList = new Set();
  const bairroList = new Set();
  const construtoraList = new Set();

  obras.forEach(o => {
    if (o.status) statusList.add(o.status);
    if (o.endereco?.bairro) bairroList.add(o.endereco.bairro);
    if (o.empresaExecutora) construtoraList.add(o.empresaExecutora);
  });

  statusList.forEach(s => statusSel.innerHTML += `<option>${s}</option>`);
  bairroList.forEach(b => bairroSel.innerHTML += `<option>${b}</option>`);
  construtoraList.forEach(c => construtoraSel.innerHTML += `<option>${c}</option>`);
}

function aplicarFiltros() {
  const nomeFiltro = document.getElementById("nome").value.toLowerCase();
  const statusFiltro = document.getElementById("status").value;
  const bairroFiltro = document.getElementById("bairro").value;
  const construtoraFiltro = document.getElementById("construtora").value;

  const filtradas = obras.filter(o => {

    const matchNome =
      nomeFiltro === "" ||
      o.titulo?.toLowerCase().includes(nomeFiltro);

    const matchStatus =
      statusFiltro === "Todas" || o.status === statusFiltro;

    const matchBairro =
      bairroFiltro === "Todas" || o.endereco?.bairro === bairroFiltro;

    const matchConstrutora =
      construtoraFiltro === "Todas" || o.empresaExecutora === construtoraFiltro;

    return matchNome && matchStatus && matchBairro && matchConstrutora;
  });

  exibirObras(filtradas);
}

function exibirObras(lista) {
  const grid = document.getElementById("obrasGrid");
  grid.innerHTML = "";

  lista.forEach(obra => {
    const card = document.createElement("div");
    card.className = "card-obra";

    const valorFormatado = obra.valorContratado
      ? Number(obra.valorContratado).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL"
        })
      : "—";

    card.innerHTML = `
      <img class="card-img" src="assets/images/Logo2.png" alt="Imagem da obra">

      <h3>${obra.titulo || "(Sem título)"}</h3>

      <p><strong>Status:</strong> ${obra.status || "—"}</p>
      <p><strong>Bairro:</strong> ${obra.endereco?.bairro || "—"}</p>
      <p><strong>Construtora:</strong> ${obra.empresaExecutora || "—"}</p>
      <p><strong>Valor:</strong> ${valorFormatado}</p>
    `;

    card.onclick = () => {
      window.location.href = `obra-detalhe.html?id=${obra.id}`;
    };

    grid.appendChild(card);
  });
}

document.getElementById("nome").addEventListener("input", aplicarFiltros);
document.getElementById("status").addEventListener("change", aplicarFiltros);
document.getElementById("bairro").addEventListener("change", aplicarFiltros);
document.getElementById("construtora").addEventListener("change", aplicarFiltros);

document.getElementById("clearFilters").onclick = () => {
  document.getElementById("nome").value = "";
  document.getElementById("status").value = "Todas";
  document.getElementById("bairro").value = "Todas";
  document.getElementById("construtora").value = "Todas";
  aplicarFiltros();
};

carregarObras();
