/**
 * script.js - Controlador Principal
 * Inspeção Pro v3 - Sistema de Inspeção de Veículos
 * 
 * Módulos carregados via index.html:
 *   - src/modules/utils.js      (formatarData, etc.)
 *   - src/modules/api.js        (fetchVeiculos, fetchInspecoes, postInspecao)
 *   - src/modules/periodos.js   (sistema de períodos P1-P12)
 *   - src/modules/offline.js    (cache, service worker, sync)
 *   - src/modules/pdf.js        (geração de PDF)
 */

// ESTADO DA APLICAÇÃO
let veiculosOriginal = [];
let veiculosFiltrados = [];
let historicoInspecoes = [];
let veiculoSelecionado = null;
let deferredInstallPrompt = null;

// ELEMENTOS DOM
const listaVeiculos = document.getElementById('listaVeiculos');
const searchInput = document.getElementById('searchInput');
const filterRoute = document.getElementById('filterRoute');
const dashboardView = document.getElementById('dashboardView');
const inspecaoView = document.getElementById('inspecaoView');
const historicoView = document.getElementById('historicoView');
const backBtn = document.getElementById('backBtn');
const formInspecao = document.getElementById('formInspecao');
const filterSupplier = document.getElementById('filterSupplier');
const filterPeriodoHistorico = document.getElementById('filterPeriodoHistorico');
const listaHistorico = document.getElementById('listaHistorico');
const btnInstall = document.getElementById('btnInstall');
const offlineAlert = document.getElementById('offlineAlert');

// Elements Modal
const modalDetalhes = document.getElementById('modalDetalhes');
const modalBody = document.getElementById('modalBody');
const btnReimprimir = document.getElementById('btnReimprimir');

/**
 * Inicialização
 */
document.addEventListener('DOMContentLoaded', () => {
    registrarServiceWorker();
    inicializarPeriodos();
    carregarVeiculos();
    carregarHistorico();

    searchInput.addEventListener('input', filtrarVeiculos);
    filterRoute.addEventListener('change', filtrarVeiculos);
    backBtn.addEventListener('click', () => 切换View('dashboard'));
    formInspecao.addEventListener('submit', salvarInspecao);

    // Filtro de período no histórico
    if (filterPeriodoHistorico) {
        filterPeriodoHistorico.addEventListener('change', renderizarHistorico);
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredInstallPrompt = e;
        btnInstall.style.display = 'block';
    });

    btnInstall.addEventListener('click', async () => {
        if (deferredInstallPrompt) {
            deferredInstallPrompt.prompt();
            const { outcome } = await deferredInstallPrompt.userChoice;
            if (outcome === 'accepted') btnInstall.style.display = 'none';
            deferredInstallPrompt = null;
        }
    });

    window.addEventListener('online', atualizarEstadoConexao);
    window.addEventListener('offline', atualizarEstadoConexao);
    atualizarEstadoConexao();
});

async function carregarVeiculos() {
    try {
        const data = await fetchVeiculos();
        veiculosOriginal = data;
        localStorage.setItem('cacheVeiculos', JSON.stringify(data));
        atualizarFiltrosDeRota();
        filtrarVeiculos();
    } catch (error) {
        const cache = localStorage.getItem('cacheVeiculos');
        if (cache) {
            veiculosOriginal = JSON.parse(cache);
            atualizarFiltrosDeRota();
            filtrarVeiculos();
        }
    }
}

async function carregarHistorico() {
    try {
        const data = await fetchInspecoes();
        historicoInspecoes = data;
        localStorage.setItem('cacheHistorico', JSON.stringify(historicoInspecoes));
        renderizarHistorico();
        atualizarFiltroFornecedor();
        atualizarFiltroPeriodoHistorico();
        renderizarVeiculos();
    } catch (error) {
        const cache = localStorage.getItem('cacheHistorico');
        if (cache) {
            historicoInspecoes = JSON.parse(cache);
            renderizarHistorico();
            atualizarFiltroFornecedor();
            atualizarFiltroPeriodoHistorico();
            renderizarVeiculos();
        }
    }
}

function atualizarFiltrosDeRota() {
    const rotas = [...new Set(veiculosOriginal.map(v => v.rota || v.Rota))].filter(r => r);
    filterRoute.innerHTML = '<option value="">Todas as Rotas</option>';
    rotas.sort().forEach(rota => {
        const option = document.createElement('option');
        option.value = rota;
        option.textContent = rota;
        filterRoute.appendChild(option);
    });
}

