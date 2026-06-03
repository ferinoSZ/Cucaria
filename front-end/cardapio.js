
const paginaInicial          = document.getElementById('paginaInicial');
const paginaCardapio         = document.getElementById('paginaCardapio');
const botaoVerCardapio       = document.getElementById('botaoVerCardapio');
const botaoVoltar            = document.getElementById('botaoVoltar');
const botaoCadastrar         = document.getElementById('botaoCadastrar');
const continerProdutos       = document.getElementById('continerProdutos');
const navAdm                 = document.getElementById('navAdm');
const toastNotificacao       = document.getElementById('toastNotificacao');

const modalConfirmacaoExclusao = document.getElementById('modalConfirmacaoExclusao');
const modalNomeProduto         = document.getElementById('modalNomeProduto');
const modalPrecoProduto        = document.getElementById('modalPrecoProduto');
const modalDescricaoProduto    = document.getElementById('modalDescricaoProduto');
const modalCancelarExclusao    = document.getElementById('modalCancelarExclusao');
const modalConfirmarExclusao   = document.getElementById('modalConfirmarExclusao');

const botaoCarrinho         = document.getElementById('botaoCarrinho');
const contadorCarrinho      = document.getElementById('contadorCarrinho');
const modalCarrinho         = document.getElementById('modalCarrinho');
const listaCarrinho         = document.getElementById('listaCarrinho');
const resumoCarrinho        = document.getElementById('resumoCarrinho');
const totalCarrinho         = document.getElementById('totalCarrinho');
const mensagemCarrinhoVazio = document.getElementById('mensagemCarrinhoVazio');
const botaoFecharCarrinho   = document.getElementById('botaoFecharCarrinho');
const botaoFinalizarPedido  = document.getElementById('botaoFinalizarPedido');

const modalEditarProduto       = document.getElementById('modalEditarProduto');
const formEditarProduto        = document.getElementById('formEditarProduto');
const editarIdProduto          = document.getElementById('editarIdProduto');
const editarNomeProduto        = document.getElementById('editarNomeProduto');
const editarDescricaoProduto   = document.getElementById('editarDescricaoProduto');
const editarPrecoVendaProduto  = document.getElementById('editarPrecoVendaProduto');
const editarPrecoProducaoProduto = document.getElementById('editarPrecoProducaoProduto');
const editarImagem             = document.getElementById('editarImagem');
const editarPreview            = document.getElementById('editarPreview');
const botaoCancelarEdicao      = document.getElementById('botaoCancelarEdicao');

let acaoConfirmarExclusao = null;
let carrinho = [];
let modoAdmAtivo = false;
let isClienteVip  = false;
let descontoVip   = 0;  
let produtos = [];

const API_URL        = '../back-end/produtos.php';
const API_PEDIDOS    = '../API/pedidos.php';
const API_SESSAO     = '../back-end/sessao_status.php';

async function verificarSessao() {
    try {
        const response = await fetch(API_SESSAO, { credentials: 'include' });
        const dados = await response.json();

        modoAdmAtivo  = dados.logado && dados.perfil === 'admin';
        isClienteVip  = dados.cliente_vip  ?? false;
        descontoVip   = dados.desconto_vip ?? 0;
        aplicarConfiguracaoModo();
    } catch (erro) {
        console.error('Erro ao verificar sessão:', erro);
        modoAdmAtivo = false;
        aplicarConfiguracaoModo();
    }
}

function aplicarConfiguracaoModo() {
    navAdm.style.display         = modoAdmAtivo ? 'block' : 'none';
    botaoCadastrar.style.display = modoAdmAtivo ? 'block' : 'none';
    atualizarVisibilidadeAcoesAdm();
}

function atualizarVisibilidadeAcoesAdm() {
    document.querySelectorAll('.botao-estoque').forEach(b => {
        b.style.display = modoAdmAtivo ? 'flex' : 'none';
    });
    document.querySelectorAll('.botao-excluir').forEach(b => {
        b.style.display = modoAdmAtivo ? 'flex' : 'none';
    });
    document.querySelectorAll('.botao-editar').forEach(b => {
        b.style.display = modoAdmAtivo ? 'flex' : 'none';
    });
    botaoCarrinho.style.display = !modoAdmAtivo ? 'flex' : 'none';
}

