const API_MEUS_PEDIDOS = '../API/pedidos.php?meus=1';
const API_SESSAO       = '../back-end/sessao_status.php';

const botaoSair        = document.getElementById('botaoSair');
const tituloMeusPedidos = document.getElementById('tituloMeusPedidos');
const listaMeusPedidos = document.getElementById('listaMeusPedidos');

const STATUS_INFO = {
    novo:      { label: 'Aguardando confirmação',    classe: 'status-aguardando' },
    aprovado:  { label: 'Pedido em preparação',      classe: 'status-preparacao' },
    pronto:    { label: 'Aguardando entrega/retirada', classe: 'status-pronto' },
    recusado:  { label: 'Pedido recusado',           classe: 'status-recusado' },
    cancelado: { label: 'Pedido cancelado',          classe: 'status-cancelado' },
    entregue:  { label: 'Pedido entregue',           classe: 'status-entregue' }
};

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

async function exigirLogin() {
    try {
        const resposta = await fetch(API_SESSAO, { credentials: 'include' });
        const dados = await resposta.json();
        if (!dados.logado) {
            window.location.replace('login.html');
            return false;
        }
        return true;
    } catch (erro) {
        console.error('Erro ao verificar sessão:', erro);
        window.location.replace('login.html');
        return false;
    }
}

async function carregarMeusPedidos() {
    try {
        const resposta = await fetch(API_MEUS_PEDIDOS, { credentials: 'include' });

        if (resposta.status === 401) {
            window.location.replace('login.html');
            return;
        }

        const pedidos = await resposta.json();
        renderizar(pedidos);
    } catch (erro) {
        console.error('Erro ao carregar pedidos:', erro);
        listaMeusPedidos.innerHTML = '<p class="mensagem-vazio-pedidos">Erro ao carregar seus pedidos.</p>';
    }
}

function renderizar(pedidos) {
    tituloMeusPedidos.textContent = `Meus Pedidos (${pedidos.length})`;

    if (!pedidos.length) {
        listaMeusPedidos.innerHTML = '<p class="mensagem-vazio-pedidos">Você ainda não fez nenhum pedido.</p>';
        return;
    }

    listaMeusPedidos.innerHTML = pedidos.map((pedido) => {
        const info = STATUS_INFO[pedido.status] || { label: pedido.status, classe: '' };

        // O status "pronto" reflete o que o cliente escolheu (retirada ou entrega).
        const rotuloStatus = pedido.status === 'pronto'
            ? (pedido.tipo_entrega === 'retirada' ? 'Aguardando retirada' : 'Aguardando entrega')
            : info.label;

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

        const pagamento = pedido.forma_pagamento === 'pix' ? 'Pix'
            : pedido.forma_pagamento === 'dinheiro' ? 'Dinheiro' : 'Não informado';

        return `
            <article class="pedido">
                <div class="pedido-header">
                    <div class="pedido-titulo">
                        <i class="bi bi-box-seam"></i>
                        <h3>${escapeHtml(pedido.numero)}</h3>
                    </div>
                    <span class="status ${info.classe}">${rotuloStatus}</span>
                </div>
                <div class="pedido-detalhes">
                    <p><i class="bi bi-bag"></i> ${escapeHtml(itensTexto || 'Sem itens')}</p>
                    <p>${entrega}</p>
                    ${referencia}
                    <p><i class="bi bi-credit-card"></i> ${pagamento}${Number(pedido.pago) === 1 ? ' • <strong>Pago</strong>' : ''}</p>
                    <p><i class="bi bi-calendar2-event"></i> Receber em: ${formatarDataHora(pedido.data_entrega)}</p>
                    <p><i class="bi bi-cash-coin"></i> Total: R$ ${Number(pedido.total).toFixed(2)}</p>
                </div>
                <p class="pedido-data">Pedido feito em ${formatarDataHora(pedido.data_pedido)}</p>
            </article>
        `;
    }).join('');
}

botaoSair.addEventListener('click', () => {
    confirmarAcao('Sair', 'Deseja realmente sair da sua conta?', async () => {
        await fetch('../API/logout.php', { credentials: 'include' });
        window.location.href = 'login.html';
    });
});

window.addEventListener('load', async () => {
    if (await exigirLogin()) {
        await carregarMeusPedidos();
    }
});