function atualizarFiltroFornecedor() {
    const fornecedores = [...new Set(historicoInspecoes.map(v => v.fornecedor || v.Fornecedor))].filter(f => f);
    filterSupplier.innerHTML = '<option value="">Todos os Transportadores</option>';
    fornecedores.sort().forEach(fornecedor => {
        const option = document.createElement('option');
        option.value = fornecedor;
        option.textContent = fornecedor;
        filterSupplier.appendChild(option);
    });
}

/**
 * Atualiza filtro de períodos no histórico
 */
function atualizarFiltroPeriodoHistorico() {
    if (!filterPeriodoHistorico) return;

    const periodos = new Set();
    historicoInspecoes.forEach(ins => {
        const periodo = getPeriodoCompletoDaData(formatarData(ins.data));
        if (periodo !== '-') periodos.add(periodo);
    });

    const current = filterPeriodoHistorico.value;
    filterPeriodoHistorico.innerHTML = '<option value="">Todos os Períodos</option>';
    [...periodos].sort().reverse().forEach(periodo => {
        const option = document.createElement('option');
        option.value = periodo;
        option.textContent = periodo;
        filterPeriodoHistorico.appendChild(option);
    });
    filterPeriodoHistorico.value = current;
}

function filtrarVeiculos() {
    const search = searchInput.value.toLowerCase();
    const rota = filterRoute.value;

    veiculosFiltrados = veiculosOriginal.filter(v => {
        const placa = (v.placa || "").toLowerCase();
        const vRota = (v.rota || v.Rota || "").toString();
        const matchSearch = placa.includes(search);
        const matchRota = rota === "" || vRota === rota;
        return matchSearch && matchRota;
    });

    renderizarVeiculos();
}

function 切换View(view) {
    dashboardView.style.display = 'none';
    inspecaoView.style.display = 'none';
    historicoView.style.display = 'none';
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    if (view === 'dashboard') {
        dashboardView.style.display = 'block';
        document.querySelector('button[onclick*="dashboard"]').classList.add('active');
        veiculoSelecionado = null;
        atualizarContadores();
    } else if (view === 'inspecao') {
        inspecaoView.style.display = 'block';
        formInspecao.reset();
        resetStatusButtons();
        // Mostra o período selecionado na inspeção
        const periodoAtual = getPeriodoAtual();
        const periodoValue = document.getElementById('periodoInspecaoValue');
        if (periodoValue) {
            periodoValue.textContent = periodoAtual.label;
        }
        
        // Define a data de hoje como padrão no input
        const dataInput = document.getElementById('dataInspecao');
        if (dataInput) {
            const hoje = new Date();
            const yyyy = hoje.getFullYear();
            const mm = String(hoje.getMonth() + 1).padStart(2, '0');
            const dd = String(hoje.getDate()).padStart(2, '0');
            dataInput.value = `${yyyy}-${mm}-${dd}`;
        }
    } else if (view === 'historico') {
        historicoView.style.display = 'block';
        document.querySelector('button[onclick*="historico"]').classList.add('active');
        carregarHistorico();
    }
}

/**
 * Verifica se veículo foi inspecionado no período selecionado
 */
function isInspecionadoNoPeriodo(placa) {
    return historicoInspecoes.some(ins => {
        const dataFormatada = formatarData(ins.data);
        return ins.placa === placa && dataPertenceAoPeriodo(dataFormatada, mesSelecionado, anoSelecionado);
    });
}

// (Função isInspecionadoHoje removida para forçar o uso exclusivo do período selecionado)


function atualizarContadores() {
    const total = veiculosOriginal.length;
    const feitos = veiculosOriginal.filter(v => isInspecionadoNoPeriodo(v.placa)).length;
    document.getElementById('countFeitos').textContent = feitos;
    document.getElementById('countFaltam').textContent = total - feitos;
}

