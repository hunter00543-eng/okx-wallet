const CACHE_NAME = "trading-dashboard-v3";

const APP_SHELL = [
  "./index.html",
  "./install.html",
  "./offline.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-180.png",
  "./icons/favicon.png"
];


/* INSTALL */

self.addEventListener("install", event => {

  event.waitUntil(

    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())

  );

});


/* ACTIVATE */

self.addEventListener("activate", event => {

  event.waitUntil(

    caches.keys().then(cacheNames => {

      return Promise.all(

        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))

      );

    }).then(() => {

      return self.clients.claim();

    })

  );

});


/* FETCH */

self.addEventListener("fetch", event => {

  if (event.request.method !== "GET") {
    return;
  }


  /*
    IMPORTANT:
    Do not allow the service worker to cache or
    override the normal website root URL.
  */

  if (event.request.mode === "navigate") {

    const url = new URL(event.request.url);

    if (url.pathname === "/" || url.pathname === "") {

      event.respondWith(
        fetch(event.request)
      );

      return;
    }
  }


  /* NORMAL REQUEST HANDLING */

  event.respondWith(

    fetch(event.request)

      .then(response => {

        if (
          response &&
          response.status === 200 &&
          response.type === "basic"
        ) {

          const responseClone = response.clone();

          caches.open(CACHE_NAME).then(cache => {

            cache.put(
              event.request,
              responseClone
            );

          });

        }

        return response;

      })

      .catch(() => {

        return caches.match(event.request)

          .then(cachedResponse => {

            if (cachedResponse) {
              return cachedResponse;
            }


            if (event.request.mode === "navigate") {

              return caches.match("./offline.html");

            }


            return new Response(
              "You are currently offline.",
              {
                status: 503,
                statusText: "Service Unavailable",
                headers: {
                  "Content-Type": "text/plain"
                }
              }
            );

          });

      })

  );

});