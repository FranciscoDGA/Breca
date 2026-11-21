/* BRECA — service worker mínimo (shell offline).
   O PWA baixa o próprio pacote para instalar. Nenhum dado do usuário sai daqui:
   não há upload, analytics nem chamadas a backend algum. */
const CACHE = 'breca-v1'
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((chaves) => Promise.all(chaves.filter((c) => c !== CACHE).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req)
          .then((resp) => {
            const copia = resp.clone()
            if (resp.ok && new URL(req.url).origin === self.location.origin) {
              caches.open(CACHE).then((cache) => cache.put(req, copia))
            }
            return resp
          })
          .catch(() => caches.match('/index.html')),
    ),
  )
})
