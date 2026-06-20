
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

const botaoSair = document.getElementById('botaoSair');
const botaoCarrinho         = document.getElementById('botaoCarrinho');
const contadorCarrinho      = document.getElementById('contadorCarrinho');
const modalCarrinho         = document.getElementById('modalCarrinho');
const listaCarrinho         = document.getElementById('listaCarrinho');
const resumoCarrinho        = document.getElementById('resumoCarrinho');
const totalCarrinho         = document.getElementById('totalCarrinho');
const mensagemCarrinhoVazio = document.getElementById('mensagemCarrinhoVazio');
const botaoFecharCarrinho   = document.getElementById('botaoFecharCarrinho');
const botaoFinalizarPedido  = document.getElementById('botaoFinalizarPedido');
const dadosEntregaCarrinho  = document.getElementById('dadosEntregaCarrinho');
const telefoneContato       = document.getElementById('telefoneContato');
const grupoEndereco         = document.getElementById('grupoEndereco');
const enderecoEntrega       = document.getElementById('enderecoEntrega');
const pontoReferencia       = document.getElementById('pontoReferencia');
const dataEntrega           = document.getElementById('dataEntrega');
const formaPagamento        = document.getElementById('formaPagamento');
const botaoMeusPedidos      = document.getElementById('botaoMeusPedidos');
const radiosTipoEntrega     = document.querySelectorAll('input[name="tipoEntrega"]');

const modalPedidoConfirmado       = document.getElementById('modalPedidoConfirmado');
const numeroPedidoConfirmado      = document.getElementById('numeroPedidoConfirmado');
const botaoFecharPedidoConfirmado = document.getElementById('botaoFecharPedidoConfirmado');

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
const editarCategoria          = document.getElementById('editarCategoria');

const botaoCategorias          = document.getElementById('botaoCategorias');
const filtrosCategoria         = document.getElementById('filtrosCategoria');
const modalCategorias          = document.getElementById('modalCategorias');
const novaCategoria            = document.getElementById('novaCategoria');
const botaoAdicionarCategoria  = document.getElementById('botaoAdicionarCategoria');
const listaCategorias          = document.getElementById('listaCategorias');
const botaoFecharCategorias    = document.getElementById('botaoFecharCategorias');

let acaoConfirmarExclusao = null;
let carrinho = [];
let modoAdmAtivo = false;
let estaLogado   = false;
let isClienteVip  = false;
let descontoVip   = 0;
let produtos = [];
let categorias = [];
let categoriaSelecionada = 'todas';
let categoriaEditandoId = null;

const API_URL        = '../back-end/produtos.php';
const API_PEDIDOS    = '../API/pedidos.php';
const API_SESSAO     = '../back-end/sessao_status.php';
const API_CATEGORIAS = '../back-end/categorias.php';

function escapeHtml(texto) {
    const div = document.createElement('div');
    div.textContent = texto ?? '';
    return div.innerHTML;
}

async function verificarSessao() {
    try {
        const response = await fetch(API_SESSAO, { credentials: 'include' });
        const dados = await response.json();

        // Cardápio exige login: quem não estiver logado vai para o login.
        if (!dados.logado) {
            window.location.replace('login.html');
            return false;
        }

        estaLogado    = true;
        modoAdmAtivo  = dados.perfil === 'admin';
        isClienteVip  = dados.cliente_vip  ?? false;
        descontoVip   = dados.desconto_vip ?? 0;
        aplicarConfiguracaoModo();
        return true;
    } catch (erro) {
        console.error('Erro ao verificar sessão:', erro);
        window.location.replace('login.html');
        return false;
    }
}

function aplicarConfiguracaoModo() {
    navAdm.style.display         = modoAdmAtivo ? 'block' : 'none';
    botaoCadastrar.style.display = modoAdmAtivo ? 'block' : 'none';
    botaoCategorias.style.display = modoAdmAtivo ? 'block' : 'none';
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
    botaoSair.style.display     = !modoAdmAtivo ? 'flex' : 'none';
    botaoMeusPedidos.style.display = (!modoAdmAtivo && estaLogado) ? 'flex' : 'none';
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
                imagem_url:     p.imagem_url,
                categoriaId:    p.categoria_id !== null ? Number(p.categoria_id) : null
            };
        });

        renderizarFiltros();
        renderizarProdutos();
    } catch (erro) {
        console.error('Erro ao carregar produtos:', erro);
    }
}

