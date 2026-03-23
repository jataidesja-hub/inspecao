/**
 * modules/pdf.js
 * Módulo de geração de PDF
 */

function formatarFalhaNoPDF(val) {
    if (!val || val === 'OK' || val.toString().toLowerCase().includes('ok')) return "OK";
    return val;
}

function adicionarBlocoVeiculo(doc, ins, y) {
    const marginX = 14;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setFillColor(240, 240, 240);
    doc.rect(marginX, y, 182, 8, 'F');
    doc.text(`VEÍCULO: ${ins.placa} | DATA: ${formatarData(ins.data)} | ROTA: ${ins.rota || ins.Rota || "N/A"}`, marginX + 2, y + 6);
    const rows = [
        ["Mecânica", formatarFalhaNoPDF(ins.mecanica)],
        ["Elétrica", formatarFalhaNoPDF(ins.eletrica)],
        ["Outros", formatarFalhaNoPDF(ins.outros)],
        ["Obs", ins.observacoes || ins.Observacoes || "-"]
    ];
    doc.autoTable({
        body: rows,
        startY: y + 8,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 2 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 30 }, 1: { cellWidth: 152 } }
    });
    return doc.lastAutoTable.finalY + 10;
}

/**
 * Gera PDF individual com período incluso
 */
function gerarPDF(dados) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Cabeçalho com período
    doc.setFontSize(16);
    doc.text("Relatório de Inspeção Individual", 105, 15, { align: "center" });
    
    // Período
    const periodoInfo = getPeriodoCompletoDaData(dados.data);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Período: ${dados.periodo || periodoInfo}`, 105, 22, { align: "center" });
    doc.setTextColor(0, 0, 0);
    
    adicionarBlocoVeiculo(doc, dados, 28);
    doc.save(`Inspecao_${dados.placa}_${dados.periodo || getPeriodoDaData(dados.data)}.pdf`);
}

/**
 * Gera relatório PDF por fornecedor com período
 */
function gerarRelatorioFornecedor() {
    const fornecedor = filterSupplier ? filterSupplier.value : '';
    const periodoHistorico = document.getElementById('filterPeriodoHistorico');
    const periodoFiltro = periodoHistorico ? periodoHistorico.value : '';
    
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

    // Filtra pelo fornecedor caso haja um selecionado, senão pega todos
    let todasDoFornecedor = fornecedor 
        ? historicoInspecoes.filter(ins => ins.fornecedor === fornecedor) 
        : [...historicoInspecoes];

    // Se houver filtro de período no histórico, aplica
    if (periodoFiltro) {
        todasDoFornecedor = todasDoFornecedor.filter(ins => {
            const periodo = getPeriodoCompletoDaData(formatarData(ins.data));
            return periodo === periodoFiltro;
        });
    }

    // Aplica filtro de datas (de / até)
    if (dtInicio || dtFim) {
        todasDoFornecedor = todasDoFornecedor.filter(ins => {
            const dFormat = formatarData(ins.data);
            if (dFormat && dFormat.includes('/')) {
                const parts = dFormat.split(' ')[0].split('/'); 
                if (parts.length === 3) {
                    const insDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]), 12, 0, 0);
                    if (dtInicio && insDate < dtInicio) return false;
                    if (dtFim && insDate > dtFim) return false;
                    return true;
                }
            }
            return false;
        });
    }

    if (todasDoFornecedor.length === 0) {
        alert("Nenhuma inspeção encontrada para os filtros selecionados.");
        return;
    }

    // Agrupa por placa mantendo apenas a última inspeção de cada placa
    const ultimasPorPlaca = {};
    todasDoFornecedor.forEach(ins => {
        ultimasPorPlaca[ins.placa] = ins;
    });

    const filtradas = Object.values(ultimasPorPlaca);
    if (filtradas.length === 0) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(18);
    const tituloDoc = fornecedor ? `Transportador: ${fornecedor}` : `Relatório Geral de Frota`;
    doc.text(tituloDoc, 14, 15);
    doc.setFontSize(10);
    doc.text(`Emitido em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 22);
    
    if (periodoFiltro) {
        doc.text(`Período: ${periodoFiltro}`, 14, 28);
    }

    let currentY = periodoFiltro ? 36 : 30;
    filtradas.forEach(ins => {
        if (currentY > 240) {
            doc.addPage();
            currentY = 20;
        }
        currentY = adicionarBlocoVeiculo(doc, ins, currentY);
    });

    const suffixPeriodo = periodoFiltro ? `_${periodoFiltro.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
    const suffixFornecedor = fornecedor ? `_${fornecedor}` : '_Geral';
    doc.save(`Relatorio_Frota${suffixFornecedor}${suffixPeriodo}.pdf`);
}
