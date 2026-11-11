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
/* v2 (Nov 3): Surprise me is never saved (it is a different random post
   every time; v1 could save one pick and keep showing it), and neither
   is any page that arrived through a redirect. Bumping the name clears
   v1's saved pages. */
var CACHE = 'hutch-pages-v2';
var MAX = 60;
/* v3 (Nov 11, Toby: Word Nerd opened on yesterday's word, then changed
   under him; "I don't want people to see it like this"). A saved copy
   opens first only while it is fresh (saved in the last 5 minutes). An
   older copy waits for the site: the current page is fetched, shown and
   saved. If the site takes longer than 3 seconds (or is unreachable),
   the saved copy opens after all. Every saved copy carries the time it
   was saved (x-hutch-t); one without it counts as old. The home screen
   also renews its apps' old copies in the background (hutch-preload), so
   a tap on an app is nearly always both instant and current. */
var FRESH_MS = 5 * 60 * 1000;
var WAIT_MS = 3000;
function age(hit) { var t = +(hit.headers.get('x-hutch-t') || 0); return t ? Date.now() - t : Infinity; }
function stampPut(c, k, res) {
  return res.text().then(function (t) {
    return c.put(k, new Response(t, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'x-hutch-t': String(Date.now()) } }));
  });
}

self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('hutch-pages-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

/* Theme files on a saved page (Nov 3, Toby: after swiping, the next post
   had no Home badge and no Surprise me button). A saved page keeps the
   theme file addresses it was saved with (hutch.js?<build number>), so it
   could run older theme code than the site has now. The newest build
   numbers seen are kept here, and every saved page is handed out with its
   theme files pointed at the newest ones. */
var ASSETS = '/__hutch-assets__';
/* the addresses can be written \/js\/hutch.js inside a script */
var ASSET_RE = /(\\?\/(?:css|js)\\?\/[\w.-]+\.(?:css|js))\?(\d{9,11})/g;
function akey(p) { return p.replace(/\\/g, ''); }
var latest = null;
function grab(text) { var m, map = {}; ASSET_RE.lastIndex = 0; while ((m = ASSET_RE.exec(text))) map[akey(m[1])] = m[2]; return map; }
function learn(text) {
  var map = grab(text); if (!Object.keys(map).length) return Promise.resolve();
  return getLatest().then(function (cur) {
    var changed = false;
    Object.keys(map).forEach(function (k) { if (!cur[k] || +map[k] > +cur[k]) { cur[k] = map[k]; changed = true; } });
    latest = cur;
    if (!changed) return;
    return caches.open(CACHE).then(function (c) { return c.put(ASSETS, new Response(JSON.stringify(cur), { headers: { 'content-type': 'application/json' } })); });
  });
}
function getLatest() {
  if (latest) return Promise.resolve(latest);
  return caches.open(CACHE).then(function (c) { return c.match(ASSETS); }).then(function (r) { return r ? r.json() : {}; })
    .catch(function () { return {}; }).then(function (m) { latest = m || {}; return latest; });
}
function freshen(res) {
  return Promise.all([res.text(), getLatest()]).then(function (a) {
    var t = a[0], map = a[1];
    t = t.replace(ASSET_RE, function (all, path, v) { var n = map[akey(path)]; return n && +n > +v ? path + '?' + n : all; });
    return new Response(t, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } });
  });
}

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
  if (/^\/surprise/i.test(u.pathname)) return true;
  return false;
}
function trim(cache) {
  return cache.keys().then(function (keys) {
    keys = keys.filter(function (k) { return k.url.indexOf(ASSETS) < 0; });
    if (keys.length <= MAX) return;
    return Promise.all(keys.slice(0, keys.length - MAX).map(function (k) { return cache.delete(k); }));
  });
}
function save(req, res) {
  if (!res || !res.ok || res.type !== 'basic' || res.redirected || !/text\/html/i.test(res.headers.get('content-type') || '')) return Promise.resolve();
  var copy = res.clone(), look = res.clone();
  return Promise.all([
    caches.open(CACHE).then(function (c) { return stampPut(c, key(req.url), copy).then(function () { return trim(c); }); }),
    look.text().then(learn)
  ]);
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (skip(req)) return;
  e.respondWith(
    caches.open(CACHE).then(function (c) { return c.match(key(req.url)); }).then(function (hit) {
      if (hit && age(hit) < FRESH_MS) return freshen(hit);
      var net = fetch(req).then(function (res) { e.waitUntil(save(req, res)); return res; });
      if (!hit) return net;
      /* an older copy: the site first, the copy if the site is slow, down or failing */
      var wait = new Promise(function (r) { setTimeout(function () { r(null); }, WAIT_MS); });
      return Promise.race([net.catch(function () { return null; }), wait]).then(function (res) {
        if (!res || res.status >= 500) return freshen(hit);
        return res;
      });
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
        if (/\/surprise/i.test(k)) return;
        return c.match(k).then(function (hit) {
          /* a fresh copy is left alone; a missing or old one is fetched (Nov 11) */
          if (hit && age(hit) < FRESH_MS) return;
          return fetch(k, { credentials: 'same-origin', cache: 'no-store' }).then(function (res) {
            if (res.ok && !res.redirected && /text\/html/i.test(res.headers.get('content-type') || '')) { var look = res.clone(); return Promise.all([stampPut(c, k, res), look.text().then(learn)]); }
          }).catch(function () {});
        });
      })).then(function () { return trim(c); });
    }));
  }
  if (d.type === 'hutch-clear') e.waitUntil(caches.delete(CACHE));
  /* the page found a newer copy of itself: learn its theme build numbers */
  if (d.type === 'hutch-learn' && d.text) e.waitUntil(learn(String(d.text)));
});
