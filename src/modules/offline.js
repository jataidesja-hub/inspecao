/**
 * modules/offline.js
 * Módulo de cache/offline e Service Worker
 */

function registrarServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').then(reg => {
            console.log('SW pronto!');
            // Força o navegador a sempre buscar o arquivo sw.js mais novo
            reg.update();
        }).catch(err => console.log('Erro SW:', err));
    }
}

function salvarNoCacheHistorico(payload) {
    historicoInspecoes.push(payload);
    localStorage.setItem('cacheHistorico', JSON.stringify(historicoInspecoes));
}

function salvarOffline(payload) {
    const fila = JSON.parse(localStorage.getItem('filaOffline') || '[]');
    fila.push(payload);
    localStorage.setItem('filaOffline', JSON.stringify(fila));
}

async function atualizarEstadoConexao() {
    if (navigator.onLine) {
        offlineAlert.style.display = 'none';
        enviarPendenciasOffline();
    } else {
        offlineAlert.style.display = 'block';
    }
}

async function enviarPendenciasOffline() {
    const fila = JSON.parse(localStorage.getItem('filaOffline') || '[]');
    if (fila.length === 0) return;
    for (const payload of fila) {
        try {
            await postInspecao(payload);
        } catch (e) { }
    }
    localStorage.removeItem('filaOffline');
}
