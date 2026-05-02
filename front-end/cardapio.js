// ===== ELEMENTOS DO DOM =====
const paginaInicial = document.getElementById('paginaInicial');
const paginaCardapio = document.getElementById('paginaCardapio');
const botaoVerCardapio = document.getElementById('botaoVerCardapio');
const botaoVoltar = document.getElementById('botaoVoltar');
const botaoCadastrar = document.getElementById('botaoCadastrar');
const continerProdutos = document.getElementById('continerProdutos');
const navAdm = document.getElementById('navAdm');

// ===== CONFIG API =====
const API_URL = "http://localhost/Cucaria/back-end/produtos.php";
let produtos = [];

// ===== CONFIGURAÇÃO DE MODO ADM =====
let modoAdmAtivo = false;

// ===== BUSCAR PRODUTOS DA API =====
async function carregarProdutos() {
    try {
        const response = await fetch(API_URL);
        const dados = await response.json();

        produtos = dados.map(p => ({
            id: p.id,
            nome: p.nome,
            descricao: p.descricao,
            preco: parseFloat(p.preco_venda),
            emEstoque: p.ativo == 1,
            imagem_url: p.imagem_url // 🔥 CORREÇÃO PRINCIPAL
        }));

        console.log(produtos); // debug

        renderizarProdutos();

    } catch (erro) {
        console.error("Erro ao carregar produtos:", erro);
    }
}

// ===== ALTERAR STATUS NO BANCO =====
async function alternarEstoqueProduto(produtoId) {
    const produto = produtos.find(p => p.id === produtoId);

    if (produto) {
        const novoStatus = produto.emEstoque ? 0 : 1;

        await fetch(API_URL, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: produtoId,
                nome: produto.nome,
                preco_venda: produto.preco,
                preco_producao: 0,
                descricao: produto.descricao,
                imagem_url: produto.imagem_url,
                ativo: novoStatus
            })
        });

        carregarProdutos();
    }
}

// ===== APLICAR CONFIGURAÇÕES DO MODO ADM =====
function aplicarConfiguracaoModo() {
    navAdm.style.display = modoAdmAtivo ? 'block' : 'none';
    botaoCadastrar.style.display = modoAdmAtivo ? 'block' : 'none';
    atualizarVisibilidadeBotoesEstoque();
}

function atualizarVisibilidadeBotoesEstoque() {
    const botoesEstoque = document.querySelectorAll('.botao-estoque');
    botoesEstoque.forEach(botao => {
        botao.style.display = modoAdmAtivo ? 'block' : 'none';
    });
}

// ===== FUNÇÕES DE NAVEGAÇÃO =====
function irParaCardapio() {
    paginaInicial.classList.remove('ativa');
    paginaCardapio.classList.add('ativa');
    window.scrollTo(0, 0);

    carregarProdutos();
}

function voltarParaInicial() {
    paginaCardapio.classList.remove('ativa');
    paginaInicial.classList.add('ativa');
    window.scrollTo(0, 0);
}

// ===== RENDERIZAÇÃO DE PRODUTOS =====
function renderizarProdutos() {
    continerProdutos.innerHTML = '';
    
    produtos.forEach(produto => {
        const cartaoProduto = document.createElement('div');
        cartaoProduto.className = 'cartao-produto';
        
        const crachá = produto.emEstoque 
            ? '<span class="crachá cracha-em-estoque">Em estoque</span>'
            : '<span class="crachá cracha-esgotado">Esgotado</span>';
        
        const textoEstoque = produto.emEstoque 
            ? 'Marcar esgotado'
            : 'Marcar disponível';
        
        const classEstoque = produto.emEstoque 
            ? 'marcar-esgotado'
            : 'marcar-disponivel';
        
        cartaoProduto.innerHTML = `
            <div class="imagem-produto">
                <img src="http://localhost/Cucaria/front-end/${produto.imagem_url}" 
                     alt="${produto.nome}"
                     onerror="this.src='img/sem-imagem.png'">
                ${crachá}
            </div>

            <div class="informacoes-produto">
                <h3 class="nome-produto">${produto.nome}</h3>
                <p class="descricao-produto">${produto.descricao}</p>
                <p class="rotulo-preco-produto">PREÇO</p>
                <p class="preco-produto">R$ ${produto.preco.toFixed(2)}</p>
                <div class="acoes-produto">
                    <button class="botao-estoque ${classEstoque}" 
                        data-produto-id="${produto.id}" 
                        style="display: ${modoAdmAtivo ? 'block' : 'none'};">
                        ${textoEstoque}
                    </button>
                </div>
            </div>
        `;
        
        const botaoEstoque = cartaoProduto.querySelector('.botao-estoque');
        botaoEstoque.addEventListener('click', () => {
            alternarEstoqueProduto(produto.id);
        });
        
        continerProdutos.appendChild(cartaoProduto);
    });
    
    aplicarConfiguracaoModo();
}

// ===== EVENT LISTENERS =====
botaoVerCardapio.addEventListener('click', irParaCardapio);
botaoVoltar.addEventListener('click', voltarParaInicial);

// ===== INICIALIZAÇÃO =====
window.addEventListener('load', () => {
    console.log('Página carregada!');
});