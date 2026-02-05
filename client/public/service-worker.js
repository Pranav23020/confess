// SELF-DESTRUCT SERVICE WORKER
// This overwrites the previous SW to kill the cache and stop reloads

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Unregister itself
      if (self.registration) {
        await self.registration.unregister();
      }

      // Claim clients to take control immediately
      await self.clients.claim();

      // Force reload all clients one last time to get fresh non-cached version
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({ type: 'SW_REMOVED' });
      });
    })()
  );
});
