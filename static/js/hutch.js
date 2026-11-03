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
  /* Toby's face: the same picture as the Traditional theme's header and
     rail (Nov 3, Toby: the Micro.blog profile photo is the old one) */
  PAGE.avatar = 'https://tobygeeksout.micro.blog/uploads/2026/tobyavatartrans.png';
  var HOME = J('hutch-home-data');
  var IDX = null;
  if (HOME) { ls('hutch-index', JSON.stringify({ words: HOME.words || [], cats: HOME.cats || [], recent: HOME.recent || [] })); IDX = HOME; }
  else { try { IDX = JSON.parse(ls('hutch-index') || 'null'); } catch (e) { IDX = null; } }
  IDX = IDX || { words: [], cats: [], recent: [] };

  /* ---------- icons + apps ---------- */
  /* Nov 2 (Toby): apps that are also in the Traditional nav use the SAME
     icons as the nav (partials/icon.html via nav-icon.html): Archive box,
     About person, Now clock, Contact envelope, Uses laptop, Surprise
     shuffle, Follow RSS, Search. Blog gets a page-of-writing icon (Nov 2: the nav's house
     read as Home, and Home is the rabbit). */
  var IC = {
    blog: '<path d="M5 4.5h11l3.5 3.5v11.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-14a1 1 0 0 1 1-1Z"/><path d="M8 9.5h8 M8 13h8 M8 16.5h5"/>',
    archive: '<rect x="3.5" y="4.5" width="17" height="4" rx="1"/><path d="M5 8.5V18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5"/><path d="M10 13h4"/>',
    about: '<circle cx="12" cy="8.2" r="3.7"/><path d="M4.5 20c0-4 3.5-6.2 7.5-6.2s7.5 2.2 7.5 6.2"/>',
    now: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2.5"/>',
    contact: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3.5 7.5 12 13l8.5-5.5"/>',
    /* the big play button from the mockups (Nov 3, Toby: "I love your new Den icon") */
    den: '<path d="M8 5.2v13.6a1 1 0 0 0 1.5.86l11-6.8a1 1 0 0 0 0-1.72l-11-6.8A1 1 0 0 0 8 5.2z" fill="currentColor"/>',
    surprise: '<path d="M3.5 7h3c1.5 0 2.5.8 3.3 2l4.4 6c.8 1.2 1.8 2 3.3 2h3"/><path d="M3.5 17h3c1.5 0 2.5-.8 3.3-2l.8-1.1"/><path d="M13.4 10.1l.8-1.1c.8-1.2 1.8-2 3.3-2h3"/><path d="M18 4.5 20.5 7 18 9.5"/><path d="M18 14.5l2.5 2.5-2.5 2.5"/>',
    uses: '<rect x="5" y="5" width="14" height="10" rx="1.5"/><path d="M2.5 19h19"/>',
    follow: '<path d="M4.5 4.5a15 15 0 0 1 15 15"/><path d="M4.5 10.8a8.7 8.7 0 0 1 8.7 8.7"/><circle cx="5.3" cy="18.7" r="1.6"/>',
    photos: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 17l-5-5-8 8"/>',
    words: '<path d="M4 19L9 5h2l5 14 M6 14h8 M17 9h4 M17 13h4"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18 M8 3v4 M16 3v4"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    /* Nov 3 (Toby): The Pulse, Reading, Blaugust, Micro.blog and the
       Tinkering Log join the apps. Blaugust keeps the nav's star. */
    pulse: '<path d="M3 12h4l2.5-6 4 12 2.5-6H21"/>',
    reading: '<path d="M12 6.5C10.5 5.3 8.3 4.5 4 4.5v13c4.3 0 6.5.8 8 2 1.5-1.2 3.7-2 8-2v-13c-4.3 0-6.5.8-8 2Z"/><path d="M12 6.5v13"/>',
    blaugust: '<path d="M12 3.2 14.7 9l6.3.6-4.8 4.2 1.5 6.2-5.7-3.5-5.7 3.5 1.5-6.2-4.8-4.2 6.3-.6Z"/>',
    mb: '<path d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v8.5a1.5 1.5 0 0 1-1.5 1.5h-8.5L6 20v-3.5H5A1.5 1.5 0 0 1 3.5 15V6.5A1.5 1.5 0 0 1 5 5Z"/><path d="M8 9.5h8 M8 12.5h5"/>',
    tinkering: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    house: '<path d="M4 11 12 4l8 7"/><path d="M6 9.5V20h12V9.5"/>',
    search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="M20 20l-4.1-4.1"/>',
    back: '<path d="M19 12H5 M11 18l-6-6 6-6"/>',
    fwd: '<path d="M5 12h14 M13 6l6 6-6 6"/>',
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
    pulse: ['The Pulse', '#C44D58', '/the-pulse/'],
    reading: ['Reading', '#6E8B4A', '/reading/'],
    blaugust: ['Blaugust', '#D98E3C', '/blaugust/'],
    mb: ['Micro.blog', '#4A6FA5', 'https://micro.blog/' + (PAGE.mbuser || 'technogeek75')],
    tinkering: ['Tinkering Log', '#5B6B7A', '/changelog/'],
    settings: ['Settings', '#6B7280', null]
  };
  var NAVDOCK = null;
  /* Nov 2 (Toby: About in the dock opened /about/, but his page is
     /about-me/): apps that are also in his Traditional menu take their
     address from that menu (#hutch-page "menu", from .Site.Menus.main),
     matched the same way partials/nav-icon.html matches icons. So a
     renamed or moved page is followed automatically. */
  (function () {
    var menu = PAGE.menu || [];
    function rel(u) { try { var x = new URL(u, location.origin); return x.origin === location.origin ? x.pathname + x.search : ''; } catch (e) { return ''; } }
    var rules = [
      ['about', /^about/i, /\/about/i], ['now', /^now$/i, /\/now\b/i], ['contact', /^contact/i, /\/contact/i],
      ['archive', /^archive/i, /\/archive/i], ['uses', /^(geek gear|uses?|gear)$/i, /\/uses?\//i],
      ['follow', /^(follow|subscribe)/i, /\/(subscribe|follow)/i], ['surprise', /surprise/i, /\/surprise/i],
      ['blaugust', /^blaugust/i, /\/blaugust/i], ['pulse', /pulse/i, /\/(the-)?pulse\//i], ['reading', /^reading$/i, /\/reading\//i],
      ['tinkering', /tinkering|changelog/i, /\/(changelog|tinkering)\//i]
    ];
    rules.forEach(function (r) {
      var hit = null;
      menu.forEach(function (m) { if (!hit && m && m.u && (r[1].test((m.n || '').trim()) || r[2].test(m.u))) hit = rel(m.u); });
      if (hit && hit !== '/') APPS[r[0]][2] = hit;
    });
    /* The dock IS the nav (Nov 2, Toby): his menu items in his order,
       with Blog in Home's place. Search isn't a dock app (Hutch Search
       has its own bar). A menu item Hutch has no app for still gets a
       dock icon that opens its page. Room for 5. */
    var dock = ['blog'];
    menu.forEach(function (m, i) {
      if (!m || !m.u) return;
      var u = rel(m.u), n = (m.n || '').trim();
      /* Stats is left out (Nov 3, Toby: "I use the Pulse instead") */
      if (!u || u === '/' || /^home$/i.test(n) || /search/i.test(n + ' ' + u) || /^stats$/i.test(n) || /\/stats\/?$/i.test(u)) return;
      var key = null;
      rules.forEach(function (r) { if (!key && (r[1].test(n) || r[2].test(m.u))) key = r[0]; });
      if (!key) {
        key = 'nav' + i; APPS[key] = [n, '#5B7A8C', u];
        /* same icon the Traditional nav gives it (partials/nav-icon.html) */
        IC[key] = /blaugust/i.test(n + u) ? '<path d="M12 3.2 14.7 9l6.3.6-4.8 4.2 1.5 6.2-5.7-3.5-5.7 3.5 1.5-6.2-4.8-4.2 6.3-.6Z"/>'
          : /newsletter/i.test(n + u) ? IC.contact
          : '<path d="M10.2 13.8a4.2 4.2 0 0 0 6 0l3-3a4.2 4.2 0 1 0-6-6l-1.3 1.3"/><path d="M13.8 10.2a4.2 4.2 0 0 0-6 0l-3 3a4.2 4.2 0 1 0 6 6l1.3-1.3"/>';
      }
      /* every nav item becomes an app (so All apps lists them all);
         only the first ones fit in the dock */
      if (dock.indexOf(key) < 0 && dock.length < 5) dock.push(key);
    });
    if (dock.length > 1) NAVDOCK = dock;
  })();

  var DOCK = NAVDOCK || ['blog', 'archive', 'about', 'now', 'contact'];
  /* the four by the date never repeat a dock app (if his nav ever holds
     one of them, the next app in line takes its place) */
  /* Nov 3 (Toby): Settings takes Uses' spot; Uses moves to All apps */
  var QUAD = ['den', 'surprise', 'settings', 'follow', 'photos', 'words', 'calendar', 'uses'].filter(function (k) { return DOCK.indexOf(k) < 0; }).slice(0, 4);
  /* Desktop (Nov 3, Toby): a big screen has room for every app on the
     home screen, so all of them sit by the date, Micro.blog before
     Settings, in place of the four. Up to 18; any beyond that stay in All
     apps. When nothing is left for All apps, its button goes away. */
  var DK_ORDER = ['den', 'surprise', 'mb', 'settings', 'follow', 'photos', 'words', 'calendar', 'uses', 'pulse', 'reading', 'blaugust'];
  var DKAPPS = DK_ORDER.concat(Object.keys(APPS).filter(function (k) { return DK_ORDER.indexOf(k) < 0; }))
    .filter(function (k, i, all) { return APPS[k] && k !== 'tinkering' && k !== 'blog' && DOCK.indexOf(k) < 0 && all.indexOf(k) === i; }).slice(0, 18);
  var WIDE5 = APPS.mb && DOCK.indexOf('mb') < 0 && QUAD.indexOf('mb') < 0 && QUAD.indexOf('settings') > -1 ? 'mb' : null;
  var DKMQ = window.matchMedia ? matchMedia('(min-width: 1100px) and (min-height: 600px)') : { matches: false };
  function tile(k) { return '<span class="hh-tile" style="background:' + APPS[k][1] + '">' + ic(k) + '</span>'; }
  function appIcon(k, label) {
    var a = APPS[k], inner = tile(k) + '<span>' + esc(a[0]) + '</span>';
    var ext = a[2] && /^https?:/.test(a[2]) ? ' target="_blank" rel="noopener"' : '';
    return a[2] ? '<a class="hh-ic" href="' + a[2] + '"' + ext + ' aria-label="' + esc(a[0]) + '">' + inner + '</a>'
                : '<button type="button" class="hh-ic" data-sheet="' + k + '" aria-label="' + esc(a[0]) + '">' + inner + '</button>';
  }

  /* which app is this page? */
  var path = location.pathname;
  function appForPage() {
    if (path === '/' || path === '/index.html') return 'blog';
    /* the app's own address first (it may come from the menu), then the
       usual addresses as a fallback */
    for (var k in APPS) { var u = APPS[k][2]; if (u && u !== '/?app=blog' && u.charAt(u.length - 1) === '/' && path.indexOf(u) === 0) return k; }
    var map = [['/archive/', 'archive'], ['/about-me/', 'about'], ['/about/', 'about'], ['/now/', 'now'], ['/contact/', 'contact'], ['/watching/', 'den'],
      ['/surprise-me/', 'surprise'], ['/uses/', 'uses'], ['/use/', 'uses'], ['/subscribe/', 'follow'], ['/photo/', 'photos'],
      ['/categories/word-of-the-day/', 'words'], ['/calendar/', 'calendar'], ['/the-pulse/', 'pulse'], ['/pulse/', 'pulse'],
      ['/reading/', 'reading'], ['/blaugust', 'blaugust'], ['/changelog/', 'tinkering'], ['/tinkering/', 'tinkering']];
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
  /* All apps is a short panel from the bottom (Nov 3, Toby: "keep it
     short, not tall"), so the screen behind it dims; a tap there closes it */
  var scrim = null;
  function syncScrim() {
    var on = !!(openSheetEl && openSheetEl.id === 'hutch-drawer');
    if (on && !scrim) {
      scrim = el('<div class="hx-scrim" aria-hidden="true"></div>');
      document.body.appendChild(scrim);
      scrim.addEventListener('click', function () { closeSheet(); });
      void scrim.offsetWidth;
    }
    if (scrim) scrim.classList.toggle('on', on);
  }
  function openSheet(s, focusSel) {
    if (openSheetEl === s) return;
    if (openSheetEl) closeSheet(true);
    openSheetEl = s;
    s.classList.add('open');
    syncScrim();
    try { history.pushState({ hutchSheet: 1 }, ''); } catch (e) {}
    if (focusSel) setTimeout(function () { var f = s.querySelector(focusSel); if (f) f.focus(); }, 60);
  }
  function closeSheet(viaCode) {
    if (!openSheetEl) return;
    openSheetEl.classList.remove('open');
    openSheetEl = null;
    syncScrim();
    if (!viaCode && history.state && history.state.hutchSheet) { try { history.back(); } catch (e) {} }
  }
  window.addEventListener('popstate', function () { if (openSheetEl) { openSheetEl.classList.remove('open'); openSheetEl = null; syncScrim(); } });
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
      /* Nov 3 (Toby): All apps lists only what isn't already on the home
         screen (dock + the four by the date). Photos and Word Nerd stay:
         on the home screen they are widgets, not icons. Searching still
         finds every app. The Tinkering Log lives in Settings. */
      var onHome = DOCK.concat(QUAD);
      /* on desktop, the apps already by the date don't repeat here */
      var keys = Object.keys(APPS).filter(function (k) { return k !== 'tinkering'; }).sort(function (a, b) { return APPS[a][0].localeCompare(APPS[b][0]); });
      drawer = sheet('hutch-drawer',
        '<label class="hx-field"><span class="hs-ic">' + ic('search') + '</span><input type="search" placeholder="Search apps" aria-label="Search apps" autocomplete="off"></label>' +
        '<div class="hx-lab">All apps</div><div class="hx-scroll"><div class="hx-dgrid">' + keys.map(function (k) { var h = onHome.indexOf(k) > -1; return '<div data-k="' + k + '" data-n="' + APPS[k][0].toLowerCase() + '"' + (h ? ' data-home style="display:none"' : '') + (DKAPPS.indexOf(k) > -1 ? ' data-dk' : '') + (k === WIDE5 ? ' data-w5' : '') + '>' + appIcon(k) + '</div>'; }).join('') + '</div></div>');
      var inp = drawer.querySelector('input');
      inp.addEventListener('input', function () {
        var q = inp.value.trim().toLowerCase();
        drawer.classList.toggle('q', !!q);
        drawer.querySelectorAll('[data-n]').forEach(function (d) { d.style.display = q ? (d.getAttribute('data-n').indexOf(q) > -1 ? '' : 'none') : (d.hasAttribute('data-home') ? 'none' : ''); });
        drawerCols();
      });
      window.addEventListener('resize', function () { if (drawer.classList.contains('open')) drawerCols(); });
      inp.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        var first = [].filter.call(drawer.querySelectorAll('[data-n]'), function (d) { return d.style.display !== 'none'; })[0];
        if (first) first.querySelector('.hh-ic').click();
      });
    }
    openSheet(drawer);
    drawerCols();
  }
  /* one row when the apps fit across (Nov 3, Toby: the unfolded screen
     upright showed 6 + 1 on two rows); more apps wrap to more rows */
  function drawerCols() {
    var g = drawer && drawer.querySelector('.hx-dgrid'); if (!g) return;
    g.style.gridTemplateColumns = '';
    var base = getComputedStyle(g).gridTemplateColumns.split(' ').length,
      n = [].filter.call(g.children, function (d) { return getComputedStyle(d).display !== 'none'; }).length,
      fit = Math.floor(g.clientWidth / 76);
    if (n > base && n <= fit) g.style.gridTemplateColumns = 'repeat(' + n + ',minmax(0,1fr))';
  }

  /* Settings */
  var settings = null;
  /* the original theme's name in Settings: one place to change when it gets its new name */
  var ORIGINAL = 'Classic';
  function openSettings() {
    if (!settings) {
      var m = skyMode();
      var avatar = PAGE.avatar || 'https://tobygeeksout.micro.blog/uploads/2026/tobyavatartrans.png';
      settings = sheet('hutch-settings',
        '<div class="hx-scroll hx-set"><h2>Settings</h2>' +
        '<div class="hx-card"><h3>Sky</h3><p>Auto follows the sun where you are, like the ' + esc(ORIGINAL) + ' theme. Day and Night stay put.</p>' +
        '<div class="hx-seg" role="group" aria-label="Sky">' + [['sky', 'Auto'], ['day', 'Day'], ['night', 'Night']].map(function (o) {
          return '<button type="button" data-sky="' + o[0] + '"' + (m === o[0] ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + '>' + o[1] + '</button>'; }).join('') + '</div></div>' +
        /* Look and Theme (Nov 3, Toby: "toggles in Settings, a good place for them").
           Look shares the original theme's own setting (tgo-look), so both themes match. */
        '<div class="hx-card"><h3>Look</h3><p>The fonts for posts and pages: 70s headlines, or clean and modern. Same as the Look button in the ' + esc(ORIGINAL) + ' theme.</p>' +
        '<div class="hx-seg" role="group" aria-label="Look">' + [['70s', '70s'], ['modern', 'Modern']].map(function (o) {
          var on = (o[0] === 'modern') === !de.classList.contains('fonts-70s');
          return '<button type="button" data-look="' + o[0] + '"' + (on ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + '>' + o[1] + '</button>'; }).join('') + '</div></div>' +
        '<div class="hx-card"><h3>Theme</h3><p>Hutch, or the ' + esc(ORIGINAL) + ' Toby Geeks Out! theme. You can come back to Hutch any time.</p>' +
        '<div class="hx-seg" role="group" aria-label="Theme"><button type="button" class="on" aria-pressed="true">Hutch</button><button type="button" data-classic aria-pressed="false">' + esc(ORIGINAL) + '</button></div></div>' +
        '<a class="hx-card hx-upd" href="/changelog/"><span class="hh-tile" style="background:' + APPS.tinkering[1] + '">' + ic('tinkering') + '</span><span><h3>What\'s new</h3><p>The Tinkering Log: every change to this theme, day by day.</p></span></a>' +
        '<div class="hx-card"><h3>Boot screen</h3><p>Shows once a day when the home screen opens.</p><button type="button" class="hx-btn ghost" data-replay>Show it again</button></div>' +
        '<div class="hx-card hx-about"><img src="' + esc(avatar) + '" alt=""><div><h3>Hutch OS 0.1</h3><p style="margin:0">Phase 1 · private test build · Nov 2026</p></div></div>' +
        '</div>');
      settings.addEventListener('click', function (e) {
        var b = e.target.closest('[data-sky]');
        if (b) { ls('tgo-sky', b.getAttribute('data-sky')); location.reload(); return; }
        if (e.target.closest('[data-replay]')) { ls('hutch-boot-day', null); if (homeEl) { closeSheet(); boot(true); } else location.href = '/'; return; }
        var lk = e.target.closest('[data-look]');
        if (lk) {
          var modern = lk.getAttribute('data-look') === 'modern';
          ls('tgo-look', modern ? 'modern' : null);
          de.classList.toggle('fonts-70s', !modern);
          [].forEach.call(settings.querySelectorAll('[data-look]'), function (x) { var on = x === lk; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); });
          return;
        }
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
  /* ---------- big desktop widgets (Nov 3, Toby; mockup v52) ----------
     On a big screen (1400 x 820 or more): From the archive (two older
     posts, Shuffle for two more), Currently (watching + reading, from the
     Den data), Top categories, and a Latest photos strip across the
     bottom. The strip holds the photos there, so the big photo widget
     steps aside for Currently; if the strip can't fit above the dock,
     the strip and Currently hide and the big photo comes back (fit()).
     Phones, the Fold and laptops never show these. */
  function agoText(iso) {
    var d = new Date(iso + 'T12:00:00'), now = new Date(), m = (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth();
    if (m < 1) return 'this month'; if (m < 12) return m + (m === 1 ? ' month ago' : ' months ago');
    var y = Math.floor(m / 12); return y + (y === 1 ? ' year ago' : ' years ago');
  }
  var ARCH = (HOME && HOME.arch) || [], archAt = 0, archOrder = null;
  function archPick(n) {
    if (!archOrder) { archOrder = ARCH.map(function (x, i) { return i; }); for (var i = archOrder.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = archOrder[i]; archOrder[i] = archOrder[j]; archOrder[j] = t; } }
    var out = []; for (var k = 0; k < n && ARCH.length; k++) { out.push(ARCH[archOrder[archAt % archOrder.length]]); archAt++; }
    return out;
  }
  function archRows(n) {
    return archPick(n).map(function (x) {
      return '<a class="hh-arow" href="' + esc(x.u) + '">' + (x.img ? '<img src="' + esc(x.img) + '" alt="" loading="lazy" decoding="async">' : '') +
        '<span class="tx"><b>' + esc(x.t) + '</b><small>' + esc(x.m) + ' · ' + esc(agoText(x.iso)) + '</small>' + (x.x ? '<em>' + esc(x.x) + '</em>' : '') + '</span></a>';
    }).join('');
  }
  /* From the archive shows as many posts as fit its card (Nov 3, Toby:
     "there's room for a third"), like Recent posts */
  function archFit() {
    var l = homeEl && homeEl.querySelector('.hh-alist'); if (!l || !l.offsetParent) return;
    var rows = [].slice.call(l.children), lb = l.getBoundingClientRect().bottom;
    function lay() {
      rows.forEach(function (r) { r.classList.remove('off'); });
      var n = 0;
      rows.forEach(function (r, i) { if (i > 0 && (n < i || r.getBoundingClientRect().bottom > lb + 1)) r.classList.add('off'); else n++; });
      return n;
    }
    /* a smaller picture and a one-line note, when that makes room for one more */
    l.classList.remove('tight');
    var roomy = lay();
    l.classList.add('tight');
    if (lay() <= roomy) { l.classList.remove('tight'); lay(); }
  }
  /* ---------- Currently: skip shows he has finished (Nov 3) ----------
     Toby: American Horror Story showed as Watching after he finished it.
     The Watching page counts a Trakt rating made on or after a Now
     Watching post as "finished" (shortcodes/watching.html, ratedSince).
     The home screen does the same: his Trakt ratings, saved here 30
     minutes, drop finished shows and the next one in Den's list shows. */
  var TRAKT_KEY = 'hutch-trakt-rated', TRAKT_ID = '23c84564f461db4829e7142a226cf1b00b1b1f8a87afb1601b081221f74f29cc';
  function tnorm(t) { try { return String(t || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ''); } catch (e) { return String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, ''); } }
  /* the newer of this screen's Trakt check and the Watching page's own
     (tgo_watching_v5_..., already filtered by its rules), so the two match */
  var DEN_KEY = 'tgo_watching_v5_technogeek75_90', TRAKT_TTL = 10 * 60 * 1000;
  function traktRated() {
    var a = null, b = null;
    try { a = JSON.parse(localStorage.getItem(TRAKT_KEY) || 'null'); } catch (e) {}
    try { b = JSON.parse(localStorage.getItem(DEN_KEY) || 'null'); } catch (e) {}
    if (a && !a.rated) a = null; if (b && !(b.rated && b.list)) b = null;
    return a && b ? (b.t > a.t ? b : a) : a || b;
  }
  /* Currently, Watching: the newest of his Now Watching posts and his
     Trakt watch history (Nov 3, Toby: "The Final Problem" is what he
     watched last, but it only lives on Trakt), the same lists the
     Watching page merges. A show rated on Trakt since is finished. */
  var MN3 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function nowWatch(c, N) {
    var done = function (n, season, at) { return c && (c.rated[n] || []).some(function (q) { return (q.s === 0 || q.s >= (season || 0)) && q.at >= at; }); };
    var posts = (N.ws && N.ws.length ? N.ws : (N.w ? [N.w] : [])).filter(function (x) { return x && x.t; }), best = null, bestAt = -1, byN = {};
    posts.forEach(function (x) {
      var n = x.n || tnorm(x.t), at = +x.at || Date.parse(x.date) || 0;
      if (done(n, x.season, at)) return;
      byN[n] = x;
      if (at > bestAt) { best = x; bestAt = at; }
    });
    ((c && c.list) || []).forEach(function (t) {
      var n = tnorm(t.title), p = byN[n];
      if (t.last <= bestAt || done(n, t.season, t.last)) return;
      var d = new Date(t.last);
      best = { t: t.title, kind: 'TV', season: Math.max(t.season || 0, (p && p.season) || 0), ep: t.ep, epn: t.epn, tmdb: t.tmdb,
        cover: (p && p.cover) || ls('tgo_poster_v1_' + t.tmdb) && (JSON.parse(ls('tgo_poster_v1_' + t.tmdb)) || {}).u || '', d: MN3[d.getMonth()] + ' ' + d.getDate() };
      bestAt = t.last;
    });
    return best;
  }
  function traktFresh(done) {
    var c = traktRated(); if (c && c.list && Date.now() - c.t < TRAKT_TTL) return;
    var REV = ((HOME && HOME.now && HOME.now.rev) || []);
    var get = function (path) { return fetch('https://api.trakt.tv/users/technogeek75/' + path, { headers: { 'trakt-api-version': '2', 'trakt-api-key': TRAKT_ID } }).then(function (q) { if (!q.ok) throw 0; return q.json(); }); };
    var since = new Date(Date.now() - 90 * 86400000).toISOString();
    Promise.all([get('ratings/shows'), get('ratings/seasons'), get('history/episodes?limit=60&start_at=' + encodeURIComponent(since)).catch(function () { return []; })]).then(function (res) {
      var rated = {}, seen = {}, list = [];
      res[0].forEach(function (x) { if (x.show) (rated[tnorm(x.show.title)] = rated[tnorm(x.show.title)] || []).push({ s: 0, at: Date.parse(x.rated_at) || 0 }); });
      res[1].forEach(function (x) { if (x.show && x.season) (rated[tnorm(x.show.title)] = rated[tnorm(x.show.title)] || []).push({ s: x.season.number || 0, at: Date.parse(x.rated_at) || 0 }); });
      res[2].forEach(function (h) {
        var sh = h.show, e = h.episode; if (!sh || !sh.ids || !e || seen[sh.ids.trakt]) return;
        seen[sh.ids.trakt] = 1;
        if (REV.indexOf(tnorm(sh.title)) > -1) return; /* reviewed = finished */
        list.push({ title: sh.title, tmdb: sh.ids.tmdb || 0, season: e.season > 0 ? e.season : 1, ep: e.number || 0, epn: e.title || '', last: Date.parse(h.watched_at) || 0 });
      });
      try { localStorage.setItem(TRAKT_KEY, JSON.stringify({ t: Date.now(), rated: rated, list: list.slice(0, 12) })); } catch (e) {}
      done();
      /* a show only on Trakt has no poster here: ask Perch once, like the Watching page (shared 30-day cache) */
      var w = nowWatch(traktRated(), (HOME && HOME.now) || {});
      if (w && !w.cover && w.tmdb) fetch('https://perch-app.pages.dev/poster?tmdb=' + w.tmdb).then(function (q) { return q.json(); }).then(function (d) {
        if (d && d.poster) { ls('tgo_poster_v1_' + w.tmdb, JSON.stringify({ t: Date.now(), u: d.poster })); done(); }
      }).catch(function () {});
    }).catch(function () {});
  }
  function nowCard() {
    var out = '';
    var N = (HOME && HOME.now) || {}, r = N.r && N.r.t ? N.r : null;
    var w = nowWatch(traktRated(), N);
    if (w || r) {
      var den = APPS.den[2] || '/watching/', item = function (x, kind) {
        var meta = '', by = '', pct = -1;
        if (kind === 'w') {
          by = x.kind === 'TV' ? (x.season ? 'Season ' + x.season : 'TV') : (x.y || 'Movie');
          if (x.ep) { meta = 'Episode ' + x.ep + (x.eps ? ' of ' + x.eps : '') + (x.epn ? ' · ' + x.epn : ''); if (x.eps) pct = Math.round(x.ep / x.eps * 100); }
          else meta = x.d ? 'Since ' + x.d : '';
        } else {
          by = x.who ? 'by ' + x.who : '';
          if (x.pct >= 0) { pct = x.pct; meta = x.pct + '%' + (x.page ? ' · page ' + x.page + (x.total ? ' of ' + x.total : '') : ''); }
        }
        return '<a class="hh-nitem" href="' + esc(den) + '">' + (x.cover ? '<img src="' + esc(x.cover) + '" alt="" loading="lazy" decoding="async">' : '<span class="cv"></span>') +
          '<span class="tx"><small>' + (kind === 'w' ? 'Watching' : 'Reading') + '</small><b>' + esc(x.t) + '</b>' + (by ? '<i>' + esc(by) + '</i>' : '') + (meta ? '<em>' + esc(meta) + '</em>' : '') +
          (pct >= 0 ? '<span class="bar"><i style="width:' + Math.max(3, Math.min(100, pct)) + '%"></i></span>' : '') + '</span></a>';
      };
      out += '<section class="hh-wg hh-now" aria-label="Currently"><div class="hh-wtag">Currently<a href="' + esc(den) + '">Den ›</a></div><div class="hh-ntwo' + (w && r ? '' : ' one') + '">' +
        (w ? item(w, 'w') : '') + (r ? item(r, 'r') : '') + '</div></section>';
    }
    return out;
  }
  function bigDesk() {
    var out = '';
    if (ARCH.length) out += '<section class="hh-wg hh-arch" aria-label="From the archive"><div class="hh-wtag">From the archive<a href="' + esc(APPS.archive[2]) + '">Archive ›</a></div>' +
      '<div class="hh-alist">' + archRows(5) + '</div><div class="hh-afoot"><span>Older posts, picked at random</span>' +
      '<button type="button" class="hh-shuf" aria-label="Shuffle: more older posts">' + ic('surprise') + '<span>Shuffle</span></button></div></section>';
    out += nowCard();
    var cats = ((HOME && HOME.cats) || []).filter(function (c) { return !/^micro$/i.test(c.n); }).slice(0, 12);
    if (cats.length) out += '<section class="hh-wg hh-cats" aria-label="Top categories"><div class="hh-wtag">Top categories<a href="' + esc(APPS.archive[2]) + '">See all ›</a></div><div class="hh-chips">' +
      cats.map(function (c) { return '<a href="' + esc(c.u) + '">' + esc(c.n) + '<span>' + c.c + '</span></a>'; }).join('') + '</div></section>';
    var ph = (HOME && HOME.photos) || [];
    if (ph.length > 2) out += '<section class="hh-wg hh-strip" aria-label="Latest photos"><div class="hh-wtag">Latest photos<a href="' + esc(APPS.photos[2]) + '">Photos ›</a></div><div class="hh-thumbs">' +
      ph.slice(0, 10).map(function (p) { return '<a href="/photo/#post=' + encodeURIComponent(p.u) + '" aria-label="' + esc(p.t || 'Photo') + '"><img src="' + esc(p.src) + '" alt="" loading="lazy" decoding="async"><small>' + esc(p.d) + '</small></a>'; }).join('') + '</div></section>';
    return out;
  }

  function buildHome() {
    var now = new Date();
    var day = now.toLocaleDateString('en-US', { weekday: 'long' }), mon = now.toLocaleDateString('en-US', { month: 'long' });
    var rows = (HOME.recent || []).map(function (r, i) {
      return '<a class="hh-row" href="' + esc(r.u) + '">' + (r.img ? '<img src="' + esc(r.img) + '" alt="" loading="' + (i < 3 ? 'eager' : 'lazy') + '" decoding="async">' : '') +
        '<div><div class="t">' + esc(r.t) + '</div><div class="d">' + esc(r.d) + '</div></div></a>';
    }).join('') || '<div class="hh-empty">No posts yet.</div>';
    var p = HOME.photo || {}, w = HOME.word || {};
    var photo = p.src
      /* the photo is never stretched: it fills its box by cropping, and a
         photo much taller (or wider) than its box shows whole instead, on
         a soft blurred copy of itself (Nov 3, Toby) */
      ? '<a class="hh-wg hh-photo" href="/photo/#post=' + encodeURIComponent(p.u || '') + '" aria-label="Photos: ' + esc(p.t || 'latest photo') + '"><img class="bg" src="' + esc(p.src) + '" alt="" aria-hidden="true" decoding="async"><img class="main" src="' + esc(p.src) + '" alt="" decoding="async">' + (p.n > 1 ? '<span class="n">+' + (p.n - 1) + '</span>' : '') +
        '<div class="cap"><small>' + esc(p.d) + '</small><b>' + esc(p.t || 'Latest photo') + '</b></div></a>'
      : '<a class="hh-wg hh-photo" href="/photo/"><span class="ph"></span><div class="cap"><small>Photos</small><b>Open Photos</b></div></a>';
    var word = w.w
      /* one tap: the whole widget opens Word Nerd, where the latest word's
         card shows every meaning (no Read more button, Nov 2) */
      /* Nov 3 (Toby): on the unfolded screen, upright or sideways, there's
         room for more than one meaning, so they're listed, numbered, as
         many as fit (fit() below). The phone keeps one, with "+2 more". */
      ? '<a class="hh-wg hh-word' + (w.ms && w.ms.length > 1 ? ' multi' : '') + '" href="' + APPS.words[2] + '" aria-label="Word Nerd: ' + esc(w.w) + '"><div class="hh-wtag">Word Nerd Alert<span class="wsee" aria-hidden="true"><span class="wl">Word Nerd </span>›</span></div><div class="w">' + esc(w.w) + '</div>' +
        '<div class="pos"><span class="pt">' + esc(w.pos || '') + '</span>' + (w.n > 1 ? '<span class="more">+' + (w.n - 1) + ' more</span>' : '') + '</div><div class="def">' + esc(w.def || '') + '</div>' +
        (w.ms && w.ms.length > 1 ? '<ol class="defs">' + w.ms.map(function (m, i) { return '<li><b>' + (i + 1) + '</b>' + esc(m) + '</li>'; }).join('') + '</ol>' : '') +
        /* big desktop: the example and a way in, so the card never ends in empty space */
        (w.ex ? '<p class="wex">“' + esc(w.ex.replace(/^[\s"“”„'‘’]+|[\s"“”„'‘’]+$/g, '')) + '”</p>' : '') + '</a>'
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
        '<div class="hh-hello"><div class="hh-tx"><div class="hh-g">' + greeting() + '</div><a class="hh-s" href="/calendar/" aria-label="Open Calendar">It\'s <em>' + day + '</em>,<br><span class="nw">' + mon + ' ' + ordinal(now.getDate()) + '.</span></a><div class="hh-p">' + esc(postsThisWeek()) + '</div></div>' +
        /* unfolded and tablets (one row of apps): room for a fifth,
           Micro.blog before Settings (Nov 3, Toby). Phones keep the four. */
        '<div class="hh-quad">' + QUAD.map(function (k) { return (k === 'settings' && WIDE5 ? '<span class="hh-w5">' + appIcon(WIDE5) + '</span>' : '') + appIcon(k); }).join('') + '</div>' +
        '<div class="hh-dkapps">' + DKAPPS.map(function (k) { return appIcon(k); }).join('') + '</div></div>' +
        '<section class="hh-wg hh-posts" aria-label="Recent posts"><div class="hh-wtag">Recent posts<a href="/?app=blog">See all ›</a></div>' + rows + '</section>' +
        photo + word + bigDesk() +
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

    homeEl.classList.toggle('nonow', !homeEl.querySelector('.hh-now'));
    /* a show finished since this page was built: swap Currently once his Trakt ratings come in;
       checked again every 10 minutes and whenever he comes back to the screen */
    if (window.matchMedia && (matchMedia('(min-width:1400px) and (min-height:700px)').matches || matchMedia('(min-width:600px) and (min-height:380px) and (max-width:1099px)').matches) && homeEl.querySelector('.hh-area .hh-cats')) traktFresh(function () {
      var old = homeEl.querySelector('.hh-now'), html = nowCard();
      if (old && old.outerHTML === html) return;
      if (old) old.remove();
      if (html) homeEl.querySelector('.hh-cats').insertAdjacentHTML('beforebegin', html);
      homeEl.classList.toggle('nonow', !homeEl.querySelector('.hh-now'));
      fit();
    });
    var nowSwap = function () {
      var old = homeEl.querySelector('.hh-now'), html = nowCard();
      if (old && old.outerHTML === html) return;
      if (old) old.remove();
      if (html) homeEl.querySelector('.hh-cats').insertAdjacentHTML('beforebegin', html);
      homeEl.classList.toggle('nonow', !homeEl.querySelector('.hh-now'));
      fit();
    };
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible' && homeEl.querySelector('.hh-cats')) { nowSwap(); traktFresh(nowSwap); } });
    setInterval(function () { if (document.visibilityState === 'visible' && homeEl.querySelector('.hh-cats')) traktFresh(nowSwap); }, TRAKT_TTL);
    var shuf = homeEl.querySelector('.hh-shuf');
    if (shuf) shuf.addEventListener('click', function () {
      var ac = homeEl.querySelector('.hh-arch'), lst = ac.querySelector('.hh-alist'), n = lst.children.length || 5;
      ac.classList.add('swap');
      setTimeout(function () { lst.innerHTML = archRows(n); ac.classList.remove('swap'); fit(); }, 180);
    });
    /* Desktop wallpaper mark (Nov 3, Toby): a computer has no launch
       screen, so the Toby Geeks Out! logo and his face rest low on the
       left, just above the mountains, the way the rabbit sits on the right
       peak. Day or night logo to match the sky (70s or modern, like the
       Traditional header). Clicking it opens About. Desktop only (CSS). */
    (function () {
      var is70 = de.classList.contains('fonts-70s'), up = 'https://tobygeeksout.micro.blog/uploads/2026/';
      var lg = DARK ? (is70 ? up + 'night-v2-toby-geeks-out-new-logo-1500-x-600-px.png' : up + 'sunset-toby-geeks-out-new-logo.png')
                    : (is70 ? up + 'toby-geeks-out-newest-v2-logo-1500-x-600-px.png' : up + 'tobygeeksoutlogonew.png');
      var av = PAGE.avatar || 'https://tobygeeksout.micro.blog/uploads/2026/tobyavatartrans.png';
      var mark = el('<a class="hh-brand" href="' + esc(APPS.about[2] || '/about/') + '" aria-label="About ' + esc(PAGE.site || 'Toby Geeks Out!') + '">' +
        '<img class="face" src="' + esc(av) + '" alt="" decoding="async" loading="lazy"><img class="logo" src="' + lg + '" alt="' + esc(PAGE.site || 'Toby Geeks Out!') + '" decoding="async" loading="lazy"></a>');
      homeEl.appendChild(mark);
    })();
    /* desktop: every app is already on the screen, so no All apps button */
    homeEl.classList.toggle('dk-full', Object.keys(APPS).filter(function (k) { return k !== 'tinkering' && DOCK.indexOf(k) < 0 && DKAPPS.indexOf(k) < 0; }).length === 0);
    fit();
    window.addEventListener('resize', fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    [].forEach.call(homeEl.querySelectorAll('img'), function (i) { if (!i.complete) i.addEventListener('load', fit, { once: true }); });

    /* browser bar matches the sky; custom_footer.html re-sets it every minute, so keep ours */
    /* The phone's top bar takes the sky color at the top of the home
       screen, and the strip by the gesture bar takes the mountains' color
       at the bottom (Nov 2, Toby: "sometimes it shows the sky color").
       The Traditional sky script re-colors the top bar every minute, so
       Hutch watches for that and puts its own color straight back. */
    var SKYBOT = { day: '#3A4A64', dawn: '#594E68', sunset: '#483744', dusk: '#22263C', night: '#0D1320' };
    de.style.setProperty('background', SKYBOT[PHASE], 'important');
    document.body.style.setProperty('background', SKYBOT[PHASE], 'important');
    setBarColor(SKYTOP[PHASE]);
  }
  /* never scroll: if anything would run past the area, tighten step by step */
  function photoFit() {
    var ph = homeEl && homeEl.querySelector('.hh-photo'), im = ph && ph.querySelector('img.main');
    if (!im || !im.naturalWidth) return;
    var r = ph.getBoundingClientRect(); if (!r.width || !r.height) return;
    var pic = im.naturalWidth / im.naturalHeight, box = r.width / r.height;
    ph.classList.toggle('whole', pic < box * 0.72 || pic > box * 1.6);
  }
  /* the desktop logo never sits on top of a widget or the dock: smaller
     if it has to be, gone if there's no free sky for it */
  function brandFit() {
    var b = homeEl && homeEl.querySelector('.hh-brand'); if (!b) return;
    b.classList.remove('sm', 'low', 'xs', 'off');
    if (getComputedStyle(b).display === 'none') return;
    var hit = function () {
      var r = b.getBoundingClientRect();
      return [].some.call(homeEl.querySelectorAll('.hh-area > *, .hh-bottom, .hh-handle'), function (c) {
        var q = c.getBoundingClientRect(); if (!q.width || !q.height) return false;
        return !(r.right + 12 < q.left || r.left - 12 > q.right || r.bottom + 12 < q.top || r.top - 12 > q.bottom);
      });
    };
    if (hit()) b.classList.add('sm');
    /* laptops: no free sky above the mountains, so it rests on the
       mountains beside the dock instead */
    if (hit()) b.classList.add('low');
    /* one more, smaller step before it goes away (Nov 3, Toby: the logo
       and face vanished when the photo strip came in) */
    if (hit()) b.classList.add('xs');
    if (hit()) b.classList.add('off');
  }
  /* Currently's items never end cut off: the by/season line goes first,
     then the cover, then the last line (Nov 3, Toby: on the Fold sideways
     the bottom line was cut). Checked again once fonts and images are in. */
  function nitemFit() {
    if (!homeEl) return;
    [].forEach.call(homeEl.querySelectorAll('.hh-nitem'), function (x) {
      x.classList.remove('t1', 't2', 't3');
      ['t1', 't2', 't3'].forEach(function (t) { if (x.scrollHeight > x.clientHeight + 1) x.classList.add(t); });
    });
  }
  /* once fonts and images are in, every card is measured again (fit() runs nitemFit too) */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setTimeout(function () { if (homeEl) fit(); }, 50); });
  window.addEventListener('load', function () { setTimeout(function () { if (homeEl) fit(); }, 50); });
  function fit() {
    if (!homeEl) return;
    setTimeout(photoFit, 0);
    setTimeout(brandFit, 0);
    setTimeout(archFit, 0);
    var a = homeEl.querySelector('.hh-area');
    homeEl.classList.remove('fit1', 'fit2', 'nostrip', 'noex');
    /* the upright Fold's short mode, from the height actually visible (Nov 3) */
    var vh = (window.visualViewport && visualViewport.height) || innerHeight;
    homeEl.classList.toggle('short', innerWidth >= 600 && innerWidth < 840 && vh < 760);
    /* every pass starts clean (Nov 3, Toby: the photo strip came and went
       on each refresh, because the last pass's trimmed Word Nerd and
       hidden chips changed the next measurement) */
    [].forEach.call(homeEl.querySelectorAll('.hh-word .defs li, .hh-chips a'), function (x) { x.style.display = ''; x.style.webkitLineClamp = ''; });
    [].forEach.call(homeEl.querySelectorAll('.hh-posts .hh-row.on'), function (x) { x.classList.remove('on'); });
    var strip = homeEl.querySelector('.hh-strip');
    /* Nov 3 (Toby: at 80% zoom his Mac showed everything at once): on a
       big desktop that's a little short, the cards shrink to fit, never
       below 85%, the way the browser's zoom does. Big monitors stay 100%. */
    /* The words stay full size (Toby: "fonts bigger, 100%"): the text
       blocks zoom back up by 1/z (--tz), so only spacing and pictures shrink. */
    a.style.zoom = ''; a.style.removeProperty('--tz'); homeEl.classList.remove('tight');
    var z = 1;
    if (strip && window.matchMedia && matchMedia('(min-width:1400px) and (min-height:700px)').matches) {
      strip.style.removeProperty('--sth');
      var h0 = a.getBoundingClientRect().height;
      for (var zi = 0; zi < 4; zi++) {
        a.style.flex = 'none'; a.style.height = 'auto';
        var need = a.getBoundingClientRect().height;
        a.style.flex = ''; a.style.height = '';
        /* Nov 3 (Toby, Windows at 125%: about 1475 x 810): shorter screens may go to 80% */
        var zMin = innerHeight < 820 ? 0.8 : 0.85;
        if (need <= h0 + 1 || z <= zMin) break;
        /* tight: smaller covers in Currently first (CSS), then shrink */
        if (!homeEl.classList.contains('tight')) { homeEl.classList.add('tight'); zi--; continue; }
        z = Math.max(zMin, Math.floor(z * h0 / need * 100) / 100);
        a.style.zoom = z; a.style.setProperty('--tz', (1 / z).toFixed(3));
      }
    }
    /* the strip's photos shrink to the room left under the cards (Nov 3,
       Toby: on his Mac there wasn't room for full-size ones, and the
       Photos widget went missing); too little room, no strip */
    if (strip) {
      strip.style.removeProperty('--sth');
      if (getComputedStyle(strip).display !== 'none') {
        var th = strip.querySelector('.hh-thumbs a'), ar = a.getBoundingClientRect(),
          padB = parseFloat(getComputedStyle(a).paddingBottom) || 0, low = 0;
        /* the cards' full height, measured without the strip (the grid
           squeezes them while it's there) */
        /* Word Nerd's example can step aside for the strip, so it's measured without it */
        homeEl.classList.add('nostrip', 'noex');
        [].forEach.call(a.children, function (c) { if (c !== strip && getComputedStyle(c).display !== 'none') low = Math.max(low, c.getBoundingClientRect().bottom); });
        homeEl.classList.remove('nostrip', 'noex');
        if (th) {
          /* on-screen sizes are shrunk by z; the strip's own sizes are not */
          var chrome = th.getBoundingClientRect().top - strip.getBoundingClientRect().top + (parseFloat(getComputedStyle(strip).paddingBottom) || 0) * z,
            room = Math.floor((ar.bottom - padB * z - low - (parseFloat(getComputedStyle(a).rowGap) || 18) * z - chrome) / z) - 8;
          /* 8px to spare so the cards above never get squeezed; both sizes unshrunk */
          if (room < th.getBoundingClientRect().height / z) strip.style.setProperty('--sth', Math.max(room, 0) + 'px');
          /* the room above was measured without Word Nerd's example: on a shrunk screen it stays out */
          if (z < 1 || room < th.getBoundingClientRect().height / z) homeEl.classList.add('noex');
          if (room < 96) homeEl.classList.add('nostrip');
        }
      }
    }
    if (strip && !homeEl.classList.contains('nostrip') && getComputedStyle(strip).display !== 'none') {
      /* a row squeezed by the grid shows up as a card cut short inside */
      var ab0 = a.getBoundingClientRect();
      /* Top categories shows fewer chips and Word Nerd trims itself (below), so they don't count */
      if ([].some.call(a.children, function (c) { return c.getBoundingClientRect().bottom > ab0.bottom + 1 || (c.classList.contains('hh-wg') && !c.classList.contains('hh-photo') && !c.classList.contains('hh-cats') && !c.classList.contains('hh-word') && c.scrollHeight > c.clientHeight + 2); })) homeEl.classList.add('nostrip');
    }
    /* Top categories: as many chips as fit its card (Nov 3) */
    var cc = homeEl.querySelector('.hh-area .hh-cats');
    if (cc && getComputedStyle(cc).display !== 'none') {
      var chips = [].slice.call(cc.querySelectorAll('.hh-chips a')), cb = cc.getBoundingClientRect().bottom - (parseFloat(getComputedStyle(cc).paddingBottom) || 0) * z;
      chips.forEach(function (x) { x.style.display = ''; });
      for (var ci = chips.length - 1; ci > 3 && chips[ci].getBoundingClientRect().bottom > cb + 1; ci--) chips[ci].style.display = 'none';
    }
    /* Word Nerd never ends cut in half (Nov 3, Safari draws text a little
       taller): the example goes first, then meanings from the end */
    var wd = homeEl.querySelector('.hh-area .hh-word.multi');
    if (wd && strip && getComputedStyle(strip).display !== 'none' || wd && homeEl.classList.contains('nostrip')) {
      [].forEach.call(wd.querySelectorAll('.defs li'), function (li) { li.style.display = ''; });
      if (wd.scrollHeight > wd.clientHeight + 2) homeEl.classList.add('noex');
      var lis = wd.querySelectorAll('.defs li');
      for (var k = lis.length - 1; k > 0 && wd.scrollHeight > wd.clientHeight + 2; k--) lis[k].style.display = 'none';
    }
    nitemFit();
    if (innerHeight <= 520) return; /* sideways phone: the area scrolls instead */
    function over() { var ab = a.getBoundingClientRect(); return [].some.call(a.children, function (c) { return c.getBoundingClientRect().bottom > ab.bottom + 1; }); }
    if (over()) homeEl.classList.add('fit1');
    if (over()) homeEl.classList.add('fit2');
    /* Recent posts fills its card (Nov 3, Toby): where the card is taller
       than its three posts (it sits beside the date or Word Nerd), more
       posts are added one at a time, as long as the card doesn't grow and
       nothing runs past the screen. */
    var pc = homeEl.querySelector('.hh-posts'), xr = pc ? [].slice.call(pc.querySelectorAll('.hh-row')).slice(3) : [];
    xr.forEach(function (r) { r.classList.remove('on'); });
    if (xr.length && !homeEl.classList.contains('fit2')) {
      var h0 = pc.getBoundingClientRect().height, padB = parseFloat(getComputedStyle(pc).paddingBottom) || 0;
      for (var xi = 0; xi < xr.length; xi++) {
        xr[xi].classList.add('on');
        var pr = pc.getBoundingClientRect();
        if (pr.height > h0 + 1 || xr[xi].getBoundingClientRect().bottom > pr.bottom - padB + 1 || over()) { xr[xi].classList.remove('on'); break; }
      }
    }
    /* the Word Nerd card: shorten the definition until it fits its card */
    var wc = homeEl.querySelector('.hh-word'), def = wc && wc.querySelector('.def');
    var defs = wc && wc.querySelector('.defs'), wide = defs && getComputedStyle(defs).display !== 'none';
    if (wide) {
      /* unfolded: list the meanings, dropping from the end until they fit;
         "+N more" counts the ones that didn't */
      var lis = [].slice.call(defs.children), more = wc.querySelector('.pos .more'), total = (HOME.word && HOME.word.n) || lis.length;
      lis.forEach(function (li) { li.style.display = ''; li.style.webkitLineClamp = ''; });
      /* text may use half the bottom padding, so one more line shows when it nearly fits (Nov 3, Toby) */
      var cbot = function () { return wc.getBoundingClientRect().bottom - parseFloat(getComputedStyle(wc).paddingBottom) / 2 + 1; };
      /* as many as fit: the last one shown may be cut to 2 lines (with …)
         rather than dropped, so the card fills up; a single one may go
         down to 1 line */
      var over = function () { return defs.getBoundingClientRect().bottom > cbot(); };
      var vis;
      var place = function () {
        for (vis = lis.length; vis >= 1; vis--) {
          lis.forEach(function (li, i) { li.style.display = i < vis ? '' : 'none'; li.style.webkitLineClamp = ''; });
          var last = lis[vis - 1], ok = !over();
          /* the last one may go down to 1 line (…) so a little room still shows it (Nov 3) */
          for (var l2 = 3; !ok && l2 >= 1; l2--) { last.style.webkitLineClamp = String(l2); ok = !over(); }
          if (ok) break;
        }
        if (vis < 1) { vis = 1; lis.forEach(function (li, i) { li.style.display = i < 1 ? '' : 'none'; }); lis[0].style.webkitLineClamp = '1'; }
      };
      /* Nov 3 (Toby, folded Fold): when the next meaning is a few pixels
         short, the lines and gaps tighten a little, kept only if that
         shows one more meaning */
      wc.classList.remove('snug'); place();
      if (vis < lis.length) {
        var v0 = vis; wc.classList.add('snug'); place();
        if (vis <= v0) { wc.classList.remove('snug'); place(); }
      }
      if (more) { var left = total - vis; more.textContent = '+' + left + ' more'; more.style.display = left > 0 ? '' : 'none'; }
    } else if (def) {
      def.style.display = ''; def.style.webkitLineClamp = '';
      /* clipped = the Read more button (or the definition) runs past the card's bottom edge */
      var clipped = function () {
        var cb = wc.getBoundingClientRect().bottom - parseFloat(getComputedStyle(wc).paddingBottom) + 1;
        var rm = wc.querySelector('.rm'), last = rm || def;
        return last.getBoundingClientRect().bottom > cb || (rm && def.getBoundingClientRect().bottom > rm.getBoundingClientRect().top);
      };
      /* Nov 3 (Toby: "+2 more" went missing on the phone): the
         definition gets shorter first, a line at a time. Only if it still
         doesn't fit does the part of speech step aside, and the "+2 more"
         count always stays. */
      var pt = wc.querySelector('.pos .pt'); if (pt) pt.style.display = '';
      for (var ln = 4; ln >= 2 && clipped(); ln--) def.style.webkitLineClamp = String(ln);
      if (clipped() && pt) pt.style.display = 'none';
      if (clipped()) def.style.webkitLineClamp = '1';
      if (clipped()) def.style.display = 'none';
    }
  }

  function boot(force) {
    if (!force) {
      var today = new Date().toDateString();
      if (calm || ls('hutch-boot-day') === today) return;
      /* Nov 3 (Toby: "a splash, then another splash"): opened from the
         phone's home screen icon, the phone already shows its own launch
         screen, so Hutch skips its boot screen there (Settings > Show it
         again still plays it). */
      if (window.matchMedia && matchMedia('(display-mode: standalone), (display-mode: minimal-ui), (display-mode: fullscreen)').matches) return;
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
  /* The browser's address bar takes the color of whatever sits at the top
     of the page (Nov 2, Toby): the sky on the home screen, the app bar in
     an app (Den dark, Photos white, Word Nerd cream...). The Traditional
     sky script re-colors it every minute, so Hutch keeps one theme-color
     tag, watches it, and puts its own color back. */
  var tcWant = null, tcMeta = null;
  function hex(c) {
    var m = String(c).match(/rgba?\(([^)]+)\)/); if (!m) return c;
    var v = m[1].split(',').map(function (x) { return parseFloat(x); });
    if (v.length > 3 && v[3] === 0) return null;
    return '#' + v.slice(0, 3).map(function (x) { return ('0' + Math.round(x).toString(16)).slice(-2); }).join('').toUpperCase();
  }
  function setBarColor(c) {
    if (!c) return;
    tcWant = c;
    if (!tcMeta) {
      var all = document.querySelectorAll('meta[name="theme-color"]'); tcMeta = all[0];
      for (var i = 1; i < all.length; i++) all[i].parentNode.removeChild(all[i]);
      if (!tcMeta) { tcMeta = document.createElement('meta'); tcMeta.name = 'theme-color'; document.head.appendChild(tcMeta); }
      tcMeta.removeAttribute('media');
      if (window.MutationObserver) new MutationObserver(function () {
        [].forEach.call(document.querySelectorAll('meta[name="theme-color"]'), function (m) { if (m !== tcMeta) m.parentNode.removeChild(m); });
        if (tcWant && tcMeta.getAttribute('content') !== tcWant) tcMeta.setAttribute('content', tcWant);
      }).observe(document.head, { attributes: true, subtree: true, childList: true, attributeFilter: ['content'] });
    }
    if (tcMeta.getAttribute('content') !== c) tcMeta.setAttribute('content', c);
  }

  /* Leaving the page (back arrow or Home): show it at once and ignore
     more taps while the next page loads, so a second tap can't skip two
     pages back (Nov 2, Toby: "slow or do I have to tap twice?"). Cleared
     if the page comes back from the browser's back/forward cache. */
  /* btn: the button that was tapped. Only that one lights up (Nov 3,
     Toby: swiping lit the back arrow pink though he never touched it) */
  function leaving(btn) {
    if (de.classList.contains('hx-leaving')) return true;
    de.classList.add('hx-leaving');
    if (btn && btn.classList) btn.classList.add('tapped');
    setTimeout(function () { de.classList.remove('hx-leaving'); if (btn && btn.classList) btn.classList.remove('tapped'); }, 4000);
    return false;
  }
  /* how long the back list was when this page loaded: anything added
     after (an embedded frame, a sheet) is skipped by the back arrow */
  var L0 = history.length, fromBF = false;
  try { var nv = performance.getEntriesByType('navigation')[0]; fromBF = !!nv && nv.type === 'back_forward'; } catch (e) {}
  window.addEventListener('pageshow', function (e) {
    de.classList.remove('hx-leaving');
    [].forEach.call(document.querySelectorAll('#hutch-bar .tapped'), function (b) { b.classList.remove('tapped'); });
    if (e.persisted) fromBF = true;
  });

  /* the nearest screen behind this one in the back list that isn't a post */
  function isPostURL(u) { try { return /^\/\d{4}\/\d{2}\/\d{2}\//.test(new URL(u, location.href).pathname); } catch (e) { return false; } }
  function appBehind() {
    try {
      if (!window.navigation || !navigation.entries || !navigation.currentEntry) return null;
      var ents = navigation.entries(), cur = navigation.currentEntry.index;
      for (var i = cur - 1; i >= 0; i--) if (ents[i] && ents[i].url && !isPostURL(ents[i].url)) return ents[i];
    } catch (e) {}
    return null;
  }

  function buildFrame() {
    var k = appForPage(), a = APPS[k] || APPS.blog;
    var isPost = PAGE.type === 'post' && PAGE.kind === 'page';
    var hasTitle = isPost || isBlogApp;
    var name = a[0];
    if (k === 'archive' && path.indexOf('/categories/') === 0 && PAGE.title) name = PAGE.title;
    if (k === 'blog' && !isPost && path !== '/' && PAGE.title) name = PAGE.title;
    /* the app's icon and name open that app's main screen (Nov 3, Toby);
       on a post, that's the Blog list */
    var appHome = a[2] && !/^https?:/.test(a[2]) ? a[2] : null;
    var bar = el('<header id="hutch-bar" role="banner">' +
      '<button type="button" class="hb-btn hb-back" aria-label="Back">' + ic('back') + '</button>' +
      (appHome ? '<a class="hb-app" href="' + esc(appHome) + '" aria-label="' + esc(a[0]) + ': main screen">' : '<div class="hb-app">') +
        '<span class="hb-tile" style="background:' + a[1] + '">' + ic(k) + '</span><div class="hb-names"><span class="hb-name">' + esc(name) + '</span>' +
        (hasTitle ? '<span class="hb-title">' + esc(isPost ? PAGE.title || '' : '') + '</span>' : '') + '</div>' + (appHome ? '</a>' : '</div>') +
      (hasTitle ? '<span class="hb-pct">0%</span>' : '') +
      (isBlogApp ? '<button type="button" class="hb-btn hb-expand" aria-label="Full screen" title="Full screen">' + ic('expand') + '</button>' : '') +
      /* no search button here (Nov 2, Toby): inside an app it read as
         "search this app", but it searched the whole site. Hutch Search
         lives on the home screen; Word Nerd and Archive have their own. */
      /* the rabbit is Home; a little house badge says so (Nov 3, Toby:
         "people don't know they can tap the logo to go home") */
      '<a class="hb-btn hb-home" href="/" aria-label="Home" title="Home"><span class="hx-rab">' + RABBIT + '</span><span class="hb-hbadge" aria-hidden="true">' + ic('house', 2.4) + '</span></a>' +
      (hasTitle ? '<span class="hb-prog"></span>' : '') + '</header>');
    document.body.insertBefore(bar, document.body.firstChild);
    var appLink = bar.querySelector('a.hb-app');
    if (appLink) appLink.addEventListener('click', function (e) {
      var u = new URL(appLink.href);
      if (u.pathname + u.search === location.pathname + location.search) { e.preventDefault(); window.scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' }); var lf = document.querySelector('.hbl-left'); if (lf) lf.scrollTop = 0; return; }
      if (de.classList.contains('hx-leaving')) { e.preventDefault(); return; }
      /* from a post, the Blog list opens with this post lit */
      if (isPost) try { sessionStorage.setItem('hutch-lastpost', location.pathname); } catch (er) {}
      leaving(appLink);
    });
    bar.querySelector('.hb-back').addEventListener('click', function () {
      /* On a post, back never goes to another post (Nov 3, Toby: "swipe
         takes care of older and newer"): it goes straight to the app
         screen you came from (the Blog list, Photos, Word Nerd, the home
         screen), skipping any posts in between, as you left it. Opened
         from outside the site, it goes to the Blog list. */
      if (isPost) {
        var tgt = appBehind();
        if (de.classList.contains('hx-leaving')) { location.href = tgt ? tgt.url : APPS.blog[2]; return; }
        leaving(this);
        if (tgt && window.navigation && navigation.traverseTo) {
          var g = false;
          window.addEventListener('pagehide', function () { g = true; }, { once: true });
          try { navigation.traverseTo(tgt.key); } catch (er) { location.href = tgt.url; return; }
          setTimeout(function () { if (!g && document.visibilityState === 'visible') location.href = tgt.url; }, 1200);
          return;
        }
        if (!window.navigation || !navigation.entries) { /* older browsers: the usual way below */ de.classList.remove('hx-leaving'); }
        else { location.href = APPS.blog[2]; return; }
      }
      var same = false;
      try { same = document.referrer && new URL(document.referrer).origin === location.origin; } catch (e) {}
      /* a second tap while waiting never gets ignored: it goes straight back */
      if (leaving(this)) { location.href = same ? document.referrer : '/'; return; }
      if (!(same && history.length > 1)) { location.href = '/'; return; }
      /* skip any steps inside this page (an open photo, a Den list) and go
         to the page before it */
      try {
        if (window.navigation && navigation.entries && navigation.currentEntry) {
          var ents = navigation.entries(), ci = navigation.currentEntry.index, here = location.pathname + location.search;
          for (var j = ci - 1; j >= 0; j--) {
            var eu = new URL(ents[j].url);
            if (eu.pathname + eu.search !== here) {
              var gone1 = false;
              window.addEventListener('pagehide', function () { gone1 = true; }, { once: true });
              navigation.traverseTo(ents[j].key);
              var back1 = ents[j].url;
              setTimeout(function () { if (!gone1 && document.visibilityState === 'visible') location.href = back1; }, 1200);
              return;
            }
          }
        }
      } catch (er) {}
      var extra = fromBF ? 0 : history.length - L0;
      if (extra > 0) {
        var gone0 = false;
        window.addEventListener('pagehide', function () { gone0 = true; }, { once: true });
        history.go(-(extra + 1));
        setTimeout(function () { if (!gone0 && document.visibilityState === 'visible') location.href = document.referrer; }, 1200);
        return;
      }
      /* Nov 3 (Toby: back on a post "gets stuck" behind a dimmed page):
         history.back() can land on a step inside this same page (a sheet,
         a #link, a step the browser kept) and never leave. If that happens,
         or nothing has left after a moment, go to the page we came from. */
      var gone = false, tries = 0;
      function away() { gone = true; }
      function stay() {
        if (gone) return;
        if (tries++ < 3) { history.back(); return; }
        location.href = document.referrer;
      }
      window.addEventListener('pagehide', away, { once: true });
      window.addEventListener('popstate', function pop() { setTimeout(stay, 60); });
      history.back();
      setTimeout(function () { if (!gone && document.visibilityState === 'visible') location.href = document.referrer; }, 1200);
    });
    bar.querySelector('.hb-home').addEventListener('click', function (e) { if (de.classList.contains('hx-leaving')) e.preventDefault(); else { ls('hutch-home-tip', '9'); leaving(this); } });
    /* first few app opens: a small "Home" bubble under the rabbit, until
       the reader has used it once */
    var tipN = +(ls('hutch-home-tip') || 0);
    if (tipN < 3 && !isEmbed) {
      ls('hutch-home-tip', String(tipN + 1));
      var tip = el('<div class="hb-tip" role="status">Tap the bunny for Home</div>');
      bar.appendChild(tip);
      setTimeout(function () { tip.classList.add('on'); }, 500);
      setTimeout(function () { tip.classList.remove('on'); setTimeout(function () { tip.remove(); }, 400); }, 4500);
      tip.addEventListener('click', function () { tip.remove(); });
    }
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
    function syncBar() { var c = hex(getComputedStyle(bar).backgroundColor); if (c) setBarColor(c); }
    syncBar();
    requestAnimationFrame(syncBar);
    setTimeout(syncBar, 400);
    if (window.MutationObserver) new MutationObserver(function () { requestAnimationFrame(syncBar); })
      .observe(de, { attributes: true, attributeFilter: ['class', 'style'] });
    bar.addEventListener('transitionend', syncBar);

    var mod = window.HutchApps && window.HutchApps[k];
    if (mod && !isBlogApp) {
      try {
        mod({
          key: k, app: a, bar: bar, page: PAGE, data: J('hutch-app-data'), path: path,
          ic: ic, esc: esc, el: el, ls: ls, phase: PHASE, dark: DARK, calm: calm,
          own: function () { de.classList.add('hutch-own'); }, /* hide the Traditional page */
          openSheet: openSheet, closeSheet: closeSheet,
          swipe: addSwipe, /* the same older / newer swipe as posts (Nov 3) */
          arrows: addArrows
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
      /* a Watch Log reads as a short list: the week, then each show with its episodes (Nov 3) */
      var wl = x.wl && x.wl.it && x.wl.it.length ? '<div class="hbl-wl"><b>🍿 Watch Log</b>' + (x.wl.h ? '<small>' + esc(x.wl.h) + '</small>' : '') + '<ul>' +
        x.wl.it.slice(0, 5).map(function (w) { return '<li><span class="t">' + esc(w.t) + '</span>' + (w.e ? '<span class="e">' + esc(w.e) + '</span>' : '') + '</li>'; }).join('') +
        (x.wl.it.length > 5 ? '<li class="more">+' + (x.wl.it.length - 5) + ' more</li>' : '') + '</ul></div>' : '';
      if (x.m) return '<a class="' + cls + '" href="' + esc(x.u) + '" data-i="' + i + '"><div class="hbl-tx"><span class="fl" aria-hidden="true">❧</span><div class="hbl-mb"><div class="hbl-k">' + esc(x.d) + ' · ' + esc(x.tm) + '</div>' + (wl || '<p>' + esc(x.x) + '</p>') +
        (x.img ? '<img class="mimg" src="' + esc(x.img) + '" alt="" loading="lazy" decoding="async">' : '') + '</div></div></a>';
      return '<a class="' + cls + '" href="' + esc(x.u) + '" data-i="' + i + '">' + (x.img ? '<img class="hero" src="' + esc(x.img) + '" alt="" loading="' + (i < 3 ? 'eager' : 'lazy') + '" decoding="async">' : '') +
        '<div class="hbl-tx"><div class="hbl-k">' + esc(x.d) + (x.c ? ' · ' + esc(x.c) : '') + '</div><h3>' + esc(x.t) + '</h3>' +
        /* card posts carry a clean line (hutch-home-data.html); reviews show their stars */
        (x.rs ? '<p class="hbl-rv"><span class="st">' + esc(x.rs) + '</span>' + esc(x.x.replace(x.rs, '').replace(/^\s*·\s*/, '')) + '</p>' : x.x ? '<p>' + esc(x.x) + '</p>' : '') +
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
      /* Nov 3 (Toby: back needed two or three taps): changing an iframe's
         src adds a step to the browser's back list, so back walked through
         every post shown in the pane before leaving. replace() swaps the
         post without adding a step. */
      if (!f.getAttribute('src')) f.setAttribute('src', x.u);
      else if (f.getAttribute('data-u') !== x.u) { try { f.contentWindow.location.replace(x.u); } catch (er) { f.setAttribute('src', x.u); } }
      f.setAttribute('data-u', x.u);
      bar.classList.remove('titled');
      bar.querySelector('.hb-title').textContent = x.t || (x.d + ' · ' + x.tm);
      bar.querySelector('.hb-prog').style.width = '0';
      if (typeof paneArrows !== 'undefined' && paneArrows) paneArrows.refresh();
    }
    /* desktop / unfolded sideways: arrows on the post pane and the ← →
       keys step through the list (newer / older), the same as the swipe
       on a phone (Nov 3) */
    function shown() { return TL.filter(function (x) { return filter === 'all' || (filter === 'micro' ? x.m : !x.m); }); }
    function nb(d) { var L = shown(), i = -1; for (var j = 0; j < L.length; j++) if (L[j].u === sel) { i = j; break; } return i < 0 ? null : L[i - d] || null; }
    right.style.position = 'relative';
    var paneArrows = addArrows({
      host: right,
      active: function () { return two(); },
      has: function (d) { return two() && !!nb(d); },
      go: function (d) {
        var x = nb(d); if (!x) return;
        openInPane(x);
        var c = list.querySelector('.hbl-it.sel'); if (c) c.scrollIntoView({ block: 'nearest', behavior: calm ? 'auto' : 'smooth' });
      },
      label: function (d) { var x = nb(d); return (d < 0 ? 'Older · ' : 'Newer · ') + (x ? (x.t || (x.d + ' · ' + x.tm)) : ''); }
    });
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
      if (paneArrows) paneArrows.refresh();
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
    /* back from swiping through posts (Nov 3): the list scrolls to the
       post you ended on and lights it up for a moment */
    function showLast() {
      var u = null; try { u = sessionStorage.getItem('hutch-lastpost'); sessionStorage.removeItem('hutch-lastpost'); } catch (e) {}
      if (!u) return;
      var c = list.querySelector('.hbl-it[href="' + u.replace(/"/g, '') + '"]');
      if (!c) return;
      c.scrollIntoView({ block: 'center' });
      c.classList.add('hl'); setTimeout(function () { c.classList.remove('hl'); }, 2400);
    }
    showLast();
    window.addEventListener('pageshow', function (e) { if (e.persisted) showLast(); });
    /* new posts arrive without a refresh (Nov 3): the timeline is redrawn
       from the newer copy and stays on the post you were looking at */
    window.hutchBlogFresh = function (tl) {
      if (!tl || !tl.length) return;
      var top = null, off = 0, cards = list.querySelectorAll('.hbl-it');
      for (var i = 0; i < cards.length; i++) { var r = cards[i].getBoundingClientRect(); if (r.bottom > 70) { top = cards[i].getAttribute('href'); off = r.top; break; } }
      TL = tl; render();
      if (top) { var c = list.querySelector('.hbl-it[href="' + top.replace(/"/g, '') + '"]'); if (c) { var sc = two() ? left : null, d = c.getBoundingClientRect().top - off; if (sc) sc.scrollTop += d; else window.scrollBy(0, d); } }
    };
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
      else if (postLike && !a.target && u.pathname !== location.pathname) { e.preventDefault(); location.replace(u.href); }
    });
  }

  /* ---------- save posts ahead as they come into view (Nov 3) ----------
     Toby: tapping a post in the Blog list took 1-2 seconds. Only the home
     screen's apps and a post's neighbours were saved on the phone ahead
     of time, so a post picked from a list waited on Micro.blog. Now, in
     every app (Blog, Archive, Den, Calendar, Word Nerd, Photos...), post
     links that come into view are handed to the page helper a few at a
     time to save ahead, up to 40 per screen, so a tap opens at once.
     Skipped when the phone is in data saver mode or on a slow (2G)
     connection. */
  function warmLinks() {
    if (!swOK || !window.IntersectionObserver) return;
    var cn = navigator.connection;
    if (cn && (cn.saveData || /2g/.test(cn.effectiveType || ''))) return;
    var seen = {}, queue = [], sent = 0, MAX = 40, t = null;
    seen[location.pathname] = 1;
    function flush() {
      t = null;
      var batch = queue.splice(0, 6);
      if (!batch.length) return;
      sent += batch.length;
      navigator.serviceWorker.ready.then(function (reg) { if (reg.active) reg.active.postMessage({ type: 'hutch-preload', urls: batch }); }).catch(function () {});
      if (queue.length) t = setTimeout(flush, 700);
    }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        var u; try { u = new URL(en.target.href, location.href); } catch (e) { return; }
        if (u.origin !== location.origin || !isPostURL(u.href) || seen[u.pathname] || sent + queue.length >= MAX) return;
        seen[u.pathname] = 1; queue.push(u.pathname);
        if (!t) t = setTimeout(flush, 350);
      });
    }, { rootMargin: '200px 0px' });
    function scan(root) { [].forEach.call((root || document).querySelectorAll('a[href]'), function (a) { if (!a.__hw) { a.__hw = 1; io.observe(a); } }); }
    scan();
    /* lists drawn or redrawn later (filters, new posts, tabs, open cards) */
    var pend = false;
    if (window.MutationObserver) new MutationObserver(function () { if (pend) return; pend = true; setTimeout(function () { pend = false; scan(); }, 300); }).observe(document.body, { childList: true, subtree: true });
  }

  /* ---------- back to top (Nov 3, Toby) ----------
     A small round up arrow in the bottom right corner (above Surprise me
     on posts), on every app screen that can
     get long (posts, the Blog list, Archive, Den, Word Nerd...). It shows
     once you're about a screen down and stays there, scrolling up or
     down, until you're back near the top (Toby). When Surprise me tucks
     away while scrolling down, it drops into the corner. It takes you to
     the top of whatever you were scrolling (the page, or a pane that
     scrolls on its own, like the Blog list or a Word Nerd card). */
  function topButton() {
    var b = el('<button type="button" class="hx-top" aria-label="Back to top" title="Back to top">' + ic('up', 2.6) + '</button>');
    document.body.appendChild(b);
    var cur = null;
    function y(t) { return t === document || t === de || t === document.body ? (window.scrollY || de.scrollTop) : t.scrollTop; }
    function h(t) { return t === document || t === de || t === document.body ? window.innerHeight : t.clientHeight; }
    document.addEventListener('scroll', function (e) {
      var t = e.target; if (t.nodeType !== 1 && t !== document) return;
      if (t !== document && (t.closest && t.closest('.hx-sheet'))) return;
      /* Nov 3 (Toby): once you're about a screen down it stays, scrolling
         up or down, and goes away only back near the top */
      var now = y(t);
      if (now > h(t) * 0.9) { cur = t; b.classList.add('on'); }
      else if (now < h(t) * 0.4 && (cur === t || !cur)) b.classList.remove('on');
    }, { passive: true, capture: true });
    b.addEventListener('click', function () {
      var t = cur || document;
      if (t === document || t === de || t === document.body) window.scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' });
      else t.scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' });
      b.classList.remove('on');
    });
  }

  /* ---------- arrows for older / newer on desktop (Nov 3, Toby) ----------
     A mouse can't swipe, so on a computer a post gets a quiet arrow on
     each side, carousel style: left = newer, right = older (the same as
     the swipe). Hovering shows where it goes ("Older · title"). The ← and
     → keys do the same anywhere (not while typing). Touch screens keep the
     swipe and don't get the arrows.
     opts: has(dir), go(dir), label(dir); dir 1 = newer, -1 = older.
     host: where the arrows sit (default: the window's edges);
     buttons: false for keys only; active(): keys count only while yes. */
  var FINE = !!(window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches);
  function addArrows(opts) {
    var btns = [];
    if (opts.buttons !== false && FINE) {
      [['l', 1], ['r', -1]].forEach(function (p) {
        var b = el('<button type="button" class="hx-arr ' + p[0] + '">' + ic(p[0] === 'l' ? 'back' : 'fwd', 2.4) + '<span class="tip"></span></button>');
        b.addEventListener('click', function () { if (opts.has(p[1])) opts.go(p[1]); });
        (opts.host || document.body).appendChild(b);
        btns.push([b, p[1]]);
      });
    }
    function refresh() {
      btns.forEach(function (p) {
        var on = opts.has(p[1]); p[0].hidden = !on;
        if (on) { var t = opts.label(p[1]); p[0].setAttribute('aria-label', t); p[0].querySelector('.tip').textContent = t; }
      });
    }
    refresh();
    document.addEventListener('keydown', function (e) {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || openSheetEl) return;
      var t = e.target;
      if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return;
      if (opts.active && !opts.active()) return;
      /* J and K too, like Gmail and most readers (Nov 3, Toby): J = next
         (older), K = previous (newer) */
      var d = e.key === 'ArrowLeft' || e.key === 'k' ? 1 : e.key === 'ArrowRight' || e.key === 'j' ? -1 : 0;
      if (!d || !opts.has(d)) return;
      e.preventDefault(); opts.go(d);
    });
    return { refresh: refresh };
  }

  /* ---------- swipe for older / newer (posts, Word Nerd cards) ----------
     Nov 3 (Toby): one swipe that works the same everywhere you read one
     thing at a time. Finger to the left = older, to the right = newer.
       - Only a clear sideways swipe counts: it has to start away from the
         screen edges (Android's own back swipe lives there) and move
         mostly sideways. Scrolling never triggers it; anything under the
         finger that can really scroll sideways keeps its own swipe.
       - While dragging, a quiet round arrow slides in from that side and
         turns orange past the line. Let go there and it goes; let go
         early and nothing happens.
     opts: has(dir) is there something that way? go(dir) go there;
     active() optional, swipes count only while it says yes. */
  var peekEls = null;
  function addSwipe(opts) {
    var W = function () { return window.innerWidth; };
    if (!peekEls) {
      peekEls = { r: el('<div class="hx-peek r" aria-hidden="true">' + ic('fwd', 2.4) + '</div>'), l: el('<div class="hx-peek l" aria-hidden="true">' + ic('back', 2.4) + '</div>') };
      document.body.appendChild(peekEls.r); document.body.appendChild(peekEls.l);
    }
    var peekR = peekEls.r, peekL = peekEls.l;
    function line() { return Math.min(130, W() * 0.3); }
    function place(pk, px, anim) {
      if (!pk) return;
      pk.style.transition = anim ? 'transform .25s cubic-bezier(.2,.8,.2,1), opacity .25s, background-color .15s' : 'background-color .15s';
      var k = Math.max(0, Math.min(1, px / line())), x = -60 + 76 * k;
      pk.style.transform = pk.classList.contains('r') ? 'translate(' + (-x) + 'px,-50%)' : 'translate(' + x + 'px,-50%)';
      pk.style.opacity = px > 4 ? String(0.35 + 0.65 * k) : '0';
      pk.classList.toggle('go', px >= line());
    }
    /* stands down only when the thing under the finger can really scroll
       sideways that way, by more than a sliver (a review card a few
       pixels too wide used to block it, Nov 3) */
    var scrollers = [];
    function findScrollers(t) {
      var out = [];
      for (var e = t; e && e !== document.body && e !== de; e = e.parentElement) {
        if (/^(INPUT|TEXTAREA|SELECT|VIDEO|IFRAME)$/.test(e.tagName)) return null;
        if (e.scrollWidth > e.clientWidth + 24) { var o = getComputedStyle(e).overflowX; if (o === 'auto' || o === 'scroll') out.push(e); }
      }
      return out;
    }
    function canScroll(dir) {
      for (var i = 0; i < scrollers.length; i++) {
        var e = scrollers[i], max = e.scrollWidth - e.clientWidth;
        if (dir < 0 ? e.scrollLeft < max - 2 : e.scrollLeft > 2) return true;
      }
      return false;
    }
    var x0 = 0, y0 = 0, mode = null, dx = 0, EDGE = 28;
    document.addEventListener('touchstart', function (e) {
      mode = null; dx = 0;
      if (e.touches.length !== 1 || openSheetEl || de.classList.contains('hx-leaving') || (opts.active && !opts.active(e.target))) { mode = 'off'; return; }
      var t = e.touches[0]; x0 = t.clientX; y0 = t.clientY;
      scrollers = findScrollers(e.target);
      if (!scrollers || x0 < EDGE || x0 > W() - EDGE || (window.getSelection && String(window.getSelection()).length)) mode = 'off';
    }, { passive: true });
    document.addEventListener('touchmove', function (e) {
      if (mode === 'off' || mode === 'v') return;
      var t = e.touches[0], mx = t.clientX - x0, my = t.clientY - y0;
      if (!mode) {
        if (Math.abs(my) > 10 && Math.abs(my) > Math.abs(mx)) { mode = 'v'; return; }
        if (Math.abs(mx) > 14 && Math.abs(mx) > Math.abs(my) * 1.8) mode = canScroll(mx) || !opts.has(mx < 0 ? -1 : 1) ? 'off' : 'h'; else return;
        if (mode === 'off') return;
      }
      dx = mx;
      var pk = dx < 0 ? peekR : peekL, other = dx < 0 ? peekL : peekR;
      if (!opts.has(dx < 0 ? -1 : 1)) { place(pk, 0, false); place(other, 0, false); return; }
      e.preventDefault();
      place(pk, Math.abs(dx) * 0.9, false); place(other, 0, false);
    }, { passive: false });
    function end() {
      if (mode !== 'h') { mode = null; return; }
      mode = null;
      var dir = dx < 0 ? -1 : 1, pk = dir < 0 ? peekR : peekL;
      if (opts.has(dir) && Math.abs(dx) * 0.9 >= line()) {
        ls('hutch-swipe-tip', '9');
        place(pk, 9999, true);
        opts.go(dir);
        setTimeout(function () { place(peekR, 0, true); place(peekL, 0, true); }, 220);
      } else { place(peekR, 0, true); place(peekL, 0, true); }
      dx = 0;
    }
    document.addEventListener('touchend', end, { passive: true });
    document.addEventListener('touchcancel', end, { passive: true });
    window.addEventListener('pageshow', function () { place(peekR, 0, false); place(peekL, 0, false); });
    return { place: place, peekR: peekR, peekL: peekL, busy: function () { return !!mode; } };
  }

  /* ---------- single posts: swipe for older / newer, Surprise me ----------
     Nov 3 (Toby). Swipe left = older post, swipe right = newer post
     (titled posts by date, from partials/hutch-data/post.html).
       - Only a clear sideways swipe counts: it has to start away from the
         screen edges (Android's own back swipe lives there) and move
         mostly sideways. Scrolling never triggers it; photo mosaics,
         wide tables and code that scroll sideways keep their own swipe.
       - While dragging, a small round arrow slides in from the side and
         turns orange past the line. Let go there and it opens; let go
         early and nothing happens.
       - Swiping replaces the page instead of adding a step, so back goes
         straight to the app you came from.
       - The first two posts someone opens show a one-time nudge: the
         arrow peeks in and back, with "Swipe for older and newer
         posts". Never again once they've swiped.
       - Both neighbours are saved ahead, so they open at once.
     Surprise me: a round shuffle button, bottom right, in the Surprise
     app's gold. It tucks away while scrolling down and comes back when
     scrolling up or at the end of the post. */
  function postExtras() {
    var N = J('hutch-app-data') || {}, older = N.o && N.o.u ? N.o : null, newer = N.n && N.n.u ? N.n : null;
    var W = function () { return window.innerWidth; };

    /* Surprise me */
    var fab = el('<a class="hx-fab" href="' + (APPS.surprise[2] || '/surprise-me/') + '" aria-label="Surprise me: a random post" title="Surprise me">' + ic('surprise') + '</a>');
    document.body.appendChild(fab);
    de.classList.add('hx-hasfab');
    var lastY = window.scrollY, hideT;
    window.addEventListener('scroll', function () {
      var y = window.scrollY, end = y + window.innerHeight >= document.documentElement.scrollHeight - 140;
      if (end || y < lastY - 6 || y < 80) fab.classList.remove('away'); else if (y > lastY + 6) fab.classList.add('away');
      /* the back-to-top button drops into the corner while Surprise me is tucked away */
      de.classList.toggle('hx-fab-away', fab.classList.contains('away'));
      lastY = y;
    }, { passive: true });

    /* the "All posts" row of Keep reading at the bottom goes to the same
       posts as the swipe (Nov 3, Toby): micros and Watchlist cards are
       skipped there too. Hutch only; the Traditional theme is untouched. */
    var allRow = document.querySelector('.kr-row--all');
    /* "All posts" opens the Blog list, this post lit (Nov 3, Toby: "people
       don't know they can tap Blog to go back to the list") */
    var allLink = allRow && allRow.querySelector('.kr-row-cat a');
    if (allLink) {
      allLink.href = APPS.blog[2];
      allLink.addEventListener('click', function () { try { sessionStorage.setItem('hutch-lastpost', location.pathname); } catch (er) {} });
    }
    if (allRow) {
      var mk = function (cls, k, x) { return '<a class="' + cls + '" href="' + esc(x.u) + '"><span class="kr-row-k">' + k + '</span><span class="kr-row-v">' + esc(x.t) + '</span></a>'; };
      [].forEach.call(allRow.querySelectorAll('.kr-row-prev, .kr-row-next, .kr-row-gap'), function (n) { n.remove(); });
      allRow.insertAdjacentHTML('beforeend', (older ? mk('kr-row-prev', '← Older', older) : '<span class="kr-row-gap" aria-hidden="true"></span>') + (newer ? mk('kr-row-next', 'Newer →', newer) : ''));
      if (!older && !newer) allRow.remove();
    }
    if (!older && !newer) return;
    /* save both neighbours ahead */
    if (swOK) navigator.serviceWorker.ready.then(function (reg) { if (reg.active) reg.active.postMessage({ type: 'hutch-preload', urls: [older, newer].filter(Boolean).map(function (x) { return x.u; }) }); }).catch(function () {});

    var sw = addSwipe({
      has: function (dir) { return !!(dir < 0 ? older : newer); },
      go: function (dir) {
        var x = dir < 0 ? older : newer;
        leaving();
        try { sessionStorage.setItem('hutch-lastpost', x.u); } catch (er) {}
        /* replace, not a new step: back (the arrow or Android's edge
           swipe) goes straight to the app you started from, however many
           posts you swiped through (Nov 3, Toby) */
        location.replace(x.u);
      }
    });
    var place = sw.place, peekR = older ? sw.peekR : null, peekL = newer ? sw.peekL : null, mode = null;
    /* desktop: the same thing as arrows and the ← → keys */
    addArrows({
      has: function (d) { return !!(d < 0 ? older : newer); },
      go: function (d) {
        var x = d < 0 ? older : newer; leaving();
        try { sessionStorage.setItem('hutch-lastpost', x.u); } catch (er) {}
        location.replace(x.u);
      },
      label: function (d) { var x = d < 0 ? older : newer; return (d < 0 ? 'Older · ' : 'Newer · ') + x.t; }
    });

    /* one-time nudge: first two posts on a touch screen */
    var n = +(ls('hutch-swipe-tip') || 0), touch = window.matchMedia && matchMedia('(pointer: coarse)').matches;
    if (n < 2 && touch && !calm) {
      ls('hutch-swipe-tip', String(n + 1));
      var demo = peekR || peekL;
      setTimeout(function () {
        if (sw.busy() || window.scrollY > 200) return;
        var tip = el('<div class="hx-swipetip" role="status">' + ic('back') + '<span>Swipe for older and newer posts</span>' + ic('fwd') + '</div>');
        document.body.appendChild(tip);
        requestAnimationFrame(function () { tip.classList.add('on'); });
        place(demo, 70, true);
        setTimeout(function () { place(demo, 0, true); }, 900);
        setTimeout(function () { tip.classList.remove('on'); setTimeout(function () { tip.remove(); }, 400); }, 4200);
      }, 1400);
    }
  }

  /* (Nov 2) An app-launch animation was tried here and taken out at
     Toby's request; apps simply open. */

  /* ---------- the page helper (static/hutch-sw.js) ----------
     Nov 2 (Toby: "any app I tap opens slowly"). It keeps a copy of each
     page on the phone and opens that copy at once. Here Hutch turns it
     on, asks it to save the home screen's apps ahead of time, and after
     a page opens from a saved copy, quietly fetches the fresh one and
     offers "New posts · Refresh" if anything changed. */
  var SW_CACHE = 'hutch-pages-v2';
  var swOK = 'serviceWorker' in navigator && 'caches' in window && (location.protocol === 'https:' || location.hostname === 'localhost');
  if (swOK && !de.classList.contains('hutch-embed')) {
    try { navigator.serviceWorker.register('/hutch-sw.js', { scope: '/' }).catch(function () {}); } catch (e) { swOK = false; }
  }
  function preload() {
    if (!swOK || !homeEl) return;
    var urls = [].map.call(homeEl.querySelectorAll('a[href^="/"]'), function (a) { return a.getAttribute('href').split('#')[0]; })
      .filter(function (u, i, all) { return u && all.indexOf(u) === i; }).slice(0, 16);
    navigator.serviceWorker.ready.then(function (reg) { if (reg.active) reg.active.postMessage({ type: 'hutch-preload', urls: urls }); }).catch(function () {});
  }
  /* strip what changes on every site rebuild without the page changing
     (cache-busting numbers), so only real changes count */
  /* Only what the app actually shows counts (Nov 3, Toby: every app was
     asking to refresh): the page's main content and its Hutch app data.
     The side rail, footer and header carry site-wide bits (latest posts,
     counts) that change on every new post and would make every page look
     "new". */
  function norm(t) {
    t = String(t || '');
    var m = t.match(/<main\b[^>]*id="main-content"[\s\S]*?<\/main>/);
    var j = t.match(/<script[^>]*id="hutch-(?:app|home)-data"[^>]*>[\s\S]*?<\/script>/g) || [];
    return ((m ? m[0] : t) + j.join('')).replace(/\?\d{9,11}\b/g, '').replace(/\s+/g, ' ');
  }
  function freshCheck() {
    if (!swOK || isEmbed || /[?&](hutch|sky|season|fonts)=/.test(location.search)) return;
    var k = location.href.split('#')[0];
    caches.open(SW_CACHE).then(function (c) {
      return c.match(k).then(function (hit) {
        var was = hit ? hit.text() : Promise.resolve(null);
        return was.then(function (old) {
          return fetch(k, { cache: 'no-store', credentials: 'same-origin' }).then(function (res) {
            if (!res.ok || !/text\/html/i.test(res.headers.get('content-type') || '')) return;
            return res.clone().text().then(function (fresh) {
              c.put(k, res);
              /* tell the page helper the newest theme build, so every saved
                 page loads the newest theme files from now on */
              try { if (navigator.serviceWorker.controller) navigator.serviceWorker.controller.postMessage({ type: 'hutch-learn', text: fresh.slice(0, 60000) }); } catch (e) {}
              if (old !== null && norm(old) !== norm(fresh)) gotFresh(fresh);
            });
          });
        });
      });
    }).catch(function () {});
  }
  /* Fully automatic (Nov 3, Toby: "it should be automatic, as I
     asked"): no chip, no tap.
       - Not touched yet (no scroll, tap or key): the newer copy loads
         at once. It is already saved, so it is instant.
       - Already reading in the Blog app: new posts slide into the
         timeline where they belong, and you stay where you were.
       - Already reading anything else: nothing moves under you; the
         newer copy is saved and shows next time.
     At most one automatic reload a minute per page, so a page that never
     matches can't keep reloading. */
  var touched = false;
  ['scroll', 'pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { window.addEventListener(ev, function () { touched = true; }, { passive: true, once: true }); });
  function gotFresh(fresh) {
    var key = 'hutch-auto:' + location.pathname + location.search, last = 0;
    try { last = +(sessionStorage.getItem(key) || 0); } catch (e) {}
    if (!touched && !openSheetEl && Date.now() - last > 60000) {
      try { sessionStorage.setItem(key, String(Date.now())); } catch (e) {}
      location.reload(); return;
    }
    if (window.hutchBlogFresh) {
      var m = fresh.match(/<script[^>]*id="hutch-home-data"[^>]*>([\s\S]*?)<\/script>/);
      if (m) { try { window.hutchBlogFresh(JSON.parse(m[1]).tl); } catch (e) {} }
    }
  }

  /* ---------- go ---------- */
  var isEmbed = de.classList.contains('hutch-embed');
  var isBlogApp = !isEmbed && path === '/' && /[?&]app=blog\b/.test(location.search) && HOME && HOME.tl && HOME.tl.length > 0;
  if (isEmbed) buildEmbed();
  else if (isHome && HOME) { buildHome(); boot(false); setTimeout(preload, 1500); }
  else { if (isHome) { de.classList.remove('hutch-hs'); de.classList.add('hutch-app'); } buildFrame(); if (isBlogApp) buildBlog(); else if (PAGE.type === 'post' && PAGE.kind === 'page' && PAGE.title) postExtras(); topButton(); if (!(PAGE.type === 'post' && PAGE.kind === 'page')) setTimeout(warmLinks, 600); }

  de.classList.add('hutch-ready'); /* lets hutch.css show the page if no app took it over */

  /* Night safety net (Nov 3, Toby: the Follow page's white signup box had
     white words at night). A page's own boxes can keep a light background
     while the night theme turns words light. Any words that end up nearly
     invisible on what is behind them get a readable color instead. Only
     at night or dusk, once the page is up. */
  function readable(root) {
    if (!root || !window.getComputedStyle) return;
    function rgb(c) { var m = String(c).match(/[\d.]+/g); if (!m || m.length < 3) return null; return { r: +m[0], g: +m[1], b: +m[2], a: m.length > 3 ? +m[3] : 1 }; }
    function L(c) { var f = function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); }
    function bgL(e) { for (; e && e.nodeType === 1; e = e.parentElement) { var c = rgb(getComputedStyle(e).backgroundColor); if (c && c.a > 0.5) return L(c); } return DARK ? 0.01 : 1; }
    var els = root.querySelectorAll('*'), n = 0;
    for (var i = 0; i < els.length && n < 3000; i++) {
      var e = els[i]; n++;
      if (/^(SCRIPT|STYLE|SVG|PATH|IMG|VIDEO|IFRAME|INPUT|SELECT|TEXTAREA|BR|HR)$/i.test(e.tagName)) continue;
      var own = false;
      for (var k = e.firstChild; k; k = k.nextSibling) if (k.nodeType === 3 && k.nodeValue.trim()) { own = true; break; }
      if (!own) continue;
      var cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      var fc = rgb(cs.color); if (!fc || fc.a < 0.3) continue;
      var b = bgL(e), f = L(fc), ratio = (Math.max(b, f) + 0.05) / (Math.min(b, f) + 0.05);
      if (ratio < 2.2) e.style.setProperty('color', b > 0.4 ? '#1E2D4A' : '#F3EDE4', 'important');
    }
  }
  if (DARK && !isHome) {
    var runReadable = function () { readable(document.querySelector('.hx-sm-doc') || (de.classList.contains('hutch-own') || de.classList.contains('hutch-blog') ? null : document.getElementById('main-content'))); };
    if (window.requestIdleCallback) requestIdleCallback(runReadable, { timeout: 1500 }); else setTimeout(runReadable, 300);
  }
  if (document.readyState === 'complete') setTimeout(freshCheck, 1200);
  else window.addEventListener('load', function () { setTimeout(freshCheck, 1200); });
  window.hutch = { openSearch: openSearch, openDrawer: openDrawer, openSettings: openSettings, phase: PHASE, boot: function () { boot(true); } };
})();
