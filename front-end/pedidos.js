const API_PEDIDOS = '../API/pedidos.php';
const API_SESSAO   = '../back-end/sessao_status.php';

const navSair          = document.getElementById('navSair');
const listaPedidos     = document.getElementById('listaPedidos');
const tituloPedidos    = document.getElementById('tituloPedidos');
const totalDataESabor  = document.getElementById('totalDataESabor');
const listaDataESabor  = document.getElementById('listaDataESabor');
const totalPorSabor    = document.getElementById('totalPorSabor');
const listaTotalSabor  = document.getElementById('listaTotalSabor');

const modalConfirmacao      = document.getElementById('modalConfirmacao');
const modalConfirmacaoTitulo = document.getElementById('modalConfirmacaoTitulo');
const modalConfirmacaoTexto = document.getElementById('modalConfirmacaoTexto');
const modalConfirmacaoNao   = document.getElementById('modalConfirmacaoNao');
const modalConfirmacaoSim   = document.getElementById('modalConfirmacaoSim');

let pedidos = [];
let acaoConfirmacao = null;
let filtrosSabor = new Set();
let filtrosData  = new Set();

// Confirmações exigidas antes de mudar o status do pedido.
const CONFIRMACAO_STATUS = {
    cancelado: { titulo: 'Cancelar pedido', texto: 'Tem certeza que deseja cancelar este pedido?' },
    entregue:  { titulo: 'Finalizar pedido', texto: 'Confirmar a finalização? O pedido sairá da lista.' }
};

function abrirConfirmacao(titulo, texto, aoConfirmar) {
    modalConfirmacaoTitulo.textContent = titulo;
    modalConfirmacaoTexto.textContent = texto;
    acaoConfirmacao = aoConfirmar;
    modalConfirmacao.classList.add('ativo');
    modalConfirmacao.setAttribute('aria-hidden', 'false');
}

function fecharConfirmacao() {
    modalConfirmacao.classList.remove('ativo');
    modalConfirmacao.setAttribute('aria-hidden', 'true');
    acaoConfirmacao = null;
}

modalConfirmacaoNao.addEventListener('click', fecharConfirmacao);
modalConfirmacao.addEventListener('click', (e) => {
    if (e.target === modalConfirmacao) fecharConfirmacao();
});
modalConfirmacaoSim.addEventListener('click', () => {
    const acao = acaoConfirmacao;
    fecharConfirmacao();
    if (acao) acao();
});

const STATUS_LABEL = {
    novo: 'Aguardando',
    aprovado: 'Em preparação',
    pronto: 'Pronto',
    recusado: 'Recusado',
    cancelado: 'Cancelado',
    entregue: 'Entregue'
};

const STATUS_CLASSE = {
    novo: '',
    aprovado: 'status-aprovado',
    pronto: 'status-aprovado',
    recusado: 'status-recusado',
    cancelado: 'status-recusado',
    entregue: 'status-aprovado'
};

// Ações de mudança de status em cada estado: [novoStatus, rótulo, classe do botão]
const ACOES_POR_STATUS = {
    novo: [
        ['aprovado', '<i class="bi bi-check-lg"></i>Aprovar', 'botao-aceitar'],
        ['recusado', '<i class="bi bi-x-lg"></i>Recusar', 'botao-recusar']
    ],
    aprovado: [
        ['cancelado', '<i class="bi bi-x-lg"></i>Cancelar', 'botao-recusar'],
        ['pronto', '<i class="bi bi-box-seam"></i>Pronto', 'botao-aceitar']
    ],
    pronto: [
        ['cancelado', '<i class="bi bi-x-lg"></i>Cancelar', 'botao-recusar'],
        ['entregue', '<i class="bi bi-bag-check"></i>Marcar entregue', 'botao-aceitar']
    ]
};

// Estados em que o admin pode marcar/desmarcar o pagamento como recebido.
const STATUS_COM_PAGO = ['aprovado', 'pronto'];

function escapeHtml(texto) {
    const div = document.createElement('div');
    div.textContent = texto ?? '';
    return div.innerHTML;
}

