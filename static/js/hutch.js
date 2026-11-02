/* ==================================================================
   HUTCH OS · Phase 1 (Nov 2, 2026, Toby + Claude)
   Loaded ONLY when Hutch is switched on (?hutch=on, see head.html),
   parser-blocking right before #page-end in baseof.html, so whatever
   it builds is already in place on the first painted frame.

   What it does
     - "/" becomes the Hutch home screen (locked, never scrolls)
     - every other page gets the app frame: an Android-style app bar
       with back, the app's icon and name, Hutch Search and Home.
       Posts swap the post title into the bar with a read % as you go.
     - "/?app=blog" is the Blog app (the Traditional home feed in the
       app frame)
     - All apps drawer, Hutch Search (apps, words, categories, posts
       via /feed.json), and a Settings sheet (Sky, Switch to classic)
     - boot splash with Toby's face + logo, once a day, home only

   Data it reads (all written by Hugo, nothing fetched up front)
     #hutch-page  page facts (baseof.html)
     #hutch-home-data  home widgets (partials/hutch-home-data.html, home only;
                  words + categories are kept in localStorage so Search
                  works on every page)
   ================================================================== */
(function () {
  'use strict';
  var de = document.documentElement;
  if (!de.classList.contains('hutch')) return;

  /* ---------- small helpers ---------- */
  function J(id) { try { var e = document.getElementById(id); return e ? JSON.parse(e.textContent) : null; } catch (e) { return null; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
  function el(html) { var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var PAGE = J('hutch-page') || {};
  var HOME = J('hutch-home-data');
  var IDX = null;
  if (HOME) { ls('hutch-index', JSON.stringify({ words: HOME.words || [], cats: HOME.cats || [], recent: HOME.recent || [] })); IDX = HOME; }
  else { try { IDX = JSON.parse(ls('hutch-index') || 'null'); } catch (e) { IDX = null; } }
  IDX = IDX || { words: [], cats: [], recent: [] };

  /* ---------- icons + apps ---------- */
  /* Nov 2 (Toby): apps that are also in the Traditional nav use the SAME
     icons as the nav (partials/icon.html via nav-icon.html): Archive box,
     About person, Now clock, Contact envelope, Uses laptop, Surprise
     shuffle, Follow RSS, Search. Blog is the nav's Home. */
  var IC = {
    blog: '<path d="M3 11.5 12 4l9 7.5"/><path d="M6 10v9h12v-9"/><path d="M10 19v-6h4v6"/>',
    archive: '<rect x="3.5" y="4.5" width="17" height="4" rx="1"/><path d="M5 8.5V18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5"/><path d="M10 13h4"/>',
    about: '<circle cx="12" cy="8.2" r="3.7"/><path d="M4.5 20c0-4 3.5-6.2 7.5-6.2s7.5 2.2 7.5 6.2"/>',
    now: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2.5"/>',
    contact: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3.5 7.5 12 13l8.5-5.5"/>',
    den: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M10 9l5 3-5 3z"/>',
    surprise: '<path d="M3.5 7h3c1.5 0 2.5.8 3.3 2l4.4 6c.8 1.2 1.8 2 3.3 2h3"/><path d="M3.5 17h3c1.5 0 2.5-.8 3.3-2l.8-1.1"/><path d="M13.4 10.1l.8-1.1c.8-1.2 1.8-2 3.3-2h3"/><path d="M18 4.5 20.5 7 18 9.5"/><path d="M18 14.5l2.5 2.5-2.5 2.5"/>',
    uses: '<rect x="5" y="5" width="14" height="10" rx="1.5"/><path d="M2.5 19h19"/>',
    follow: '<path d="M4.5 4.5a15 15 0 0 1 15 15"/><path d="M4.5 10.8a8.7 8.7 0 0 1 8.7 8.7"/><circle cx="5.3" cy="18.7" r="1.6"/>',
    photos: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 17l-5-5-8 8"/>',
    words: '<path d="M4 19L9 5h2l5 14 M6 14h8 M17 9h4 M17 13h4"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18 M8 3v4 M16 3v4"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="M20 20l-4.1-4.1"/>',
    back: '<path d="M19 12H5 M11 18l-6-6 6-6"/>',
    up: '<path d="M6 15l6-6 6 6"/>',
    close: '<path d="M6 6l12 12 M18 6L6 18"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.4"/>',
    expand: '<path d="M15 3h6v6 M9 21H3v-6 M21 3l-7 7 M3 21l7-7"/>',
    shrink: '<path d="M4 14h6v6 M20 10h-6V4 M14 10l7-7 M3 21l7-7"/>'
  };
  function ic(k, w) { return '<svg class="hx-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (w || 2) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (IC[k] || IC.blog) + '</svg>'; }
  /* Toby's own rabbit, the one that says "Hey!" on the Traditional home page */
  var RABBIT = '<img class="hx-rabimg" src="https://tobygeeksout.micro.blog/uploads/2026/fb54b5e64c.png" alt="" width="344" height="688" decoding="async">';

  /* key: [name, color, url]. url null = opens a sheet */
  var APPS = {
    blog: ['Blog', '#C4622D', '/?app=blog'],
    archive: ['Archive', '#8C6A4F', '/archive/'],
    about: ['About', '#1E2D4A', '/about/'],
    now: ['Now', '#7A8F6A', '/now/'],
    contact: ['Contact', '#3E7C7A', '/contact/'],
    den: ['Den', '#7C5A7A', '/watching/'],
    surprise: ['Surprise', '#D9A441', '/surprise-me/'],
    uses: ['Uses', '#5B7A8C', '/uses/'],
    follow: ['Follow', '#E08A3C', '/subscribe/'],
    photos: ['Photos', '#3F7FA6', '/photo/'],
    words: ['Word Nerd', '#B07A1E', '/categories/word-of-the-day/'],
    calendar: ['Calendar', '#CF5C4A', '/calendar/'],
    settings: ['Settings', '#6B7280', null]
  };
  var QUAD = ['den', 'surprise', 'uses', 'follow'];
  var DOCK = ['blog', 'archive', 'about', 'now', 'contact'];
  function tile(k) { return '<span class="hh-tile" style="background:' + APPS[k][1] + '">' + ic(k) + '</span>'; }
  function appIcon(k, label) {
    var a = APPS[k], inner = tile(k) + '<span>' + esc(a[0]) + '</span>';
    return a[2] ? '<a class="hh-ic" href="' + a[2] + '" aria-label="' + esc(a[0]) + '">' + inner + '</a>'
                : '<button type="button" class="hh-ic" data-sheet="' + k + '" aria-label="' + esc(a[0]) + '">' + inner + '</button>';
  }

  /* which app is this page? */
  var path = location.pathname;
  function appForPage() {
    if (path === '/' || path === '/index.html') return 'blog';
    var map = [['/archive/', 'archive'], ['/about/', 'about'], ['/now/', 'now'], ['/contact/', 'contact'], ['/watching/', 'den'],
      ['/surprise-me/', 'surprise'], ['/uses/', 'uses'], ['/subscribe/', 'follow'], ['/photo/', 'photos'],
      ['/categories/word-of-the-day/', 'words'], ['/calendar/', 'calendar']];
    for (var i = 0; i < map.length; i++) if (path.indexOf(map[i][0]) === 0) return map[i][1];
    if (path.indexOf('/categories/') === 0) return 'archive';
    return 'blog';
  }

  /* ---------- sky (same sun math + phases as custom_footer.html) ---------- */
  function clockMins() {
    var m = location.search.match(/[?&]sky=(\d{1,2}):(\d{2})/);
    if (m) return (+m[1]) * 60 + (+m[2]);
    try { var t = sessionStorage.getItem('tgo-sky-test'); if (t && /^\d{1,2}:\d{2}$/.test(t)) { var p = t.split(':'); return (+p[0]) * 60 + (+p[1]); } } catch (e) {}
    var n = new Date(); return n.getHours() * 60 + n.getMinutes();
  }
  function sunTimes() {
    var d = new Date(), rad = Math.PI / 180, tz = -d.getTimezoneOffset(), lon = tz / 4, lat = 38;
    var doy = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5), g = 2 * Math.PI / 365 * (doy - 1);
    var eq = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
    var dec = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
    var cosHa = Math.cos(90.833 * rad) / (Math.cos(lat * rad) * Math.cos(dec)) - Math.tan(lat * rad) * Math.tan(dec);
    if (cosHa > 1 || cosHa < -1) return { r: 360, s: 1080 };
    var ha = Math.acos(cosHa) / rad;
    return { r: 720 - 4 * (lon + ha) - eq + tz, s: 720 - 4 * (lon - ha) - eq + tz };
  }
  function skyMode() { var v = ls('tgo-sky'); return v === 'day' || v === 'night' ? v : (v === 'off' ? 'day' : 'sky'); }
  function skyPhase() {
    var mode = skyMode();
    if (mode === 'day') return 'day';
    if (mode === 'night') return 'night';
    var mins = clockMins(), T = sunTimes(), R = T.r, S = T.s;
    if (mins < R - 60 || mins >= S + 60) return 'night';
    if (mins < R) return 'dusk';
    if (mins < R + 100) return 'dawn';
    if (mins <= S - 90) return 'day';
    if (mins < S) return 'sunset';
    return 'dusk';
  }
  var PHASE = skyPhase();
  var DARK = PHASE === 'night' || PHASE === 'dusk';
  if (DARK) de.classList.add('hx-dark');
  var SKYTOP = { day: '#8FC1E6', dawn: '#E9B49A', sunset: '#D9784F', dusk: '#26304C', night: '#0C1322' };

  /* ---------- sheets (drawer, search, settings) with Android back ---------- */
  var openSheetEl = null;
  function openSheet(s, focusSel) {
    if (openSheetEl === s) return;
    if (openSheetEl) closeSheet(true);
    openSheetEl = s;
    s.classList.add('open');
    try { history.pushState({ hutchSheet: 1 }, ''); } catch (e) {}
    if (focusSel) setTimeout(function () { var f = s.querySelector(focusSel); if (f) f.focus(); }, 60);
  }
  function closeSheet(viaCode) {
    if (!openSheetEl) return;
    openSheetEl.classList.remove('open');
    openSheetEl = null;
    if (!viaCode && history.state && history.state.hutchSheet) { try { history.back(); } catch (e) {} }
  }
  window.addEventListener('popstate', function () { if (openSheetEl) { openSheetEl.classList.remove('open'); openSheetEl = null; } });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && openSheetEl) closeSheet(); });
  function swipeDownToClose(s) {
    var y0 = null;
    s.addEventListener('touchstart', function (e) { var sc = s.querySelector('.hx-scroll'); y0 = (!sc || sc.scrollTop <= 0) ? e.touches[0].clientY : null; }, { passive: true });
    s.addEventListener('touchend', function (e) { if (y0 !== null && e.changedTouches[0].clientY - y0 > 90) closeSheet(); y0 = null; }, { passive: true });
  }
  function sheet(id, inner) {
    var s = el('<div class="hx-sheet" id="' + id + '" role="dialog" aria-modal="true"><button type="button" class="hx-grab" aria-label="Close"><i></i></button><div class="hx-sh-in">' + inner + '</div></div>');
    s.querySelector('.hx-grab').addEventListener('click', function () { closeSheet(); });
    swipeDownToClose(s);
    document.body.appendChild(s);
    return s;
  }

  /* All apps */
  var drawer = null;
  function openDrawer() {
    if (!drawer) {
      var keys = Object.keys(APPS).sort(function (a, b) { return APPS[a][0].localeCompare(APPS[b][0]); });
      drawer = sheet('hutch-drawer',
        '<label class="hx-field"><span class="hs-ic">' + ic('search') + '</span><input type="search" placeholder="Search apps" aria-label="Search apps" autocomplete="off"></label>' +
        '<div class="hx-lab">All apps</div><div class="hx-scroll"><div class="hx-dgrid">' + keys.map(function (k) { return '<div data-k="' + k + '" data-n="' + APPS[k][0].toLowerCase() + '">' + appIcon(k) + '</div>'; }).join('') + '</div></div>');
      var inp = drawer.querySelector('input');
      inp.addEventListener('input', function () {
        var q = inp.value.trim().toLowerCase();
        drawer.querySelectorAll('[data-n]').forEach(function (d) { d.style.display = !q || d.getAttribute('data-n').indexOf(q) > -1 ? '' : 'none'; });
      });
      inp.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        var first = [].filter.call(drawer.querySelectorAll('[data-n]'), function (d) { return d.style.display !== 'none'; })[0];
        if (first) first.querySelector('.hh-ic').click();
      });
    }
    openSheet(drawer);
  }

  /* Settings */
  var settings = null;
  function openSettings() {
    if (!settings) {
      var m = skyMode();
      var avatar = PAGE.avatar || 'https://tobygeeksout.micro.blog/uploads/2026/tobyavatartrans.png';
      settings = sheet('hutch-settings',
        '<div class="hx-scroll hx-set"><h2>Settings</h2>' +
        '<div class="hx-card"><h3>Sky</h3><p>Auto follows the sun where you are, like the Traditional theme. Day and Night stay put.</p>' +
        '<div class="hx-seg" role="group" aria-label="Sky">' + [['sky', 'Auto'], ['day', 'Day'], ['night', 'Night']].map(function (o) {
          return '<button type="button" data-sky="' + o[0] + '"' + (m === o[0] ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + '>' + o[1] + '</button>'; }).join('') + '</div></div>' +
        '<div class="hx-card"><h3>Boot screen</h3><p>Shows once a day when the home screen opens.</p><button type="button" class="hx-btn ghost" data-replay>Show it again</button></div>' +
        '<div class="hx-card"><h3>Classic look</h3><p>Go back to the Traditional Toby Geeks Out! theme. You can come back with the Hutch link any time.</p><button type="button" class="hx-btn" data-classic>Switch to classic</button></div>' +
        '<div class="hx-card hx-about"><img src="' + esc(avatar) + '" alt=""><div><h3>Hutch OS 0.1</h3><p style="margin:0">Phase 1 · private test build · Nov 2026</p></div></div>' +
        '</div>');
      settings.addEventListener('click', function (e) {
        var b = e.target.closest('[data-sky]');
        if (b) { ls('tgo-sky', b.getAttribute('data-sky')); location.reload(); return; }
        if (e.target.closest('[data-replay]')) { ls('hutch-boot-day', null); if (homeEl) { closeSheet(); boot(true); } else location.href = '/'; return; }
        if (e.target.closest('[data-classic]')) { location.href = location.pathname + '?hutch=off'; }
      });
    }
    openSheet(settings);
  }

  /* Hutch Search */
  var search = null, FEED = null, feedLoading = null;
  function loadFeed() {
    if (FEED) return Promise.resolve(FEED);
    if (feedLoading) return feedLoading;
    feedLoading = fetch('/feed.json', { credentials: 'same-origin' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) {
      FEED = (j.items || []).map(function (it) {
        var txt = String(it.content_html || '').replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, "'").replace(/&quot;|&ldquo;|&rdquo;/g, '"').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
        var u = it.url || it.id || ''; try { u = new URL(u, location.origin).pathname; } catch (e) {}
        return { t: it.title || '', x: txt, u: u, d: it.date_published || '' };
      }).sort(function (a, b) { return a.d < b.d ? 1 : -1; });
      return FEED;
    }).catch(function () { feedLoading = null; return null; });
    return feedLoading;
  }
  function hi(s, terms) {
    var out = esc(s);
    terms.forEach(function (t) { if (t.length < 2) return; out = out.replace(new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>'); });
    return out;
  }
  function snippet(x, term) {
    var i = x.toLowerCase().indexOf(term);
    if (i < 0) return x.slice(0, 140);
    var a = Math.max(0, i - 50);
    while (a > 0 && x[a - 1] !== ' ') a--;
    var b = Math.min(x.length, i + 110);
    while (b < x.length && x[b] !== ' ') b++;
    return (a > 0 ? '… ' : '') + x.slice(a, b) + (b < x.length ? ' …' : '');
  }
  function fmtDate(iso) { var d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' }); }
  function renderSearch(q) {
    var box = search.querySelector('.hx-results');
    q = q.trim();
    if (!q) {
      var rec = (IDX.recent || []).map(function (r) { return '<li><a href="' + esc(r.u) + '"><span class="hh-tile" style="background:#C4622D">' + ic('blog') + '</span><span><span class="hx-t">' + esc(r.t) + '</span></span><span class="hx-d">' + esc(r.d) + '</span></a></li>'; }).join('');
      var cats = (IDX.cats || []).slice(0, 12).map(function (c) { return '<a class="hx-chip" href="' + esc(c.u) + '">' + esc(c.n) + '</a>'; }).join('');
      box.innerHTML = (rec ? '<div class="hx-lab">Recent posts</div><ul class="hx-res">' + rec + '</ul>' : '') +
        (cats ? '<div class="hx-lab">Browse categories</div><div class="hx-chip-row">' + cats + '</div>' : '') +
        '<p class="hx-note">Search finds apps, Word Nerd words, categories, and every post.</p>';
      return;
    }
    var ql = q.toLowerCase(), terms = ql.split(/\s+/).filter(Boolean), html = '';
    var apps = Object.keys(APPS).filter(function (k) { return APPS[k][0].toLowerCase().indexOf(ql) > -1 || (k === 'den' && 'watching'.indexOf(ql) === 0); });
    if (apps.length) html += '<div class="hx-lab">Apps</div><ul class="hx-res">' + apps.map(function (k) {
      var a = APPS[k], inner = tile(k) + '<span><span class="hx-t">' + hi(a[0], terms) + '</span></span>';
      return '<li>' + (a[2] ? '<a href="' + a[2] + '">' + inner + '</a>' : '<button type="button" data-sheet="' + k + '">' + inner + '</button>') + '</li>'; }).join('') + '</ul>';
    var words = (IDX.words || []).filter(function (w) { return w.w && w.w.toLowerCase().indexOf(ql) > -1; }).slice(0, 6);
    if (words.length) html += '<div class="hx-lab">Word Nerd Alert</div><ul class="hx-res">' + words.map(function (w) {
      return '<li><a href="' + esc(w.u) + '"><span class="hx-wdot">' + esc(w.w.charAt(0).toUpperCase()) + '</span><span><span class="hx-t">' + hi(w.w, terms) + '</span></span></a></li>'; }).join('') + '</ul>';
    var cats = (IDX.cats || []).filter(function (c) { return c.n.toLowerCase().indexOf(ql) > -1; }).slice(0, 6);
    if (cats.length) html += '<div class="hx-lab">Categories</div><ul class="hx-res">' + cats.map(function (c) {
      return '<li><a href="' + esc(c.u) + '"><span class="hh-tile" style="background:#8C6A4F">' + ic('tag') + '</span><span><span class="hx-t">' + hi(c.n, terms) + '</span><span class="hx-sn">' + c.c + ' post' + (c.c === 1 ? '' : 's') + '</span></span></a></li>'; }).join('') + '</ul>';
    html += '<div class="hx-lab">Posts</div><div class="hx-posts"><p class="hx-note">' + (FEED ? '' : 'Looking through every post…') + '</p></div>';
    box.innerHTML = html;
    loadFeed().then(function (feed) {
      if (search.querySelector('input').value.trim() !== q) return;
      var pbox = box.querySelector('.hx-posts');
      if (!pbox) return;
      if (!feed) { pbox.innerHTML = '<p class="hx-note">Posts could not load right now. <a href="/search/" style="color:#C4622D;font-weight:600">Try the Search page</a>.</p>'; return; }
      var hits = [];
      for (var i = 0; i < feed.length && hits.length < 40; i++) {
        var p = feed[i], tl = p.t.toLowerCase(), xl = p.x.toLowerCase(), ok = true, score = 0;
        for (var j = 0; j < terms.length; j++) {
          var inT = tl.indexOf(terms[j]) > -1, inX = xl.indexOf(terms[j]) > -1;
          if (!inT && !inX) { ok = false; break; }
          score += inT ? 3 : 1;
        }
        if (ok) hits.push([score, p]);
      }
      hits.sort(function (a, b) { return b[0] - a[0]; });
      if (!hits.length) { pbox.innerHTML = '<p class="hx-note">No posts match “' + esc(q) + '”.</p>'; return; }
      pbox.innerHTML = '<ul class="hx-res">' + hits.slice(0, 25).map(function (h) {
        var p = h[1], title = p.t || snippet(p.x, '').slice(0, 70);
        return '<li><a href="' + esc(p.u) + '"><span><span class="hx-t">' + hi(title, terms) + '</span><span class="hx-sn">' + hi(snippet(p.x, terms[0]), terms) + '</span></span><span class="hx-d">' + esc(fmtDate(p.d)) + '</span></a></li>';
      }).join('') + '</ul>';
    });
  }
  function openSearch() {
    if (!search) {
      search = sheet('hutch-search',
        '<label class="hx-field"><span class="hs-ic">' + ic('search') + '</span><input type="search" placeholder="Hutch Search" aria-label="Hutch Search" autocomplete="off" enterkeyhint="search"><button type="button" class="hx-x" aria-label="Clear">' + ic('close') + '</button></label>' +
        '<div class="hx-scroll"><div class="hx-results"></div></div>');
      var inp = search.querySelector('input'), t;
      inp.addEventListener('input', function () { clearTimeout(t); t = setTimeout(function () { renderSearch(inp.value); }, 140); });
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { inp.blur(); } });
      search.querySelector('.hx-x').addEventListener('click', function () { inp.value = ''; renderSearch(''); inp.focus(); });
      renderSearch('');
    }
    openSheet(search, 'input');
  }

  /* anything with data-sheet opens its sheet */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-sheet]');
    if (!b) return;
    e.preventDefault();
    var k = b.getAttribute('data-sheet');
    if (k === 'settings') openSettings(); else if (k === 'search') openSearch(); else if (k === 'apps') openDrawer();
  });

  /* ---------- home screen ---------- */
  var homeEl = null;
  var isHome = de.classList.contains('hutch-hs');
  function ordinal(n) { var s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
  function greeting() {
    var h = Math.floor(clockMins() / 60);
    return h >= 5 && h < 12 ? 'Good morning.' : h >= 12 && h < 17 ? 'Good afternoon.' : h >= 17 && h < 21 ? 'Good evening.' : 'Good night.';
  }
  function postsThisWeek() {
    var now = new Date(), start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    var key = start.getFullYear() + '-' + ('0' + (start.getMonth() + 1)).slice(-2) + '-' + ('0' + start.getDate()).slice(-2);
    var n = (HOME.dates || []).filter(function (d) { return d >= key; }).length;
    if (n) return n + (n === 1 ? ' post' : ' posts') + ' this week';
    var r = HOME.recent && HOME.recent[0];
    return r ? 'Latest post ' + r.d : 'Welcome to Hutch';
  }
  function buildHome() {
    var now = new Date();
    var day = now.toLocaleDateString('en-US', { weekday: 'long' }), mon = now.toLocaleDateString('en-US', { month: 'long' });
    var rows = (HOME.recent || []).map(function (r) {
      return '<a class="hh-row" href="' + esc(r.u) + '">' + (r.img ? '<img src="' + esc(r.img) + '" alt="" loading="eager" decoding="async">' : '') +
        '<div><div class="t">' + esc(r.t) + '</div><div class="d">' + esc(r.d) + '</div></div></a>';
    }).join('') || '<div class="hh-empty">No posts yet.</div>';
    var p = HOME.photo || {}, w = HOME.word || {};
    var photo = p.src
      ? '<a class="hh-wg hh-photo" href="/photo/" aria-label="Photos: ' + esc(p.t || 'latest photo') + '"><img src="' + esc(p.src) + '" alt="" decoding="async">' + (p.n > 1 ? '<span class="n">+' + (p.n - 1) + '</span>' : '') +
        '<div class="cap"><small>' + esc(p.d) + '</small><b>' + esc(p.t || 'Latest photo') + '</b></div></a>'
      : '<a class="hh-wg hh-photo" href="/photo/"><span class="ph"></span><div class="cap"><small>Photos</small><b>Open Photos</b></div></a>';
    var word = w.w
      ? '<a class="hh-wg hh-word" href="' + APPS.words[2] + '"><div class="hh-wtag">Word Nerd Alert</div><div class="w">' + esc(w.w) + '</div>' +
        '<div class="pos">' + esc(w.pos || '') + (w.n > 1 ? '<span>+' + (w.n - 1) + ' more</span>' : '') + '</div><div class="def">' + esc(w.def || '') + '</div>' +
        '<span class="rm" data-href="' + esc(w.u) + '" role="link" tabindex="0">Read more</span></a>'
      : '<a class="hh-wg hh-word" href="' + APPS.words[2] + '"><div class="hh-wtag">Word Nerd Alert</div><div class="hh-empty">Open Word Nerd</div></a>';
    /* the ridge stretches to any screen; the rabbit sits on the tall right peak on its own, so it never stretches */
    var ridge = '<div class="hh-ridgebox" aria-hidden="true"><svg class="hh-ridge hh-ridge-phone" viewBox="0 0 400 260" preserveAspectRatio="none">' +
      '<path fill="var(--r1)" opacity=".45" d="M0 190 L50 164 L100 186 L160 150 L220 180 L262 140 L300 96 L338 132 L370 150 L400 140 L400 260 L0 260Z"/>' +
      '<path fill="var(--r2)" opacity=".8" d="M0 220 L70 192 L130 214 L195 184 L255 212 L320 190 L400 210 L400 260 L0 260Z"/></svg>' +
      /* wide screens: the tall peak sits at the far right, clear of the taskbar */
      '<svg class="hh-ridge hh-ridge-wide" viewBox="0 0 400 260" preserveAspectRatio="none">' +
      '<path fill="var(--r1)" opacity=".45" d="M0 200 L50 176 L100 194 L160 166 L220 188 L280 160 L322 132 L360 96 L384 122 L400 130 L400 260 L0 260Z"/>' +
      '<path fill="var(--r2)" opacity=".8" d="M0 226 L70 202 L130 220 L195 196 L255 216 L320 198 L360 206 L400 196 L400 260 L0 260Z"/></svg>' +
      '<svg class="hh-bunny" viewBox="0 0 20 24"><g fill="var(--r2)" opacity=".8" transform="translate(1 1)"><ellipse cx="9" cy="17" rx="8" ry="6.5"/><circle cx="15" cy="10" r="4.6"/><ellipse cx="13" cy="2" rx="1.6" ry="6"/><ellipse cx="17" cy="2" rx="1.6" ry="6"/><circle cx="2" cy="16" r="2.2"/></g></svg></div>';
    homeEl = el('<div id="hutch-home" data-sky="' + PHASE + '" role="main" aria-label="Hutch home screen"><div class="hh-stars"></div>' + ridge +
      '<div class="hh-area">' +
        '<div class="hh-hello"><div class="hh-tx"><div class="hh-g">' + greeting() + '</div><a class="hh-s" href="/calendar/" aria-label="Open Calendar">It\'s <em>' + day + '</em>,<br>' + mon + ' ' + ordinal(now.getDate()) + '.</a><div class="hh-p">' + esc(postsThisWeek()) + '</div></div>' +
        '<div class="hh-quad">' + QUAD.map(function (k) { return appIcon(k); }).join('') + '</div></div>' +
        '<section class="hh-wg hh-posts" aria-label="Recent posts"><div class="hh-wtag">Recent posts<a href="/?app=blog">See all ›</a></div>' + rows + '</section>' +
        photo + word +
      '</div>' +
      '<button type="button" class="hh-handle" data-sheet="apps" aria-label="All apps">' + ic('up', 2.4) + '<span>All apps</span></button>' +
      '<div class="hh-bottom"><nav class="hh-dock" aria-label="Dock">' + DOCK.map(function (k) { return appIcon(k); }).join('') + '</nav>' +
        '<button type="button" class="hh-search" data-sheet="search"><span class="hs-ic">' + ic('search') + '</span><span class="lbl">Hutch Search</span><span class="hx-face hs-face">' + RABBIT + '</span></button></div>' +
      '</div>');
    document.body.appendChild(homeEl);

    /* Read more goes to the post; the rest of the widget opens Word Nerd */
    homeEl.querySelectorAll('.rm[data-href]').forEach(function (b) {
      function go(e) { e.preventDefault(); e.stopPropagation(); location.href = b.getAttribute('data-href'); }
      b.addEventListener('click', go);
      b.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(e); });
    });
    /* drag up anywhere on the bottom area (or the handle) opens All apps */
    var y0 = null;
    homeEl.addEventListener('touchstart', function (e) { y0 = e.touches[0].clientY > innerHeight * 0.55 ? e.touches[0].clientY : null; }, { passive: true });
    homeEl.addEventListener('touchend', function (e) { if (y0 !== null && y0 - e.changedTouches[0].clientY > 60) openDrawer(); y0 = null; }, { passive: true });
    homeEl.addEventListener('touchmove', function (e) { if (!e.target.closest('.hh-area')) e.preventDefault(); }, { passive: false });

    fit();
    window.addEventListener('resize', fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    [].forEach.call(homeEl.querySelectorAll('img'), function (i) { if (!i.complete) i.addEventListener('load', fit, { once: true }); });

    /* browser bar matches the sky; custom_footer.html re-sets it every minute, so keep ours */
    function bar() { var m = document.querySelector('meta[name="theme-color"]'); if (!m) { m = document.createElement('meta'); m.name = 'theme-color'; document.head.appendChild(m); } m.setAttribute('content', SKYTOP[PHASE]); }
    bar(); setInterval(bar, 20000);
  }
  /* never scroll: if anything would run past the area, tighten step by step */
  function fit() {
    if (!homeEl) return;
    var a = homeEl.querySelector('.hh-area');
    homeEl.classList.remove('fit1', 'fit2');
    if (innerHeight <= 520) return; /* sideways phone: the area scrolls instead */
    function over() { var ab = a.getBoundingClientRect(); return [].some.call(a.children, function (c) { return c.getBoundingClientRect().bottom > ab.bottom + 1; }); }
    if (over()) homeEl.classList.add('fit1');
    if (over()) homeEl.classList.add('fit2');
    /* the Word Nerd card: shorten the definition until it fits its card */
    var wc = homeEl.querySelector('.hh-word'), def = wc && wc.querySelector('.def');
    if (def) {
      def.style.display = ''; def.style.webkitLineClamp = '';
      /* clipped = the Read more button (or the definition) runs past the card's bottom edge */
      var clipped = function () {
        var cb = wc.getBoundingClientRect().bottom - parseFloat(getComputedStyle(wc).paddingBottom) + 1;
        var rm = wc.querySelector('.rm'), last = rm || def;
        return last.getBoundingClientRect().bottom > cb || (rm && def.getBoundingClientRect().bottom > rm.getBoundingClientRect().top);
      };
      var pos = wc.querySelector('.pos'); if (pos) pos.style.display = '';
      if (clipped() && pos) pos.style.display = 'none';
      if (clipped()) def.style.webkitLineClamp = '1';
      if (clipped()) def.style.display = 'none';
    }
  }

  function boot(force) {
    if (!force) {
      var today = new Date().toDateString();
      if (calm || ls('hutch-boot-day') === today) return;
      ls('hutch-boot-day', today);
    }
    var avatar = PAGE.avatar || 'https://tobygeeksout.micro.blog/uploads/2026/tobyavatartrans.png';
    var logo = DARK ? 'https://tobygeeksout.micro.blog/uploads/2026/night-v2-toby-geeks-out-new-logo-1500-x-600-px.png'
                    : 'https://tobygeeksout.micro.blog/uploads/2026/toby-geeks-out-newest-v2-logo-1500-x-600-px.png';
    var b = el('<div id="hutch-boot" aria-hidden="true"><img class="face" src="' + esc(avatar) + '" alt=""><img class="logo" src="' + logo + '" alt=""><div class="os">Hutch OS</div><div class="bar"><i></i></div></div>');
    if (homeEl) { var cs = getComputedStyle(homeEl); ['--sky1', '--sky2', '--ht'].forEach(function (v) { b.style.setProperty(v, cs.getPropertyValue(v)); }); }
    document.body.appendChild(b);
    setTimeout(function () { b.classList.add('gone'); }, 1500);
    setTimeout(function () { b.remove(); }, 2100);
  }

  /* ---------- app frame ---------- */
  function buildFrame() {
    var k = appForPage(), a = APPS[k] || APPS.blog;
    var isPost = PAGE.type === 'post' && PAGE.kind === 'page';
    var hasTitle = isPost || isBlogApp;
    var name = a[0];
    if (k === 'archive' && path.indexOf('/categories/') === 0 && PAGE.title) name = PAGE.title;
    if (k === 'blog' && !isPost && path !== '/' && PAGE.title) name = PAGE.title;
    var bar = el('<header id="hutch-bar" role="banner">' +
      '<button type="button" class="hb-btn hb-back" aria-label="Back">' + ic('back') + '</button>' +
      '<div class="hb-app"><span class="hb-tile" style="background:' + a[1] + '">' + ic(k) + '</span><div class="hb-names"><span class="hb-name">' + esc(name) + '</span>' +
        (hasTitle ? '<span class="hb-title">' + esc(isPost ? PAGE.title || '' : '') + '</span>' : '') + '</div></div>' +
      (hasTitle ? '<span class="hb-pct">0%</span>' : '') +
      (isBlogApp ? '<button type="button" class="hb-btn hb-expand" aria-label="Full screen" title="Full screen">' + ic('expand') + '</button>' : '') +
      '<button type="button" class="hb-btn" data-sheet="search" aria-label="Hutch Search">' + ic('search') + '</button>' +
      '<a class="hb-btn hb-home" href="/" aria-label="Home"><span class="hx-rab">' + RABBIT + '</span></a>' +
      (hasTitle ? '<span class="hb-prog"></span>' : '') + '</header>');
    document.body.insertBefore(bar, document.body.firstChild);
    bar.querySelector('.hb-back').addEventListener('click', function () {
      var same = false;
      try { same = document.referrer && new URL(document.referrer).origin === location.origin; } catch (e) {}
      if (same && history.length > 1) history.back(); else location.href = '/';
    });
    /* custom_footer.html writes an inline !important padding-top on <main>
       for the Traditional header (32px once the header is hidden). Pages
       that pad themselves (posts, the newsletter reader) get 0 and keep it;
       everything else clears the app bar instead, every time it is re-set. */
    var main = document.getElementById('main-content');
    if (main && !isBlogApp && !document.querySelector('.post-header, .newsletter-single')) {
      var want = 'calc(var(--h-bar) + 20px)';
      var fixPad = function () { if (main.style.getPropertyValue('padding-top') !== want || main.style.getPropertyPriority('padding-top') !== 'important') main.style.setProperty('padding-top', want, 'important'); };
      fixPad();
      new MutationObserver(fixPad).observe(main, { attributes: true, attributeFilter: ['style'] });
    }
    var h1 = isPost ? document.querySelector('.post-header-title') : null;
    var pct = bar.querySelector('.hb-pct'), prog = bar.querySelector('.hb-prog'), ticking = false;
    function onScroll() {
      ticking = false;
      var y = window.scrollY || de.scrollTop;
      bar.classList.toggle('scrolled', y > 4);
      if (!isPost) return;
      var past = h1 ? h1.getBoundingClientRect().bottom < 56 : y > 160;
      bar.classList.toggle('titled', past);
      var body = document.querySelector('.post-content, .e-content, article') || document.body;
      var r = body.getBoundingClientRect(), total = r.height - innerHeight + 120;
      var p = total > 0 ? Math.min(100, Math.max(0, Math.round((-r.top + 60) / total * 100))) : 100;
      pct.textContent = p + '%';
      prog.style.width = p + '%';
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();

    /* App modules (hutch-apps.js): each app registers itself on
       window.HutchApps under its key (words, den, photos, ...). If this
       page belongs to one, it gets the bar, its data and the helpers. */
    var mod = window.HutchApps && window.HutchApps[k];
    if (mod && !isBlogApp) {
      try {
        mod({
          key: k, app: a, bar: bar, page: PAGE, data: J('hutch-app-data'), path: path,
          ic: ic, esc: esc, el: el, ls: ls, phase: PHASE, dark: DARK, calm: calm,
          own: function () { de.classList.add('hutch-own'); }, /* hide the Traditional page */
          openSheet: openSheet, closeSheet: closeSheet
        });
      } catch (err) { de.classList.remove('hutch-own'); if (window.console) console.error('Hutch app ' + k, err); }
    }
  }

  /* ---------- Blog app (/?app=blog), v36 ----------
     Timeline of the newest 60 posts as cards (titled posts with their
     photo and an excerpt, micros with the ❧ and the time), filtered by
     All / Posts / Micros. Phone and unfolded-portrait: a card opens the
     post itself. Landscape: timeline on the left, the post on the right
     (the real post page in a pane), and the expand button gives the post
     the whole screen. */
  function buildBlog() {
    var TL = HOME.tl || [];
    de.classList.add('hutch-blog');
    var filter = 'all', sel = null, full = false;
    var wrap = el('<div id="hutch-blog"><div class="hbl-left">' +
      '<div class="hbl-filters" role="group" aria-label="Show">' + [['all', 'All'], ['posts', 'Posts'], ['micro', 'Micros']].map(function (f) {
        return '<button type="button" data-f="' + f[0] + '"' + (f[0] === 'all' ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + '>' + f[1] + '</button>'; }).join('') + '</div>' +
      '<div class="hbl-tl"></div></div><div class="hbl-right"></div></div>');
    document.body.appendChild(wrap);
    var list = wrap.querySelector('.hbl-tl'), right = wrap.querySelector('.hbl-right'), left = wrap.querySelector('.hbl-left');
    var bar = document.getElementById('hutch-bar'), expandBtn = bar.querySelector('.hb-expand');
    var mq = window.matchMedia('(min-width: 840px) and (orientation: landscape)');
    function card(x, i) {
      var cls = 'hbl-it' + (x.m ? ' micro' : '') + (x.u === sel ? ' sel' : '');
      if (x.m) return '<a class="' + cls + '" href="' + esc(x.u) + '" data-i="' + i + '"><div class="hbl-tx"><span class="fl" aria-hidden="true">❧</span><div class="hbl-mb"><div class="hbl-k">' + esc(x.d) + ' · ' + esc(x.tm) + '</div><p>' + esc(x.x) + '</p>' +
        (x.img ? '<img class="mimg" src="' + esc(x.img) + '" alt="" loading="lazy" decoding="async">' : '') + '</div></div></a>';
      return '<a class="' + cls + '" href="' + esc(x.u) + '" data-i="' + i + '">' + (x.img ? '<img class="hero" src="' + esc(x.img) + '" alt="" loading="' + (i < 3 ? 'eager' : 'lazy') + '" decoding="async">' : '') +
        '<div class="hbl-tx"><div class="hbl-k">' + esc(x.d) + (x.c ? ' · ' + esc(x.c) : '') + '</div><h3>' + esc(x.t) + '</h3>' + (x.x ? '<p>' + esc(x.x) + '</p>' : '') +
        '<span class="hbl-kr">Keep reading · ' + (x.min || 1) + ' min</span></div></a>';
    }
    function render() {
      var items = TL.map(function (x, i) { return [x, i]; }).filter(function (p) { return filter === 'all' || (filter === 'micro' ? p[0].m : !p[0].m); });
      list.innerHTML = (items.map(function (p) { return card(p[0], p[1]); }).join('') || '<p class="hbl-none">Nothing here yet.</p>') +
        '<div class="hbl-more"><a href="/archive/">Everything older is in Archive ›</a></div>';
    }
    function two() { return mq.matches; }
    function openInPane(x) {
      sel = x.u;
      [].forEach.call(list.querySelectorAll('.hbl-it'), function (a) { a.classList.toggle('sel', a.getAttribute('href') === sel); });
      var f = right.querySelector('iframe');
      if (!f) { f = document.createElement('iframe'); f.title = 'Post'; right.appendChild(f); }
      if (f.getAttribute('src') !== x.u) f.setAttribute('src', x.u);
      bar.classList.remove('titled');
      bar.querySelector('.hb-title').textContent = x.t || (x.d + ' · ' + x.tm);
      bar.querySelector('.hb-prog').style.width = '0';
    }
    function layout() {
      de.classList.toggle('hbl-two', two());
      if (!two()) { de.classList.remove('hbl-full'); bar.classList.remove('titled'); return; }
      if (!sel && TL.length) openInPane(TL[0]);
    }
    wrap.querySelector('.hbl-filters').addEventListener('click', function (e) {
      var b = e.target.closest('[data-f]'); if (!b) return;
      filter = b.getAttribute('data-f');
      [].forEach.call(this.querySelectorAll('[data-f]'), function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      render(); left.scrollTop = 0; window.scrollTo(0, 0);
    });
    list.addEventListener('click', function (e) {
      var a = e.target.closest('.hbl-it'); if (!a || !two()) return;
      e.preventDefault(); openInPane(TL[+a.getAttribute('data-i')]);
    });
    expandBtn.addEventListener('click', function () {
      full = !de.classList.contains('hbl-full');
      de.classList.toggle('hbl-full', full);
      expandBtn.innerHTML = ic(full ? 'shrink' : 'expand');
      expandBtn.setAttribute('aria-label', full ? 'Show the timeline' : 'Full screen');
      expandBtn.title = expandBtn.getAttribute('aria-label');
    });
    /* the post in the right pane reports its title and how far you've read */
    window.hutchPane = function (info) {
      if (!two()) return;
      if (info.title) bar.querySelector('.hb-title').textContent = info.title;
      bar.classList.toggle('titled', !!info.past);
      bar.querySelector('.hb-pct').textContent = (info.pct || 0) + '%';
      bar.querySelector('.hb-prog').style.width = (info.pct || 0) + '%';
      if (info.path && info.path !== sel) {
        sel = info.path;
        [].forEach.call(list.querySelectorAll('.hbl-it'), function (a) { a.classList.toggle('sel', a.getAttribute('href') === sel); });
      }
    };
    render(); layout();
    if (mq.addEventListener) mq.addEventListener('change', layout); else mq.addListener(layout);
  }

  /* a page shown inside the Blog app's right pane: no app bar of its own,
     it tells the Blog app which post it is and how far down you are */
  function buildEmbed() {
    var isPost = PAGE.type === 'post' && PAGE.kind === 'page';
    var h1 = document.querySelector('.post-header-title'), tick = false;
    var main = document.getElementById('main-content');
    if (main && !document.querySelector('.post-header, .newsletter-single')) {
      var fixPad = function () { if (main.style.getPropertyValue('padding-top') !== '20px') main.style.setProperty('padding-top', '20px', 'important'); };
      fixPad(); new MutationObserver(fixPad).observe(main, { attributes: true, attributeFilter: ['style'] });
    }
    function report() {
      tick = false;
      var p = 0, body = document.querySelector('.post-content, .e-content, article') || document.body;
      var r = body.getBoundingClientRect(), total = r.height - innerHeight + 120;
      p = total > 0 ? Math.min(100, Math.max(0, Math.round((-r.top + 60) / total * 100))) : 100;
      try { window.parent.hutchPane && window.parent.hutchPane({ title: PAGE.title, path: path, pct: isPost ? p : 0, past: h1 ? h1.getBoundingClientRect().bottom < 8 : false }); } catch (e) {}
    }
    window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(report); } }, { passive: true });
    report();
    /* links that leave the posts open in the full window */
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]'); if (!a) return;
      var u; try { u = new URL(a.href, location.href); } catch (er) { return; }
      var postLike = u.origin === location.origin && /^\/\d{4}\/\d{2}\/\d{2}\//.test(u.pathname);
      if (!postLike && !a.target) { e.preventDefault(); window.top.location.href = u.href; }
    });
  }

  /* ---------- go ---------- */
  var isEmbed = de.classList.contains('hutch-embed');
  var isBlogApp = !isEmbed && path === '/' && /[?&]app=blog\b/.test(location.search) && HOME && HOME.tl && HOME.tl.length > 0;
  if (isEmbed) buildEmbed();
  else if (isHome && HOME) { buildHome(); boot(false); }
  else { if (isHome) { de.classList.remove('hutch-hs'); de.classList.add('hutch-app'); } buildFrame(); if (isBlogApp) buildBlog(); }

  window.hutch = { openSearch: openSearch, openDrawer: openDrawer, openSettings: openSettings, phase: PHASE, boot: function () { boot(true); } };
})();
