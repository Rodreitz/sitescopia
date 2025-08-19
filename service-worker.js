// service-worker.js

// O nome do cache é versionado. Mudar este nome força a atualização de todos os arquivos.
const CACHE_NAME = 'arttesdabel-cache-v1.0.2.4'; // Incremente a versão do cache
// Lista de arquivos e recursos essenciais para o funcionamento offline do app.
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/logo.png',
  '/manifest.json'
];

// Lista de recursos de terceiros (não essenciais para o boot inicial)
const externalUrlsToCache = [
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@700&display=swap',
  'https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js',
  'https://cdn.jsdelivr.net/npm/toastify-js'
];


self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Cache aberto.');
      // --- NOVO: Cacheamento resiliente ---
      // Cacheia os arquivos essenciais primeiro. Se falhar, a instalação falha.
      return cache.addAll(urlsToCache).then(() => {
        // Depois, tenta cachear os recursos externos. Se um deles falhar, não impede a instalação.
        const externalCachePromises = externalUrlsToCache.map(url => 
          cache.add(url).catch(err => console.warn(`Falha ao cachear ${url}:`, err))
        );
        return Promise.all(externalCachePromises);
      });
    }).then(() => self.skipWaiting()) // Força a ativação imediata.
  );
});


self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('A deletar cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) 
  );
});


self.addEventListener('fetch', event => {
  // Estratégia "Network Falling Back to Cache" para navegação
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Estratégia "Cache First, Falling Back to Network" para outros recursos
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).then(fetchResponse => {
        // Opcional: Adiciona novas requisições ao cache dinamicamente
        if (fetchResponse.ok) {
          const responseToCache = fetchResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return fetchResponse;
      });
    })
  );
});
