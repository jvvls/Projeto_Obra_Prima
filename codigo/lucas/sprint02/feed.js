document.addEventListener('DOMContentLoaded', () => {
    const API_URL = "http://localhost:3000/feedbacks"; 
    async function excluirFeedback(id, nome) {
        if (!confirm(`Tem certeza que deseja excluir o feedback de ${nome} (ID: ${id})? Essa ação é irreversível.`)) {
            return;
        }

        try {
            const resposta = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
            
            if (resposta.ok) {
                const data = await resposta.json();
                alert(data.message || `Feedback (ID: ${id}) de ${nome} removido com sucesso!`);
                carregarFeedbacks(); 
            } else {
                const erro = await resposta.json();
                alert(erro.error || "Erro ao excluir feedback.");
            }
        } catch (erro) {
            console.error("Erro ao excluir feedback:", erro);
            alert("Erro de conexão ao tentar excluir o feedback.");
        }
    }

    async function carregarFeedbacks() {
        try {
            const resposta = await fetch(API_URL);
            const feedbacks = await resposta.json();

            const container = document.querySelector(".feedback-list");
            if (!container) return;
            container.innerHTML = "";
            
            if (feedbacks.length === 0) {
                container.innerHTML = '<p>Nenhum feedback cadastrado. Use o botão "Novo Feedback" para adicionar um.</p>';
                return;
            }

            feedbacks.forEach(fb => {
                const card = document.createElement("div");
                card.classList.add("feedback-card-detail", `type-${fb.tipo?.toLowerCase() || "geral"}`);
                card.dataset.feedbackId = fb.id;

                card.innerHTML = `
                    <div class="card-header">
                        <span class="feedback-type">${fb.tipo}</span>
                        <span class="user-name-card">Postado por: ${fb.nome}</span>
                    </div>
                    <h4 class="obra-title-card">Obra: ${fb.obra}</h4>
                    <h5 class="feedback-title">${fb.titulo || 'Sem Título'}</h5>
                    <p class="feedback-description">${fb.descricao}</p> 
                    <div class="card-footer">
                        <div class="like-dislike-controls">
                            <button class="like-btn" data-action="like"><i class="fas fa-thumbs-up"></i> ${fb.likes || 0}</button>
                            <button class="dislike-btn" data-action="dislike"><i class="fas fa-thumbs-down"></i> ${fb.dislikes || 0}</button>
                        </div>
                        
                        <button class="delete-btn" data-id="${fb.id}" data-nome="${fb.nome}">
                            <i class="fas fa-trash-alt"></i> Excluir
                        </button>
                    </div>
                `;
                container.appendChild(card);
            });

            inicializarLikesDislikes();
            inicializarExclusao();

        } catch (erro) {
            console.error("Erro ao carregar feedbacks:", erro);
            const container = document.querySelector(".feedback-list");
            if (container) container.innerHTML = '<p style="color: red;">Erro ao carregar feedbacks. Verifique se o **server.js** está rodando.</p>';
        }
    }

    function inicializarExclusao() {
        document.querySelectorAll(".delete-btn").forEach(btn => {
            btn.addEventListener("click", (e) => { 
                const id = parseInt(e.currentTarget.dataset.id);
                const nome = e.currentTarget.dataset.nome;
                if (confirm(`Deseja realmente excluir o feedback de ${nome}?`)) {
                    excluirFeedback(id, nome);
                }
            });
        });
    }
    function inicializarLikesDislikes() {
        const extractCount = (btn) => {
            const textContent = btn.textContent.trim().replace(/[^0-9]/g, ''); 
            return parseInt(textContent) || 0;
        };

        const updateCount = (btn, newCount) => {
            const icon = btn.querySelector('i');
            btn.innerHTML = `${icon.outerHTML} ${newCount}`;
        };

        document.querySelectorAll('.like-dislike-controls').forEach(controls => {
            const likeBtn = controls.querySelector('.like-btn');
            const dislikeBtn = controls.querySelector('.dislike-btn');

            const handleInteraction = (clickedBtn, otherBtn) => {
                let clickedCount = extractCount(clickedBtn);
                let otherCount = extractCount(otherBtn);

                if (clickedBtn.classList.contains('active')) {
                    clickedBtn.classList.remove('active');
                    updateCount(clickedBtn, clickedCount - 1);
                } else {
                    clickedBtn.classList.add('active');
                    updateCount(clickedBtn, clickedCount + 1);
                    if (otherBtn.classList.contains('active')) {
                        otherBtn.classList.remove('active');
                        updateCount(otherBtn, otherCount - 1);
                    }
                }
               
            };

            if (likeBtn && dislikeBtn) {
                likeBtn.addEventListener('click', () => handleInteraction(likeBtn, dislikeBtn));
                dislikeBtn.addEventListener('click', () => handleInteraction(dislikeBtn, likeBtn));
            }
        });
    }

    carregarFeedbacks();
});