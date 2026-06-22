const formatoMoeda = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
});

// Dados de exemplo (fallback se a API falhar).
const dashboardPadrao = {
    meses: [
        { ym: '2026-01', label: 'Jan' },
        { ym: '2026-02', label: 'Fev' },
        { ym: '2026-03', label: 'Mar' },
        { ym: '2026-04', label: 'Abr' },
        { ym: '2026-05', label: 'Mai' },
        { ym: '2026-06', label: 'Jun' },
    ],
    linhas: [
        { ym: '2026-01', sabor: 'Chocolate', quantidade: 12, bruto: 420, custos: 150 },
        { ym: '2026-02', sabor: 'Prestígio', quantidade: 9, bruto: 360, custos: 140 },
        { ym: '2026-03', sabor: 'Chocolate', quantidade: 15, bruto: 525, custos: 180 },
        { ym: '2026-04', sabor: 'Dois Amores', quantidade: 7, bruto: 245, custos: 95 },
        { ym: '2026-05', sabor: 'Banana', quantidade: 10, bruto: 350, custos: 130 },
        { ym: '2026-06', sabor: 'Chocolate', quantidade: 18, bruto: 630, custos: 220 },
    ],
};

const cores = {
    gross: '#cf889a',
    costs: '#ccb99b',
    net: '#b85f74',
    text: '#8d6d63',
    axis: '#c9b8aa',
    grid: 'rgba(198, 181, 164, 0.34)',
    background: '#fbf8f3',
};

const elementos = {
    kpiLucroBruto: document.getElementById('kpiLucroBruto'),
    kpiCustosProducao: document.getElementById('kpiCustosProducao'),
    kpiLucroLiquido: document.getElementById('kpiLucroLiquido'),
    canvas: document.getElementById('dashboardChart'),
    canvasTop: document.getElementById('topProdutosChart'),
};

const estado = {
    meses: [],
    linhas: [],
    filtrosMes: new Set(),
    filtrosSabor: new Set(),
    regioesMes: [],      // [{ ym, x0, x1 }] para detectar clique no gráfico mensal
    regioesSabor: [],    // [{ sabor, y0, y1 }] para detectar clique no ranking
    resizeObserver: null,
};

function normalizarDados(dados) {
    const meses = Array.isArray(dados?.meses) ? dados.meses : [];
    const linhas = Array.isArray(dados?.linhas)
        ? dados.linhas.map((l) => ({
            ym: String(l.ym),
            sabor: l.sabor,
            quantidade: Number(l.quantidade) || 0,
            bruto: Number(l.bruto) || 0,
            custos: Number(l.custos) || 0,
        }))
        : [];
    return { meses, linhas };
}

// Calcula cards + dados dos dois gráficos a partir das linhas e dos filtros ativos.
function calcularView() {
    const { linhas, meses, filtrosMes, filtrosSabor } = estado;

    // Cards: respeita os dois filtros.
    const cardLinhas = linhas.filter((l) =>
        (!filtrosSabor.size || filtrosSabor.has(l.sabor)) &&
        (!filtrosMes.size || filtrosMes.has(l.ym)));
    const bruto = cardLinhas.reduce((s, l) => s + l.bruto, 0);
    const custos = cardLinhas.reduce((s, l) => s + l.custos, 0);

    // Gráfico mensal: filtra por sabor; mostra todos os meses da janela.
    const porMes = {};
    meses.forEach((m) => { porMes[m.ym] = { bruto: 0, custos: 0 }; });
    linhas
        .filter((l) => !filtrosSabor.size || filtrosSabor.has(l.sabor))
        .forEach((l) => {
            if (porMes[l.ym]) {
                porMes[l.ym].bruto += l.bruto;
                porMes[l.ym].custos += l.custos;
            }
        });
    const mensal = {
        labels: meses.map((m) => m.label),
        yms: meses.map((m) => m.ym),
        gross: meses.map((m) => porMes[m.ym].bruto),
        costs: meses.map((m) => porMes[m.ym].custos),
        net: meses.map((m) => porMes[m.ym].bruto - porMes[m.ym].custos),
    };

    // Ranking de sabores: filtra por mês; agrupa por sabor.
    const porSabor = {};
    linhas
        .filter((l) => !filtrosMes.size || filtrosMes.has(l.ym))
        .forEach((l) => { porSabor[l.sabor] = (porSabor[l.sabor] || 0) + l.quantidade; });
    const ordenado = Object.entries(porSabor).sort((a, b) => b[1] - a[1]).slice(0, 8);

    return {
        cards: { brutoTotal: bruto, custosProducao: custos, lucroLiquido: bruto - custos },
        mensal,
        top: { labels: ordenado.map((e) => e[0]), valores: ordenado.map((e) => e[1]) },
    };
}