function produtosFiltrados() {
    if (categoriaSelecionada === 'todas') return produtos;
    if (categoriaSelecionada === 'sem') return produtos.filter(p => !p.categoriaId);
    return produtos.filter(p => p.categoriaId === categoriaSelecionada);
}

function criarCartaoProduto(produto) {
    const cartao = document.createElement('div');
    cartao.className = 'cartao-produto';

    const cracha = produto.emEstoque
        ? '<span class="crachá cracha-em-estoque">Em estoque</span>'
        : '<span class="crachá cracha-esgotado">Esgotado</span>';

    const textoEstoque  = produto.emEstoque ? 'Esgotado' : 'Disponível';
    const classeEstoque = produto.emEstoque ? 'Esgotado' : 'Disponivel';

    const imgSrc = produto.imagem_url ? produto.imagem_url : '';

    cartao.innerHTML = `
        <div class="imagem-produto">
            ${imgSrc
                ? `<img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(produto.nome)}" style="width:100%;height:100%;object-fit:cover;">`
                : `<i class="bi bi-image"></i>`
            }
            ${cracha}
            <button class="botao-excluir-icone" data-produto-id="${produto.id}"
                style="display:${modoAdmAtivo ? 'flex' : 'none'}" title="Excluir produto">
                <i class="bi bi-trash3-fill"></i>
            </button>
        </div>
        <div class="informacoes-produto">
            <h3 class="nome-produto">${escapeHtml(produto.nome)}</h3>
            <p class="descricao-produto">${escapeHtml(produto.descricao)}</p>
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
    cartao.querySelector('.botao-excluir-icone')
        .addEventListener('click', () => excluirProduto(produto.id));

    const btnCarrinho = cartao.querySelector('.botao-adicionar-carrinho');
    if (btnCarrinho) {
        btnCarrinho.addEventListener('click', () => adicionarAoCarrinho(produto));
    }

    return cartao;
}

function adicionarTituloCategoria(nome) {
    const titulo = document.createElement('h3');
    titulo.className = 'titulo-categoria-grupo';
    titulo.textContent = nome;
    continerProdutos.appendChild(titulo);
}

function renderizarProdutos() {
    continerProdutos.innerHTML = '';

    const lista = produtosFiltrados();

    if (lista.length === 0) {
        continerProdutos.innerHTML = '<p class="aviso-sem-produtos">Nenhum produto nesta categoria.</p>';
        return;
    }

    // Na visão "Todos", separa por categoria com um título discreto.
    if (categoriaSelecionada === 'todas') {
        categorias.forEach(cat => {
            const doGrupo = lista.filter(p => p.categoriaId === cat.id);
            if (!doGrupo.length) return;
            adicionarTituloCategoria(cat.nome);
            doGrupo.forEach(p => continerProdutos.appendChild(criarCartaoProduto(p)));
        });

        const semCategoria = lista.filter(p => !p.categoriaId);
        if (semCategoria.length) {
            if (modoAdmAtivo) adicionarTituloCategoria('Sem categoria');
            semCategoria.forEach(p => continerProdutos.appendChild(criarCartaoProduto(p)));
        }
        return;
    }

    lista.forEach(p => continerProdutos.appendChild(criarCartaoProduto(p)));
}

async function carregarCategorias() {
    try {
        const resp = await fetch(API_CATEGORIAS, { credentials: 'include' });
        const dados = await resp.json();
        categorias = dados.map(c => ({ id: Number(c.id), nome: c.nome }));
    } catch (e) {
        console.error('Erro ao carregar categorias:', e);
        categorias = [];
    }

    if (categoriaSelecionada !== 'todas' && categoriaSelecionada !== 'sem'
        && !categorias.some(c => c.id === categoriaSelecionada)) {
        categoriaSelecionada = 'todas';
    }

    renderizarFiltros();
    popularSelectEdicao();
}