async function carregarProdutos() {
    try {
        const response = await fetch(API_URL);
        const dados = await response.json();

        produtos = dados.map(p => {
            const precoOriginal = Number(p.preco_venda);
            const precoFinal    = (isClienteVip && descontoVip > 0)
                ? precoOriginal * (1 - descontoVip / 100)
                : precoOriginal;

            return {
                id:             Number(p.id),
                nome:           p.nome,
                descricao:      p.descricao,
                preco:          precoFinal,
                precoProducao:  Number(p.preco_producao),
                emEstoque:      Number(p.ativo) === 1,
                imagem_url:     p.imagem_url
            };
        });

        renderizarProdutos();
    } catch (erro) {
        console.error('Erro ao carregar produtos:', erro);
    }
}

function renderizarProdutos() {
    continerProdutos.innerHTML = '';

    produtos.forEach(produto => {
        const cartao = document.createElement('div');
        cartao.className = 'cartao-produto';

        const cracha = produto.emEstoque
            ? '<span class="crachá cracha-em-estoque">Em estoque</span>'
            : '<span class="crachá cracha-esgotado">Esgotado</span>';

        const textoEstoque  = produto.emEstoque ? 'Esgotado' : 'Disponível';
        const classeEstoque = produto.emEstoque ? 'Esgotado' : 'Disponivel';

        const imgSrc = produto.imagem_url
            ? `../front-end/${produto.imagem_url}`
            : '';

        cartao.innerHTML = `
            <div class="imagem-produto">
                ${imgSrc
                    ? `<img src="${imgSrc}" alt="${produto.nome}">`
                    : `<i class="bi bi-image"></i>`
                }
                ${cracha}
            </div>
            <div class="informacoes-produto">
                <h3 class="nome-produto">${produto.nome}</h3>
                <p class="descricao-produto">${produto.descricao}</p>
                <p class="rotulo-preco-produto">PREÇO</p>
                <p class="preco-produto">R$ ${produto.preco.toFixed(2)}</p>
                <div class="acoes-produto">
                    <button class="botao-estoque ${classeEstoque}"
                        style="display:${modoAdmAtivo ? 'flex' : 'none'}">
                        ${textoEstoque}
                    </button>
                    <button class="botao-editar"
                        style="display:${modoAdmAtivo ? 'flex' : 'none'}">
                        <i class="fa-solid fa-pen"></i> Editar
                    </button>
                    <button class="botao-excluir"
                        style="display:${modoAdmAtivo ? 'flex' : 'none'}; gap:6px;">
                        <i class="fa-solid fa-trash"></i> Excluir
                    </button>
                    ${!modoAdmAtivo
                        ? `<button class="botao-adicionar-carrinho"
                               ${!produto.emEstoque ? 'disabled' : ''}>
                               <i class="fa-solid fa-cart-plus"></i> ${produto.emEstoque ? 'Adicionar' : 'Esgotado'}
                           </button>`
                        : ''
                    }
                </div>
            </div>
        `;

        cartao.querySelector('.botao-estoque')
            .addEventListener('click', () => alternarEstoqueProduto(produto.id));

        cartao.querySelector('.botao-editar')
            .addEventListener('click', () => abrirModalEdicao(produto));

        cartao.querySelector('.botao-excluir')
            .addEventListener('click', () => excluirProduto(produto.id));

        const btnCarrinho = cartao.querySelector('.botao-adicionar-carrinho');
        if (btnCarrinho) {
            btnCarrinho.addEventListener('click', () => adicionarAoCarrinho(produto));
        }

        continerProdutos.appendChild(cartao);
    });
}

async function alternarEstoqueProduto(produtoId) {
    const produto = produtos.find(p => p.id === produtoId);
    if (!produto) return;

    const novoStatus = produto.emEstoque ? 0 : 1;

    try {
        const resposta = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ acao: 'mudarStatus', id: produtoId, status: novoStatus })
        });

        const dados = await resposta.json();

        if (dados.sucesso) {
            produto.emEstoque = !produto.emEstoque;
            renderizarProdutos();
            mostrarToast(produto.emEstoque ? 'Produto marcado como disponível!' : 'Produto marcado como esgotado!');
        } else {
            alert('Erro ao alterar estoque.');
        }
    } catch (erro) {
        console.error('Erro:', erro);
    }
}

async function excluirProduto(produtoId) {
    const produto = produtos.find(p => p.id === produtoId);
    if (!produto) return;

    abrirModalConfirmacaoExclusao(produto, async () => {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ acao: 'excluir', id: produtoId })
            });

            const resultado = await response.json();

            if (resultado.success) {
                await carregarProdutos();
                mostrarToast('Produto excluído com sucesso!');
            } else {
                alert('Erro ao excluir produto.');
            }
        } catch (erro) {
            console.error('Erro ao excluir:', erro);
        }
    });
}