function atualizarKpis(cards) {
    if (elementos.kpiLucroBruto) elementos.kpiLucroBruto.textContent = formatoMoeda.format(cards.brutoTotal);
    if (elementos.kpiCustosProducao) elementos.kpiCustosProducao.textContent = formatoMoeda.format(cards.custosProducao);
    if (elementos.kpiLucroLiquido) elementos.kpiLucroLiquido.textContent = formatoMoeda.format(cards.lucroLiquido);
}

function configurarCanvas(canvas, contexto) {
    const larguraCss = canvas.clientWidth;
    const alturaCss = canvas.clientHeight;
    const dpr = window.devicePixelRatio || 1;

    if (canvas.width !== Math.floor(larguraCss * dpr) || canvas.height !== Math.floor(alturaCss * dpr)) {
        canvas.width = Math.max(1, Math.floor(larguraCss * dpr));
        canvas.height = Math.max(1, Math.floor(alturaCss * dpr));
    }

    contexto.setTransform(dpr, 0, 0, dpr, 0, 0);
    contexto.clearRect(0, 0, larguraCss, alturaCss);
    return { larguraCss, alturaCss };
}

function arredondarParaEscala(valor, totalLinhas) {
    if (valor <= 0) return 1000 * totalLinhas;
    const passoBase = 1000;
    const passo = Math.max(passoBase, Math.ceil((valor / totalLinhas) / passoBase) * passoBase);
    return passo * totalLinhas;
}

function formatarEixo(valor) {
    if (valor === 0) return 'R$0k';
    return `R$${Math.round(valor / 1000)}k`;
}

function desenharBarra(contexto, x, y, largura, altura, cor) {
    const raio = Math.min(6, largura / 2, altura / 2);
    contexto.beginPath();
    contexto.moveTo(x, y + altura);
    contexto.lineTo(x, y + raio);
    contexto.quadraticCurveTo(x, y, x + raio, y);
    contexto.lineTo(x + largura - raio, y);
    contexto.quadraticCurveTo(x + largura, y, x + largura, y + raio);
    contexto.lineTo(x + largura, y + altura);
    contexto.closePath();
    contexto.fillStyle = cor;
    contexto.fill();
}