function renderizarFiltros() {
    let chips = `<button class="chip-categoria ${categoriaSelecionada === 'todas' ? 'ativo' : ''}" data-cat="todas">Todos</button>`;
    chips += categorias.map(c =>
        `<button class="chip-categoria ${categoriaSelecionada === c.id ? 'ativo' : ''}" data-cat="${c.id}">${escapeHtml(c.nome)}</button>`
    ).join('');

    // "Sem categoria" só para o admin organizar; o cliente não vê.
    if (modoAdmAtivo && produtos.some(p => !p.categoriaId)) {
        chips += `<button class="chip-categoria ${categoriaSelecionada === 'sem' ? 'ativo' : ''}" data-cat="sem">Sem categoria</button>`;
    }

    filtrosCategoria.innerHTML = chips;
    filtrosCategoria.querySelectorAll('.chip-categoria').forEach(btn => {
        btn.addEventListener('click', () => {
            const v = btn.dataset.cat;
            categoriaSelecionada = (v === 'todas' || v === 'sem') ? v : Number(v);
            renderizarFiltros();
            renderizarProdutos();
        });
    });
}

function popularSelectEdicao() {
    editarCategoria.innerHTML = '<option value="" disabled>Selecione</option>' +
        categorias.map(c => `<option value="${c.id}">${escapeHtml(c.nome)}</option>`).join('');
}

function abrirModalCategorias() {
    categoriaEditandoId = null;
    renderizarListaCategorias();
    modalCategorias.classList.add('ativo');
    modalCategorias.setAttribute('aria-hidden', 'false');
}

function fecharModalCategorias() {
    modalCategorias.classList.remove('ativo');
    modalCategorias.setAttribute('aria-hidden', 'true');
    novaCategoria.value = '';
    categoriaEditandoId = null;
}

function renderizarListaCategorias() {
    if (!categorias.length) {
        listaCategorias.innerHTML = '<p class="aviso-sem-categorias">Nenhuma categoria cadastrada.</p>';
        return;
    }

    listaCategorias.innerHTML = categorias.map((c, i) => {
        if (c.id === categoriaEditandoId) {
            return `
                <div class="item-categoria">
                    <input type="text" class="input-editar-categoria" value="${escapeHtml(c.nome)}">
                    <div class="acoes-categoria">
                        <button class="botao-cat-salvar" data-id="${c.id}" title="Salvar"><i class="fa-solid fa-check"></i></button>
                        <button class="botao-cat-cancelar" title="Cancelar"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </div>`;
        }
        return `
            <div class="item-categoria">
                <span>${escapeHtml(c.nome)}</span>
                <div class="acoes-categoria">
                    <button class="botao-cat-mover" data-index="${i}" data-dir="-1" ${i === 0 ? 'disabled' : ''} title="Subir"><i class="fa-solid fa-chevron-up"></i></button>
                    <button class="botao-cat-mover" data-index="${i}" data-dir="1" ${i === categorias.length - 1 ? 'disabled' : ''} title="Descer"><i class="fa-solid fa-chevron-down"></i></button>
                    <button class="botao-cat-renomear" data-id="${c.id}" title="Renomear"><i class="fa-solid fa-pen"></i></button>
                    <button class="botao-cat-excluir" data-id="${c.id}" data-nome="${escapeHtml(c.nome)}" title="Excluir"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>`;
    }).join('');

    listaCategorias.querySelectorAll('.botao-cat-mover').forEach(b =>
        b.addEventListener('click', () => moverCategoria(Number(b.dataset.index), Number(b.dataset.dir))));

    listaCategorias.querySelectorAll('.botao-cat-renomear').forEach(b =>
        b.addEventListener('click', () => {
            categoriaEditandoId = Number(b.dataset.id);
            renderizarListaCategorias();
            const inp = listaCategorias.querySelector('.input-editar-categoria');
            if (inp) { inp.focus(); inp.select(); }
        }));
    listaCategorias.querySelectorAll('.botao-cat-excluir').forEach(b =>
        b.addEventListener('click', () => excluirCategoria(Number(b.dataset.id), b.dataset.nome)));
    listaCategorias.querySelectorAll('.botao-cat-cancelar').forEach(b =>
        b.addEventListener('click', () => { categoriaEditandoId = null; renderizarListaCategorias(); }));
    listaCategorias.querySelectorAll('.botao-cat-salvar').forEach(b =>
        b.addEventListener('click', () => salvarRenomearCategoria(Number(b.dataset.id))));

    const inp = listaCategorias.querySelector('.input-editar-categoria');
    if (inp) {
        inp.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); salvarRenomearCategoria(categoriaEditandoId); }
            if (e.key === 'Escape') { categoriaEditandoId = null; renderizarListaCategorias(); }
        });
    }
}

