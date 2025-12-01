const API_URL = 'http://localhost:3000/cidadaos';
const citizenForm = document.getElementById('citizenForm');
const formTitle = document.getElementById('formTitle');
// A CONSTANTE 'backButton' FOI REMOVIDA DAQUI

let currentCidadaoId = null;

// Roda quando a página é carregada
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');

  if (id) {
    // Modo de Edição
    currentCidadaoId = id;
    formTitle.textContent = 'Editar Cidadão';
    loadCidadaoData(id);
  } else {
    // Modo de Cadastro
    formTitle.textContent = 'Novo Cidadão';
  }
});

// Carrega os dados do cidadão para o formulário (Modo Edição)
async function loadCidadaoData(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) throw new Error('Cidadão não encontrado');
    const data = await response.json();

    // Preenche seções
    document.getElementById('fullName').value = data.dadosPessoais.nomeCompleto;
    document.getElementById('cpf').value = data.dadosPessoais.cpf;
    document.getElementById('birthDate').value =
      data.dadosPessoais.dataNascimento;
    if (data.dadosPessoais.genero) {
      document.querySelector(
        `input[name="gender"][value="${data.dadosPessoais.genero}"]`
      ).checked = true;
    }

    document.getElementById('email').value = data.contato.email;
    document.getElementById('phone').value = data.contato.telefone;

    document.getElementById('cep').value = data.endereco.cep;
    document.getElementById('street').value = data.endereco.logradouro;
    document.getElementById('number').value = data.endereco.numero;
    document.getElementById('complement').value = data.endereco.complemento;
    document.getElementById('neighborhood').value = data.endereco.bairro;
    document.getElementById('city').value = data.endereco.cidade;
    document.getElementById('state').value = data.endereco.estado;

    // Senhas não são pré-preenchidas por segurança
    document.getElementById('password').value = '';
    document.getElementById('confirmPassword').value = '';
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    alert('Não foi possível carregar os dados do cidadão.');
    window.location.href = '../html/listagemUsers.html';
  }
}

// Evento de submit do formulário (Cria ou Atualiza)
citizenForm.addEventListener('submit', async function (e) {
  e.preventDefault();

  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (password !== confirmPassword) {
    alert('As senhas não coincidem. Por favor, verifique.');
    return;
  }

  // Monta o objeto aninhado conforme a estrutura do db.json
  const formData = {
    dadosPessoais: {
      nomeCompleto: document.getElementById('fullName').value,
      cpf: document.getElementById('cpf').value,
      dataNascimento: document.getElementById('birthDate').value,
      genero: document.querySelector('input[name="gender"]:checked')
        ? document.querySelector('input[name="gender"]:checked').value
        : null,
    },
    contato: {
      email: document.getElementById('email').value,
      telefone: document.getElementById('phone').value,
    },
    endereco: {
      cep: document.getElementById('cep').value,
      logradouro: document.getElementById('street').value,
      numero: document.getElementById('number').value,
      complemento: document.getElementById('complement').value,
      bairro: document.getElementById('neighborhood').value,
      cidade: document.getElementById('city').value,
      estado: document.getElementById('state').value,
    },
    seguranca: {
      password: password,
    },
  };

  try {
    let response;
    if (currentCidadaoId) {
      // Modo Edição (PUT)
      response = await fetch(`${API_URL}/${currentCidadaoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
    } else {
      // Modo Cadastro (POST)
      response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
    }

    if (!response.ok) throw new Error('Erro ao salvar os dados.');

    alert('Dados salvos com sucesso!');
    window.location.href = '../html/listagemUsers.html'; // Redireciona para a lista
  } catch (error) {
    console.error('Erro:', error);
    alert('Ocorreu um erro ao salvar. Tente novamente.');
  }
});

// --- Busca de CEP (API Externa ViaCEP) ---
document
  .getElementById('searchCep')
  .addEventListener('click', async function () {
    const cep = document.getElementById('cep').value.replace(/\D/g, '');

    if (cep.length !== 8) {
      alert('CEP inválido. Digite um CEP com 8 dígitos.');
      return;
    }

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (!response.ok) throw new Error('CEP não encontrado');
      const data = await response.json();

      if (data.erro) {
        alert('CEP não encontrado.');
        return;
      }

      // Preenche os campos de endereço
      document.getElementById('street').value = data.logradouro;
      document.getElementById('neighborhood').value = data.bairro;
      document.getElementById('city').value = data.localidade;
      document.getElementById('state').value = data.uf;
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      alert('Não foi possível buscar o CEP.');
    }
  });

// --- O BLOCO DE CÓDIGO DO "Botão Voltar" FOI REMOVIDO DAQUI ---

// --- Formatadores (Mantidos do seu código original) ---

// Formatação automática do CPF
document.getElementById('cpf').addEventListener('input', function (e) {
  let value = e.target.value.replace(/\D/g, '');
  if (value.length > 11) value = value.substring(0, 11);

  if (value.length > 9) {
    value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (value.length > 6) {
    value = value.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
  } else if (value.length > 3) {
    value = value.replace(/(\d{3})(\d{1,3})/, '$1.$2');
  }
  e.target.value = value;
});

// Formatação automática do CEP
document.getElementById('cep').addEventListener('input', function (e) {
  let value = e.target.value.replace(/\D/g, '');
  if (value.length > 8) value = value.substring(0, 8);
  if (value.length > 5) {
    value = value.replace(/(\d{5})(\d{1,3})/, '$1-$2');
  }
  e.target.value = value;
});

// Formatação automática do telefone
document.getElementById('phone').addEventListener('input', function (e) {
  let value = e.target.value.replace(/\D/g, '');
  if (value.length > 11) value = value.substring(0, 11);

  if (value.length > 10) {
    value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (value.length > 6) {
    value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  } else if (value.length > 2) {
    value = value.replace(/(\d{2})(\d{0,5})/, '($1) $2');
  } else if (value.length > 0) {
    value = value.replace(/(\d{0,2})/, '($1');
  }
  e.target.value = value;
});
