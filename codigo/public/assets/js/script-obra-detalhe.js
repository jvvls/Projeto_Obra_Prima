const urlParams = new URLSearchParams(window.location.search);
const obraId = urlParams.get("id");

if (!obraId) {
    alert("ID da obra não informado!");
}

async function carregarObra() {
    try {
        const response = await fetch("http://localhost:3000/obras/" + obraId);
        if (!response.ok) throw new Error("Erro ao carregar obra.");

        const obra = await response.json();
        preencherDadosObra(obra);
        montarTimeline(obra.marcos);

    } catch (err) {
        console.error(err);
        alert("Erro ao buscar dados da obra.");
    }
}

// 🔧 Função utilitária para formatar valores
function formatarValor(valor) {
    if (!valor) return "—";

    if (typeof valor === "number") {
        return valor.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    }

    const num = Number(
        valor.toString().replace(/[R$\s]/g, "").replace(",", ".")
    );

    if (isNaN(num)) return valor; 
    return num.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function preencherDadosObra(obra) {
    document.getElementById("tituloObra").textContent = obra.titulo;
    document.getElementById("descricaoObra").textContent = obra.descricao;
    document.getElementById("statusObra").textContent = obra.status;
    document.getElementById("bairroObra").textContent = obra.endereco?.bairro || "—";
    document.getElementById("cidadeObra").textContent = obra.endereco?.cidade || "—";

    document.getElementById("valorObra").textContent = formatarValor(obra.valorContratado);

    document.getElementById("dataInicio").textContent = obra.dataInicio || "—";
    document.getElementById("dataFim").textContent = obra.previsaoTermino || "—";
}

function montarTimeline(marcos) {
    const container = document.getElementById("timeline");
    container.innerHTML = "";

    if (!marcos || marcos.length === 0) {
        container.innerHTML = "<p>Esta obra não possui marcos cadastrados.</p>";
        return;
    }

    marcos.forEach(marco => {
        const item = document.createElement("div");
        item.classList.add("timeline-item");

        item.innerHTML = `
            <h3>${marco.titulo}</h3>
            <p>${marco.descricao}</p>
            <p class="percent">Progresso: ${marco.percentual}%</p>
            <span class="data"><strong>Data:</strong> ${marco.data}</span>
        `;

        container.appendChild(item);
    });
}

carregarObra();