function desenharGrafico(mensal) {
    estado.regioesMes = [];
    if (!elementos.canvas) return;
    const contexto = elementos.canvas.getContext('2d');
    if (!contexto) return;

    const { larguraCss, alturaCss } = configurarCanvas(elementos.canvas, contexto);

    contexto.fillStyle = cores.background;
    contexto.fillRect(0, 0, larguraCss, alturaCss);

    const { labels, yms, gross, costs, net } = mensal;

    if (!labels.length) {
        contexto.fillStyle = cores.text;
        contexto.font = '15px Arial, Helvetica, sans-serif';
        contexto.textAlign = 'center';
        contexto.textBaseline = 'middle';
        contexto.fillText('Sem registros pagos neste ano ainda.', larguraCss / 2, alturaCss / 2);
        return;
    }

    const padding = { top: 28, right: 20, bottom: 52, left: 64 };
    const larguraGrafico = larguraCss - padding.left - padding.right;
    const alturaGrafico = alturaCss - padding.top - padding.bottom;
    const maxSerie = Math.max(0, ...gross, ...costs, ...net);
    const valorMaximo = arredondarParaEscala(maxSerie * 1.12, 4);
    const totalLinhas = 4;
    const alturaLinha = alturaGrafico / totalLinhas;

    contexto.font = '12px Arial, Helvetica, sans-serif';
    contexto.textAlign = 'right';
    contexto.textBaseline = 'middle';

    for (let i = 0; i <= totalLinhas; i += 1) {
        const valorLinha = (valorMaximo / totalLinhas) * i;
        const y = padding.top + alturaGrafico - alturaLinha * i;
        contexto.strokeStyle = cores.grid;
        contexto.lineWidth = 1;
        contexto.setLineDash([4, 4]);
        contexto.beginPath();
        contexto.moveTo(padding.left, y);
        contexto.lineTo(larguraCss - padding.right, y);
        contexto.stroke();
        contexto.setLineDash([]);
        contexto.fillStyle = cores.text;
        contexto.fillText(formatarEixo(valorLinha), padding.left - 10, y);
    }

    contexto.strokeStyle = cores.axis;
    contexto.lineWidth = 1.3;
    contexto.beginPath();
    contexto.moveTo(padding.left, padding.top);
    contexto.lineTo(padding.left, padding.top + alturaGrafico);
    contexto.lineTo(larguraCss - padding.right, padding.top + alturaGrafico);
    contexto.stroke();

    const grupoLargura = larguraGrafico / labels.length;
    const larguraBarra = Math.min(28, grupoLargura * 0.18);
    const distancia = Math.max(6, larguraBarra * 0.35);
    const larguraTotalGrupo = larguraBarra * 3 + distancia * 2;
    const serieMap = [
        { valores: gross, cor: cores.gross },
        { valores: costs, cor: cores.costs },
        { valores: net, cor: cores.net },
    ];

    labels.forEach((label, indice) => {
        const ym = yms[indice];
        const x0 = padding.left + grupoLargura * indice;
        estado.regioesMes.push({ ym, x0, x1: x0 + grupoLargura });

        const selecionado = !estado.filtrosMes.size || estado.filtrosMes.has(ym);
        contexto.globalAlpha = selecionado ? 1 : 0.3;

        const centroGrupo = x0 + grupoLargura / 2;
        const inicioGrupo = centroGrupo - larguraTotalGrupo / 2;

        serieMap.forEach((serie, indiceSerie) => {
            const valor = Number(serie.valores[indice] ?? 0);
            const alturaBarra = valorMaximo > 0 ? (valor / valorMaximo) * alturaGrafico : 0;
            const x = inicioGrupo + indiceSerie * (larguraBarra + distancia);
            const y = padding.top + alturaGrafico - alturaBarra;
            desenharBarra(contexto, x, y, larguraBarra, Math.max(0, alturaBarra), serie.cor);
        });

        contexto.fillStyle = estado.filtrosMes.has(ym) ? cores.net : cores.text;
        contexto.font = estado.filtrosMes.has(ym) ? 'bold 12px Arial' : '12px Arial';
        contexto.textAlign = 'center';
        contexto.textBaseline = 'top';
        contexto.fillText(label, centroGrupo, padding.top + alturaGrafico + 14);
        contexto.globalAlpha = 1;
    });
}

function desenharTopProdutos(top) {
    estado.regioesSabor = [];
    if (!elementos.canvasTop) return;
    const contexto = elementos.canvasTop.getContext('2d');
    if (!contexto) return;

    const { larguraCss, alturaCss } = configurarCanvas(elementos.canvasTop, contexto);
    contexto.fillStyle = cores.background;
    contexto.fillRect(0, 0, larguraCss, alturaCss);

    const { labels, valores } = top;
    if (!labels.length) {
        contexto.fillStyle = cores.text;
        contexto.font = '15px Arial, Helvetica, sans-serif';
        contexto.textAlign = 'center';
        contexto.textBaseline = 'middle';
        contexto.fillText('Sem vendas pagas registradas ainda.', larguraCss / 2, alturaCss / 2);
        return;
    }

    const padding = { top: 18, right: 56, bottom: 18, left: 130 };
    const larguraGrafico = larguraCss - padding.left - padding.right;
    const alturaGrafico = alturaCss - padding.top - padding.bottom;
    const maxValor = Math.max(1, ...valores);
    const alturaFaixa = alturaGrafico / labels.length;
    const alturaBarra = Math.min(34, alturaFaixa * 0.6);

    contexto.font = '13px Arial, Helvetica, sans-serif';

    labels.forEach((label, i) => {
        const valor = Number(valores[i] ?? 0);
        const larguraBarra = (valor / maxValor) * larguraGrafico;
        const y0 = padding.top + alturaFaixa * i;
        const centro = y0 + alturaFaixa / 2;
        estado.regioesSabor.push({ sabor: label, y0, y1: y0 + alturaFaixa });

        const selecionado = !estado.filtrosSabor.size || estado.filtrosSabor.has(label);
        contexto.globalAlpha = selecionado ? 1 : 0.3;

        contexto.fillStyle = estado.filtrosSabor.has(label) ? cores.net : cores.text;
        contexto.font = estado.filtrosSabor.has(label) ? 'bold 13px Arial' : '13px Arial';
        contexto.textAlign = 'right';
        contexto.textBaseline = 'middle';
        const nome = label.length > 16 ? label.slice(0, 15) + '…' : label;
        contexto.fillText(nome, padding.left - 12, centro);

        const y = centro - alturaBarra / 2;
        const raio = Math.min(7, alturaBarra / 2);
        const x = padding.left;
        contexto.beginPath();
        contexto.moveTo(x, y);
        contexto.lineTo(x + Math.max(larguraBarra - raio, 0), y);
        contexto.quadraticCurveTo(x + larguraBarra, y, x + larguraBarra, y + raio);
        contexto.lineTo(x + larguraBarra, y + alturaBarra - raio);
        contexto.quadraticCurveTo(x + larguraBarra, y + alturaBarra, x + Math.max(larguraBarra - raio, 0), y + alturaBarra);
        contexto.lineTo(x, y + alturaBarra);
        contexto.closePath();
        contexto.fillStyle = cores.gross;
        contexto.fill();

        contexto.fillStyle = cores.net;
        contexto.font = '13px Arial';
        contexto.textAlign = 'left';
        contexto.fillText(String(valor), padding.left + larguraBarra + 8, centro);
        contexto.globalAlpha = 1;
    });
}

