const scope = self.registration.scope;
const prefix = 'palletoptimizer:' + scope + ':';
const cacheName = prefix + '6f64a15e8611ab66';
const files = ['index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
const urls = files.map(file => new URL(file, scope).href);
const home = urls[0];

self.addEventListener('install', event => {
    event.waitUntil((async () => {
        const cache = await caches.open(cacheName);
        await cache.addAll(urls.map(url => new Request(url, {cache: 'reload'})));
        await self.skipWaiting();
    })());
});

self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys.filter(key => key.startsWith(prefix) && key !== cacheName)
            .map(key => caches.delete(key)));
        await self.clients.claim();
    })());
});

self.addEventListener('fetch', event => {
    const {request} = event;
    if (request.method !== 'GET' || !request.url.startsWith(scope)) return;
    if (request.mode === 'navigate') {
        const url = new URL(request.url);
        url.search = '';
        if (url.href !== scope && url.href !== home) return;
        event.respondWith((async () => {
            try {
                const response = await fetch(request);
                if (response.ok) return response;
                return (await (await caches.open(cacheName)).match(home)) ?? response;
            } catch {
                return (await (await caches.open(cacheName)).match(home)) ?? Response.error();
            }
        })());
    } else if (urls.includes(request.url)) {
        event.respondWith((async () => (await (await caches.open(cacheName)).match(request)) ?? fetch(request))());
    }
});
