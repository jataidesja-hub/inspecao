const CACHE_NAME = 'inspeção-pro-v5';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './src/modules/utils.js',
    './src/modules/api.js',
    './src/modules/periodos.js',
    './src/modules/offline.js',
    './src/modules/pdf.js',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || fetch(event.request);
        })
    );
});
