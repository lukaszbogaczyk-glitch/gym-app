// Service worker: aplikacja działa bez internetu.
// Pliki aplikacji: najpierw z sieci (od razu najnowsza wersja), a bez internetu z pamięci.
// Zmień VERSION przy każdej zmianie listy plików.
const VERSION = 'v14';
const CACHE = 'silownia-' + VERSION;
const APP = ['./', './index.html', './exercises.js', './technique.js', './muscles.js', './anim.js', './anim3d.js', './kreator.js', './importxl.js', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(APP)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('silownia-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const fonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!sameOrigin && !fonts) return; // np. zapytania do API AI zawsze idą do sieci
  e.respondWith(caches.open(CACHE).then(async cache => {
    const key = req.mode === 'navigate' ? './index.html' : req;
    if (fonts) { // czcionki rzadko się zmieniają: z pamięci
      const hit = await cache.match(key);
      return hit || fetch(req).then(res => { if (res.ok || res.type === 'opaque') cache.put(key, res.clone()); return res; });
    }
    try { // pliki aplikacji: z sieci (najwyżej 5 s), żeby po zmianie od razu była nowa wersja
      const res = await Promise.race([fetch(req, { cache: 'no-cache' }), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 5000))]);
      if (res.ok) cache.put(key, res.clone());
      return res;
    } catch (err) {
      const hit = await cache.match(key, { ignoreSearch: true });
      if (hit) return hit;
      throw err;
    }
  }));
});
