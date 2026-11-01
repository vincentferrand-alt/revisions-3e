// Service worker minimal : permet l'installation et l'usage hors-ligne.
// Pour forcer une mise à jour chez tous les utilisateurs, change le numéro de version ci-dessous.
const CACHE = 'revisions-3e-v1';
const FICHIERS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(FICHIERS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cles) => Promise.all(cles.filter((c) => c !== CACHE).map((c) => caches.delete(c))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Pages : réseau d'abord (pour voir les nouvelles leçons), cache si hors-ligne.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((rep) => {
          const copie = rep.clone();
          caches.open(CACHE).then((c) => c.put(req, copie));
          return rep;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  // Autres fichiers : cache d'abord, puis réseau.
  event.respondWith(
    caches.match(req).then((r) => r || fetch(req).then((rep) => {
      const copie = rep.clone();
      caches.open(CACHE).then((c) => c.put(req, copie));
      return rep;
    }))
  );
});
