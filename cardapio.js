// ===== ELEMENTOS DO DOM =====
const paginaInicial = document.getElementById('paginaInicial');
const paginaCardapio = document.getElementById('paginaCardapio');
const botaoVerCardapio = document.getElementById('botaoVerCardapio');
const botaoVoltar = document.getElementById('botaoVoltar');
const botaoCadastrar = document.getElementById('botaoCadastrar');
const continerProdutos = document.getElementById('continerProdutos');
const navAdm = document.getElementById('navAdm');

// ===== CONFIGURAÇÃO DE MODO ADM =====
// Variável para controlar o estado do modo ADM
let modoAdmAtivo = false;

// ===== APLICAR CONFIGURAÇÕES DO MODO ADM =====
function aplicarConfiguracaoModo() {
    // Mostrar/esconder nav ADM
    navAdm.style.display = modoAdmAtivo ? 'block' : 'none';
    
    // Mostrar/esconder botão de cadastrar
    botaoCadastrar.style.display = modoAdmAtivo ? 'block' : 'none';
    
    // Mostrar/esconder botões de estoque
    atualizarVisibilidadeBotoesEstoque();
}

function atualizarVisibilidadeBotoesEstoque() {
    const botoesEstoque = document.querySelectorAll('.botao-estoque');
    botoesEstoque.forEach(botao => {
        botao.style.display = modoAdmAtivo ? 'block' : 'none';
    });
}

// ===== PRODUTOS DE TESTE =====
const produtos = [
    {
        id: 1,
        nome: 'Cuca de Banana',
        descricao: 'Massa foinha com banana caramelizada e farofa doce.',
        preco: 28.00,
        emEstoque: true
    },
    {
        id: 2,
        nome: 'Cuca de Uva',
        descricao: 'Receita tradicional com uvas frescas e farofa crocante.',
        preco: 32.00,
        emEstoque: false
    },
    {
        id: 3,
        nome: 'Cuca de Cenoura',
        descricao: 'Massa foinha com cenoura ralada e farofa doce.',
        preco: 30.00,
        emEstoque: true
    }
];

// ===== FUNÇÕES DE NAVEGAÇÃO =====
function irParaCardapio() {
    console.log('Clicou em "Ver Cardápio"');
    paginaInicial.classList.remove('ativa');
    paginaCardapio.classList.add('ativa');
    window.scrollTo(0, 0);
}

function voltarParaInicial() {
    console.log('Voltando para a página inicial');
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
                ${crachá}
            </div>
            <div class="informacoes-produto">
                <h3 class="nome-produto">${produto.nome}</h3>
                <p class="descricao-produto">${produto.descricao}</p>
                <p class="rotulo-preco-produto">PREÇO</p>
                <p class="preco-produto">R$ ${produto.preco.toFixed(2)}</p>
                <div class="acoes-produto">
                    <button class="botao-estoque ${classEstoque}" data-produto-id="${produto.id}" style="display: ${modoAdmAtivo ? 'block' : 'none'};">
                        ${textoEstoque}
                    </button>
                </div>
            </div>
        `;
        
        // Adicionar evento ao botão de estoque
        const botaoEstoque = cartaoProduto.querySelector('.botao-estoque');
        botaoEstoque.addEventListener('click', () => {
            alternarEstoqueProduto(produto.id);
        });
        
        continerProdutos.appendChild(cartaoProduto);
    });
    
    // Aplicar configurações de modo
    aplicarConfiguracaoModo();
}

// ===== FUNÇÕES DE ESTOQUE =====
function alternarEstoqueProduto(produtoId) {
    const produto = produtos.find(p => p.id === produtoId);
    if (produto) {
        produto.emEstoque = !produto.emEstoque;
        renderizarProdutos();
    }
}

// ===== EVENT LISTENERS =====
botaoVerCardapio.addEventListener('click', irParaCardapio);
botaoVoltar.addEventListener('click', voltarParaInicial);

// ===== INICIALIZAÇÃO =====
window.addEventListener('load', () => {
    console.log('Página carregada!');
    console.log('Modo ADM:', modoAdmAtivo ? 'ATIVADO' : 'DESATIVADO');
    renderizarProdutos();
});
