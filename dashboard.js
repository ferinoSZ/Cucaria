const formatoMoeda = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
});

const dashboardPadrao = {
    cards: {
        brutoTotal: 29500,
        custosProducao: 12200,
        lucroLiquido: 17300,
    },
    chart: {
        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
        series: {
            gross: [4200, 3800, 5000, 4700, 5500, 6200],
            costs: [1800, 1600, 2100, 1900, 2300, 2500],
            net: [2400, 2200, 3000, 2800, 3200, 3700],
        },
    },
};

const cores = {
    gross: '#cf889a',
    grossGrid: 'rgba(207, 136, 154, 0.12)',
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
};

const estadoDashboard = {
    dados: null,
    resizeObserver: null,
};

function normalizarSerie(valor, fallback) {
    if (Array.isArray(valor)) {
        return valor.map((item) => Number(item)).filter((item) => Number.isFinite(item));
    }

    if (valor && typeof valor === 'object') {
        const valoresOrdenados = Object.keys(valor)
            .sort((a, b) => Number(a) - Number(b))
            .map((chave) => Number(valor[chave]))
            .filter((item) => Number.isFinite(item));

        if (valoresOrdenados.length > 0) {
            return valoresOrdenados;
        }
    }

    return [...fallback];
}

function extrairSerie(series, chaves, fallback) {
    for (const chave of chaves) {
        if (series && Object.prototype.hasOwnProperty.call(series, chave)) {
            return normalizarSerie(series[chave], fallback);
        }
    }

    return [...fallback];
}

function normalizarDadosDashboard(dados) {
    const chartEntrada = dados?.chart ?? {};
    const seriesEntrada = chartEntrada.series ?? dados?.series ?? {};
    const cardsEntrada = dados?.cards ?? {};
    const labelsEntrada = Array.isArray(chartEntrada.labels)
        ? chartEntrada.labels
        : Array.isArray(dados?.labels)
            ? dados.labels
            : [...dashboardPadrao.chart.labels];

    return {
        cards: {
            brutoTotal: Number(cardsEntrada.brutoTotal ?? cardsEntrada.grossTotal ?? cardsEntrada.faturamentoTotal ?? dashboardPadrao.cards.brutoTotal),
            custosProducao: Number(cardsEntrada.custosProducao ?? cardsEntrada.productionCosts ?? cardsEntrada.custos ?? dashboardPadrao.cards.custosProducao),
            lucroLiquido: Number(cardsEntrada.lucroLiquido ?? cardsEntrada.netProfit ?? cardsEntrada.lucro ?? dashboardPadrao.cards.lucroLiquido),
        },
        chart: {
            labels: labelsEntrada,
            series: {
                gross: extrairSerie(seriesEntrada, ['gross', 'bruto', 'faturamento', 'receita'], dashboardPadrao.chart.series.gross),
                costs: extrairSerie(seriesEntrada, ['costs', 'custos', 'despesas', 'productionCosts'], dashboardPadrao.chart.series.costs),
                net: extrairSerie(seriesEntrada, ['net', 'liquido', 'lucro', 'netProfit'], dashboardPadrao.chart.series.net),
            },
        },
    };
}

function formatarMoeda(valor) {
    return formatoMoeda.format(valor);
}

function atualizarKpis(dados) {
    if (elementos.kpiLucroBruto) {
        elementos.kpiLucroBruto.textContent = formatarMoeda(dados.cards.brutoTotal);
    }

    if (elementos.kpiCustosProducao) {
        elementos.kpiCustosProducao.textContent = formatarMoeda(dados.cards.custosProducao);
    }

    if (elementos.kpiLucroLiquido) {
        elementos.kpiLucroLiquido.textContent = formatarMoeda(dados.cards.lucroLiquido);
    }
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
    if (valor <= 0) {
        return 1000 * totalLinhas;
    }

    const passoBase = 1000;
    const passo = Math.max(passoBase, Math.ceil((valor / totalLinhas) / passoBase) * passoBase);
    return passo * totalLinhas;
}

