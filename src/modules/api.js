/**
 * modules/api.js
 * Módulo de comunicação com o backend (Google Apps Script)
 */

const GAS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbxV3o7O3stAND63PG_WKCHnCc5QHCk-9sKyQVwprax_BuGJKrPidQ0sDz9MSH-pGS1O/exec";

/**
 * Busca veículos na planilha
 */
async function fetchVeiculos() {
    const response = await fetch(`${GAS_WEBAPP_URL}?action=getVeiculos`);
    return await response.json();
}

/**
 * Busca histórico de inspeções
 */
async function fetchInspecoes() {
    const response = await fetch(`${GAS_WEBAPP_URL}?action=getInspecoes`);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
}

/**
 * Salva inspeção no backend
 */
async function postInspecao(payload) {
    return await fetch(GAS_WEBAPP_URL, {
        method: "POST",
        body: JSON.stringify({ action: "salvarInspecao", payload: payload })
    });
}
