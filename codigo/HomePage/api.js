// ==================== API MOCK - OBRA PRIMA ====================
// Simula uma API REST para gerenciar obras e dados

class ObraPrimaAPI {
  constructor() {
    // Dados mockados (em produção, isso viria de um servidor real)
    this.obras = [
      // Obras em Andamento (5)
      { 
        id: 1, 
        nome: "Residencial Aurora", 
        img: "img/imagem 1.jpg", 
        status: "Andamento", 
        progresso: 75,
        bairro: "Centro",
        tipo: "Residencial",
        custo: 250000,
        dataInicio: "2024-01-15"
      },
      { 
        id: 2, 
        nome: "Shopping Mineirinho", 
        img: "img/imagem 2.jpg", 
        status: "Andamento", 
        progresso: 50,
        bairro: "Jardim América",
        tipo: "Comercial",
        custo: 500000,
        dataInicio: "2024-03-01"
      },
      { 
        id: 3, 
        nome: "Advocacia Rectus", 
        img: "img/imagem 3.jpg", 
        status: "Andamento", 
        progresso: 60,
        bairro: "Centro",
        tipo: "Residencial",
        custo: 300000,
        dataInicio: "2024-02-10"
      },
      { 
        id: 4, 
        nome: "Obra Andamento 4", 
        img: "img/imagem 1.jpg", 
        status: "Andamento", 
        progresso: 40,
        bairro: "Jardim América",
        tipo: "Comercial",
        custo: 400000,
        dataInicio: "2024-04-05"
      },
      { 
        id: 5, 
        nome: "Obra Andamento 5", 
        img: "img/imagem 2.jpg", 
        status: "Andamento", 
        progresso: 55,
        bairro: "Alto da Boa Vista",
        tipo: "Residencial",
        custo: 350000,
        dataInicio: "2024-03-20"
      },
      // Obras Concluídas (8)
      { 
        id: 6, 
        nome: "Advocacia Rectus", 
        img: "img/imagem 3.jpg", 
        status: "Finalizando", 
        progresso: 95,
        bairro: "Alto da Boa Vista",
        tipo: "Comercial",
        custo: 800000,
        dataInicio: "2023-11-10"
      },
      { 
        id: 7, 
        nome: "Obra Concluída 2", 
        img: "img/imagem 1.jpg", 
        status: "Finalizando", 
        progresso: 100,
        bairro: "Centro",
        tipo: "Residencial",
        custo: 450000,
        dataInicio: "2023-10-15"
      },
      { 
        id: 8, 
        nome: "Obra Concluída 3", 
        img: "img/imagem 2.jpg", 
        status: "Finalizando", 
        progresso: 98,
        bairro: "Jardim América",
        tipo: "Comercial",
        custo: 600000,
        dataInicio: "2023-09-20"
      },
      { 
        id: 9, 
        nome: "Obra Concluída 4", 
        img: "img/imagem 3.jpg", 
        status: "Finalizando", 
        progresso: 100,
        bairro: "Centro",
        tipo: "Residencial",
        custo: 380000,
        dataInicio: "2023-08-10"
      },
      { 
        id: 10, 
        nome: "Obra Concluída 5", 
        img: "img/imagem 1.jpg", 
        status: "Finalizando", 
        progresso: 97,
        bairro: "Alto da Boa Vista",
        tipo: "Comercial",
        custo: 550000,
        dataInicio: "2023-12-05"
      },
      { 
        id: 11, 
        nome: "Obra Concluída 6", 
        img: "img/imagem 2.jpg", 
        status: "Finalizando", 
        progresso: 100,
        bairro: "Jardim América",
        tipo: "Residencial",
        custo: 420000,
        dataInicio: "2023-07-22"
      },
      { 
        id: 12, 
        nome: "Obra Concluída 7", 
        img: "img/imagem 3.jpg", 
        status: "Finalizando", 
        progresso: 99,
        bairro: "Centro",
        tipo: "Comercial",
        custo: 700000,
        dataInicio: "2023-06-15"
      },
      { 
        id: 13, 
        nome: "Obra Concluída 8", 
        img: "img/imagem 1.jpg", 
        status: "Finalizando", 
        progresso: 100,
        bairro: "Alto da Boa Vista",
        tipo: "Residencial",
        custo: 480000,
        dataInicio: "2023-05-30"
      },
      // Obras Atrasadas (1)
      { 
        id: 14, 
        nome: "Obra Atrasada", 
        img: "img/imagem 2.jpg", 
        status: "Atrasada", 
        progresso: 45,
        bairro: "Centro",
        tipo: "Residencial",
        custo: 320000,
        dataInicio: "2023-12-01"
      }
    ];

    this.feedbacks = [
      { id: 1, texto: "A obra no do conjunto reseidencialno bairro Savassi ocorreu tudo dentro dos conformes!", data: "2025-11-09", autor: "Gestor Adriano Parroco" },
      { id: 2, texto: "Equipe super organizada.", data: "2025-11-08", autor: "Arthur Gomes" },
      { id: 3, texto: "Gostei da transparência nos relatórios e na responsatividade do site.", data: "2025-10-28", autor: "Deborah Martins" },
      { id: 4, texto: "Graças ao site Obra Prima, pude me precaver com uma construção de um prédio que iria começar ao lado de minha casa.", data: "2025-11-04", autor: "Usuário Anônimo" }
    ];

    this.notificacoes = [
      { id: 1, titulo: "Nova obra iniciada", mensagem: "A obra Residencial Aurora foi iniciada", lida: false },
      { id: 2, titulo: "Material entregue", mensagem: "Materiais para Shopping Mineirinho foram entregues", lida: false },
      { id: 3, titulo: "Relatório disponível", mensagem: "Novo relatório mensal disponível", lida: true }
    ];
  }