function formatarDataHora(dataMysql) {
    if (!dataMysql) return 'Não informada';
    const [dataParte, horaParte] = dataMysql.split(' ');
    const [ano, mes, dia] = dataParte.split('-');
    const hora = horaParte ? horaParte.slice(0, 5) : '';
    return `${dia}/${mes}/${ano}${hora ? ' às ' + hora : ''}`;
}

function formatarDataCurta(dataMysql) {
    if (!dataMysql) return '—';
    const [dataParte] = dataMysql.split(' ');
    const [ano, mes, dia] = dataParte.split('-');
    return `${dia}/${mes}/${ano}`;
}

async function verificarAcesso() {
    try {
        const resposta = await fetch(API_SESSAO, { credentials: 'include' });
        const dados = await resposta.json();

        if (!dados.logado || dados.perfil !== 'admin') {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    } catch (erro) {
        console.error('Erro ao verificar sessão:', erro);
        window.location.href = 'login.html';
        return false;
    }
}

async function carregarPedidos() {
    try {
        const resposta = await fetch(API_PEDIDOS, { credentials: 'include' });

        if (resposta.status === 403) {
            window.location.href = 'login.html';
            return;
        }

        pedidos = await resposta.json();
        renderizarTudo();
    } catch (erro) {
        console.error('Erro ao carregar pedidos:', erro);
        listaPedidos.innerHTML = '<p class="mensagem-vazio-pedidos">Erro ao carregar pedidos.</p>';
    }
}

function obterLinhas() {
    const linhas = [];
    pedidos.forEach(pedido => {
        (pedido.itens || []).forEach(item => {
            linhas.push({
                pedidoId: pedido.id,
                numero: pedido.numero,
                cliente: pedido.cliente_nome || 'Cliente não identificado',
                endereco: pedido.endereco,
                dataEntrega: pedido.data_entrega,
                formaPagamento: pedido.forma_pagamento,
                status: pedido.status,
                sabor: item.nome_produto,
                quantidade: Number(item.quantidade)
            });
        });
    });
    return linhas;
}

function pedidoCorresponde(pedido) {
    if (filtrosData.size && !filtrosData.has(formatarDataCurta(pedido.data_entrega))) return false;
    if (filtrosSabor.size && !(pedido.itens || []).some(i => filtrosSabor.has(i.nome_produto))) return false;
    return true;
}

function renderizarPedidos() {
    if (pedidos.length === 0) {
        tituloPedidos.textContent = 'Pedidos (0)';
        listaPedidos.innerHTML = '<p class="mensagem-vazio-pedidos">Nenhum pedido recebido ainda.</p>';
        return;
    }

    const lista = pedidos.filter(pedidoCorresponde);
    tituloPedidos.textContent = `Pedidos (${lista.length})`;

    if (lista.length === 0) {
        listaPedidos.innerHTML = '<p class="mensagem-vazio-pedidos">Nenhum pedido para este filtro.</p>';
        return;
    }

    listaPedidos.innerHTML = lista.map((pedido) => {
        const itensTexto = (pedido.itens || [])
            .map(item => `${item.nome_produto} x${item.quantidade}`)
            .join(', ');

        const entrega = pedido.tipo_entrega === 'entrega'
            ? `<i class="bi bi-geo-alt"></i> ${escapeHtml(pedido.endereco || 'Endereço não informado')}`
            : pedido.tipo_entrega === 'retirada'
                ? `<i class="bi bi-shop"></i> Retirada no local`
                : `<i class="bi bi-geo-alt"></i> Não informado`;

        const referencia = (pedido.tipo_entrega === 'entrega' && pedido.ponto_referencia)
            ? `<p><i class="bi bi-signpost-2"></i> Ref.: ${escapeHtml(pedido.ponto_referencia)}</p>`
            : '';

        const telefone = pedido.telefone
            ? (() => {
                let digitos = String(pedido.telefone).replace(/\D/g, '');
                if (digitos.length <= 11) digitos = '55' + digitos;
                return `<p><i class="bi bi-whatsapp"></i> <a href="https://wa.me/${digitos}" target="_blank" rel="noopener">${escapeHtml(pedido.telefone)}</a></p>`;
              })()
            : '';

        const ehPago = Number(pedido.pago) === 1;

        const botaoPago = STATUS_COM_PAGO.includes(pedido.status)
            ? `<button class="botao-pago${ehPago ? ' ativo' : ''}" data-pedido-id="${pedido.id}" data-acao="pago" data-pago="${ehPago ? 1 : 0}"><i class="bi bi-cash-coin"></i>${ehPago ? 'Pago' : 'Marcar pago'}</button>`
            : '';

        const acoesStatus = (ACOES_POR_STATUS[pedido.status] || [])
            .map(([novoStatus, rotulo, classe]) =>
                `<button class="${classe}" data-pedido-id="${pedido.id}" data-status="${novoStatus}">${rotulo}</button>`)
            .join('');

        const acoes = botaoPago + acoesStatus;

        // O status "pronto" reflete o que o cliente escolheu (retirada ou entrega).
        const rotuloStatus = pedido.status === 'pronto'
            ? (pedido.tipo_entrega === 'retirada' ? 'Aguardando retirada' : 'Aguardando entrega')
            : (STATUS_LABEL[pedido.status] || pedido.status);

        return `
            <article class="pedido">
                <div class="pedido-header">
                    <div class="pedido-titulo">
                        <i class="bi bi-box-seam"></i>
                        <h3>${escapeHtml(pedido.numero)}</h3>
                    </div>
                    <span class="status ${STATUS_CLASSE[pedido.status] || ''}">${rotuloStatus}</span>
                </div>
                <div class="pedido-detalhes">
                    <p><i class="bi bi-person"></i> ${escapeHtml(pedido.cliente_nome || 'Cliente não identificado')}</p>
                    ${telefone}
                    <p><i class="bi bi-bag"></i> ${escapeHtml(itensTexto || 'Sem itens')}</p>
                    <p>${entrega}</p>
                    ${referencia}
                    <p><i class="bi bi-credit-card"></i> ${pedido.forma_pagamento === 'pix' ? 'Pix' : pedido.forma_pagamento === 'dinheiro' ? 'Dinheiro' : 'Não informado'}${ehPago ? ' • <strong>Pago</strong>' : ''}</p>
                    <p><i class="bi bi-cash-coin"></i> Total: R$ ${Number(pedido.total).toFixed(2)}</p>
                </div>
                <div class="pedido-observacao">
                    <i class="bi bi-calendar2-event"></i>
                    <p>Cliente quer receber: <strong>${formatarDataHora(pedido.data_entrega)}</strong></p>
                </div>
                <div class="pedido-acao">${acoes}</div>
            </article>
        `;
    }).join('');

    listaPedidos.querySelectorAll('.pedido-acao button').forEach(botao => {
        botao.addEventListener('click', () => {
            const id = Number(botao.dataset.pedidoId);
            if (botao.dataset.acao === 'pago') {
                marcarPago(id, botao.dataset.pago === '1' ? 0 : 1);
                return;
            }

            const status = botao.dataset.status;
            const confirmacao = CONFIRMACAO_STATUS[status];
            if (confirmacao) {
                abrirConfirmacao(confirmacao.titulo, confirmacao.texto, () => atualizarStatusPedido(id, status));
            } else {
                atualizarStatusPedido(id, status);
            }
        });
    });
}

// Totais de cucas por DATA de entrega (respeita o filtro de sabor, se houver).
function renderizarResumoPorData(linhas) {
    const filtradas = linhas.filter(l => !filtrosSabor.size || filtrosSabor.has(l.sabor));

    const agrupado = filtradas.reduce((acc, l) => {
        const data = formatarDataCurta(l.dataEntrega);
        acc[data] = (acc[data] || 0) + l.quantidade;
        return acc;
    }, {});

    const entradas = Object.entries(agrupado).sort((a, b) => {
        const [dA, mA, aA] = a[0].split('/').map(Number);
        const [dB, mB, aB] = b[0].split('/').map(Number);
        return new Date(aA, mA - 1, dA) - new Date(aB, mB - 1, dB);
    });

    totalDataESabor.textContent = entradas.reduce((s, [, q]) => s + q, 0);

    listaDataESabor.innerHTML = entradas.map(([data, qtd]) => `
        <div class="item-data-e-sabor item-filtravel ${filtrosData.has(data) ? 'ativo' : ''}" data-data="${data}">
            <div class="item-info">
                <p class="item-data"><i class="bi bi-calendar2-event"></i>${data}</p>
            </div>
            <span class="item-total">${qtd}</span>
        </div>
    `).join('');

    listaDataESabor.querySelectorAll('.item-filtravel').forEach(el => {
        el.addEventListener('click', () => {
            const d = el.dataset.data;
            if (filtrosData.has(d)) filtrosData.delete(d); else filtrosData.add(d);
            renderizarTudo();
        });
    });
}

// Totais por SABOR (respeita o filtro de data, se houver).
function renderizarResumoPorSabor(linhas) {
    const filtradas = linhas.filter(l => !filtrosData.size || filtrosData.has(formatarDataCurta(l.dataEntrega)));

    const agrupado = filtradas.reduce((acc, l) => {
        acc[l.sabor] = (acc[l.sabor] || 0) + l.quantidade;
        return acc;
    }, {});

    const entradas = Object.entries(agrupado).sort((a, b) => b[1] - a[1]);

    totalPorSabor.textContent = entradas.reduce((s, [, q]) => s + q, 0);

    listaTotalSabor.innerHTML = entradas.map(([sabor, qtd]) => `
        <div class="item-total-sabor item-filtravel ${filtrosSabor.has(sabor) ? 'ativo' : ''}" data-sabor="${escapeHtml(sabor)}">
            <p class="item-sabor"><i class="bi bi-box-seam"></i>${escapeHtml(sabor)}</p>
            <span class="item-total">${qtd}</span>
        </div>
    `).join('');

    listaTotalSabor.querySelectorAll('.item-filtravel').forEach(el => {
        el.addEventListener('click', () => {
            const s = el.dataset.sabor;
            if (filtrosSabor.has(s)) filtrosSabor.delete(s); else filtrosSabor.add(s);
            renderizarTudo();
        });
    });
}

function renderizarTudo() {
    const linhas = obterLinhas();
    renderizarPedidos();
    renderizarResumoPorData(linhas);
    renderizarResumoPorSabor(linhas);
}

async function marcarPago(pedidoId, pago) {
    try {
        const resposta = await fetch(API_PEDIDOS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ acao: 'marcarPago', id: pedidoId, pago })
        });

        if (tratarSessaoExpirada(resposta)) return;

        const resultado = await resposta.json();

        if (resultado.success) {
            await carregarPedidos();
        } else {
            alert('Erro ao atualizar pagamento.');
        }
    } catch (erro) {
        console.error('Erro ao marcar pagamento:', erro);
        alert('Erro ao conectar com a API.');
    }
}

async function atualizarStatusPedido(pedidoId, status) {
    try {
        const resposta = await fetch(API_PEDIDOS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ acao: 'atualizarStatus', id: pedidoId, status })
        });

        if (tratarSessaoExpirada(resposta)) return;

        const resultado = await resposta.json();

        if (resultado.success) {
            await carregarPedidos();
        } else {
            alert('Erro ao atualizar status do pedido.');
        }
    } catch (erro) {
        console.error('Erro ao atualizar status:', erro);
        alert('Erro ao conectar com a API.');
    }
}

if (navSair) {
    navSair.addEventListener('click', (e) => {
        e.preventDefault();
        abrirConfirmacao('Sair', 'Deseja realmente sair da sua conta?', async () => {
            await fetch('../API/logout.php', { credentials: 'include' });
            window.location.href = 'login.html';
        });
    });
}

window.addEventListener('load', async () => {
    const acessoPermitido = await verificarAcesso();
    if (acessoPermitido) {
        await carregarPedidos();
    }
});
