const CACHE_NAME = 'breque-pwa-v9'
// O bundle tem nome fixo para poder entrar no precache: sem ele, a primeira
// abertura offline do PWA carregaria o HTML sem as funções do app.
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/app.html',
  '/assets/app.js',
  '/manifest.webmanifest',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
]

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch(() => {}),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  )
})

// Network-first: sempre busca a versão mais nova quando online; usa cache se offline.
// NUNCA guarda URLs com query string: o Web Share Target (GET) coloca o texto
// compartilhado na URL, e isso seria persistência de PII (regra 4 do AGENTS.md).
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (url.search === '' && response && response.status === 200) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() =>
        caches
          .match(event.request)
          .then((cached) => cached || caches.match('/app.html') || caches.match('/')),
      ),
  )
})
