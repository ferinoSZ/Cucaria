(function () {
    const style = document.createElement('style');
    style.textContent = `
        .cc-modal {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(60, 45, 45, 0.45);
            z-index: 2000;
            align-items: center;
            justify-content: center;
            padding: 16px;
        }
        .cc-modal.ativo { display: flex; }
        .cc-modal-card {
            background: #fbf7f1;
            width: min(92vw, 420px);
            padding: 24px;
            border-radius: 16px;
            border: 1px solid #d8cec3;
            box-shadow: 0 12px 32px rgba(78, 51, 51, 0.2);
            font-family: Arial, sans-serif;
        }
        .cc-modal-titulo { color: #b87082; font-size: 1.2rem; margin-bottom: 12px; }
        .cc-modal-texto { color: #6f5648; font-size: 0.95rem; line-height: 1.4; margin-bottom: 20px; }
        .cc-modal-acoes { display: flex; gap: 10px; justify-content: flex-end; }
        .cc-modal-btn {
            padding: 10px 18px;
            border: none;
            border-radius: 10px;
            font-weight: bold;
            font-size: 0.92rem;
            cursor: pointer;
            transition: 0.3s;
        }
        .cc-modal-nao { background: #e7dccf; color: #6f5648; }
        .cc-modal-nao:hover { background: #dccdbb; }
        .cc-modal-sim { background: #c77d8b; color: white; }
        .cc-modal-sim:hover { background: #b3697a; }
    `;

    const modal = document.createElement('div');
    modal.className = 'cc-modal';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
        <div class="cc-modal-card" role="dialog" aria-modal="true">
            <h3 class="cc-modal-titulo"></h3>
            <p class="cc-modal-texto"></p>
            <div class="cc-modal-acoes">
                <button type="button" class="cc-modal-btn cc-modal-nao">Voltar</button>
                <button type="button" class="cc-modal-btn cc-modal-sim">Confirmar</button>
            </div>
        </div>
    `;

    let aoConfirmar = null;

    function fechar() {
        modal.classList.remove('ativo');
        modal.setAttribute('aria-hidden', 'true');
        aoConfirmar = null;
    }

    function montar() {
        document.head.appendChild(style);
        document.body.appendChild(modal);

        modal.querySelector('.cc-modal-nao').addEventListener('click', fechar);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) fechar();
        });
        modal.querySelector('.cc-modal-sim').addEventListener('click', () => {
            const acao = aoConfirmar;
            fechar();
            if (acao) acao();
        });
    }

    if (document.body) {
        montar();
    } else {
        document.addEventListener('DOMContentLoaded', montar);
    }

    window.confirmarAcao = function (titulo, texto, callback) {
        modal.querySelector('.cc-modal-titulo').textContent = titulo;
        modal.querySelector('.cc-modal-texto').textContent = texto;
        aoConfirmar = callback;
        modal.classList.add('ativo');
        modal.setAttribute('aria-hidden', 'false');
    };
})();
