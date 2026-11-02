/* ==================================================================
   HUTCH OS page helper (service worker) · Nov 2, 2026 (Toby + Claude)
   Toby: "any app I tap opens slowly". Every Hutch app is a full page
   from Micro.blog, so each tap waited on the server. This keeps a copy
   of each page on the phone and opens that copy at once.

     - Only Hutch registers it (static/js/hutch.js, when ?hutch=on).
       ?hutch=off (Settings > Switch to classic) removes it and its
       saved pages (layouts/partials/head.html), so Traditional
       visitors never have it.
     - Only page loads (navigations) on this site. Pictures, styles,
       scripts, feeds and anything with ?hutch= or ?sky= go straight to
       the network as always.
     - A saved copy opens first; with no saved copy, the network does
       and the result is saved. hutch.js then fetches a fresh copy in
       the background, saves it, and offers "New posts · Refresh" when
       the page changed.
     - At most 60 pages are kept; the oldest go first.
   ================================================================== */
var CACHE = 'hutch-pages-v1';
var MAX = 60;

self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('hutch-pages-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function key(url) {
  var u = new URL(url);
  u.hash = '';
  return u.href;
}
function skip(req) {
  if (req.method !== 'GET' || req.mode !== 'navigate') return true;
  var u = new URL(req.url);
  if (u.origin !== self.location.origin) return true;
  if (/[?&](hutch|sky|season|fonts)=/.test(u.search)) return true;
  if (/\.(xml|json|txt|rss)$/i.test(u.pathname)) return true;
  return false;
}
function trim(cache) {
  return cache.keys().then(function (keys) {
    if (keys.length <= MAX) return;
    return Promise.all(keys.slice(0, keys.length - MAX).map(function (k) { return cache.delete(k); }));
  });
}
function save(req, res) {
  if (!res || !res.ok || res.type !== 'basic' || !/text\/html/i.test(res.headers.get('content-type') || '')) return Promise.resolve();
  var copy = res.clone();
  return caches.open(CACHE).then(function (c) { return c.put(key(req.url), copy).then(function () { return trim(c); }); });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (skip(req)) return;
  e.respondWith(
    caches.open(CACHE).then(function (c) { return c.match(key(req.url)); }).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) { e.waitUntil(save(req, res)); return res; });
    }).catch(function () { return fetch(req); })
  );
});

/* hutch.js asks for pages to be saved ahead (the apps on the home screen) */
self.addEventListener('message', function (e) {
  var d = e.data || {};
  if (d.type === 'hutch-preload' && d.urls) {
    e.waitUntil(caches.open(CACHE).then(function (c) {
      return Promise.all(d.urls.map(function (u) {
        var k = key(new URL(u, self.location.origin).href);
        return c.match(k).then(function (hit) {
          if (hit) return;
          return fetch(k, { credentials: 'same-origin' }).then(function (res) {
            if (res.ok && /text\/html/i.test(res.headers.get('content-type') || '')) return c.put(k, res);
          }).catch(function () {});
        });
      })).then(function () { return trim(c); });
    }));
  }
  if (d.type === 'hutch-clear') e.waitUntil(caches.delete(CACHE));
});