function abrirModalConfirmacaoExclusao(produto, onConfirmar) {
    modalNomeProduto.textContent      = produto.nome;
    modalPrecoProduto.textContent     = `R$ ${produto.preco.toFixed(2)}`;
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

function abrirModalEdicao(produto) {
    editarIdProduto.value              = produto.id;
    editarNomeProduto.value            = produto.nome;
    editarDescricaoProduto.value       = produto.descricao;
    editarPrecoVendaProduto.value      = produto.preco.toFixed(2);
    editarPrecoProducaoProduto.value   = produto.precoProducao.toFixed(2);

    if (produto.imagem_url) {
        editarPreview.src = `../front-end/${produto.imagem_url}`;
        editarPreview.classList.add('visible');
    } else {
        editarPreview.src = '';
        editarPreview.classList.remove('visible');
    }

    editarImagem.value = '';

    modalEditarProduto.classList.add('ativo');
    modalEditarProduto.setAttribute('aria-hidden', 'false');
}

function fecharModalEdicao() {
    modalEditarProduto.classList.remove('ativo');
    modalEditarProduto.setAttribute('aria-hidden', 'true');
    formEditarProduto.reset();
    editarPreview.src = '';
    editarPreview.classList.remove('visible');
}

editarImagem.addEventListener('change', function () {
    const arquivo = this.files[0];
    if (!arquivo) return;
    const url = URL.createObjectURL(arquivo);
    editarPreview.src = url;
    editarPreview.classList.add('visible');
});

formEditarProduto.addEventListener('submit', async function (e) {
    e.preventDefault();

    const id            = Number(editarIdProduto.value);
    const nome          = editarNomeProduto.value.trim();
    const descricao     = editarDescricaoProduto.value.trim();
    const precoVenda    = Number(editarPrecoVendaProduto.value);
    const precoProducao = Number(editarPrecoProducaoProduto.value);
    const arquivo       = editarImagem.files[0];

    try {
        let imagemUrl = null;

        if (arquivo) {
            const formData = new FormData();
            formData.append('acao',         'uploadImagem');
            formData.append('imagem',       arquivo);

            const uploadResp = await fetch(API_URL, { method: 'POST', body: formData });
            const uploadDados = await uploadResp.json();

            if (!uploadDados.imagem_url) {
                alert('Erro ao enviar nova imagem.');
                return;
            }
            imagemUrl = uploadDados.imagem_url;
        } else {
            const produtoAtual = produtos.find(p => p.id === id);
            imagemUrl = produtoAtual ? produtoAtual.imagem_url : '';
        }

        const response = await fetch(API_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id,
                nome,
                descricao,
                preco_venda:    precoVenda,
                preco_producao: precoProducao,
                imagem_url:     imagemUrl
            })
        });

        const resultado = await response.json();

        if (resultado.success) {
            fecharModalEdicao();
            await carregarProdutos();
            mostrarToast('Produto atualizado com sucesso!');
        } else {
            alert('Erro ao salvar alterações.');
        }
    } catch (erro) {
        console.error('Erro ao editar produto:', erro);
        alert('Erro ao conectar com a API.');
    }
});

function irParaCardapio() {
    paginaInicial.classList.remove('ativa');
    paginaCardapio.classList.add('ativa');
    window.scrollTo(0, 0);
}

function voltarParaInicial() {
    paginaCardapio.classList.remove('ativa');
    paginaInicial.classList.add('ativa');
    window.scrollTo(0, 0);
}

function adicionarAoCarrinho(produto) {
    const item = carrinho.find(i => i.id === produto.id);
    if (item) {
        item.quantidade += 1;
    } else {
        carrinho.push({ ...produto, quantidade: 1 });
    }
    mostrarToast(`${produto.nome} adicionado ao carrinho!`);
    atualizarCarrinho();
}

function removerDoCarrinho(produtoId) {
    const idx = carrinho.findIndex(i => i.id === produtoId);
    if (idx > -1) {
        carrinho[idx].quantidade -= 1;
        if (carrinho[idx].quantidade <= 0) carrinho.splice(idx, 1);
    }
    atualizarCarrinho();
}

function atualizarCarrinho() {
    contadorCarrinho.textContent = carrinho.reduce((t, i) => t + i.quantidade, 0);
    renderizarCarrinho();
}

