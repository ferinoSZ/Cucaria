// ===== ELEMENTOS DO DOM =====
const paginaInicial = document.getElementById('paginaInicial');
const paginaCardapio = document.getElementById('paginaCardapio');
const botaoVerCardapio = document.getElementById('botaoVerCardapio');
const botaoVoltar = document.getElementById('botaoVoltar');
const botaoCadastrar = document.getElementById('botaoCadastrar');
const continerProdutos = document.getElementById('continerProdutos');
const navAdm = document.getElementById('navAdm');
const modalConfirmacaoExclusao = document.getElementById('modalConfirmacaoExclusao');
const modalNomeProduto = document.getElementById('modalNomeProduto');
const modalPrecoProduto = document.getElementById('modalPrecoProduto');
const modalDescricaoProduto = document.getElementById('modalDescricaoProduto');
const modalCancelarExclusao = document.getElementById('modalCancelarExclusao');
const modalConfirmarExclusao = document.getElementById('modalConfirmarExclusao');
const botaoCarrinho = document.getElementById('botaoCarrinho');
const contadorCarrinho = document.getElementById('contadorCarrinho');
const modalCarrinho = document.getElementById('modalCarrinho');
const listaCarrinho = document.getElementById('listaCarrinho');
const resumoCarrinho = document.getElementById('resumoCarrinho');
const totalCarrinho = document.getElementById('totalCarrinho');
const mensagemCarrinhoVazio = document.getElementById('mensagemCarrinhoVazio');
const botaoFecharCarrinho = document.getElementById('botaoFecharCarrinho');
const botaoFinalizarPedido = document.getElementById('botaoFinalizarPedido');
const toastNotificacao = document.getElementById('toastNotificacao');

let acaoConfirmarExclusao = null;
let carrinho = [];

// ===== CONFIGURAÇÃO DE MODO ADM =====
// Variável para controlar o estado do modo ADM
let modoAdmAtivo = false; // Defina como true para ativar o modo ADM, false para desativar

// ===== APLICAR CONFIGURAÇÕES DO MODO ADM =====
function aplicarConfiguracaoModo() {
    // Mostrar/esconder nav ADM
    navAdm.style.display = modoAdmAtivo ? 'block' : 'none';
    
    // Mostrar/esconder botão de cadastrar
    botaoCadastrar.style.display = modoAdmAtivo ? 'block' : 'none';
    
    // Mostrar/esconder ações administrativas dos cards
    atualizarVisibilidadeAcoesAdm();
}

function atualizarVisibilidadeAcoesAdm() {
    const botoesEstoque = document.querySelectorAll('.botao-estoque');
    botoesEstoque.forEach(botao => {
        botao.style.display = modoAdmAtivo ? 'block' : 'none';
    });

    const botoesExcluir = document.querySelectorAll('.botao-excluir');
    botoesExcluir.forEach(botao => {
        botao.style.display = modoAdmAtivo ? 'block' : 'none';
    });

    const botoesCarrinho = document.querySelectorAll('.botao-adicionar-carrinho');
    botoesCarrinho.forEach(botao => {
        botao.style.display = !modoAdmAtivo ? 'block' : 'none';
    });

    botaoCarrinho.style.display = !modoAdmAtivo ? 'block' : 'none';
}

// ===== CONFIG =====
const API_URL = "http://localhost/Cucaria/back-end/produtos.php";
let produtos = [];

