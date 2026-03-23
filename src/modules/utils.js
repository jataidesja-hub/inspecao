/**
 * modules/utils.js
 * Funções utilitárias gerais
 */

function formatarData(dataStr) {
    if (!dataStr) return "";
    try {
        if (dataStr.toString().includes('/')) return dataStr;
        const d = new Date(dataStr);
        if (isNaN(d.getTime())) return dataStr;
        return d.toLocaleDateString('pt-BR');
    } catch (e) {
        return dataStr;
    }
}
