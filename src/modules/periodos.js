/**
 * modules/periodos.js
 * Sistema de Filtro por Períodos
 * 
 * Cada mês do ano é um "período" numerado de 1 a 12.
 * Quando o ano troca, os períodos reiniciam.
 * 
 * Período 1 = Janeiro, Período 2 = Fevereiro, ..., Período 12 = Dezembro
 */

const MESES = [
    "Janeiro", "Fevereiro", "Março", "Abril",
    "Maio", "Junho", "Julho", "Agosto",
    "Setembro", "Outubro", "Novembro", "Dezembro"
];

const MESES_ABREV = [
    "Jan", "Fev", "Mar", "Abr",
    "Mai", "Jun", "Jul", "Ago",
    "Set", "Out", "Nov", "Dez"
];

// Estado do período
let anoSelecionado = new Date().getFullYear();
let mesSelecionado = new Date().getMonth(); // 0-11

/**
 * Retorna o número do período (1-12) baseado no mês (0-11)
 */
function getNumeroPeriodo(mes) {
    return mes + 1;
}

/**
 * Retorna o label do período formatado
 */
function getLabelPeriodo(mes, ano) {
    return `P${getNumeroPeriodo(mes)} - ${MESES[mes]}/${ano}`;
}

/**
 * Retorna label curto do período
 */
function getLabelPeriodoCurto(mes) {
    return `P${getNumeroPeriodo(mes)}`;
}

/**
 * Inicializa o filtro de períodos na interface
 */
function inicializarPeriodos() {
    renderizarMeses();
    atualizarInfoPeriodo();
}

/**
 * Renderiza botões de meses no painel de períodos
 */
function renderizarMeses() {
    const container = document.getElementById('periodMonths');
    if (!container) return;

    container.innerHTML = '';

    MESES_ABREV.forEach((mes, index) => {
        const btn = document.createElement('button');
        btn.className = `period-month-btn ${index === mesSelecionado ? 'active' : ''}`;
        btn.setAttribute('data-month', index);

        // Destacar mês atual se for o mesmo ano
        const agora = new Date();
        if (index === agora.getMonth() && anoSelecionado === agora.getFullYear()) {
            btn.classList.add('current');
        }

        btn.innerHTML = `
            <span class="period-number">P${getNumeroPeriodo(index)}</span>
            <span class="period-month-name">${mes}</span>
        `;
        btn.onclick = () => selecionarMes(index);
        container.appendChild(btn);
    });

    document.getElementById('anoAtual').textContent = anoSelecionado;
}

/**
 * Seleciona um mês e filtra os dados
 */
function selecionarMes(mes) {
    mesSelecionado = mes;
    renderizarMeses();
    atualizarInfoPeriodo();
    filtrarVeiculosPorPeriodo();
}

/**
 * Muda o ano e reinicia os períodos
 */
function mudarAno(delta) {
    anoSelecionado += delta;
    // Ao mudar de ano, NÃO reseta o mês - mantém o mês selecionado
    renderizarMeses();
    atualizarInfoPeriodo();
    filtrarVeiculosPorPeriodo();
}

/**
 * Atualiza a informação do período na interface
 */
function atualizarInfoPeriodo() {
    const infoEl = document.getElementById('periodValue');
    if (infoEl) {
        infoEl.textContent = getLabelPeriodo(mesSelecionado, anoSelecionado);
    }
}

/**
 * Filtra veículos/inspeções pelo período selecionado
 */
function filtrarVeiculosPorPeriodo() {
    // Refiltra veículos com base no período ativo
    filtrarVeiculos();
}

/**
 * Verifica se uma data string (dd/mm/yyyy) pertence ao período selecionado
 */
function dataPertenceAoPeriodo(dataStr, mes, ano) {
    if (!dataStr) return false;
    try {
        let d;
        if (dataStr.includes('/')) {
            const parts = dataStr.split('/');
            d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        } else {
            d = new Date(dataStr);
        }
        if (isNaN(d.getTime())) return false;
        return d.getMonth() === mes && d.getFullYear() === ano;
    } catch (e) {
        return false;
    }
}

/**
 * Retorna o período formatado de uma data
 */
function getPeriodoDaData(dataStr) {
    if (!dataStr) return "-";
    try {
        let d;
        if (dataStr.includes('/')) {
            const parts = dataStr.split('/');
            d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        } else {
            d = new Date(dataStr);
        }
        if (isNaN(d.getTime())) return "-";
        return getLabelPeriodoCurto(d.getMonth());
    } catch (e) {
        return "-";
    }
}

/**
 * Retorna o período + ano formatado de uma data
 */
function getPeriodoCompletoDaData(dataStr) {
    if (!dataStr) return "-";
    try {
        let d;
        if (dataStr.includes('/')) {
            const parts = dataStr.split('/');
            d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        } else {
            d = new Date(dataStr);
        }
        if (isNaN(d.getTime())) return "-";
        return getLabelPeriodo(d.getMonth(), d.getFullYear());
    } catch (e) {
        return "-";
    }
}

/**
 * Retorna período selecionado atualmente
 */
function getPeriodoAtual() {
    return {
        mes: mesSelecionado,
        ano: anoSelecionado,
        numero: getNumeroPeriodo(mesSelecionado),
        label: getLabelPeriodo(mesSelecionado, anoSelecionado),
        labelCurto: getLabelPeriodoCurto(mesSelecionado)
    };
}