async function salvarRenomearCategoria(id) {
    const inp = listaCategorias.querySelector('.input-editar-categoria');
    if (!inp) return;
    const nome = inp.value.trim();
    if (!nome) { alert('Nome inválido.'); return; }

    const res = await enviarCategoria({ acao: 'renomear', id, nome });
    if (!res) return;

    if (res.success) {
        categoriaEditandoId = null;
        await carregarCategorias();
        renderizarListaCategorias();
        renderizarProdutos();
        mostrarToast('Categoria renomeada!');
    } else {
        alert(res.erro || 'Erro ao renomear.');
    }
}

async function enviarCategoria(body) {
    const resp = await fetch(API_CATEGORIAS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
    });
    if (tratarSessaoExpirada(resp)) return null;
    return resp.json();
}

async function adicionarCategoria() {
    const nome = novaCategoria.value.trim();
    if (!nome) { alert('Informe o nome da categoria.'); return; }

    const res = await enviarCategoria({ acao: 'criar', nome });
    if (!res) return;

    if (res.success) {
        novaCategoria.value = '';
        await carregarCategorias();
        renderizarListaCategorias();
        mostrarToast('Categoria adicionada!');
    } else {
        alert(res.erro || 'Erro ao adicionar categoria.');
    }
}

async function moverCategoria(index, direcao) {
    const novo = index + direcao;
    if (novo < 0 || novo >= categorias.length) return;

    const arr = categorias.slice();
    [arr[index], arr[novo]] = [arr[novo], arr[index]];

    const res = await enviarCategoria({ acao: 'reordenar', ids: arr.map(c => c.id) });
    if (!res) return;

    if (res.success) {
        await carregarCategorias();   // recarrega já na nova ordem (atualiza chips e select)
        renderizarListaCategorias();
        renderizarProdutos();         // reflete a ordem dos grupos no "Todos"
    } else {
        alert(res.erro || 'Erro ao reordenar.');
    }
}

function excluirCategoria(id, nome) {
    confirmarAcao('Excluir categoria', `Excluir a categoria "${nome}"? Os produtos dela ficarão sem categoria.`, async () => {
        const res = await enviarCategoria({ acao: 'excluir', id });
        if (!res) return;

        if (res.success) {
            if (categoriaSelecionada === id) categoriaSelecionada = 'todas';
            await carregarCategorias();
            await carregarProdutos();
            renderizarListaCategorias();
            mostrarToast('Categoria excluída!');
        } else {
            alert(res.erro || 'Erro ao excluir.');
        }
    });
}