// ===== API =====
async function carregarProdutos() {
    try {
        const response = await fetch(API_URL);
        const dados = await response.json();

        console.log("Dados da API:", dados);

        produtos = dados.map(p => ({
            id: Number(p.id),
            nome: p.nome,
            descricao: p.descricao,
            preco: Number(p.preco_venda),
            emEstoque: Number(p.ativo) === 1,
            imagem_url: p.imagem_url
        }));

        renderizarProdutos(); // ✅ mantém seu fluxo

    } catch (erro) {
        console.error("Erro ao carregar produtos:", erro);
    }
}
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
        
        const botaoCarrinhoHtml = produto.emEstoque && !modoAdmAtivo
            ? `<button class="botao-adicionar-carrinho" data-produto-id="${produto.id}" style="display: ${!modoAdmAtivo ? 'block' : 'none'};"><i class="fa-solid fa-cart-plus"></i> Adicionar</button>`
            : '';

        cartaoProduto.innerHTML = `
           <div class="imagem-produto">
                <img src="http://localhost/Cucaria/front-end/${produto.imagem_url}" 
                    alt="${produto.nome}">
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
                    <button class="botao-excluir" data-produto-id="${produto.id}" style="display: ${modoAdmAtivo ? 'block' : 'none'};">
                        Excluir item
                    </button>
                    ${botaoCarrinhoHtml}
                </div>
            </div>
        `;
        
        // Adicionar evento ao botão de estoque
        const botaoEstoque = cartaoProduto.querySelector('.botao-estoque');
        botaoEstoque.addEventListener('click', () => {
            alternarEstoqueProduto(produto.id);
        });

        const botaoExcluir = cartaoProduto.querySelector('.botao-excluir');
        botaoExcluir.addEventListener('click', () => {
            excluirProduto(produto.id);
        });

        const botaoAdicionarCarrinho = cartaoProduto.querySelector('.botao-adicionar-carrinho');
        if (botaoAdicionarCarrinho) {
            botaoAdicionarCarrinho.addEventListener('click', () => {
                adicionarAoCarrinho(produto);
            });
        }
        
        continerProdutos.appendChild(cartaoProduto);
    });
    
    // Aplicar configurações de modo
    aplicarConfiguracaoModo();
}

async function alternarEstoqueProduto(produtoId) {
    const produto = produtos.find(p => p.id === produtoId);

    if (!produto) return;

    const novoStatus = produto.emEstoque ? 0 : 1;

    await fetch(API_URL, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            id: produto.id,
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

async function excluirProduto(produtoId) {
    const indiceProduto = produtos.findIndex(p => p.id === produtoId);

    if (indiceProduto === -1) return;

    const produto = produtos[indiceProduto];

    abrirModalConfirmacaoExclusao(produto, async () => {

        await fetch(API_URL, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ id: produtoId })
        });

        carregarProdutos(); 
    });
}

function abrirModalConfirmacaoExclusao(produto, onConfirmar) {
    modalNomeProduto.textContent = produto.nome;
    modalPrecoProduto.textContent = `R$ ${produto.preco.toFixed(2)}`;
    modalDescricaoProduto.textContent = produto.descricao;
    acaoConfirmarExclusao = onConfirmar;

    modalConfirmacaoExclusao.classList.add('ativo');
    modalConfirmacaoExclusao.setAttribute('aria-hidden', 'false');
}

function fecharModalConfirmacaoExclusao() {
    modalConfirmacaoExclusao.classList.remove('ativo');
    modalConfirmacaoExclusao.setAttribute('aria-hidden', 'true');
    acaoConfirmarExclusao = null;
}

// ===== FUNÇÕES DE CARRINHO =====
function adicionarAoCarrinho(produto) {
    const itemExistente = carrinho.find(item => item.id === produto.id);
    
    if (itemExistente) {
        itemExistente.quantidade += 1;
    } else {
        carrinho.push({ ...produto, quantidade: 1 });
    }
    
    mostrarToast(`${produto.nome} adicionado ao carrinho!`);
    atualizarCarrinho();
}

function removerDoCarrinho(produtoId) {
    const indice = carrinho.findIndex(item => item.id === produtoId);
    if (indice > -1) {
        carrinho[indice].quantidade -= 1;
        if (carrinho[indice].quantidade <= 0) {
            carrinho.splice(indice, 1);
        }
    }
    atualizarCarrinho();
}

function atualizarCarrinho() {
    contadorCarrinho.textContent = carrinho.reduce((total, item) => total + item.quantidade, 0);
    renderizarCarrinho();
}

