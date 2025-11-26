const API_URL = 'http://localhost:3000/cidadaos';
const tableBody = document.getElementById('citizenTableBody');
const searchInput = document.getElementById('searchInput');
let allCidadaos = []; // Cache local para a pesquisa

// Roda quando a página é carregada
document.addEventListener('DOMContentLoaded', () => {
  fetchCidadaos();
});

// Busca os cidadãos da API (Read)
async function fetchCidadaos() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Erro ao buscar dados.');
    allCidadaos = await response.json();
    renderTable(allCidadaos);
  } catch (error) {
    console.error('Erro:', error);
    tableBody.innerHTML =
      '<tr><td colspan="5">Não foi possível carregar os dados.</td></tr>';
  }
}

// Renderiza a tabela com os dados
function renderTable(cidadaos) {
  tableBody.innerHTML = ''; // Limpa a tabela

  if (cidadaos.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="5">Nenhum cidadão cadastrado.</td></tr>';
    return;
  }

  cidadaos.forEach((cidadao) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${cidadao.dadosPessoais.nomeCompleto}</td>
      <td>${cidadao.dadosPessoais.cpf}</td>
      <td>${cidadao.contato.email}</td>
      <td>${cidadao.contato.telefone}</td>
      <td class="action-buttons">
        <a href="../html/cadastroCidadao.html?id=${cidadao.id}" class="btn-action btn-edit">Editar</a>
        <button class="btn-action btn-delete" data-id="${cidadao.id}">Excluir</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

// Event listener para os botões de excluir (delegação de evento)
tableBody.addEventListener('click', function (e) {
  if (e.target.classList.contains('btn-delete')) {
    const id = e.target.getAttribute('data-id');
    deleteCidadao(id);
  }
});

// Função de Exclusão (Delete)
async function deleteCidadao(id) {
  if (!confirm('Tem certeza que deseja excluir este cidadão?')) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Erro ao excluir.');

    alert('Cidadão excluído com sucesso!');
    fetchCidadaos(); // Recarrega a lista
  } catch (error) {
    console.error('Erro:', error);
    alert('Não foi possível excluir o cidadão.');
  }
}

// Event listener para a barra de pesquisa
searchInput.addEventListener('input', function (e) {
  const searchTerm = e.target.value.toLowerCase();

  const filteredCidadaos = allCidadaos.filter((cidadao) => {
    return (
      cidadao.dadosPessoais.nomeCompleto.toLowerCase().includes(searchTerm) ||
      cidadao.dadosPessoais.cpf.toLowerCase().includes(searchTerm) ||
      cidadao.contato.email.toLowerCase().includes(searchTerm)
    );
  });

  renderTable(filteredCidadaos);
});