botaoAdicionarCategoria.addEventListener('click', adicionarCategoria);
botaoFecharCategorias.addEventListener('click', fecharModalCategorias);
modalCategorias.addEventListener('click', (e) => {
    if (e.target === modalCategorias) fecharModalCategorias();
});
novaCategoria.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); adicionarCategoria(); }
});

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

        if (tratarSessaoExpirada(resposta)) return;

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

            if (tratarSessaoExpirada(response)) return;

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
    editarCategoria.value              = produto.categoriaId ?? '';

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
    const categoriaId   = editarCategoria.value;
    const arquivo       = editarImagem.files[0];

    if (!categoriaId) {
        alert('Selecione uma categoria.');
        return;
    }

    try {
        let imagemUrl = null;

        if (arquivo) {
            const formData = new FormData();
            formData.append('acao',         'uploadImagem');
            formData.append('imagem',       arquivo);

            const uploadResp = await fetch(API_URL, { method: 'POST', body: formData });

            if (tratarSessaoExpirada(uploadResp)) return;

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
                imagem_url:     imagemUrl,
                categoria_id:   Number(categoriaId)
            })
        });

        if (tratarSessaoExpirada(response)) return;

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
        dadosEntregaCarrinho.style.display  = 'none';
        return;
    }

    mensagemCarrinhoVazio.style.display = 'none';
    resumoCarrinho.style.display        = 'block';
    botaoFinalizarPedido.style.display  = 'block';
    dadosEntregaCarrinho.style.display  = 'block';

    let total = 0;

    carrinho.forEach(item => {
        total += item.preco * item.quantidade;

        listaCarrinho.insertAdjacentHTML('beforeend', `
            <div class="item-carrinho">
                <div class="info-item">
                    <h4>${escapeHtml(item.nome)}</h4>
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

    const tipoEntrega = tipoEntregaSelecionado();

    const telefone = telefoneContato.value.trim();
    if (telefone.replace(/\D/g, '').length < 10) {
        alert('Informe um telefone válido com DDD (ex: (47) 99999-9999).');
        return;
    }

    if (!tipoEntrega) {
        alert('Escolha entre retirar no local ou entrega.');
        return;
    }
    if (tipoEntrega === 'entrega' && !enderecoEntrega.value.trim()) {
        alert('Informe o endereço de entrega.');
        return;
    }
    if (!dataEntrega.value || !formaPagamento.value) {
        alert('Preencha data/hora desejada e forma de pagamento.');
        return;
    }

    const total = carrinho.reduce((t, i) => t + (i.preco * i.quantidade), 0);

    try {
        const response = await fetch(API_PEDIDOS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                itens: carrinho,
                total,
                telefone,
                tipo_entrega: tipoEntrega,
                endereco: tipoEntrega === 'entrega' ? enderecoEntrega.value.trim() : null,
                ponto_referencia: tipoEntrega === 'entrega' ? (pontoReferencia.value.trim() || null) : null,
                data_entrega: dataEntrega.value.replace('T', ' '),
                forma_pagamento: formaPagamento.value
            })
        });

        if (response.status === 401) {
            alert('Sua sessão foi encerrada porque a conta foi acessada em outro dispositivo. Faça login novamente.');
            window.location.href = 'login.html';
            return;
        }

        const resultado = await response.json();

        if (resultado.success) {
            carrinho = [];
            telefoneContato.value = '';
            radiosTipoEntrega.forEach(r => { r.checked = false; });
            grupoEndereco.style.display = 'none';
            enderecoEntrega.value = '';
            pontoReferencia.value = '';
            dataEntrega.value     = '';
            formaPagamento.value  = '';
            atualizarCarrinho();
            fecharModalCarrinho();
            mostrarPedidoConfirmado(resultado.numero);
        } else {
            alert('Erro ao finalizar pedido.');
        }
    } catch (erro) {
        console.error('Erro ao enviar pedido:', erro);
        alert('Erro ao conectar com a API.');
    }
});

function mostrarPedidoConfirmado(numero) {
    numeroPedidoConfirmado.textContent = numero;
    modalPedidoConfirmado.classList.add('ativo');
    modalPedidoConfirmado.setAttribute('aria-hidden', 'false');
}

function fecharModalPedidoConfirmado() {
    modalPedidoConfirmado.classList.remove('ativo');
    modalPedidoConfirmado.setAttribute('aria-hidden', 'true');
}

botaoFecharPedidoConfirmado.addEventListener('click', fecharModalPedidoConfirmado);

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
    if (await verificarSessao()) {
        await carregarCategorias();
        await carregarProdutos();
    }
});
function tipoEntregaSelecionado() {
    const selecionado = document.querySelector('input[name="tipoEntrega"]:checked');
    return selecionado ? selecionado.value : '';
}

radiosTipoEntrega.forEach(radio => {
    radio.addEventListener('change', () => {
        const ehEntrega = tipoEntregaSelecionado() === 'entrega';
        grupoEndereco.style.display = ehEntrega ? 'block' : 'none';
        if (!ehEntrega) {
            enderecoEntrega.value = '';
            pontoReferencia.value = '';
        }
    });
});

async function efetuarLogout() {
    await fetch('../API/logout.php', { credentials: 'include' });
    window.location.href = 'login.html';
}

function confirmarSair(e) {
    if (e) e.preventDefault();
    confirmarAcao('Sair', 'Deseja realmente sair da sua conta?', efetuarLogout);
}

botaoSair.addEventListener('click', confirmarSair);

const navSair = document.getElementById('navSair');
if (navSair) {
    navSair.addEventListener('click', confirmarSair);
}