function formatarEixo(valor) {
    if (valor === 0) {
        return 'R$0k';
    }

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

function desenharGrafico(dados) {
    if (!elementos.canvas) {
        return;
    }

    const contexto = elementos.canvas.getContext('2d');
    if (!contexto) {
        return;
    }

    const { larguraCss, alturaCss } = configurarCanvas(elementos.canvas, contexto);
    const padding = {
        top: 28,
        right: 20,
        bottom: 52,
        left: 64,
    };

    const larguraGrafico = larguraCss - padding.left - padding.right;
    const alturaGrafico = alturaCss - padding.top - padding.bottom;
    const labels = dados.chart.labels;
    const gross = dados.chart.series.gross;
    const costs = dados.chart.series.costs;
    const net = dados.chart.series.net;
    const maxSerie = Math.max(0, ...gross, ...costs, ...net);
    const valorMaximo = arredondarParaEscala(maxSerie * 1.12, 4);
    const totalLinhas = 4;
    const alturaLinha = alturaGrafico / totalLinhas;

    contexto.fillStyle = cores.background;
    contexto.fillRect(0, 0, larguraCss, alturaCss);

    contexto.font = '12px Arial, Helvetica, sans-serif';
    contexto.textAlign = 'right';
    contexto.textBaseline = 'middle';

    for (let indice = 0; indice <= totalLinhas; indice += 1) {
        const valorLinha = (valorMaximo / totalLinhas) * indice;
        const y = padding.top + alturaGrafico - alturaLinha * indice;

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
    const distanciaEntreBarras = Math.max(6, larguraBarra * 0.35);
    const larguraTotalGrupo = larguraBarra * 3 + distanciaEntreBarras * 2;

    const serieMap = [
        { valores: gross, cor: cores.gross },
        { valores: costs, cor: cores.costs },
        { valores: net, cor: cores.net },
    ];

    labels.forEach((label, indiceLabel) => {
        const centroGrupo = padding.left + grupoLargura * indiceLabel + grupoLargura / 2;
        const inicioGrupo = centroGrupo - larguraTotalGrupo / 2;

        serieMap.forEach((serie, indiceSerie) => {
            const valor = Number(serie.valores[indiceLabel] ?? 0);
            const alturaBarra = valorMaximo > 0 ? (valor / valorMaximo) * alturaGrafico : 0;
            const x = inicioGrupo + indiceSerie * (larguraBarra + distanciaEntreBarras);
            const y = padding.top + alturaGrafico - alturaBarra;

            desenharBarra(contexto, x, y, larguraBarra, Math.max(0, alturaBarra), serie.cor);
        });

        contexto.fillStyle = cores.text;
        contexto.textAlign = 'center';
        contexto.textBaseline = 'top';
        contexto.fillText(label, centroGrupo, padding.top + alturaGrafico + 14);
    });
}

async function carregarDadosDashboard() {
    const dadosLocais = window.dashboardData ? normalizarDadosDashboard(window.dashboardData) : normalizarDadosDashboard(dashboardPadrao);
    const urlApi = document.body.dataset.dashboardApi?.trim();

    if (!urlApi) {
        return dadosLocais;
    }

    try {
        const resposta = await fetch(urlApi, {
            headers: {
                Accept: 'application/json',
            },
        });

        if (!resposta.ok) {
            throw new Error(`Falha ao carregar dashboard: ${resposta.status}`);
        }

        const dadosRemotos = await resposta.json();
        return normalizarDadosDashboard(dadosRemotos);
    } catch (erro) {
        console.warn('Usando dados locais do dashboard.', erro);
        return dadosLocais;
    }
}

function renderizarDashboard(dados) {
    estadoDashboard.dados = dados;
    atualizarKpis(dados);
    desenharGrafico(dados);
}

function observarRedimensionamento() {
    if (!elementos.canvas) {
        return;
    }

    if (typeof ResizeObserver !== 'undefined') {
        estadoDashboard.resizeObserver = new ResizeObserver(() => {
            if (estadoDashboard.dados) {
                desenharGrafico(estadoDashboard.dados);
            }
        });

        estadoDashboard.resizeObserver.observe(elementos.canvas.parentElement);
        return;
    }

    window.addEventListener('resize', () => {
        if (estadoDashboard.dados) {
            desenharGrafico(estadoDashboard.dados);
        }
    });
}

async function inicializarDashboard() {
    const dados = await carregarDadosDashboard();
    renderizarDashboard(dados);
    observarRedimensionamento();
}

inicializarDashboard();