  // Simular delay de rede
  delay(ms = 500) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // GET - Buscar todas as obras
  async getObras(filtros = {}) {
    await this.delay(300);
    let obrasFiltradas = [...this.obras];

    if (filtros.bairro) {
      obrasFiltradas = obrasFiltradas.filter(o => 
        o.bairro.toLowerCase().includes(filtros.bairro.toLowerCase())
      );
    }

    if (filtros.tipo && filtros.tipo !== 'Tipo de obra') {
      obrasFiltradas = obrasFiltradas.filter(o => o.tipo === filtros.tipo);
    }

    return { success: true, data: obrasFiltradas };
  }

  // GET - Buscar obra por ID
  async getObraById(id) {
    await this.delay(200);
    const obra = this.obras.find(o => o.id === id);
    return { success: !!obra, data: obra };
  }

  // GET - Buscar feedbacks
  async getFeedbacks() {
    await this.delay(200);
    return { success: true, data: this.feedbacks };
  }

  // GET - Buscar notificações
  async getNotificacoes() {
    await this.delay(200);
    const naoLidas = this.notificacoes.filter(n => !n.lida);
    return { success: true, data: this.notificacoes, naoLidas: naoLidas.length };
  }

  // POST - Marcar notificação como lida
  async marcarNotificacaoLida(id) {
    await this.delay(100);
    const notificacao = this.notificacoes.find(n => n.id === id);
    if (notificacao) {
      notificacao.lida = true;
      return { success: true };
    }
    return { success: false };
  }

  // GET - Estatísticas gerais
  async getEstatisticas() {
    await this.delay(200);
    const obrasAtivas = this.obras.filter(o => o.status === 'Andamento').length;
    const obrasConcluidas = this.obras.filter(o => o.status === 'Finalizando').length;
    const obrasAtrasadas = this.obras.filter(o => o.status === 'Atrasada').length;
    const custoTotal = this.obras.reduce((sum, o) => sum + o.custo, 0);

    return {
      success: true,
      data: {
        obrasAtivas,
        obrasConcluidas,
        obrasAtrasadas,
        satisfacaoMedia: 4.6,
        equipesAtivas: 9,
        custosMes: 187000,
        materiaisFalta: 5
      }
    };
  }

  // POST - Login
  async login(email, senha) {
    await this.delay(500);
    // Simulação de login
    if (email && senha) {
      return { 
        success: true, 
        data: { 
          token: 'mock_token_12345', 
          usuario: { nome: 'Usuário', email: email } 
        } 
      };
    }
    return { success: false, message: 'Email ou senha inválidos' };
  }

  // POST - Cadastro
  async cadastro(dados) {
    await this.delay(500);
    if (dados.nome && dados.email && dados.senha) {
      return { 
        success: true, 
        message: 'Cadastro realizado com sucesso!' 
      };
    }
    return { success: false, message: 'Dados inválidos' };
  }
}

// Instância global da API
const api = new ObraPrimaAPI();