function renderizarVeiculos() {
    listaVeiculos.innerHTML = '';
    if (veiculosFiltrados.length === 0) {
        listaVeiculos.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">Nenhum veículo encontrado.</p>';
        return;
    }

    veiculosFiltrados.forEach(v => {
        // Usa o PERÍODO SELECIONADO como referência para o status
        const feitoNoPeriodo = isInspecionadoNoPeriodo(v.placa);
        const div = document.createElement('div');
        div.className = `card glass vehicle-card fade-in ${feitoNoPeriodo ? 'inspected' : ''}`;
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span class="plate">${v.placa || "S/P"}</span>
                ${feitoNoPeriodo ? '<span class="status-badge conforme" style="width:auto;">FEITO</span>' : ''}
                <span style="font-size:0.8rem; color:var(--text-secondary)">Rota: ${v.rota || v.Rota || "N/A"}</span>
            </div>
            <h3 style="margin:1rem 0 0.5rem 0; font-size:1.1rem">${v.fornecedor || "Desconhecido"}</h3>
            <p style="font-size:0.85rem; color:var(--text-secondary)">${v.descricao_veiculo || v.Descricao_Veiculo || ""}</p>
        `;
        div.onclick = () => selecionarVeiculo(v);
        listaVeiculos.appendChild(div);
    });
    atualizarContadores();
}

/**
 * Renderiza histórico com Períodos
 */
function renderizarHistorico() {
    listaHistorico.innerHTML = '';
    
    let dadosHistorico = [...historicoInspecoes];

    // Filtros visuais
    const periodoFiltro = filterPeriodoHistorico ? filterPeriodoHistorico.value : '';
    const fornecedorFiltro = filterSupplier ? filterSupplier.value : '';
    const dtInicioInput = document.getElementById('filterDataInicio');
    const dtFimInput = document.getElementById('filterDataFim');
    const dtInicioStr = dtInicioInput ? dtInicioInput.value : '';
    const dtFimStr = dtFimInput ? dtFimInput.value : '';

    let dtInicio = null;
    let dtFim = null;

    if (dtInicioStr) {
        const p = dtInicioStr.split('-');
        dtInicio = new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2]), 0, 0, 0);
    }
    if (dtFimStr) {
        const p = dtFimStr.split('-');
        dtFim = new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2]), 23, 59, 59);
    }

    dadosHistorico = dadosHistorico.filter(ins => {
        // 1. Filtro Período
        if (periodoFiltro) {
            const periodo = getPeriodoCompletoDaData(formatarData(ins.data));
            if (periodo !== periodoFiltro) return false;
        }

        // 2. Filtro Fornecedor
        if (fornecedorFiltro && ins.fornecedor !== fornecedorFiltro) {
            return false;
        }

        // 3. Filtro Data
        if (dtInicio || dtFim) {
            // A data armazenada está em pt-BR (dd/mm/yyyy). formatarData cuida disso.
            // Para comparar corretamente, precisamos parsear a data da inspeção p/ Date object
            const dFormat = formatarData(ins.data);
            if (dFormat && dFormat.includes('/')) {
                const parts = dFormat.split(' ')[0].split('/'); // Pega só a data
                if (parts.length === 3) {
                    const insDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]), 12, 0, 0);
                    if (dtInicio && insDate < dtInicio) return false;
                    if (dtFim && insDate > dtFim) return false;
                }
            }
        }

        return true;
    });

    if (dadosHistorico.length === 0) {
        listaHistorico.innerHTML = '<tr><td colspan="6" style="text-align:center">Nenhuma inspeção encontrada.</td></tr>';
        return;
    }

    dadosHistorico.slice().reverse().forEach((ins, index) => {
        const tr = document.createElement('tr');
        const statusClass = ins.status === 'conforme' ? 'status-ok' : 'status-issue';
        const periodo = ins.periodo || getPeriodoDaData(formatarData(ins.data));
        tr.innerHTML = `
            <td data-label="Período"><span class="period-cell-badge">${periodo}</span></td>
            <td data-label="Data">${formatarData(ins.data)}</td>
            <td data-label="Placa"><span class="plate" style="font-size:0.75rem">${ins.placa}</span></td>
            <td data-label="Transportador">${ins.fornecedor}</td>
            <td data-label="Status"><span class="status-indicator ${statusClass}"></span> ${ins.status.toUpperCase()}</td>
            <td data-label="Ação"><button class="btn" style="padding:0.4rem 0.8rem; font-size:0.8rem; background:rgba(255,255,255,0.1); color:white;" onclick="abrirDetalhes(${index})">Ver Detalhes</button></td>
        `;
        listaHistorico.appendChild(tr);
    });
}

function selecionarVeiculo(veiculo) {
    veiculoSelecionado = veiculo;
    document.getElementById('inspecaoTitle').textContent = `Inspeção: ${veiculo.placa || "Sem Placa"}`;
    document.getElementById('inspecaoFornecedor').textContent = veiculo.fornecedor || "";
    切换View('inspecao');
}

function resetStatusButtons() {
    ['mecanica', 'eletrica', 'outros'].forEach(tipo => {
        toggleStatus(tipo, 'OK');
    });
    atualizarStatusGeral();
}

function toggleStatus(tipo, status) {
    const btnOk = document.getElementById(`btn_${tipo}_ok`);
    const btnFail = document.getElementById(`btn_${tipo}_fail`);
    const inputStatus = document.getElementById(`input_${tipo}_status`);
    const detailField = document.getElementById(`detail_${tipo}`);

    if (status === 'OK') {
        btnOk.classList.add('active-ok');
        btnFail.classList.remove('active-fail');
        inputStatus.value = 'OK';
        detailField.classList.remove('visible');
    } else {
        btnOk.classList.remove('active-ok');
        btnFail.classList.add('active-fail');
        inputStatus.value = 'FAIL';
        detailField.classList.add('visible');
    }
    atualizarStatusGeral();
}

function atualizarStatusGeral() {
    const m = document.getElementById('input_mecanica_status').value;
    const e = document.getElementById('input_eletrica_status').value;
    const o = document.getElementById('input_outros_status').value;

    const display = document.getElementById('displayStatusGeral');
    const input = document.getElementById('inputStatusGeral');

    if (m === 'FAIL' || e === 'FAIL' || o === 'FAIL') {
        display.textContent = 'Não Conforme (Possui Falhas)';
        display.className = 'status-badge nao_conforme';
        input.value = 'nao_conforme';
    } else {
        display.textContent = 'Conforme (Tudo OK)';
        display.className = 'status-badge conforme';
        input.value = 'conforme';
    }
}

function abrirDetalhes(index) {
    // Reconstrói o mesmo array filtrado
    let dadosHistorico = [...historicoInspecoes];
    const periodoFiltro = filterPeriodoHistorico ? filterPeriodoHistorico.value : '';
    if (periodoFiltro) {
        dadosHistorico = dadosHistorico.filter(ins => {
            const periodo = getPeriodoCompletoDaData(formatarData(ins.data));
            return periodo === periodoFiltro;
        });
    }
    const ins = dadosHistorico.slice().reverse()[index];
    if (!ins) return;

    const periodo = ins.periodo || getPeriodoCompletoDaData(formatarData(ins.data));
    document.getElementById('modalTitle').textContent = `Inspeção: ${ins.placa}`;
    modalBody.innerHTML = `
        <div class="detail-item"><span class="detail-label">Período</span><span class="detail-val">${periodo}</span></div>
        <div class="detail-item"><span class="detail-label">Data</span><span class="detail-val">${formatarData(ins.data)}</span></div>
        <div class="detail-item"><span class="detail-label">Transportador</span><span class="detail-val">${ins.fornecedor}</span></div>
        <div class="detail-item"><span class="detail-label">Rota</span><span class="detail-val">${ins.rota || ins.Rota || "N/A"}</span></div>
        <div class="detail-item"><span class="detail-label">Status Geral</span><span class="detail-val">${ins.status.toUpperCase()}</span></div>
        <div class="detail-item"><span class="detail-label">Mecânica</span><span class="detail-val">${ins.mecanica}</span></div>
        <div class="detail-item"><span class="detail-label">Elétrica</span><span class="detail-val">${ins.eletrica}</span></div>
        <div class="detail-item"><span class="detail-label">Outros</span><span class="detail-val">${ins.outros}</span></div>
        <div class="detail-item"><span class="detail-label">Observações</span><span class="detail-val">${ins.observacoes || "Nenhuma"}</span></div>
    `;
    btnReimprimir.onclick = () => gerarPDF(ins);
    modalDetalhes.style.display = 'flex';
}

function fecharModal() {
    modalDetalhes.style.display = 'none';
}

/**
 * Salvar inspeção com período
 */
async function salvarInspecao(e) {
    e.preventDefault();
    const formData = new FormData(formInspecao);
    const getVal = (tipo) => {
        const status = formData.get(`${tipo}_status`);
        const detalhe = formData.get(`${tipo}_detalhe`);
        if (status === 'OK') return 'OK';
        return detalhe && detalhe.trim() !== '' ? "Falha: " + detalhe : "Falha: (Não especificada)";
    };

    let dataObj = new Date();
    const dataInputVal = formData.get('dataInspecao');
    if (dataInputVal) {
        // Input do tipo date retorna YYYY-MM-DD
        const parts = dataInputVal.split('-');
        if (parts.length === 3) {
            dataObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        }
    }
    const dataFormatada = dataObj.toLocaleDateString('pt-BR');

    const periodoAtual = getPeriodoAtual();

    const payload = {
        data: dataFormatada,
        periodo: periodoAtual.labelCurto,
        periodo_completo: periodoAtual.label,
        placa: veiculoSelecionado.placa,
        rota: (veiculoSelecionado.rota || veiculoSelecionado.Rota || "N/A").toString(),
        fornecedor: veiculoSelecionado.fornecedor,
        status: formData.get('status'),
        mecanica: getVal('mecanica'),
        eletrica: getVal('eletrica'),
        outros: getVal('outros'),
        observacoes: formData.get('observacoes')
    };

    salvarNoCacheHistorico(payload);
    try {
        await postInspecao(payload);
    } catch (err) {
        salvarOffline(payload);
    }
    gerarPDF(payload);
    renderizarVeiculos();
    切换View('dashboard');
}