function render() {
    const view = calcularView();
    atualizarKpis(view.cards);
    desenharGrafico(view.mensal);
    desenharTopProdutos(view.top);
}

function alternar(conjunto, valor) {
    if (conjunto.has(valor)) conjunto.delete(valor); else conjunto.add(valor);
}

async function carregarDados() {
    const dadosLocais = normalizarDados(dashboardPadrao);
    const urlApi = document.body.dataset.dashboardApi?.trim();
    if (!urlApi) return dadosLocais;

    try {
        const resposta = await fetch(urlApi, {
            credentials: 'include',
            headers: { Accept: 'application/json' },
        });

        if (resposta.status === 401 || resposta.status === 403) {
            window.location.href = 'login.html';
            return dadosLocais;
        }
        if (!resposta.ok) throw new Error(`Falha ao carregar dashboard: ${resposta.status}`);

        return normalizarDados(await resposta.json());
    } catch (erro) {
        console.warn('Usando dados locais do dashboard.', erro);
        return dadosLocais;
    }
}

function configurarCliques() {
    if (elementos.canvas) {
        elementos.canvas.style.cursor = 'pointer';
        elementos.canvas.addEventListener('click', (e) => {
            const rect = elementos.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const reg = estado.regioesMes.find((r) => x >= r.x0 && x <= r.x1);
            if (reg) { alternar(estado.filtrosMes, reg.ym); render(); }
        });
    }

    if (elementos.canvasTop) {
        elementos.canvasTop.style.cursor = 'pointer';
        elementos.canvasTop.addEventListener('click', (e) => {
            const rect = elementos.canvasTop.getBoundingClientRect();
            const y = e.clientY - rect.top;
            const reg = estado.regioesSabor.find((r) => y >= r.y0 && y <= r.y1);
            if (reg) { alternar(estado.filtrosSabor, reg.sabor); render(); }
        });
    }
}

function observarRedimensionamento() {
    if (!elementos.canvas) return;

    if (typeof ResizeObserver !== 'undefined') {
        estado.resizeObserver = new ResizeObserver(() => render());
        estado.resizeObserver.observe(elementos.canvas.parentElement);
        if (elementos.canvasTop) estado.resizeObserver.observe(elementos.canvasTop.parentElement);
        return;
    }

    window.addEventListener('resize', render);
}

async function inicializarDashboard() {
    const dados = await carregarDados();
    estado.meses = dados.meses;
    estado.linhas = dados.linhas;
    render();
    configurarCliques();
    observarRedimensionamento();
}

inicializarDashboard();

const navSair = document.getElementById('navSair');
if (navSair) {
    navSair.addEventListener('click', (e) => {
        e.preventDefault();
        confirmarAcao('Sair', 'Deseja realmente sair da sua conta?', async () => {
            await fetch('../API/logout.php', { credentials: 'include' });
            window.location.href = 'login.html';
        });
    });
}