function renderizarCarrinho() {
    listaCarrinho.innerHTML = '';

    if (carrinho.length === 0) {
        mensagemCarrinhoVazio.style.display = 'block';
        resumoCarrinho.style.display        = 'none';
        botaoFinalizarPedido.style.display  = 'none';
        return;
    }

    mensagemCarrinhoVazio.style.display = 'none';
    resumoCarrinho.style.display        = 'block';
    botaoFinalizarPedido.style.display  = 'block';

    let total = 0;

    carrinho.forEach(item => {
        total += item.preco * item.quantidade;

        listaCarrinho.insertAdjacentHTML('beforeend', `
            <div class="item-carrinho">
                <div class="info-item">
                    <h4>${item.nome}</h4>
                    <p class="preco-item">R$ ${item.preco.toFixed(2)} x ${item.quantidade}</p>
                </div>
                <div class="acoes-item">
                    <button class="botao-menos" data-produto-id="${item.id}">-</button>
                    <span class="quantidade-item">${item.quantidade}</span>
                    <button class="botao-mais" data-produto-id="${item.id}">+</button>
                    <button class="botao-remover-item" data-produto-id="${item.id}">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `);
    });

    totalCarrinho.textContent = `R$ ${total.toFixed(2)}`;

    listaCarrinho.querySelectorAll('.botao-mais').forEach(b => {
        b.addEventListener('click', () => {
            const p = produtos.find(p => p.id === parseInt(b.dataset.produtoId));
            if (p) adicionarAoCarrinho(p);
        });
    });

    listaCarrinho.querySelectorAll('.botao-menos').forEach(b => {
        b.addEventListener('click', () => removerDoCarrinho(parseInt(b.dataset.produtoId)));
    });

    listaCarrinho.querySelectorAll('.botao-remover-item').forEach(b => {
        b.addEventListener('click', () => {
            const idx = carrinho.findIndex(i => i.id === parseInt(b.dataset.produtoId));
            if (idx > -1) { carrinho.splice(idx, 1); atualizarCarrinho(); }
        });
    });
}

function abrirModalCarrinho()  {
    modalCarrinho.classList.add('ativo');
    modalCarrinho.setAttribute('aria-hidden', 'false');
}

function fecharModalCarrinho() {
    modalCarrinho.classList.remove('ativo');
    modalCarrinho.setAttribute('aria-hidden', 'true');
}

function mostrarToast(mensagem) {
    toastNotificacao.textContent = mensagem;
    toastNotificacao.classList.add('ativo');
    setTimeout(() => toastNotificacao.classList.remove('ativo'), 3000);
}

botaoFinalizarPedido.addEventListener('click', async () => {
    if (carrinho.length === 0) { alert('Carrinho vazio!'); return; }

    const total = carrinho.reduce((t, i) => t + (i.preco * i.quantidade), 0);

    try {
        const response = await fetch(API_PEDIDOS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itens: carrinho, total })
        });

        const resultado = await response.json();

        if (resultado.success) {
            let mensagem = `🧾 Pedido ${resultado.numero}\n\n`;
            carrinho.forEach(i => {
                mensagem += `• ${i.nome} x${i.quantidade} - R$ ${(i.preco * i.quantidade).toFixed(2)}\n`;
            });
            mensagem += `\n💰 Total: R$ ${total.toFixed(2)}`;

            const telefone = '5547984246239';
            window.open(`https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`, '_blank');

            carrinho = [];
            atualizarCarrinho();
            fecharModalCarrinho();
        } else {
            alert('Erro ao finalizar pedido.');
        }
    } catch (erro) {
        console.error('Erro ao enviar pedido:', erro);
        alert('Erro ao conectar com a API.');
    }
});

botaoVerCardapio.addEventListener('click', irParaCardapio);
botaoVoltar.addEventListener('click', voltarParaInicial);

modalCancelarExclusao.addEventListener('click', fecharModalConfirmacaoExclusao);
modalConfirmarExclusao.addEventListener('click', () => {
    if (acaoConfirmarExclusao) acaoConfirmarExclusao();
    fecharModalConfirmacaoExclusao();
});
modalConfirmacaoExclusao.addEventListener('click', e => {
    if (e.target === modalConfirmacaoExclusao) fecharModalConfirmacaoExclusao();
});

botaoCarrinho.addEventListener('click', abrirModalCarrinho);
botaoFecharCarrinho.addEventListener('click', fecharModalCarrinho);
modalCarrinho.addEventListener('click', e => {
    if (e.target === modalCarrinho) fecharModalCarrinho();
});

botaoCancelarEdicao.addEventListener('click', fecharModalEdicao);
modalEditarProduto.addEventListener('click', e => {
    if (e.target === modalEditarProduto) fecharModalEdicao();
});

window.addEventListener('load', async () => {
    await verificarSessao();
    await carregarProdutos();
});