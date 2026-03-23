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
    const fornecedor = filterSupplier.value;
    if (!fornecedor) return;

    const periodoHistorico = document.getElementById('filterPeriodoHistorico');
    const periodoFiltro = periodoHistorico ? periodoHistorico.value : '';

    // Filtra todas as inspeções deste transportador
    let todasDoFornecedor = historicoInspecoes.filter(ins => ins.fornecedor === fornecedor);

    // Se houver filtro de período no histórico, aplica
    if (periodoFiltro) {
        todasDoFornecedor = todasDoFornecedor.filter(ins => {
            const periodo = getPeriodoCompletoDaData(formatarData(ins.data));
            return periodo === periodoFiltro;
        });
    }

    // Agrupa por placa mantendo apenas a última
    const ultimasPorPlaca = {};
    todasDoFornecedor.forEach(ins => {
        ultimasPorPlaca[ins.placa] = ins;
    });

    const filtradas = Object.values(ultimasPorPlaca);
    if (filtradas.length === 0) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Transportador: ${fornecedor}`, 14, 15);
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

    const suffix = periodoFiltro ? `_${periodoFiltro.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
    doc.save(`Relatorio_Frota_${fornecedor}${suffix}.pdf`);
}