function renderizarCarrinho() {
    listaCarrinho.innerHTML = '';
    
    if (carrinho.length === 0) {
        mensagemCarrinhoVazio.style.display = 'block';
        resumoCarrinho.style.display = 'none';
        botaoFinalizarPedido.style.display = 'none';
        return;
    }
    
    mensagemCarrinhoVazio.style.display = 'none';
    resumoCarrinho.style.display = 'block';
    botaoFinalizarPedido.style.display = 'block';
    
    let total = 0;
    
    carrinho.forEach(item => {
        const subtotal = item.preco * item.quantidade;
        total += subtotal;
        
        const itemHTML = `
            <div class="item-carrinho">
                <div class="info-item">
                    <h4>${item.nome}</h4>
                    <p class="preco-item">R$ ${item.preco.toFixed(2)} x ${item.quantidade}</p>
                </div>
                <div class="acoes-item">
                    <button class="botao-menos" data-produto-id="${item.id}">-</button>
                    <span class="quantidade-item">${item.quantidade}</span>
                    <button class="botao-mais" data-produto-id="${item.id}">+</button>
                    <button class="botao-remover-item" data-produto-id="${item.id}"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `;
        listaCarrinho.insertAdjacentHTML('beforeend', itemHTML);
    });
    
    totalCarrinho.textContent = `R$ ${total.toFixed(2)}`;
    
    // Adicionar event listeners aos botões de quantidade
    document.querySelectorAll('.botao-mais').forEach(botao => {
        botao.addEventListener('click', () => {
            const produtoId = parseInt(botao.dataset.produtoId);
            const produto = produtos.find(p => p.id === produtoId);
            if (produto) adicionarAoCarrinho(produto);
        });
    });
    
    document.querySelectorAll('.botao-menos').forEach(botao => {
        botao.addEventListener('click', () => {
            const produtoId = parseInt(botao.dataset.produtoId);
            removerDoCarrinho(produtoId);
        });
    });
    
    document.querySelectorAll('.botao-remover-item').forEach(botao => {
        botao.addEventListener('click', () => {
            const produtoId = parseInt(botao.dataset.produtoId);
            const indice = carrinho.findIndex(item => item.id === produtoId);
            if (indice > -1) {
                carrinho.splice(indice, 1);
                atualizarCarrinho();
            }
        });
    });
}

function abrirModalCarrinho() {
    modalCarrinho.classList.add('ativo');
    modalCarrinho.setAttribute('aria-hidden', 'false');
}

function mostrarToast(mensagem) {
    toastNotificacao.textContent = mensagem;
    toastNotificacao.classList.add('ativo');
    
    setTimeout(() => {
        toastNotificacao.classList.remove('ativo');
    }, 3000);
}

function fecharModalCarrinho() {
    modalCarrinho.classList.remove('ativo');
    modalCarrinho.setAttribute('aria-hidden', 'true');
}

// ===== EVENT LISTENERS =====
botaoVerCardapio.addEventListener('click', irParaCardapio);
botaoVoltar.addEventListener('click', voltarParaInicial);

modalCancelarExclusao.addEventListener('click', fecharModalConfirmacaoExclusao);
modalConfirmarExclusao.addEventListener('click', () => {
    if (acaoConfirmarExclusao) {
        acaoConfirmarExclusao();
    }
    fecharModalConfirmacaoExclusao();
});

modalConfirmacaoExclusao.addEventListener('click', (event) => {
    if (event.target === modalConfirmacaoExclusao) {
        fecharModalConfirmacaoExclusao();
    }
});

botaoCarrinho.addEventListener('click', abrirModalCarrinho);
botaoFecharCarrinho.addEventListener('click', fecharModalCarrinho);

modalCarrinho.addEventListener('click', (event) => {
    if (event.target === modalCarrinho) {
        fecharModalCarrinho();
    }
});

const API_PEDIDOS = "http://localhost/Cucaria/back-end/pedidos.php";

botaoFinalizarPedido.addEventListener('click', async () => {

    if (carrinho.length === 0) {
        alert("Carrinho vazio!");
        return;
    }

    const total = carrinho.reduce((t, i) => t + (i.preco * i.quantidade), 0);

    try {
        const response = await fetch(API_PEDIDOS, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                itens: carrinho,
                total: total
            })
        });

        const resultado = await response.json();

        if (resultado.success) {

            // 🧾 montar mensagem
            let mensagem = `🧾 Pedido ${resultado.numero}\n\n`;

            carrinho.forEach(item => {
                mensagem += `• ${item.nome} x${item.quantidade} - R$ ${(item.preco * item.quantidade).toFixed(2)}\n`;
            });

            mensagem += `\n💰 Total: R$ ${total.toFixed(2)}`;

            // 📲 WhatsApp
            const telefone = "5547984246239"; // <-- COLOCA SEU NÚMERO AQUI
            const url = `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;

            window.open(url, "_blank");

            // limpar carrinho (igual você já fazia)
            carrinho = [];
            atualizarCarrinho();
            fecharModalCarrinho();

        } else {
            alert("Erro ao finalizar pedido");
        }

    } catch (erro) {
        console.error("Erro ao enviar pedido:", erro);
        alert("Erro ao conectar com a API");
    }
});

window.addEventListener('load', () => {
    console.log('Página carregada!');
    console.log('Modo ADM:', modoAdmAtivo ? 'ATIVADO' : 'DESATIVADO');
    carregarProdutos(); 
});