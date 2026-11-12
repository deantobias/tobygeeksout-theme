/* HUTCH OS app modules (Nov 2, 2026). Loaded before hutch.js only when Hutch is on.
   Each app registers HutchApps.<key> = function (ctx) { ... }. Built from static/js/apps/. */
window.HutchApps = window.HutchApps || {};

/* ------------------------------------------------------------------
   ARCHIVE app (Hutch OS, Nov 2, 2026, mockup v33)
   A Files-style first screen: every category is a folder with its post
   count, plus "All posts" (the Traditional archive, by year and month).
   Opening a folder shows the magazine-contents page (masthead, stats
   dateline, newest post as the feature, then contents rows with leader
   dots) inside the app. Word of the Day, Photos and the review
   categories open their own apps instead.
   Phone + unfolded portrait: folders, a folder slides in over them
   (Android back closes it). Landscape: folder list left, folder right.
   Data: #hutch-app-data from partials/hutch-data/archive.html, written
   into list.archivehtml.html. Category pages (/categories/x/) keep the
   Traditional page.
   ------------------------------------------------------------------ */
(function () {
  window.HutchApps = window.HutchApps || {};
  HutchApps.archive = function (ctx) {
    if (ctx.path.indexOf('/archive') !== 0) return; /* /categories/x/ stays Traditional */
    var D = ctx.data;
    if (!D || !D.years || !D.years.length || !D.cats) return;
    var esc = ctx.esc;
    var MN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    var C = ['#C4622D', '#1E2D4A', '#5B7A8C', '#7A8F6A', '#7C5A7A', '#D9A441', '#8C6A4F', '#3E7C7A'];
    var IC = {
      folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
      all: '<rect x="3" y="4" width="18" height="5" rx="1.5"/><path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9 M10 13h4"/>',
      arrow: '<path d="M7 17L17 7 M9 7h8v8"/>',
      search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
      cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18 M8 3v4 M16 3v4"/>'
    };
    function ic(k) { return IC[k] ? '<svg class="hx-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IC[k] + '</svg>' : ctx.ic(k); }
    function dt(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
    function short(s) { var d = dt(s); return MN[d.getMonth()].slice(0, 3) + ' ' + d.getDate(); }
    function long(s) { var d = dt(s); return MN[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear(); }

    /* ---------- posts, flat, newest first ---------- */
    var POSTS = [];
    D.years.forEach(function (y) { y.months.forEach(function (m) { m.p.forEach(function (p) { p.y = y.y; p.m = m.m; POSTS.push(p); }); }); });
    POSTS.sort(function (a, b) { return a.d < b.d ? 1 : a.d > b.d ? -1 : 0; });
    var MCOUNT = {};
    D.years.forEach(function (y) { y.months.forEach(function (m) { MCOUNT[y.y + ' ' + m.m] = m.n; }); });

    /* ---------- folders ---------- */
    var APPF = { 'word of the day': ['Word Nerd', 'words', '/categories/word-of-the-day/'], 'photos': ['Photos', 'photos', '/photo/'],
      'movie reviews': ['Den', 'den', '/watching/'], 'tv reviews': ['Den', 'den', '/watching/'], 'book reviews': ['Den', 'den', '/watching/'] };
    var PRI = ['spotlight', 'blaugust', 'blogging', 'technology', 'personal', 'ai'];
    function pri(n) { n = n.toLowerCase(); for (var i = 0; i < PRI.length; i++) if (n === PRI[i] || (PRI[i] === 'blaugust' && n.indexOf('blaugust') === 0)) return i; return 99; }
    var FOLDERS = D.cats.map(function (c, i) {
      var a = APPF[String(c.n).toLowerCase()];
      return { id: 'c' + i, ci: i, n: String(c.n), c: c.c || 0, l: c.l || '', u: c.u, f: c.f, fs: c.fs, fi: c.fi, app: a ? a[0] : '', ai: a ? a[1] : '', au: a ? a[2] : '' };
    }).filter(function (f) { return f.c > 0; });
    FOLDERS.sort(function (a, b) {
      var pa = pri(a.n), pb = pri(b.n);
      if (pa !== pb) return pa - pb;
      if (pa === 1 && pb === 1) return a.n < b.n ? 1 : -1; /* newest Blaugust first */
      return b.c - a.c || (a.n.toLowerCase() < b.n.toLowerCase() ? -1 : 1);
    });
    FOLDERS.forEach(function (f, i) { f.col = C[(i + 1) % C.length]; });
    var ALL = { id: 'all', n: 'All posts', c: D.total || POSTS.length, l: POSTS[0].d, all: true, col: C[0], f: POSTS[0].u };
    var BYID = {}; FOLDERS.concat([ALL]).forEach(function (f) { BYID[f.id] = f; });
    var RECENT = FOLDERS.slice().sort(function (a, b) { return a.l < b.l ? 1 : a.l > b.l ? -1 : 0; }).slice(0, 4);

    function fic(f, big) {
      return '<span class="' + (big ? 'ar-big' : 'ar-fi') + '" style="--fc:' + f.col + '">' + ic(f.all ? 'all' : (f.ai || 'folder')) + '</span>';
    }

    /* ---------- folder page (magazine contents) ---------- */
    function postsFor(f) { return f.all ? POSTS : POSTS.filter(function (p) { return p.c && p.c.indexOf(f.ci) > -1; }); }
    function catHTML(f) {
      var ps = postsFor(f);
      if (!ps.length) return '<div class="ar-mag"><div class="ar-mast" role="heading" aria-level="2">' + esc(f.n) + '</div><p class="ar-nada">Nothing here yet.</p></div>';
      var first = ps[0], since = ps[ps.length - 1].d.slice(0, 4);
      var feat = ps[0], fs = f.all ? feat.s : (f.fs || feat.s), img = f.all ? '' : f.fi;
      var h = '<div class="ar-mag"><div class="ar-mast" role="heading" aria-level="2">' + esc(f.n) + '</div>' +
        '<div class="ar-dateline"><b>' + ps.length + (ps.length === 1 ? ' post' : ' posts') + '</b> · since ' + since + ' · latest ' + short(first.d) + '</div>' +
        '<a class="ar-feat" href="' + esc(feat.u) + '">' + (img ? '<img class="ar-img" src="' + esc(img) + '" alt="" loading="lazy" decoding="async">' : '') +
        '<div class="ar-k">' + (f.all ? 'Newest post · ' : 'Latest in ' + esc(f.n) + ' · ') + short(feat.d) + '</div>' +
        '<div role="heading" aria-level="3" class="ar-h' + (feat.t ? '' : ' ar-untitled') + '">' + esc(feat.t || long(feat.d)) + '</div>' + (fs ? '<p>' + esc(fs) + '</p>' : '') + '</a>';
      var cy = null, cm = null;
      for (var i = 1; i < ps.length; i++) {
        var p = ps[i];
        if (f.all) {
          if (p.y !== cy) { cy = p.y; cm = null; h += '<div class="ar-year ar-ybig" role="heading" aria-level="3">' + esc(p.y) + '</div>'; }
          if (p.m !== cm) { cm = p.m; h += '<div class="ar-year ar-mo" role="heading" aria-level="4">' + esc(p.m) + '<span>' + (MCOUNT[p.y + ' ' + p.m] || '') + '</span></div>'; }
        } else if (p.y !== cy) { cy = p.y; h += '<div class="ar-year" role="heading" aria-level="3">' + esc(p.y) + '</div>'; }
        h += '<a class="ar-ent' + (p.t ? '' : ' ar-micro') + '" href="' + esc(p.u) + '"><span class="ar-ln"><b>' + esc(p.t || p.s || 'Untitled post from ' + long(p.d)) + '</b><i></i><span>' + short(p.d) + '</span></span>' +
          (p.t && p.s ? '<span class="ar-sm">' + esc(p.s) + '</span>' : '') + '</a>';
      }
      return h + '<div class="ar-foot"><a href="/calendar/">' + ic('cal') + 'See it on the Calendar</a>' + (f.u ? '<a href="' + esc(f.u) + '">Open the classic ' + esc(f.n) + ' page</a>' : '') + '</div></div>';
    }

    /* ---------- build ---------- */
    var root = ctx.el('<div class="hx-ar" role="main">' +
      '<div class="ar-view ar-home"><div class="ar-scroll"><div class="ar-pad">' +
        '<label class="ar-search">' + ic('search') + '<input type="search" placeholder="Search ' + FOLDERS.length + ' folders" aria-label="Search folders" autocomplete="off"></label>' +
        '<div class="ar-recent-wrap"><div class="ar-lbl">Recent</div><div class="ar-recent">' + RECENT.map(function (f) {
          var tag = f.au ? 'a href="' + f.au + '"' : 'button type="button"';
          return '<' + tag + ' class="ar-rc" data-f="' + f.id + '">' + fic(f) + '<span>' + esc(f.n) + '</span><small>' + short(f.l) + '</small></' + tag.split(' ')[0] + '>'; }).join('') + '</div></div>' +
        /* the folders run most posts first, so this is the Top categories list (Nov 3, Toby: they don't fit on the Fold's home screen) */
        '<div class="ar-lbl">Top categories<span>' + FOLDERS.length + '</span></div><div class="ar-fwrap"></div></div></div></div>' +
      '<div class="ar-view ar-cat ar-off" aria-hidden="true"><div class="ar-scroll"></div></div>' +
      '<div class="ar-panes"><div class="ar-pane ar-left"><label class="ar-search">' + ic('search') + '<input type="search" placeholder="Search ' + FOLDERS.length + ' folders" aria-label="Search folders" autocomplete="off"></label><div class="ar-scroll ar-flist"></div></div>' +
        '<div class="ar-pane ar-right"><div class="ar-scroll ar-catpane"></div></div></div>' +
      '</div>');
    if (ctx.calm) root.classList.add('ar-calm');
    document.body.appendChild(root);
    ctx.own();

    var q = '', sel = null, open = null;
    var mq = window.matchMedia('(min-width: 840px) and (orientation: landscape)');
    var fwrap = root.querySelector('.ar-fwrap'), flist = root.querySelector('.ar-flist'), catpane = root.querySelector('.ar-catpane');
    var vCat = root.querySelector('.ar-cat'), vCatS = vCat.querySelector('.ar-scroll');
    var nameEl = ctx.bar.querySelector('.hb-name'), baseName = nameEl ? nameEl.textContent : 'Archive';

    function list() {
      var L = [ALL].concat(FOLDERS);
      return q ? L.filter(function (f) { return f.n.toLowerCase().indexOf(q) > -1; }) : L;
    }
    function drawFolders() {
      var L = list();
      fwrap.innerHTML = L.length ? '<div class="ar-folders">' + L.map(function (f) {
        var tag = f.au ? 'a href="' + f.au + '"' : 'button type="button"';
        return '<' + tag + ' class="ar-folder" data-f="' + f.id + '">' + fic(f, 1) + (f.app ? '<span class="ar-app">' + ic('arrow') + esc(f.app) + '</span>' : '') +
          '<span class="ar-nm"><b>' + esc(f.n) + '</b><small>' + f.c + (f.c === 1 ? ' post' : ' posts') + '</small></span></' + tag.split(' ')[0] + '>'; }).join('') + '</div>'
        : '<p class="ar-more">No folders match "' + esc(q) + '"</p>';
      root.querySelector('.ar-recent-wrap').hidden = !!q;
    }
    function drawList() {
      flist.innerHTML = list().map(function (f) {
        var tag = f.au ? 'a href="' + f.au + '"' : 'button type="button"';
        return '<' + tag + ' class="ar-row' + (f.id === sel ? ' ar-sel' : '') + '" data-f="' + f.id + '"' + (f.id === sel ? ' aria-current="true"' : '') + '>' + fic(f) + '<b>' + esc(f.n) + '</b>' +
          (f.app ? '<span class="ar-app">' + esc(f.app) + '</span>' : '<small>' + f.c + '</small>') + '</' + tag.split(' ')[0] + '>'; }).join('') || '<p class="ar-more">No folders match "' + esc(q) + '"</p>';
    }
    function showInPane(id) {
      sel = id; drawList();
      catpane.innerHTML = catHTML(BYID[id]); catpane.scrollTop = 0;
    }
    function setName(n) { if (nameEl) nameEl.textContent = n; }
    function openFolder(id, push) {
      var f = BYID[id]; if (!f) return;
      if (two()) { showInPane(id); if (push) { try { history.replaceState({ hxar: id }, ''); } catch (e) {} } return; }
      vCatS.innerHTML = catHTML(f); vCatS.scrollTop = 0;
      vCat.classList.remove('ar-off'); vCat.setAttribute('aria-hidden', 'false');
      root.querySelector('.ar-home').setAttribute('aria-hidden', 'true');
      open = id; setName(f.n);
      if (push) { try { history.pushState({ hxar: id }, ''); } catch (e) {} }
    }
    function closeFolder() {
      if (!open) return;
      open = null; setName(baseName);
      vCat.classList.add('ar-off'); vCat.setAttribute('aria-hidden', 'true');
      root.querySelector('.ar-home').removeAttribute('aria-hidden');
    }
    function two() { return mq.matches; }
    function layout() {
      root.classList.toggle('ar-two', two());
      if (two()) {
        var keep = open || sel || 'all';
        if (open) closeFolder();
        showInPane(keep);
      } else drawFolders();
    }

    root.addEventListener('click', function (e) {
      var f = e.target.closest('[data-f]');
      if (!f || f.tagName === 'A') return; /* app folders are real links */
      openFolder(f.getAttribute('data-f'), true);
    });
    [].forEach.call(root.querySelectorAll('.ar-search input'), function (inp) {
      inp.addEventListener('input', function () {
        q = inp.value.trim().toLowerCase();
        [].forEach.call(root.querySelectorAll('.ar-search input'), function (o) { if (o !== inp) o.value = inp.value; });
        if (two()) drawList(); else drawFolders();
      });
    });
    /* the app bar's back closes an open folder first (capture: runs before hutch.js's own) */
    var back = ctx.bar.querySelector('.hb-back');
    /* Nov 11: only step back when this folder really added a step (it can
       also be reopened from a saved state, with no step of its own; stepping
       back then left the Archive or did nothing). Otherwise close it in place. */
    if (back) back.addEventListener('click', function (e) { if (open) { e.stopImmediatePropagation(); if (history.state && history.state.hxar && history.state._hd > 0) history.back(); else closeFolder(); } }, true);
    window.addEventListener('popstate', function (e) {
      var id = e.state && e.state.hxar;
      if (id && BYID[id] && !two()) openFolder(id, false); else closeFolder();
    });
    if (mq.addEventListener) mq.addEventListener('change', layout); else if (mq.addListener) mq.addListener(layout);
    layout();
    /* coming back from a post: reopen the folder it was in */
    var st = history.state && history.state.hxar;
    if (st && BYID[st]) { if (two()) showInPane(st); else openFolder(st, false); }
  };
})();

/* ------------------------------------------------------------------
   CALENDAR app (Hutch OS, Nov 2, 2026, mockup v39)
   An Android-style calendar of Toby's posts, three views:
     Schedule  one long list, newest first, only days with posts, a
               banner per month (Blaugust tagged)
     Month     posts as colored chips in each day (colored by category),
               tap a day for its agenda; swipe or arrows for months
     Year      the year at a glance (nothing / one / two or more), the
               same scale as the Traditional /calendar/ page
   Today is circled; the "Today" button (.ca-todaybtn) jumps back.
   Landscape: month grid left, the day's agenda right (own scroll).
   Data: partials/hutch-data/calendar.html, the same posts and title
   rule as shortcodes/postcalendar.html.
   ------------------------------------------------------------------ */
(function () {
  window.HutchApps = window.HutchApps || {};
  HutchApps.calendar = function (ctx) {
    var D = ctx.data;
    if (!D || !D.p || D.p.length < 7) return;
    var esc = ctx.esc;
    var MN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    var WD = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var BANNER = ['#9DB4C0,#5B7A8C', '#B9C6CD,#7E8E96', '#C9D6A3,#7A8F6A', '#C9D6A3,#6E8B4A', '#E9C46A,#7A8F6A', '#E9C46A,#D98E3C',
      '#F2B880,#D98A5F', '#E2725B,#C4622D', '#D98E3C,#8C6A4F', '#C4622D,#5A2A1C', '#8EA0AA,#4C5B63', '#5C7FA3,#1E2D4A'];
    var IC = { l: '<path d="M15 6l-6 6 6 6"/>', r: '<path d="M9 6l6 6-6 6"/>', down: '<path d="M6 9l6 6 6-6"/>' };
    function ic(k) { return '<svg class="hx-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IC[k] + '</svg>'; }
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function key(y, m, d) { return y + '-' + pad(m + 1) + '-' + pad(d); }

    /* ---------- posts by day ---------- */
    var BY = {}, YEARS = {}, BLAUG = {};
    for (var i = 0; i + 6 < D.p.length; i += 7) {
      var p = { d: D.p[i], tm: D.p[i + 1], t: D.p[i + 2], u: D.p[i + 3], c: D.p[i + 4], b: D.p[i + 5] === 'b', m: D.p[i + 6] === 'm' };
      (BY[p.d] = BY[p.d] || []).push(p);
      YEARS[p.d.slice(0, 4)] = true;
      if (p.b) BLAUG[p.d.slice(0, 7)] = true;
    }
    function mins(t) { var a = /(\d+):(\d+)\s*(AM|PM)/i.exec(t || ''); if (!a) return 0; return (+a[1] % 12 + (/p/i.test(a[3]) ? 12 : 0)) * 60 + (+a[2]); }
    Object.keys(BY).forEach(function (k) { BY[k].sort(function (a, b) { return mins(a.tm) - mins(b.tm); }); });
    var DAYS = Object.keys(BY).sort();
    var now = new Date(), TY = now.getFullYear(), TM = now.getMonth(), TD = now.getDate(), TK = key(TY, TM, TD);
    var first = DAYS[0], last = DAYS[DAYS.length - 1];
    var MIN = (+first.slice(0, 4)) * 12 + (+first.slice(5, 7) - 1);
    var MAX = Math.max(TY * 12 + TM, (+last.slice(0, 4)) * 12 + (+last.slice(5, 7) - 1));
    var YLIST = Object.keys(YEARS).sort().reverse();
    if (YLIST.indexOf(String(TY)) < 0) YLIST.unshift(String(TY));

    /* ---------- category colors (like events in Google Calendar) ---------- */
    var dark = !!ctx.dark;
    var CAT = { 'blogging': '#C4622D', 'technology': '#5B7A8C', 'tech': '#5B7A8C', 'personal': '#6E8559', 'word of the day': '#A87A1A',
      'photos': '#7C5A7A', 'movie reviews': dark ? '#4A6596' : '#1E2D4A', 'tv reviews': dark ? '#4A6596' : '#1E2D4A', 'book reviews': dark ? '#4A6596' : '#1E2D4A',
      'reel and remote': dark ? '#4A6596' : '#1E2D4A', 'micro': '#8C6A4F' };
    var POOL = ['#3E7C7A', '#A0526B', '#5E6BA8', '#6E8B4A', '#B0662A', '#7A6A9C', '#4F7F9E', '#9A5B3C'];
    function color(p) {
      if (p.b) return '#B4501F';
      var c = String(p.c || '').toLowerCase();
      if (CAT[c]) return CAT[c];
      var h = 0; for (var j = 0; j < c.length; j++) h = (h * 31 + c.charCodeAt(j)) >>> 0;
      return POOL[h % POOL.length];
    }
    /* WCAG (Nov 9, Toby): white words on a chip need 4.5:1, so the chip's
       category colour is shaded 18% (same hue, every chip 5:1 or more) */
    function shade(h) {
      var m = /^#?([0-9a-f]{6})$/i.exec(h); if (!m) return h;
      var n = parseInt(m[1], 16), f = function (v) { return Math.round(v * 0.82); };
      return 'rgb(' + f(n >> 16 & 255) + ',' + f(n >> 8 & 255) + ',' + f(n & 255) + ')';
    }
    function catName(p) { return p.b ? 'Blaugust' + (p.c && !/blaugust/i.test(p.c) ? ' · ' + p.c : '') : (p.c || 'Post'); }

    /* ---------- state ---------- */
    var saved = ctx.ls('hx-cal-view');
    var view = saved === 'schedule' || saved === 'year' ? saved : 'month';
    var cur = TY * 12 + TM, sel = TK, yr = TY;
    if (cur > MAX) cur = MAX;
    var mqTwo = window.matchMedia('(min-width: 840px) and (orientation: landscape)');
    var mqPhone = window.matchMedia('(max-width: 599px)');

    var root = ctx.el('<div class="hx-cal" role="main">' +
      '<div class="ca-tb"><button type="button" class="ca-title" aria-live="polite"></button>' +
        '<span class="ca-seg" role="group" aria-label="View"><button type="button" data-v="schedule">Schedule</button><button type="button" data-v="month">Month</button><button type="button" data-v="year">Year</button></span>' +
        '<button type="button" class="ca-todaybtn" data-today title="Today" aria-label="Today, ' + MN[TM] + ' ' + TD + '">' + TD + '</button>' +
        '<button type="button" class="ca-nav" data-go="-1" aria-label="Previous">' + ic('l') + '</button><button type="button" class="ca-nav" data-go="1" aria-label="Next">' + ic('r') + '</button></div>' +
      '<div class="ca-main"></div></div>');
    if (ctx.calm) root.classList.add('ca-calm');
    document.body.appendChild(root);
    ctx.own();
    var main = root.querySelector('.ca-main'), title = root.querySelector('.ca-title');

    /* the next year with posts, older (-1) or newer (+1); YLIST is newest first */
    function nextYear(go) { var y = YLIST[YLIST.indexOf(String(yr)) - go]; return y ? +y : 0; }
    function ym(c) { return [Math.floor(c / 12), c % 12]; }
    function chipsMax() { return mqPhone.matches ? 2 : (mqTwo.matches && innerHeight >= 760) ? 4 : 3; }

    /* ---------- month ---------- */
    function monthHTML() {
      var a = ym(cur), y = a[0], m = a[1];
      var fd = new Date(y, m, 1).getDay(), dim = new Date(y, m + 1, 0).getDate(), pdim = new Date(y, m, 0).getDate();
      var total = Math.ceil((fd + dim) / 7) * 7, cells = '', mx = chipsMax();
      for (var i = 0; i < total; i++) {
        var d = i - fd + 1;
        if (d < 1 || d > dim) { cells += '<span class="ca-day ca-out" aria-hidden="true"><span class="ca-n">' + (d < 1 ? pdim + d : d - dim) + '</span></span>'; continue; }
        var k = key(y, m, d), ps = BY[k] || [];
        var lab = MN[m] + ' ' + d + (ps.length ? ', ' + ps.length + (ps.length === 1 ? ' post' : ' posts') : '') + (k === TK ? ', today' : '');
        cells += '<button type="button" class="ca-day' + (k === TK ? ' ca-today' : '') + (k === sel ? ' ca-sel' : '') + '" data-d="' + k + '" aria-label="' + lab + '"' + (k === sel ? ' aria-pressed="true"' : '') + '>' +
          '<span class="ca-n">' + d + '</span>' +
          ps.slice(0, mx).map(function (p) { return '<span class="ca-chip" style="background:' + shade(color(p)) + '">' + esc(p.t.replace(/^\W*(Word Nerd Alert|Blaugust Day \d+|Now Watching):\s*/i, '')) + '</span>'; }).join('') +
          (ps.length > mx ? '<span class="ca-more">+' + (ps.length - mx) + '</span>' : '') + '</button>';
      }
      return '<div class="ca-month"><div class="ca-wk" aria-hidden="true">' + 'SMTWTFS'.split('').map(function (x) { return '<span>' + x + '</span>'; }).join('') + '</div><div class="ca-days">' + cells + '</div></div>';
    }
    function agendaHTML() {
      var ps = BY[sel] || [], p = sel.split('-'), dt = new Date(+p[0], +p[1] - 1, +p[2]);
      return '<div class="ca-agenda"><div class="ca-ahead"><span class="ca-big">' + dt.getDate() + '</span><span class="ca-wd">' + WD[dt.getDay()] + ' · ' + MN[dt.getMonth()].slice(0, 3) + (dt.getFullYear() !== TY ? ' ' + dt.getFullYear() : '') + '</span>' +
        '<span class="ca-cnt">' + (ps.length ? ps.length + (ps.length > 1 ? ' posts' : ' post') : '') + '</span></div>' +
        (ps.length ? ps.map(function (q) {
          return '<a class="ca-ev" href="' + esc(q.u) + '"><span class="ca-bar" style="background:' + color(q) + '"></span><span class="ca-tm">' + esc(q.tm) + '</span>' +
            '<span class="ca-tx"><b' + (q.m ? ' class="ca-micro"' : '') + '>' + esc(q.t) + '</b><small>' + esc(catName(q)) + '</small></span></a>';
        }).join('') : '<div class="ca-empty">' + (sel > TK ? 'This day is still ahead.' : 'Nothing posted this day.') + '</div>') + '</div>';
    }

    /* ---------- year ---------- */
    function yearHTML() {
      var total = 0, days = 0, months = '';
      for (var mi = 0; mi < 12; mi++) {
        var fd = new Date(yr, mi, 1).getDay(), dim = new Date(yr, mi + 1, 0).getDate(), g = '', bl = BLAUG[yr + '-' + pad(mi + 1)];
        for (var i = 0; i < fd; i++) g += '<i class="ca-e"></i>';
        for (var d = 1; d <= dim; d++) {
          var k = key(yr, mi, d), n = (BY[k] || []).length; total += n; if (n) days++;
          g += '<i class="' + (n >= 2 ? 'ca-l2' : n === 1 ? 'ca-l1' : '') + (k === TK ? ' ca-t' : '') + '"></i>';
        }
        var c = yr * 12 + mi, ok = c >= MIN && c <= MAX;
        months += '<button type="button" class="ca-mini' + (bl ? ' ca-blaug' : '') + '" data-m="' + c + '"' + (ok ? '' : ' disabled') + ' aria-label="' + MN[mi] + ' ' + yr + '">' +
          '<span class="ca-mn">' + MN[mi].slice(0, 3) + (bl ? '<span>Blaugust</span>' : '') + '</span><span class="ca-g">' + g + '</span></button>';
      }
      var ys = YLIST.length > 1 ? '<div class="ca-years" role="group" aria-label="Choose a year">' + YLIST.map(function (y) { return '<button type="button" data-y="' + y + '"' + (+y === yr ? ' class="on" aria-current="true"' : '') + '>' + y + '</button>'; }).join('') + '</div>' : '';
      return '<div class="ca-year">' + ys + '<div class="ca-ygrid">' + months + '</div>' +
        '<div class="ca-legend"><span><i></i>Nothing posted</span><span><i class="ca-l1"></i>One post</span><span><i class="ca-l2"></i>Two or more</span></div>' +
        '<div class="ca-ystats"><b>' + total + '</b> ' + (total === 1 ? 'post' : 'posts') + ' on <b>' + days + '</b> ' + (days === 1 ? 'day' : 'days') + ' in ' + yr + '</div></div>';
    }

    /* ---------- schedule ---------- */
    function scheduleHTML() {
      var out = '', curM = null, buf = '', n = 0;
      function flush() {
        if (!curM) return;
        var y = +curM.slice(0, 4), m = +curM.slice(5, 7) - 1;
        out += '<div class="ca-banner" role="heading" aria-level="2"><span class="ca-bg" style="background:linear-gradient(135deg,' + BANNER[m] + ')"></span><b>' + MN[m] + (y !== TY ? ' ' + y : '') + '</b><small>' + n + (n === 1 ? ' post' : ' posts') + '</small>' + (BLAUG[curM] ? '<span class="ca-blg">Blaugust</span>' : '') + '</div>' + buf;
      }
      for (var i = DAYS.length - 1; i >= 0; i--) {
        var k = DAYS[i], mk = k.slice(0, 7), ps = BY[k];
        if (mk !== curM) { flush(); curM = mk; buf = ''; n = 0; }
        n += ps.length;
        var p = k.split('-'), dt = new Date(+p[0], +p[1] - 1, +p[2]);
        buf += '<div class="ca-sday' + (k === TK ? ' ca-today' : '') + '"><div class="ca-dt"><small>' + WD[dt.getDay()].slice(0, 3) + '</small><b>' + dt.getDate() + '</b></div><div class="ca-evs">' +
          ps.map(function (q) { return '<a class="ca-sev" href="' + esc(q.u) + '" style="background:' + color(q) + '"><b' + (q.m ? ' class="ca-micro"' : '') + '>' + esc(q.t) + '</b><small>' + esc(q.tm) + ' · ' + esc(catName(q)) + '</small></a>'; }).join('') + '</div></div>';
      }
      flush();
      return '<div class="ca-sched">' + out + '<p class="ca-end">That\'s every post, back to ' + MN[+first.slice(5, 7) - 1] + ' ' + first.slice(0, 4) + '.</p></div>';
    }

    /* ---------- draw ---------- */
    function draw() {
      [].forEach.call(root.querySelectorAll('[data-v]'), function (b) { var on = b.getAttribute('data-v') === view; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      var a = ym(cur);
      title.innerHTML = view === 'month' ? '<span>' + MN[a[1]] + (mqPhone.matches && a[0] === TY ? '' : ' ' + a[0]) + '</span>' + ic('down')
        : view === 'schedule' ? '<span>Schedule</span>' : '<span>' + yr + '</span>' + ic('down');
      title.disabled = view === 'schedule';
      root.setAttribute('data-view', view);
      main.innerHTML = view === 'month' ? '<div class="ca-mwrap">' + monthHTML() + agendaHTML() + '</div>' : view === 'schedule' ? scheduleHTML() : yearHTML();
      [].forEach.call(root.querySelectorAll('.ca-nav'), function (b) {
        var go = +b.getAttribute('data-go');
        b.disabled = view === 'month' ? (cur + go < MIN || cur + go > MAX) : view === 'year' ? !nextYear(go) : true;
      });
      main.scrollTop = 0;
      var s = main.querySelector('.ca-agenda'); if (s) s.scrollTop = 0;
    }
    function drawAgenda() {
      var ag = main.querySelector('.ca-agenda');
      if (!ag) return draw();
      [].forEach.call(main.querySelectorAll('.ca-day[data-d]'), function (c) { var on = c.getAttribute('data-d') === sel; c.classList.toggle('ca-sel', on); if (on) c.setAttribute('aria-pressed', 'true'); else c.removeAttribute('aria-pressed'); });
      var t = document.createElement('div'); t.innerHTML = agendaHTML(); ag.parentNode.replaceChild(t.firstChild, ag);
      ag = main.querySelector('.ca-agenda');
      /* one pane: bring the agenda up if it starts below the screen */
      if (!mqTwo.matches) {
        var r = ag.getBoundingClientRect(), mr = main.getBoundingClientRect();
        if (r.top > mr.bottom - 120) main.scrollTo({ top: main.scrollTop + r.top - mr.bottom + 200, behavior: ctx.calm ? 'auto' : 'smooth' });
      }
    }
    function goMonth(c, keepSel) {
      cur = Math.max(MIN, Math.min(MAX, c));
      if (!keepSel) { var a = ym(cur); sel = (a[0] === TY && a[1] === TM) ? TK : key(a[0], a[1], 1); }
      view = 'month'; draw();
    }

    root.addEventListener('click', function (e) {
      var t = e.target;
      var v = t.closest('[data-v]'); if (v) { view = v.getAttribute('data-v'); ctx.ls('hx-cal-view', view); if (view === 'year') yr = ym(cur)[0]; draw(); return; }
      if (t.closest('[data-today]')) { cur = TY * 12 + TM; sel = TK; yr = TY; view = 'month'; draw(); return; }
      if (t.closest('.ca-title')) { if (view === 'month') { view = 'year'; yr = ym(cur)[0]; } else if (view === 'year') { view = 'month'; if (ym(cur)[0] !== yr) goMonth(yr === TY ? TY * 12 + TM : yr * 12 + 11); } draw(); return; }
      var g = t.closest('[data-go]');
      if (g) { var go = +g.getAttribute('data-go'); if (view === 'year') { if (nextYear(go)) { yr = nextYear(go); draw(); } } else goMonth(cur + go); return; }
      var y = t.closest('[data-y]'); if (y) { yr = +y.getAttribute('data-y'); draw(); return; }
      var mm = t.closest('[data-m]'); if (mm && !mm.disabled) { goMonth(+mm.getAttribute('data-m')); return; }
      var d = t.closest('[data-d]'); if (d) { sel = d.getAttribute('data-d'); drawAgenda(); return; }
    });
    /* swipe months (phones mostly); vertical scrolling is left alone */
    var sx = null, sy = null;
    main.addEventListener('touchstart', function (e) { if (view !== 'month' || !e.target.closest('.ca-month')) { sx = null; return; } sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    main.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; sx = null;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) goMonth(cur + (dx < 0 ? 1 : -1));
    }, { passive: true });
    function relayout() { root.classList.toggle('ca-two', mqTwo.matches); draw(); }
    var rz = null, lastMax = chipsMax();
    window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { if (chipsMax() !== lastMax) { lastMax = chipsMax(); if (view === 'month') draw(); } }, 150); });
    [mqTwo, mqPhone].forEach(function (q) { if (q.addEventListener) q.addEventListener('change', relayout); else if (q.addListener) q.addListener(relayout); });
    relayout();
  };
})();

/* ==================================================================
   DEN app (/watching/), Hutch OS (Nov 2, 2026, Toby + Claude) - mockup v30
   Always dark, like a streaming app. Three swipeable rows, no tabs:
     Currently reading   book covers + how far along
     Currently watching  wide cards on a blurred poster (S2 · E4 + episode)
     History             everything rated, newest first, stars out of 5
   Tap an item: phone = a detail view slides in; unfolded sideways
   (landscape, 840px+) = the section's list on the left, details on the
   right, each pane scrolling on its own. Tap a row's title = full list.
   Month in review (Nov 7, Toby): before History, the same months as the
   Watched page's Month in review row (partials/month-review.html, from
   Trakt in the browser): the three finished months, each a fan of
   posters with the numbers, linking to Trakt's Month in Review, then
   the month in progress as a dashed "shows up here" card. The title and
   See all open /watched/#watched-months. Hidden until Trakt answers.
   Data: partials/hutch-data/den.html (build time). Currently watching
   also reads the cards the Traditional /watching/ page draws into
   #watching-grid after its Trakt fetch (it caches 30 minutes), so the
   page's own rules (hide list, Trakt ratings) decide what is listed.
   No Watchlist anywhere: it is private to Toby.
   Back: opening a list or a detail pushes a history entry, so the
   phone's back gesture (and the app bar's back) closes it first.
   ================================================================== */
(function () {
  window.HutchApps = window.HutchApps || {};
  HutchApps.den = function (ctx) {
    var D = ctx.data;
    if (!D) return;
    var esc = ctx.esc, de = document.documentElement;
    var READ = D.reading || [], WATCH_POSTS = D.watching || [], HIST = D.history || [], QUEUE_ALL = D.queue || [], QUEUE = QUEUE_ALL, LINKS = D.links || {};
    var grid = document.getElementById('watching-grid');
    /* nothing at all to show: leave the Traditional page alone */
    if (!READ.length && !WATCH_POSTS.length && !HIST.length && !grid) return;
    var WATCH = WATCH_POSTS.slice();

    /* ---------- little helpers ---------- */
    function norm(s) { try { return String(s || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ''); } catch (e) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ''); } }
    var PAL = [['#5C7FA3', '#2B3F5C', '#0E1622'], ['#E0A15E', '#A4522C', '#2A1A14'], ['#D98A5F', '#7C4A55', '#1C2236'], ['#7FB3C9', '#2F5B75', '#0F1B26'],
      ['#9DB4C0', '#5B7A8C', '#1E2D4A'], ['#C9A86A', '#6E5A3A', '#221A12'], ['#E2725B', '#7A2E2E', '#1A0F12'], ['#E8C79A', '#B0784A', '#3A2618']];
    var BOOK = ['#7C5A7A', '#3E6E5E', '#2E4A3E', '#8C6A4F', '#2F4A6B', '#6B4E3D', '#4A5D7A', '#7A4A4A'];
    function hash(s) { var h = 0; s = String(s || ''); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
    function grad(x) { var p = PAL[hash(x.t) % PAL.length]; return 'linear-gradient(160deg,' + p[0] + ',' + p[1] + ',' + p[2] + ')'; }
    function bookBg(x) { return BOOK[hash(x.t) % BOOK.length]; }
    var IC = {
      chev: '<path d="M9 6l6 6-6 6"/>',
      open: '<path d="M14 4h6v6 M20 4l-9 9 M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
      out: '<path d="M7 17L17 7M9 7h8v8"/>',
      link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
      check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>'
    };
    function ic(k) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IC[k] + '</svg>'; }
    var STAR = '<path d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 16.8l-5.3 2.8 1-5.8-4.2-4.1 5.9-.9z"/>';
    function svgStar(c) { return '<svg viewBox="0 0 24 24" class="' + c + '" fill="currentColor" aria-hidden="true">' + STAR + '</svg>'; }
    function rtext(r) { return (Math.round(r * 2) / 2).toString().replace('.5', '½').replace(/^0½/, '½'); }
    function stars(r) {
      var h = '';
      for (var i = 1; i <= 5; i++) {
        if (r >= i) h += '<span class="s">' + svgStar('on') + '</span>';
        else if (r >= i - 0.5) h += '<span class="s">' + svgStar('off') + '<span class="half">' + svgStar('on') + '</span></span>';
        else h += '<span class="s">' + svgStar('off') + '</span>';
      }
      return '<span class="hxd-stars" role="img" aria-label="' + rtext(r) + ' out of 5 stars">' + h + '</span>';
    }
    function img(u, cls) { return u ? '<img class="' + (cls || 'pic') + '" src="' + esc(u) + '" alt="" loading="lazy" decoding="async">' : ''; }
    function art(x) {
      if (x.kind === 'Book') return '<div class="cover" style="background:' + bookBg(x) + '"><div class="ct">' + esc(x.t) + '</div><div class="ca">' + esc(x.who || '') + '</div>' + img(x.cover) + '</div>';
      return '<div class="poster" style="background:' + grad(x) + '"><div class="pn">' + esc(x.t) + '</div>' + img(x.cover) +
        (x.season && (x.sec === 'history') ? '<span class="badge">S' + x.season + '</span>' : '') + '</div>';
    }
    function pct(x) {
      if (x.kind === 'Book') return x.pct >= 0 ? Math.min(100, x.pct) : (x.total ? Math.round(x.page / x.total * 100) : -1);
      if (x.kind === 'TV' && x.ep && x.eps) return Math.min(100, Math.round((x.ep - 0.5) / x.eps * 100));
      return -1;
    }
    function bar(x) { var p = pct(x); return p >= 0 ? '<div class="bar"><i style="width:' + p + '%"></i></div>' : ''; }
    /* "5 left · 4h 50m", like Trakt's Continue Watching (episodes after the
       one he last watched, times the show's episode length) */
    function left(x) {
      if (x.kind !== 'TV' || !x.ep || !x.eps || x.eps <= x.ep) return '';
      var n = x.eps - x.ep, out = n + ' left';
      if (x.rt) { var m = n * x.rt, h = Math.floor(m / 60); out += ' · ' + (h ? h + 'h ' : '') + (m % 60 ? (m % 60) + 'm' : '').trim(); }
      return out.trim();
    }
    function where(x) {
      if (x.kind === 'Book') return x.page && x.total ? 'Page ' + x.page + ' of ' + x.total : (x.pct >= 0 ? x.pct + '% read' : (x.who || 'Reading now'));
      if (x.kind === 'TV') return x.season ? 'S' + x.season + (x.ep ? ' · E' + x.ep : '') : 'TV';
      return 'Movie' + (x.y ? ' · ' + x.y : '');
    }

    /* tag each item with its section, so ids and lookups stay simple */
    function tag(list, sec) { list.forEach(function (x) { x.sec = sec; }); return list; }
    tag(READ, 'reading'); tag(WATCH, 'watching'); tag(HIST, 'history'); tag(QUEUE_ALL, 'queue');
    var SECTIONS = {
      reading: { title: 'Currently reading', items: function () { return READ; }, empty: 'Between books right now.' },
      watching: { title: 'Currently watching', items: function () { return WATCH; }, empty: 'Nothing playing right now.' },
      queue: { title: 'Waiting for', items: function () { return QUEUE; }, empty: 'Nothing on the list right now.' },
      history: { title: 'History', items: function () { return HIST; }, empty: 'No ratings yet.' }
    };
    function get(id) { var all = READ.concat(WATCH, HIST); for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i]; return null; }

    /* ---------- build ---------- */
    ctx.own();
    de.classList.add('hx-den-on');
    var root = ctx.el('<div class="hx-den" id="hx-den">' +
      '<div class="hxd-view hxd-home"><div class="hxd-scroll"></div></div>' +
      '<div class="hxd-view hxd-list off" aria-hidden="true"></div>' +
      '<div class="hxd-view hxd-detail off" aria-hidden="true"></div></div>');
    if (ctx.calm) root.classList.add('calm');
    document.body.appendChild(root);
    var homeEl = root.querySelector('.hxd-home .hxd-scroll'), vList = root.querySelector('.hxd-list'), vDetail = root.querySelector('.hxd-detail');
    var hbName = ctx.bar.querySelector('.hb-name');
    var mq = window.matchMedia('(min-width: 840px) and (orientation: landscape)');
    function two() { return mq.matches; }

    /* a cover or poster that can't load falls back to its painted cover */
    root.addEventListener('error', function (e) { var t = e.target; if (t && t.tagName === 'IMG') t.parentNode && t.parentNode.removeChild(t); }, true);

    function bookTile(x) {
      return '<button type="button" class="it it-book" data-pick="' + x.id + '">' + art(x) + '<span class="cap"><span class="tt">' + esc(x.t) + '</span><span class="tm">' + esc(where(x)) + '</span>' + bar(x) + '</span></button>';
    }
    /* Nov 12 (mockup v119, A): the still on top, the words on their own
       panel under it. The picture is the episode's still when Perch has
       one, else the wide backdrop, else the poster on its own blur. */
    function cardArt(x) {
      var w = wideArt(x);
      if (w) return img(w, 'pic wide');
      return x.cover ? img(x.cover, 'blur') + img(x.cover, 'pic tall') : '';
    }
    function watchCard(x) {
      var tv = x.kind === 'TV', l = left(x), n = l ? +(l.match(/^\d+/) || [0])[0] : 0;
      var line = tv ? (x.epn || (x.ep ? 'Episode ' + x.ep : (x.d ? 'Last watched ' + x.d : ''))) + (n ? ' · ' + n + (n === 1 ? ' episode left' : ' episodes left') : '') : 'Movie' + (x.y ? ' · ' + x.y : '');
      return '<button type="button" class="it hd-wcard" data-pick="' + x.id + '"><span class="wst" data-art="' + x.id + '" style="background:' + grad(x) + '"><span class="tn">' + esc(x.t) + '</span>' + cardArt(x) +
        '<span class="ty">' + esc(tv ? where(x) : 'Movie') + '</span></span>' +
        '<span class="winfo"><span class="nm">' + esc(x.t) + '</span>' + (line ? '<span class="en">' + esc(line) + '</span>' : '') + bar(x) + '</span></button>';
    }
    /* stills arrive after the row is drawn: swap the picture in place */
    function paintCards() {
      [].forEach.call(homeEl.querySelectorAll('.wst[data-art]'), function (el) {
        var x = get(el.getAttribute('data-art')); if (!x) return;
        var w = wideArt(x), cur = el.querySelector('img.pic');
        if (w && (!cur || cur.getAttribute('src') !== w)) {
          [].forEach.call(el.querySelectorAll('img'), function (i) { i.parentNode.removeChild(i); });
          el.insertAdjacentHTML('beforeend', img(w, 'pic wide'));
        }
      });
    }
    function histTile(x) {
      return '<button type="button" class="it it-hist" data-pick="' + x.id + '">' + art(x) + '<span class="cap">' + stars(x.r) + '<span class="tt">' + esc(x.t) + '</span><span class="tm">' +
        (x.kind === 'TV' && x.season ? 'Season ' + x.season + ' · ' : '') + esc(x.d) + '</span></span></button>';
    }
    /* Waiting for (Nov 5): The Queue's posters, each with its release
       badge (Out now, the date, or TBA); a tap opens the post */
    var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    function relShort(x) {
      if (x.out) return 'Out now';
      var m = String(x.dk || '').match(/^(\d{4})-(\d{2})-(\d{2})$/), yNow = String(new Date().getFullYear());
      if (!m || m[1] === '9999') return 'TBA';
      if (m[2] === '99') return m[1];
      if (m[3] === '99') return MON[+m[2] - 1] + ' ' + m[1];
      return MON[+m[2] - 1] + ' ' + (+m[3]) + (m[1] !== yNow ? ', ' + m[1] : '');
    }
    function soon(x) { if (x.out) return 'out'; var m = String(x.dk || '').match(/^(\d{4})-(\d{2})-(\d{2})$/); if (!m || m[3] === '99') return ''; return (new Date(+m[1], +m[2] - 1, +m[3]) - new Date()) < 45 * 864e5 ? 'soon' : ''; }
    function queueTile(x) {
      return '<a class="it it-hist it-q" href="' + esc(x.url) + '"><div class="poster" style="background:' + grad(x) + '"><div class="pn">' + esc(x.t) + '</div>' + img(x.cover) +
        '<span class="qbadge ' + soon(x) + '">' + esc(relShort(x)) + '</span></div><span class="cap"><span class="tt">' + esc(x.t) + '</span><span class="tm">' +
        esc(x.out ? 'Out now · ' + x.kind : x.kind + (relShort(x) !== 'TBA' ? ' · ' + relShort(x) : ' · No date yet')) + '</span></span></a>';
    }
    /* each row: its title (Waiting for opens The Queue page; the others
       open their list here) and, on the right, See all for the full page
       (Nov 5, Toby: like the home screen widgets) */
    function section(key, tiles, count) {
      var S = SECTIONS[key], items = S.items(), page = LINKS[key];
      var head = key === 'queue' && page
        ? '<a class="shead" href="' + esc(page) + '"><h2>' + S.title + '</h2>' + ic('chev') + (count ? '<small>' + items.length + '</small>' : '') + '</a>'
        : '<button type="button" class="shead" data-open="' + key + '"><h2>' + S.title + '</h2>' + ic('chev') + (count ? '<small>' + items.length + '</small>' : '') + '</button>';
      return '<section class="sec sec-' + key + '"><div class="shead-row">' + head + (page ? '<a class="sall" href="' + esc(page) + '">See all ›</a>' : '') + '</div>' +
        (items.length ? '<div class="row">' + items.slice(0, 24).map(tiles).join('') + '</div>' : '<p class="none">' + S.empty + '</p>') + '</section>';
    }
    /* Waiting for leaves out what Toby has started (Nov 5): anything
       watched on Trakt after it was queued (partials/queue-trakt.html), or
       with a "Now watching:" post newer than the queue post (checked when
       the site was built, partials/queue-items.html). */
    var STARTED = {};
    function qnorm(t) { return norm(String(t || '').replace(/\s*,?\s*(?:Season\s+\d+|S\d+)\s*$/i, '')); }
    function applyQueue() {
      /* exactly the same two rules as the /the-queue/ page (Nov 5, Toby:
         "i want den and queue get the same behavior"): the posts check was
         done when the site was built, this is the Trakt one */
      QUEUE = QUEUE_ALL.filter(function (x) {
        var t = STARTED[x.qn || qnorm(x.t)];
        return !(t && t > (x.at || 0) * 1000);
      });
    }
    if (window.tgoQueueStarted && QUEUE_ALL.length) {
      window.tgoQueueStarted(Math.min.apply(null, QUEUE_ALL.map(function (x) { return (x.at || 0) * 1000; }))).then(function (m) {
        STARTED = m || {}; var before = QUEUE.length; applyQueue();
        if (QUEUE.length !== before && state.view === 'home') renderHome();
      }).catch(function () {});
    }
    /* Month in review (Nov 7): from Trakt, once it answers */
    var MONTHS = null;
    function plural(v, one, many) { return v + '\u00a0' + (v === 1 ? one : many); }
    function monthsSection() {
      if (!MONTHS || !MONTHS.months || !MONTHS.months.length) return '';
      var page = LINKS.months;
      var cards = MONTHS.months.map(function (m) {
        var fan = (m.posters || []).slice(0, 5).map(function (p) { return '<span class="mfp" data-tmdb="' + esc(p.tmdb) + '" data-kind="' + esc(p.kind) + '"></span>'; }).join('');
        var stats = m.plays ? plural(m.movies, 'movie', 'movies') + ' · ' + plural(m.shows, 'show', 'shows') + ' · ' + plural(m.hours, 'hour', 'hours') : 'Nothing logged';
        return '<a class="it it-month" href="' + esc(m.mir) + '" rel="noopener"><span class="mfan" aria-hidden="true">' + fan + '</span>' +
          '<span class="cap"><span class="tt">' + esc(m.label) + '</span><span class="tm">' + esc(stats) + '</span><span class="go">See it on Trakt ↗</span></span></a>';
      }).join('');
      var next = MONTHS.current ? '<div class="it it-month mnext"><strong>' + esc(MONTHS.current.label) + '</strong><span>shows up here in ' + esc(MONTHS.current.next) + '</span></div>' : '';
      var head = page ? '<a class="shead" href="' + esc(page) + '"><h2>Month in review</h2>' + ic('chev') + '</a>' : '<div class="shead"><h2>Month in review</h2></div>';
      return '<section class="sec sec-months"><div class="shead-row">' + head + (page ? '<a class="sall" href="' + esc(page) + '">See all ›</a>' : '') + '</div>' +
        '<div class="row">' + cards + next + '</div></section>';
    }
    function fillPosters() {
      if (!window.tgoPoster) return;
      [].forEach.call(homeEl.querySelectorAll('.mfp:not(.on)'), function (slot) {
        slot.classList.add('on');
        window.tgoPoster(+slot.getAttribute('data-tmdb'), slot.getAttribute('data-kind')).then(function (u) {
          if (!u || !slot.isConnected) return;
          var im = document.createElement('img'); im.alt = ''; im.loading = 'lazy'; im.decoding = 'async'; im.src = u;
          slot.appendChild(im);
        });
      });
    }
    if (window.tgoMonthReview) {
      window.tgoMonthReview().then(function (d) { MONTHS = d; if (state.view === 'home') renderHome(); }).catch(function () {});
    }
    function renderHome() {
      var y = homeEl.scrollTop;
      var keepX = {};
      [].forEach.call(homeEl.querySelectorAll('.row'), function (r) { keepX[r.parentNode.className] = r.scrollLeft; });
      applyQueue();
      homeEl.innerHTML = section('reading', bookTile) + section('watching', watchCard) + (QUEUE.length ? section('queue', queueTile, true) : '') + monthsSection() + section('history', histTile, true);
      fillPosters();
      WATCH.slice(0, 8).forEach(function (x) { if (x.kind === 'TV') loadShow(x).then(function () { paintCards(); }); });
      [].forEach.call(homeEl.querySelectorAll('.row'), function (r) { if (keepX[r.parentNode.className]) r.scrollLeft = keepX[r.parentNode.className]; });
      homeEl.scrollTop = y;
    }

    /* ---------- list + detail ---------- */
    var FILTERS = [['All', null], ['Movies', 'Movie'], ['TV', 'TV'], ['Books', 'Book']];
    var state = { view: 'home', sec: null, id: null, filter: 'All' };
    function listItems() {
      var items = SECTIONS[state.sec].items(), f = null;
      FILTERS.forEach(function (p) { if (p[0] === state.filter) f = p[1]; });
      return state.sec === 'history' && f ? items.filter(function (x) { return x.kind === f; }) : items;
    }
    function listRows() {
      var items = listItems(), h = state.sec === 'history';
      if (!items.length) return '<p class="none">' + (h && state.filter !== 'All' ? 'Nothing here yet.' : SECTIONS[state.sec].empty) + '</p>';
      return items.map(function (x) {
        var meta = h ? (x.kind === 'Book' ? (x.who ? esc(x.who) + ' · ' : '') : x.kind + (x.kind === 'TV' && x.season ? ' · Season ' + x.season : '') + ' · ') + esc(x.d)
          : x.kind === 'Book' ? esc(where(x)) + (x.who ? ' · ' + esc(x.who) : '')
          : x.kind === 'TV' ? 'TV · ' + esc(where(x)) + (x.epn ? ' · ' + esc(x.epn) : '') : esc(where(x));
        return '<button type="button" class="li' + (two() && x.id === state.id ? ' sel' : '') + '" data-pick="' + x.id + '"><span class="mini">' + art(x) + '</span><span class="m"><span class="tt">' + esc(x.t) + '</span>' +
          '<span class="tm">' + meta + '</span>' + (h ? stars(x.r) : bar(x)) + '</span></button>';
      }).join('');
    }
    function filtersHtml() {
      if (state.sec !== 'history') return '';
      return '<div class="filters" role="group" aria-label="Show">' + FILTERS.map(function (f) {
        return '<button type="button" data-f="' + f[0] + '" class="' + (f[0] === state.filter ? 'on' : '') + '" aria-pressed="' + (f[0] === state.filter) + '">' + f[0] + '</button>'; }).join('') + '</div>';
    }
    /* ==============================================================
       Nov 12, 2026 (Toby, mockups v118 + v119): details that act like
       an app. Nothing sends the reader off to "Read the post" any more:
         - Currently watching (TV): the episode he is on, its synopsis,
           the whole season (later episodes stay quiet: no spoilers),
           the show's own summary. Words come from Trakt's public API
           (same key as the Watching page).
         - History, a movie he is watching, Currently reading: the full
           post, read from the post's own page when it is opened, with
           a permalink line at the bottom.
         - Books: where to get the book + "Add to my bookshelf" on
           Micro.blog (from the ISBN in the post's Book details link).
       PICTURES: Trakt does not allow loading its images directly
       (developer.trakt.tv/docs/images), so episode stills come through
       Perch's lookup (TMDB) once it offers them:
         GET perch-app.pages.dev/poster?tmdb=ID&season=N
           -> { stills: { "1": url, "2": url }, backdrop: url }
       Until then: the wide backdrop from the post, else the poster on
       a blur. Nothing breaks when the lookup has no stills.
       ============================================================== */
    var TKEY = '23c84564f461db4829e7142a226cf1b00b1b1f8a87afb1601b081221f74f29cc'; /* public API key, not a secret */
    var PERCH = 'https://perch-app.pages.dev/poster';
    var HOUR = 3600000, DAY = 24 * HOUR;
    function lsGet(k, ttl) { try { var c = JSON.parse(localStorage.getItem(k) || 'null'); if (c && Date.now() - c.t < (c.e ? Math.min(ttl, 6 * HOUR) : ttl)) return c.v; } catch (e) {} return null; }
    function lsSet(k, v, empty) { try { localStorage.setItem(k, JSON.stringify({ t: Date.now(), v: v, e: empty ? 1 : 0 })); } catch (e) {} }
    var PEND = {};
    function cached(k, ttl, make, isEmpty) {
      var c = lsGet(k, ttl); if (c) return Promise.resolve(c);
      if (PEND[k]) return PEND[k];
      return PEND[k] = make().then(function (v) { delete PEND[k]; lsSet(k, v, isEmpty && isEmpty(v)); return v; }, function (e) { delete PEND[k]; throw e; });
    }
    function tget(path) {
      return fetch('https://api.trakt.tv' + path, { headers: { 'trakt-api-version': '2', 'trakt-api-key': TKEY } }).then(function (r) { if (!r.ok) throw new Error('Trakt ' + r.status); return r.json(); });
    }
    /* which show on Trakt: the card's own slug, the Trakt link, else a search by title */
    function findShow(x) {
      var m = String(x.url || '').match(/trakt\.tv\/shows\/([^\/?#]+)/);
      var slug = x.slug || (m ? decodeURIComponent(m[1]) : '');
      if (slug) return Promise.resolve({ slug: slug, tmdb: x.tmdb || 0 });
      return cached('tgo_den_find_v1_' + norm(x.t) + (x.y || ''), 30 * DAY, function () {
        return tget('/search/show?query=' + encodeURIComponent(x.t) + '&limit=8').then(function (list) {
          /* same title first; among those, the year in the post, else the newest
             (a remake like Carrie shares its name with older shows) */
          var same = (list || []).filter(function (r) { return r.show && norm(r.show.title) === norm(x.t); }).map(function (r) { return r.show; });
          same.sort(function (a, b) { return (String(b.year) === String(x.y)) - (String(a.year) === String(x.y)) || (b.year || 0) - (a.year || 0); });
          var hit = same[0] || null;
          if (!hit && list && list[0]) hit = list[0].show;
          if (!hit || !hit.ids || !hit.ids.slug) throw new Error('no show');
          return { slug: hit.ids.slug, tmdb: hit.ids.tmdb || 0 };
        });
      });
    }
    function showInfo(slug) {
      return cached('tgo_den_show_v1_' + slug, 7 * DAY, function () {
        return tget('/shows/' + encodeURIComponent(slug) + '?extended=full').then(function (s) {
          return { ov: s.overview || '', net: s.network || '', genres: s.genres || [], cert: s.certification || '', status: s.status || '', y: s.year || '', tmdb: (s.ids && s.ids.tmdb) || 0 };
        });
      });
    }
    function seasonEps(slug, n) {
      return cached('tgo_den_eps_v1_' + slug + '_' + n, 6 * HOUR, function () {
        return tget('/shows/' + encodeURIComponent(slug) + '/seasons/' + n + '?extended=full').then(function (list) {
          return (list || []).map(function (e) { return { n: e.number || 0, t: e.title || '', ov: e.overview || '', rt: e.runtime || 0, air: e.first_aired || '' }; }).filter(function (e) { return e.n > 0; });
        });
      });
    }
    function okImg(u) { return /^https:\/\/image\.tmdb\.org\//.test(String(u || '')) ? u : ''; }
    function stillsFor(tmdb, n) {
      if (!tmdb) return Promise.resolve({ st: {}, bd: '' });
      return cached('tgo_den_stills_v1_' + tmdb + '_' + n, 7 * DAY, function () {
        return fetch(PERCH + '?tmdb=' + tmdb + '&season=' + n).then(function (r) { return r.json(); }).then(function (d) {
          var st = {}, src = (d && d.stills) || {};
          for (var k in src) { if (okImg(src[k])) st[k] = src[k]; }
          return { st: st, bd: okImg(d && d.backdrop) };
        });
      }, function (v) { var any = false; for (var k in v.st) any = true; return !any && !v.bd; });
    }
    /* a wide (landscape) picture: TMDB backdrops and stills, never a poster */
    function wide(u) { return /image\.tmdb\.org\/t\/p\/(?:w1280|w780|w300|original)\//.test(String(u || '')) || /\/(?:backdrop|still)s?\//i.test(String(u || '')); }

    /* everything Trakt + Perch know about a show he is watching: T[x.id] */
    var T = {}, P = {};
    function loadShow(x) {
      if (x.kind !== 'TV' || !x.season) return Promise.resolve(null);
      var t = T[x.id] = T[x.id] || { key: '' }, key = x.season + '|' + x.ep;
      if (t.key === key && t.done) return Promise.resolve(t);
      if (t.key === key && t.p) return t.p;
      t.key = key;
      return t.p = findShow(x).then(function (f) {
        t.slug = f.slug;
        var a = seasonEps(f.slug, x.season).then(function (e) { t.eps = e; }, function () {});
        var b = showInfo(f.slug).then(function (s) { t.show = s; return s.tmdb || f.tmdb; }, function () { return f.tmdb; })
          .then(function (tmdb) { return stillsFor(tmdb, x.season).then(function (s) { t.st = s.st; t.bd = s.bd; }, function () {}); });
        return Promise.all([a, b]);
      }).then(function () { t.done = true; t.p = null; return t; }, function () { t.done = true; t.p = null; return t; });
    }
    /* the picture for an item: the episode's still, the show's backdrop, the post's backdrop */
    function wideArt(x) {
      var t = T[x.id], p = P[x.url];
      if (t && t.st && t.st[x.ep]) return t.st[x.ep];
      if (p && p.bd) return p.bd;
      if (wide(x.cover)) return x.cover;
      if (t && t.bd) return t.bd;
      return '';
    }

    /* ---- the full post, read from the post's own page ---- */
    function ptxt(el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; }
    function nostars(s) { return String(s || '').replace(/[★☆½]{2,}/g, ' ').replace(/My Rating Scale\s*↗?/gi, ' ').replace(/\s+/g, ' ').trim(); }
    function paras(el) {
      var ps = el.querySelectorAll('p'), out = [];
      if (ps.length) { [].forEach.call(ps, function (p) { var s = nostars(ptxt(p)); if (s) out.push(s); }); return out; }
      var c = el.cloneNode(true);
      [].forEach.call(c.querySelectorAll('br'), function (b) { b.parentNode.replaceChild(c.ownerDocument.createTextNode('\n'), b); });
      c.textContent.split(/\n+/).forEach(function (s) { s = nostars(s.replace(/\s+/g, ' ')); if (s) out.push(s); });
      return out;
    }
    function readPost(html) {
      var out = { facts: [], thoughts: [], syn: '', tag: '', bd: '', trailer: '', where: '', tmdb: '', trakt: '', scale: '', isbn: '' };
      var doc; try { doc = new DOMParser().parseFromString(String(html || ''), 'text/html'); } catch (e) { return out; }
      var ec = doc.querySelector('.e-content'); if (!ec) return out;
      [].forEach.call(ec.querySelectorAll('script,style,.quoteback-footer'), function (n) { n.parentNode.removeChild(n); });
      var q = function (s) { return ec.querySelector(s); };
      var bd = q('img.review-backdrop'); if (bd) out.bd = okImg(bd.getAttribute('src'));
      [].forEach.call(ec.querySelectorAll('.review-fact-label'), function (l) {
        var v = l.nextElementSibling; if (v && ptxt(l) && ptxt(v)) out.facts.push([ptxt(l), ptxt(v)]);
      });
      out.tag = ptxt(q('.review-tagline'));
      var syn = q('.review-synopsis') || q('.review-about');
      out.syn = ptxt(syn);
      if (out.tag && out.syn.indexOf(out.tag) === 0) out.syn = out.syn.slice(out.tag.length).trim();
      /* his own words: a marked cell, else whatever follows a "My thoughts" label */
      var th = q('.review-thoughts, .movie-card-thoughts');
      if (!th) {
        [].some.call(ec.querySelectorAll('p,div,td,span,h4,h5,strong'), function (l) {
          if (l.children.length || !/^my (?:thoughts|take|review)\s*:?$/i.test(ptxt(l))) return false;
          var n = l.nextElementSibling || (l.parentNode && l.parentNode !== ec ? l.parentNode.nextElementSibling : null);
          if (n) { th = n; l.setAttribute('data-den-label', '1'); }
          return !!n;
        });
      }
      if (th) out.thoughts = paras(th);
      /* a quote in the card is the synopsis (the old "Watched" cards) */
      if (!out.syn) {
        [].some.call(ec.querySelectorAll('blockquote'), function (b) {
          if (b === th || (th && (th.contains(b) || b.contains(th))) || /quoteback/.test(b.className)) return false;
          if (b.parentNode === ec) return false;
          out.syn = ptxt(b); return !!out.syn;
        });
      }
      /* plain posts: the post's own paragraphs are what he wrote */
      [].forEach.call(ec.children, function (c) {
        if (!/^(P|BLOCKQUOTE|UL|OL)$/.test(c.tagName) || c === th || /quoteback/.test(c.className)) return;
        var s = nostars(ptxt(c)); if (!s || s === out.syn || s.length < 3) return;
        if (out.thoughts.indexOf(s) < 0) out.thoughts.push(s);
      });
      [].forEach.call(ec.querySelectorAll('a[href]'), function (a) {
        var h = a.getAttribute('href') || '', tx = ptxt(a);
        if (/^https?:\/\/(?:www\.)?(?:youtu\.be|youtube\.com)\//i.test(h)) { if (!out.trailer) out.trailer = h; }
        else if (/^https?:\/\/(?:www\.)?themoviedb\.org\//i.test(h)) { if (/where to watch/i.test(tx)) out.where = h; else if (!out.tmdb) out.tmdb = h; }
        else if (/^https?:\/\/(?:www\.)?trakt\.tv\//i.test(h)) { if (!out.trakt) out.trakt = h; }
        else if (/rating-scale/i.test(h)) { if (!out.scale) out.scale = h; }
        var m = h.match(/\/books\/(97[89]\d{10})\b/); if (m && !out.isbn) out.isbn = m[1];
      });
      return out;
    }
    function local(u) { u = String(u || ''); return u.charAt(0) === '/' || u.indexOf(location.origin) === 0; }
    function loadPost(x) {
      if (!x || !local(x.url) || /^\/(?:reading|watching|watched)\/?$/.test(x.url)) return Promise.resolve(null);
      if (P[x.url]) return Promise.resolve(P[x.url]);
      if (PEND['p' + x.url]) return PEND['p' + x.url];
      return PEND['p' + x.url] = fetch(x.url, { credentials: 'same-origin' }).then(function (r) { if (!r.ok) throw 0; return r.text(); }).then(function (t) {
        delete PEND['p' + x.url]; return P[x.url] = readPost(t);
      }, function () { delete PEND['p' + x.url]; return null; });
    }

    /* ---- the pieces of a detail screen ---- */
    var MONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    function airDate(iso) {
      var d = new Date(iso); if (!iso || isNaN(d)) return '';
      return MONS[d.getMonth()] + ' ' + d.getDate() + (d.getFullYear() !== new Date().getFullYear() ? ', ' + d.getFullYear() : '');
    }
    function cap(s) { s = String(s || '').replace(/-/g, ' '); return s.charAt(0).toUpperCase() + s.slice(1); }
    function ext(label, href, cls) {
      return '<a class="btn ' + (cls || 'ghost') + '" href="' + esc(href) + '" target="_blank" rel="noopener">' + esc(label) + ' ' + ic('out') + '</a>';
    }
    function factsHtml(rows) {
      rows = rows.filter(function (r) { return r && r[1]; });
      return rows.length ? '<dl class="facts">' + rows.map(function (r) { return '<dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd>'; }).join('') + '</dl>' : '';
    }
    function permaHtml(text, x) {
      var link = local(x.url) && !/^\/(?:reading|watching|watched)\/?$/.test(x.url) ? '<a href="' + esc(x.url) + '">Permalink</a>' : '';
      return text || link ? '<div class="perma">' + ic('link') + '<span>' + esc(text) + '</span>' + link + '</div>' : '';
    }
    /* the short summary in the page data is sometimes only a card's leftovers
       ("Season 1 My Rating Scale", "Watch on YouTube"); those are not a summary */
    function sumOf(x) {
      var s = String(x.sum || '').replace(/My Rating Scale\s*↗?/gi, ' ').replace(/▶?\s*Watch on YouTube/gi, ' ').replace(/\bSeason\s+\d+\b/gi, ' ').replace(/\s+/g, ' ').trim();
      return s.length >= 40 ? x.sum : '';
    }
    function synHtml(p, x, label) {
      var h = '';
      if (p && (p.syn || p.tag)) h += '<div class="lbl">' + label + '</div>' + (p.tag ? '<p class="tagline">' + esc(p.tag) + '</p>' : '') + (p.syn ? '<p class="summary">' + esc(p.syn) + '</p>' : '');
      if (p && p.thoughts.length) h += '<div class="lbl">My thoughts</div><div class="thoughts">' + p.thoughts.map(function (s) { return '<p class="summary">' + esc(s) + '</p>'; }).join('') + '</div>';
      /* the short summary from the page data only stands in until the post itself has been read */
      if (!h && sumOf(x) && !p) h = '<div class="lbl">Summary</div><p class="summary">' + esc(sumOf(x)) + '</p>';
      return h;
    }
    function bookLinks(x, p) {
      var isbn = p && p.isbn, qv = isbn || (x.t + (x.who ? ' ' + x.who : ''));
      if (!qv) return '';
      var e = encodeURIComponent(qv);
      return '<div class="lbl">Get the book</div><div class="btns">' + ext('Amazon', 'https://www.amazon.com/s?k=' + e) + ext('Bookshop.org', 'https://bookshop.org/books?keywords=' + e) + ext('Nook', 'https://www.barnesandnoble.com/s/' + e) + '</div>' +
        (isbn ? '<div class="lbl">On Micro.blog</div><div class="btns">' + ext('Add to my bookshelf', 'https://micro.blog/books/' + isbn, 'solid') + '</div><p class="hint">Opens this book on Micro.blog, where members pick a shelf.</p>' : '');
    }
    function epsHtml(x, t) {
      var eps = (t && t.eps) || []; if (!eps.length) return '';
      var cur = x.ep || 0, st = (t && t.st) || {};
      var open = OPENEPS[x.id], from = open ? 0 : Math.max(0, cur - 3), to = open ? eps.length : Math.min(eps.length, Math.max(cur, 1) + 2);
      var rows = eps.slice(from, to).map(function (e) {
        var seen = cur && e.n < cur, now = cur && e.n === cur, later = !seen && !now;
        var th = st[e.n] ? '<span class="eth">' + img(st[e.n]) + (seen ? '<em>' + ic('check') + '</em>' : '') + '</span>' : '<span class="enum' + (seen ? ' seen' : '') + (now ? ' now' : '') + '">' + (seen ? ic('check') : e.n) + '</span>';
        var meta = now ? 'Watching now' : [airDate(e.air), e.rt ? e.rt + ' min' : ''].filter(Boolean).join(' · ');
        return '<li class="ep' + (now ? ' now' : '') + (later ? ' later' : '') + (st[e.n] ? ' pic' : '') + '">' + th + '<span class="etx"><span class="en"><b>E' + e.n + '</b>' + (e.t ? ' · ' + esc(e.t) : '') + '</span>' +
          (meta ? '<span class="em">' + esc(meta) + '</span>' : '') + (seen && e.ov ? '<span class="es">' + esc(e.ov) + '</span>' : '') + '</span></li>';
      }).join('');
      var more = eps.length - (to - from);
      return '<div class="lbl">Season ' + x.season + '</div><ul class="eps">' + rows + '</ul>' +
        (more > 0 ? '<button type="button" class="epmore" data-eps="' + x.id + '">Show all ' + eps.length + ' episodes</button>' : (open && eps.length > 5 ? '<button type="button" class="epmore" data-eps="' + x.id + '">Show fewer</button>' : ''));
    }
    var OPENEPS = {};
    /* the body under the header: built from what is known now, rebuilt as Trakt and the post arrive */
    function bodyHtml(x) {
      var p = P[x.url] || null, t = T[x.id] || null, done = x.sec === 'history', h = '';
      if (t && t.eps && t.eps.length && !x.eps && x.sec === 'watching') { x.eps = t.eps.length; var rt0 = 0; t.eps.forEach(function (q) { if (q.n === x.ep) rt0 = q.rt; }); if (!x.rt && rt0) x.rt = rt0; }
      if (x.sec === 'watching' && x.kind === 'TV') {
        var e = null; ((t && t.eps) || []).forEach(function (q) { if (q.n === x.ep) e = q; });
        var small = [e && e.rt ? e.rt + ' min' : (x.rt ? x.rt + ' min' : ''), e && e.air ? 'aired ' + airDate(e.air) : '', left(x) ? left(x).replace(/^(\d+) left/, function (m, n) { return n + (n === '1' ? ' episode left' : ' episodes left'); }) : ''].filter(Boolean).join(' · ');
        var name = (e && e.t) || x.epn;
        var val = x.ep ? 'E' + x.ep + (name ? ' · ' + esc(name) : '') : (x.season ? 'Season ' + x.season : '');
        if (val) h += '<div class="prog"><div class="lbl first">Now on</div><div class="pv">' + val + (small ? '<span class="left">' + esc(small) + '</span>' : '') + '</div>' + (pct(x) >= 0 ? '<div class="bar"><i style="width:' + pct(x) + '%"></i></div>' : '') + '</div>';
        var ov = (e && e.ov) || (p && p.syn) || sumOf(x);
        if (ov) h += '<p class="summary epsum">' + esc(ov) + '</p>';
        h += epsHtml(x, t);
        if (t && t.show && (t.show.ov || t.show.genres.length)) {
          var chips = t.show.genres.slice(0, 4).map(cap).concat([t.show.cert, t.show.net, cap(t.show.status)]).filter(Boolean);
          h += '<div class="lbl">About the show</div>' + (t.show.ov ? '<p class="summary">' + esc(t.show.ov) + '</p>' : '') + (chips.length ? '<div class="chips">' + chips.map(function (c) { return '<span>' + esc(c) + '</span>'; }).join('') + '</div>' : '');
        }
        if (p && p.thoughts.length) h += '<div class="lbl">My thoughts</div><div class="thoughts">' + p.thoughts.map(function (s) { return '<p class="summary">' + esc(s) + '</p>'; }).join('') + '</div>';
        var tb = '';
        if (t && t.slug) tb += ext('More on Trakt', 'https://trakt.tv/shows/' + encodeURIComponent(t.slug));
        else if (!local(x.url) && x.url) tb += ext('More on Trakt', x.url);
        if (p && p.where) tb += ext('Where to watch', p.where);
        if (tb) h += '<div class="btns">' + tb + '</div>';
        return h + permaHtml(x.d ? (local(x.url) ? 'Last posted ' : 'Last watched ') + x.d : '', x);
      }
      if (x.kind === 'Book') {
        if (!done) {
          var pv = esc(where(x)) + (x.page && x.total && x.pct >= 0 ? ' · ' + x.pct + '%' : '');
          h += '<div class="prog"><div class="lbl first">Progress</div><div class="pv">' + pv + (x.page && x.total && x.total > x.page ? '<span class="left">' + (x.total - x.page) + ' pages to go</span>' : '') + '</div>' + (pct(x) >= 0 ? '<div class="bar"><i style="width:' + pct(x) + '%"></i></div>' : '') + '</div>';
        } else h += rateHtml(x, p);
        var bf = p && p.facts.length ? p.facts : [['Author', x.who], ['Published', x.y]];
        h += factsHtml(bf);
        h += synHtml(p, x, 'About the book');
        h += bookLinks(x, p);
        return h + permaHtml(done ? 'Finished ' + (x.date || x.d) : (x.date || x.d ? 'Started ' + (x.date || x.d) : ''), x);
      }
      /* a movie or a show he rated, or a movie he is watching */
      if (done) h += rateHtml(x, p);
      var mf = p && p.facts.length ? p.facts : [[x.kind === 'TV' ? 'Created by' : 'Director', x.who], ['Released', x.y]];
      h += factsHtml(mf);
      h += synHtml(p, x, 'Synopsis');
      var b = '';
      if (p && p.where) b += ext('Where to watch', p.where);
      if (p && p.trailer) b += ext('Trailer', p.trailer);
      if (p && p.trakt) b += ext('More on Trakt', p.trakt);
      else if (p && p.tmdb && !p.where) b += ext('More on TMDB', p.tmdb);
      else if (!local(x.url) && x.url) b += ext('More on Trakt', x.url);
      if (b) h += '<div class="btns">' + b + '</div>';
      return h + permaHtml(done ? 'Finished ' + (x.date || x.d) : (x.d ? 'Started ' + x.d : ''), x);
    }
    function rateHtml(x, p) {
      return '<div class="rate">' + stars(x.r) + '<b>' + rtext(x.r) + ' of 5</b>' + (p && p.scale ? '<a class="scale" href="' + esc(p.scale) + '">My rating scale</a>' : '') + '</div>';
    }
    function headHtml(x) {
      var done = x.sec === 'history', t = T[x.id];
      if (t && t.eps && t.eps.length && !x.eps && x.sec === 'watching') x.eps = t.eps.length;
      var meta = x.kind === 'Book' ? 'Book' + (x.y ? ' · ' + esc(x.y) : '') : (x.kind === 'TV' ? 'TV' : 'Movie') + ((x.y || (t && t.show && t.show.y)) ? ' · ' + esc(x.y || t.show.y) : '') + (x.kind === 'TV' && t && t.show && t.show.net && !done ? ' · ' + esc(t.show.net) : '');
      var sub = '';
      if (x.kind === 'Book') sub = x.who ? 'by ' + esc(x.who) : '';
      else if (x.kind === 'TV') sub = x.season ? 'Season ' + x.season + (!done && x.ep ? ' · Episode ' + x.ep + (x.eps ? ' of ' + x.eps : '') : '') : '';
      var w = x.kind === 'Book' ? '' : wideArt(x);
      var info = '<div class="info"><div class="meta">' + meta + '</div><h2>' + esc(x.t) + '</h2>' + (sub ? '<div class="sub2">' + sub + '</div>' : '') + '</div>';
      if (w) return '<div class="dhero" style="background:' + grad(x) + '">' + img(w, 'hpic') + info + '</div>';
      var bg = x.cover ? img(x.cover, 'bgimg') : '';
      return '<div class="dtop"><div class="bg" style="background:' + (x.kind === 'Book' ? bookBg(x) : grad(x)) + '"></div>' + bg + '<div class="art">' + art(x) + '</div>' + info + '</div>';
    }
    function detail(x) {
      if (!x) return '<p class="none pad">Pick something on the left.</p>';
      var hh = headHtml(x), bh = bodyHtml(x);
      LAST[x.id] = { h: hh, b: bh };
      return '<div class="dx" data-dx="' + esc(x.id) + '"><div class="dxhead">' + hh + '</div><div class="dbody">' + bh + '</div></div>';
    }
    /* fill in what arrives after the screen opens; only the part that changed is redrawn */
    var LAST = {};
    function patch(x) {
      var hh = headHtml(x), bh = bodyHtml(x), was = LAST[x.id] || {};
      [].forEach.call(root.querySelectorAll('.dx'), function (el) {
        if (el.getAttribute('data-dx') !== x.id) return;
        var he = el.querySelector('.dxhead'), be = el.querySelector('.dbody');
        if (he && was.h !== hh) he.innerHTML = hh;
        if (be && was.b !== bh) be.innerHTML = bh;
      });
      LAST[x.id] = { h: hh, b: bh };
    }
    function hydrate(x) {
      if (!x) return;
      loadPost(x).then(function (p) { if (p) patch(x); });
      if (x.sec === 'watching') loadShow(x).then(function (t) { if (t) { patch(x); paintCards(); } });
    }
    function setName(t) { if (hbName) hbName.textContent = t; }
    function show(v, on) { v.classList.toggle('off', !on); v.setAttribute('aria-hidden', on ? 'false' : 'true'); if (!on) v.inert = true; else v.inert = false; }
    function render() {
      var s = state;
      if (s.view === 'home') { show(vList, false); show(vDetail, false); setName(ctx.app[0]); return; }
      var x = s.id ? get(s.id) : null;
      if (two()) {
        /* landscape: list left, details right */
        if (!x || x.sec !== s.sec) { var it = listItems(); x = it[0] || null; s.id = x ? x.id : null; }
        vList.innerHTML = '<div class="panes"><div class="pane left">' + filtersHtml() + '<div class="pscroll lrows">' + listRows() + '</div></div>' +
          '<div class="pane right"><div class="pscroll rdet">' + detail(x) + '</div></div></div>';
        show(vList, true); show(vDetail, false); setName(SECTIONS[s.sec].title);
        hydrate(x);
        var sel = vList.querySelector('.li.sel'); if (sel && sel.scrollIntoView) { var lr = vList.querySelector('.lrows'); if (sel.offsetTop > lr.clientHeight - 60) lr.scrollTop = sel.offsetTop - 80; }
        return;
      }
      if (s.sec) {
        var keep = vList.querySelector('.lrows'), y = keep && vList.getAttribute('data-sec') === s.sec ? keep.scrollTop : 0;
        vList.innerHTML = filtersHtml() + '<div class="pscroll lrows">' + listRows() + '</div>';
        vList.setAttribute('data-sec', s.sec);
        vList.querySelector('.lrows').scrollTop = y;
      }
      show(vList, !!s.sec && (s.view === 'list' || (s.view === 'detail' && s.fromList)));
      if (s.view === 'detail' && x) {
        vDetail.innerHTML = '<div class="pscroll">' + detail(x) + '</div>';
        show(vDetail, true); setName(x.t);
        hydrate(x);
      } else { show(vDetail, false); setName(SECTIONS[s.sec] ? SECTIONS[s.sec].title : ctx.app[0]); }
    }
    function go(next, push) {
      state = next;
      var hs = next.view === 'home' ? null : { hxd: 1, view: next.view, sec: next.sec, id: next.id, filter: next.filter, fromList: !!next.fromList };
      try { if (push) history.pushState(hs, ''); else history.replaceState(hs, ''); } catch (e) {}
      render();
    }
    function openList(sec, id) { go({ view: 'list', sec: sec, id: id || null, filter: 'All' }, true); }
    function openItem(id) {
      var x = get(id); if (!x) return;
      if (two()) {
        if (state.view !== 'home' && state.sec === x.sec) { state.id = id; go(state, false); var rd = vList.querySelector('.rdet'); if (rd) rd.scrollTop = 0; return; }
        openList(x.sec, id); return;
      }
      go({ view: 'detail', sec: x.sec, id: id, filter: state.filter, fromList: state.view === 'list' && state.sec === x.sec }, true);
      vDetail.querySelector('.pscroll').scrollTop = 0;
    }
    window.addEventListener('popstate', function (e) {
      var s = e.state;
      state = s && s.hxd ? { view: s.view, sec: s.sec, id: s.id, filter: s.filter || 'All', fromList: s.fromList } : { view: 'home', sec: null, id: null, filter: 'All' };
      render();
    });
    /* the app bar's back closes the open list / detail first */
    ctx.bar.addEventListener('click', function (e) {
      if (state.view !== 'home' && e.target.closest('.hb-back')) { e.preventDefault(); e.stopPropagation(); history.back(); }
      /* the Den icon and name go all the way back to Den's main screen (Nov 3) */
      else if (state.view !== 'home' && e.target.closest('.hb-app')) { e.preventDefault(); e.stopPropagation(); history.go(state.view === 'detail' && state.fromList ? -2 : -1); }
    }, true);

    root.addEventListener('click', function (e) {
      var t = e.target;
      var em = t.closest('[data-eps]'); if (em) { var ex = get(em.getAttribute('data-eps')); if (ex) { OPENEPS[ex.id] = !OPENEPS[ex.id]; patch(ex); } return; }
      var o = t.closest('[data-open]'); if (o) { openList(o.getAttribute('data-open')); return; }
      var f = t.closest('[data-f]'); if (f) { state.filter = f.getAttribute('data-f'); state.id = null; go(state, false); return; }
      var p = t.closest('[data-pick]'); if (p) { openItem(p.getAttribute('data-pick')); return; }
    });
    /* the post starts loading as the finger goes down, so it is usually
       there by the time the screen has slid in */
    root.addEventListener('pointerdown', function (e) { var p = e.target.closest && e.target.closest('[data-pick]'); if (p) { var x = get(p.getAttribute('data-pick')); if (x) { loadPost(x); if (x.sec === 'watching') loadShow(x); } } }, { passive: true });
    /* app bar shadow follows the scroll of whichever view is on top */
    root.addEventListener('scroll', function (e) {
      if (e.target.classList && (e.target.classList.contains('hxd-scroll') || e.target.classList.contains('pscroll'))) ctx.bar.classList.toggle('scrolled', e.target.scrollTop > 4);
    }, true);
    if (mq.addEventListener) mq.addEventListener('change', render); else if (mq.addListener) mq.addListener(render);

    /* ---------- Currently watching: follow the /watching/ page's own list ---------- */
    function readGrid() {
      if (!grid) return null;
      var cnt = document.getElementById('watching-count');
      if (!grid.children.length && (!cnt || /loading/i.test(cnt.textContent))) return null;
      var byNorm = {}; WATCH_POSTS.forEach(function (x) { byNorm[x.n || norm(x.t)] = x; });
      var out = [];
      [].forEach.call(grid.querySelectorAll('.wr-card'), function (card, i) {
        var a = card.querySelector('.wr-name'); if (!a) return;
        var t = a.textContent.trim(), n = norm(t), href = a.getAttribute('href') || '';
        var prog = ((card.querySelector('.wr-prog-text') || {}).textContent || '').trim();
        var season = +((prog.match(/Season\s+(\d+)/i) || [])[1] || 0);
        var dtx = ((card.querySelector('.wr-date') || {}).textContent || '').replace(/^(Last watched|Started)\s+/i, '').trim();
        var dt = new Date(dtx), d = isNaN(dt) ? '' : dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        var im = card.querySelector('img.wr-cover'), cover = im ? im.getAttribute('src') : '';
        var p = byNorm[n];
        /* newest wins (Nov 5): the Watching page links the card to Trakt
           when Trakt is newer than the post, so the post isn't used here */
        if (p && p.url) { try { if (new URL(href, location.href).pathname !== new URL(p.url, location.href).pathname) p = null; } catch (er) {} }
        /* Trakt's latest episode, number, name and season size (data-* on the card) */
        var tslug = card.getAttribute('data-slug') || '', ttmdb = +(card.getAttribute('data-tmdb') || 0);
        var tep = +(card.getAttribute('data-ep') || 0), tepn = card.getAttribute('data-epn') || '', teps = +(card.getAttribute('data-eps') || 0), trt = +(card.getAttribute('data-rt') || 0);
        if (p) {
          var c = {}; for (var k in p) c[k] = p[k];
          if (season > (c.season || 0)) { c.season = season; c.ep = 0; c.eps = 0; c.epn = ''; }
          if (tep && season >= (c.season || 0) && tep >= (c.ep || 0)) { c.ep = tep; c.epn = tepn || (tep === c.ep ? c.epn : ''); if (teps) c.eps = teps; }
          if (trt) c.rt = trt;
          else if (teps && !c.eps && season === c.season) c.eps = teps;
          if (!c.cover && cover) c.cover = cover;
          if (tslug) c.slug = tslug; if (ttmdb) c.tmdb = ttmdb;
          if (d && /Last watched/i.test((card.querySelector('.wr-date') || {}).textContent || '')) c.d = d;
          out.push(c);
        } else {
          out.push({ id: 't' + n, sec: 'watching', kind: /movie/i.test(prog) ? 'Movie' : 'TV', t: t, n: n, season: season, ep: tep, eps: teps, epn: tepn, rt: trt, y: '', cover: cover, url: href, d: d, date: dtx, sum: '', slug: tslug, tmdb: ttmdb });
        }
      });
      return out;
    }
    var lastSig = '';
    function syncWatch() {
      var g = readGrid(); if (!g) return;
      var sig = JSON.stringify(g.map(function (x) { return [x.id, x.season, x.ep, x.eps, x.epn, x.rt, x.cover, x.d]; }));
      if (sig === lastSig) return;
      lastSig = sig;
      WATCH = tag(g, 'watching');
      renderHome();
      if (state.view !== 'home' && (state.sec === 'watching')) { if (state.id && !get(state.id)) state.id = null; render(); }
    }
    if (grid && window.MutationObserver) {
      var tmr = 0;
      new MutationObserver(function () { clearTimeout(tmr); tmr = setTimeout(syncWatch, 60); }).observe(grid.parentNode || grid, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['data-ep', 'data-eps', 'data-epn', 'data-rt', 'src'] });
    }

    /* ---------- go ---------- */
    renderHome();
    syncWatch();
    var hs0 = history.state;
    if (hs0 && hs0.hxd) { state = { view: hs0.view, sec: hs0.sec, id: hs0.id, filter: hs0.filter || 'All', fromList: hs0.fromList }; }
    render();
  };
})();

/* ------------------------------------------------------------------
   NOW app (Hutch OS, Nov 2, 2026, mockup v38)
   The same /now page, as a dashboard of cards: same sections, same
   order, same links. Nothing is fetched or worked out again: the app
   reads what the {{< now >}} shortcode rendered (.tg-now), including
   the Watching row its own script fills in from Trakt, and keeps
   watching it (MutationObserver) so a late Trakt update shows here too.
   A section the page leaves out (or hides) is left out here.
   Landscape: two columns of cards, Directory across the bottom.
   ------------------------------------------------------------------ */
(function () {
  window.HutchApps = window.HutchApps || {};
  HutchApps.now = function (ctx) {
    var src = document.querySelector((ctx.data && ctx.data.from) || '.tg-now');
    if (!src || !src.querySelector('.tgn-sec')) return;
    var esc = ctx.esc;
    function $(s, r) { return (r || src).querySelector(s); }
    function $$(s, r) { return [].slice.call((r || src).querySelectorAll(s)); }
    function txt(n) { return n ? n.textContent.replace(/\s+/g, ' ').trim() : ''; }
    function href(n) { return n ? n.getAttribute('href') || '' : ''; }
    function words(s) { return s.replace(/^\/+|\/+$/g, '').split(/[-_\/]+/).map(function (w) { return w ? w.charAt(0).toUpperCase() + w.slice(1) : w; }).join(' '); }
    /* a node's inline content (text + links), copied, never moved */
    function inner(n) { var d = document.createElement('span'); if (n) [].forEach.call(n.childNodes, function (c) { d.appendChild(c.cloneNode(true)); }); return d.innerHTML; }

    function head(sec, extra) {
      var k = $('.tgn-kicker', sec), h = $('.tgn-h', sec), s = $('.tgn-head .tgn-src', sec);
      var right = extra || (s ? (s.tagName === 'A' ? '<a class="nw-from" href="' + esc(href(s)) + '"' + (/^https?:/.test(href(s)) && href(s).indexOf(location.host) < 0 ? ' rel="noopener"' : '') + '>' + esc(txt(s)) + '</a>' : '<span class="nw-tag">' + esc(txt(s)) + '</span>') : '');
      return '<div class="nw-ch"><div><div class="nw-lab">' + esc(txt(k)) + '</div><div class="nw-h" role="heading" aria-level="2">' + esc(txt(h)) + '</div></div>' + right + '</div>';
    }

    /* ---------- one card per section ---------- */
    var CARD = {
      watching: function (sec) {
        if (sec.hidden) return '';
        var ps = $$('.tgn-poster', sec);
        if (!ps.length) return '';
        return '<section class="nw-card" data-k="watching">' + head(sec) + '<div class="nw-posters">' + ps.map(function (a) {
          var img = $('img.tgn-poster-img', a), meta = txt($('.tgn-poster-meta', a)), t = txt($('.tgn-poster-title', a)), h = href(a);
          var tag = h ? 'a href="' + esc(h) + '"' + (a.rel ? ' rel="' + esc(a.rel) + '"' : '') : 'div';
          return '<' + tag + ' class="nw-pst"><span class="nw-art">' + (img ? '<img src="' + esc(img.getAttribute('src')) + '" alt="" loading="lazy" decoding="async">' : '<span class="nw-blank" aria-hidden="true">🍿</span>') + '</span>' +
            '<b>' + esc(t) + '</b><small>' + esc(meta) + '</small></' + tag.split(' ')[0] + '>';
        }).join('') + '</div></section>';
      },
      reading: function (sec) {
        var a = $('.tgn-book', sec); if (!a) return '';
        var img = $('img.tgn-book-cover', a), t = txt($('.tgn-book-title', a)), fill = $('.tgn-bar-fill', a);
        var pct = fill ? fill.style.width : '', smalls = $$('.tgn-small', a).map(function (s) { return '<small>' + esc(txt(s)) + '</small>'; }).join('');
        return '<section class="nw-card" data-k="reading">' + head(sec) + '<a class="nw-book" href="' + esc(href(a)) + '">' +
          '<span class="nw-cv">' + (img ? '<img src="' + esc(img.getAttribute('src')) + '" alt="" loading="lazy" decoding="async">' : '') + '<span>' + esc(t) + '</span></span>' +
          '<span class="nw-bk"><b>' + esc(t) + '</b>' + smalls + (pct ? '<span class="nw-bar"><i style="width:' + esc(pct) + '"></i></span>' : '') + '</span>' +
          (pct ? '<span class="nw-pct">' + esc(pct.replace(/\s/g, '')) + '</span>' : '') + '</a></section>';
      },
      photo: function (sec) {
        var a = $('.tgn-photo a', sec), img = $('.tgn-photo img', sec); if (!a || !img) return '';
        var cap = $('.tgn-photo figcaption', sec), t = txt($('.tgn-cap-title', cap)), d = txt($('time', cap));
        return '<section class="nw-card" data-k="photo">' + head(sec) + '<a class="nw-photo" href="' + esc(href(a)) + '"><img src="' + esc(img.getAttribute('src')) + '" alt="' + esc(img.getAttribute('alt') || '') + '" loading="lazy" decoding="async">' +
          '<span class="nw-cap"><small>' + esc(d) + '</small>' + (t ? '<b>' + esc(t) + '</b>' : '') + '</span></a></section>';
      },
      writing: function (sec) {
        var dots = $('.tgn-dots', sec); if (!dots) return '';
        var on = $$('i.on', dots).length, all = $$('i', dots).length, body = $('.tgn-writing-body', sec);
        var count = $('.tgn-count', body);
        return '<section class="nw-card" data-k="writing">' + head(sec) + '<div class="nw-writing"><div class="nw-dots" role="img" aria-label="' + esc(dots.getAttribute('aria-label') || '') + '">' +
          new Array(all + 1).join('.').split('').map(function (x, i) { return '<i' + (i < on ? ' class="on"' : '') + '></i>'; }).join('') + '</div>' +
          '<div class="nw-wbody"><span class="nw-count">' + inner(count) + '</span>' + $$('.tgn-small', body).map(function (s) { return '<small>' + inner(s) + '</small>'; }).join('') + '</div></div></section>';
      },
      building: function (sec) {
        var bs = $$('.tgn-build', sec); if (!bs.length) return '';
        return '<section class="nw-card" data-k="building">' + head(sec) + '<div class="nw-projects">' + bs.map(function (b) {
          var img = $('img', b);
          return '<div class="nw-proj"><span class="nw-pi' + (img && img.classList.contains('tgn-icon--tint') ? ' nw-tint' : '') + '">' + (img ? '<img src="' + esc(img.getAttribute('src')) + '" alt="" loading="lazy" decoding="async">' : '') + '</span>' +
            '<b>' + esc(txt($('.tgn-build-name', b))) + '</b><small>' + inner($('.tgn-small', b)) + '</small></div>';
        }).join('') + '</div></section>';
      },
      making: function (sec) {
        var a = $('.tgn-make', sec); if (!a) return '';
        var img = $('img', a), b = txt($('b', a)), s = txt($('.tgn-small', a)).replace(b, '').replace(/^\s*·\s*/, '');
        return '<section class="nw-card" data-k="making">' + head(sec) + '<a class="nw-photo' + (img ? '' : ' nw-noimg') + '" href="' + esc(href(a)) + '">' + (img ? '<img src="' + esc(img.getAttribute('src')) + '" alt="" loading="lazy" decoding="async">' : '') +
          '<span class="nw-cap"><small>' + esc(s) + '</small><b>' + esc(b) + '</b></span></a></section>';
      },
      dir: function (sec) {
        var APP = { about: ['about', '#1E2D4A'], now: ['now', '#7A8F6A'], photo: ['photos', '#3F7FA6'], uses: ['uses', '#5B7A8C'], contact: ['contact', '#3E7C7A'] };
        var what = $('.tgn-subrow .tgn-src', sec);
        var slashes = $$('.tgn-slash', sec).map(function (s) {
          var code = txt($('code', s)), slug = code.replace(/^\/+|\/+$/g, ''), a = APP[slug] || ['blog', '#C4622D'], here = !s.getAttribute('href');
          var tag = here ? 'span aria-current="page"' : 'a href="' + esc(href(s)) + '"';
          return '<' + tag + ' class="nw-sl' + (here ? ' nw-here' : '') + '" title="' + esc(txt($('span', s))) + '"><span class="nw-ti" style="background:' + a[1] + '">' + ctx.ic(a[0]) + '</span>' + esc(words(slug)) + '<code>' + esc(code) + '</code></' + tag.split(' ')[0] + '>';
        }).join('');
        var subs = $$('.tgn-subrow .tgn-sub', sec);
        var pills = $$('.tgn-chip', sec).map(function (c) { return '<a href="' + esc(href(c)) + '">' + esc(words(txt(c))) + '</a>'; }).join('');
        var right = what ? '<a class="nw-what" href="' + esc(href(what)) + '" rel="noopener">' + esc(txt(what)) + '</a>' : '';
        return '<section class="nw-card nw-full" data-k="dir">' + head(sec, right) + (slashes ? '<div class="nw-slash">' + slashes + '</div>' : '') +
          (pills ? '<div class="nw-morel">' + esc(txt(subs[1]) || 'More pages') + '</div><div class="nw-pills">' + pills + '</div>' : '') + '</section>';
      },
      other: function (sec) { /* a section added to the page later: its content as is */
        var body = [].slice.call(sec.children).filter(function (c) { return !c.classList.contains('tgn-head'); });
        return '<section class="nw-card nw-other">' + head(sec) + '<div class="nw-raw">' + body.map(function (c) { return c.outerHTML; }).join('') + '</div></section>';
      }
    };
    function kind(sec) {
      var h = $('.tgn-h', sec), id = (h && h.id) || sec.id || '';
      var m = /tgn-(watching|reading|photo|writing|building|making|dir)/.exec(id);
      return m ? m[1] : 'other';
    }
    var LEFT = { watching: 1, reading: 1, writing: 1 };

    var root = ctx.el('<div class="hx-now" role="main"><div class="nw-scroll"><div class="nw-wrap"></div></div></div>');
    document.body.appendChild(root);
    var wrap = root.querySelector('.nw-wrap');
    /* a cover or poster that fails to load: hide it, the tile underneath shows instead */
    root.addEventListener('error', function (e) { if (e.target.tagName === 'IMG') e.target.classList.add('nw-bad'); }, true);

    function render() {
      var lede = $('.tgn-lede'), upd = $('#tgn-updated') || $('.tgn-updated time');
      var cards = $$('.tgn-sec').map(function (s) { var k = kind(s); return { k: k, h: (CARD[k] || CARD.other)(s) }; }).filter(function (c) { return c.h; });
      var dir = cards.filter(function (c) { return c.k === 'dir'; }), rest = cards.filter(function (c) { return c.k !== 'dir'; });
      var L = '', R = '', nl = 0, nr = 0;
      rest.forEach(function (c) {
        var left = c.k in LEFT ? true : c.k === 'other' ? nl <= nr : false;
        if (left) { L += c.h; nl++; } else { R += c.h; nr++; }
      });
      var foot = $('.tgn-foot');
      wrap.innerHTML = '<div class="nw-intro">' + (upd ? '<span class="nw-up"><i></i>Updated <time datetime="' + esc(upd.getAttribute('datetime') || '') + '">' + esc(txt(upd)) + '</time></span>' : '') +
          (lede ? '<p>' + esc(txt(lede)) + '</p>' : '') + '</div>' +
        '<div class="nw-grid nw-one">' + cards.map(function (c) { return c.h; }).join('') + '</div>' +
        '<div class="nw-grid nw-two"><div class="nw-col">' + L + '</div><div class="nw-col">' + R + '</div>' + dir.map(function (c) { return c.h; }).join('') + '</div>' +
        (foot ? '<p class="nw-foot">' + inner(foot) + '</p>' : '');
    }
    render();
    ctx.own();

    /* the page's own script can fill Watching (Trakt) and bump the date later */
    var t = null;
    function later() { clearTimeout(t); t = setTimeout(function () { var y = root.querySelector('.nw-scroll').scrollTop; render(); root.querySelector('.nw-scroll').scrollTop = y; }, 120); }
    if (window.MutationObserver) {
      var mo = new MutationObserver(function (list) {
        /* fitRow() on the page flips poster "hidden" flags; those don't matter here */
        if (list.some(function (r) { return !(r.type === 'attributes' && r.attributeName === 'hidden' && r.target.classList && r.target.classList.contains('tgn-poster')); })) later();
      });
      mo.observe(src, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['hidden', 'src', 'datetime'] });
    }
  };
})();

/* ---------- Photos app (/photo/), Hutch OS v32 mockup, Nov 2, 2026 ----------
   Always light, like a gallery wall (ignores the sky).
   Home: profile header, then the newest photo post big in its own card
   (Nov 5, mockup v62: "Newest" chip, how long ago, swipe through its
   photos, Read more; wide screens put the words beside the photo), then
   "More photos": a square grid of every older photo post's first photo,
   "+N" when the post holds more. 3 across on the phone, 4 on the
   unfolded screen upright, 6 when the screen is wide.
   Tap a square:
     phone / unfolded upright  a scrolling feed starting at that post:
       the photo big (swipe or tap for the post's other photos), date,
       title, a short caption, Read more.
     wide (sideways fold, desktop)  photo on the left, words on the
       right; arrows step through the post's photos, then on to the
       next post; Newer / Older jump a whole post.
   The phone's back gesture closes the feed before leaving the app.
   Data: partials/hutch-data/photos.html (same rules as the /photo page). */
(function () {
  window.HutchApps = window.HutchApps || {};
  HutchApps.photos = function (ctx) {
    var D = ctx.data;
    if (!D || !D.posts || !D.posts.length) return; /* no data: keep the Traditional page */
    var P = D.posts, esc = ctx.esc, de = document.documentElement;

    var IC = {
      open: '<path d="M14 4h6v6 M20 4l-9 9 M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
      stack: '<rect x="7" y="7" width="13" height="13" rx="2"/><path d="M4 16V6a2 2 0 0 1 2-2h10"/>',
      grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
      l: '<path d="M15 6l-6 6 6 6"/>', r: '<path d="M9 6l6 6-6 6"/>'
    };
    function ic(k) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IC[k] + '</svg>'; }
    /* Micro.blog's resizer for his uploads (same as the Photos category cards); the original if it fails */
    function sz(src, w) { return /cdn\.uploads\.micro\.blog/.test(src) ? 'https://cdn.micro.blog/photos/' + w + 'x/' + encodeURIComponent(src) : src; }
    function img(ph, w, alt, lazy) {
      return '<img src="' + esc(w ? sz(ph.s, w) : ph.s) + '" data-o="' + esc(ph.s) + '" alt="' + esc(alt) + '"' + (lazy ? ' loading="lazy"' : '') + ' decoding="async" draggable="false">';
    }
    function alt(p, k) { var a = p.ph[k].a; return a || (p.ph.length > 1 ? p.l + ', photo ' + (k + 1) + ' of ' + p.ph.length : p.l); }
    function more(n) { return n > 1 ? '<span class="hxp-pill">' + ic('stack') + '<span>+' + (n - 1) + ' more</span></span>' : ''; }
    function dots(n) { if (n < 2 || n > 10) return ''; var s = ''; for (var k = 0; k < n; k++) s += '<i' + (k ? '' : ' class="on"') + '></i>'; return '<span class="hxp-dots" aria-hidden="true">' + s + '</span>'; }
    function words(p, feed) {
      return '<time class="hxp-date" datetime="' + esc(p.d) + '">' + esc(p.dl) + '</time>' +
        (p.t || !feed ? '<h2 class="hxp-title">' + esc(p.t || p.l) + '</h2>' : '') +
        (p.c ? '<p class="hxp-cap">' + esc(p.c) + '</p>' : '');
    }
    function readMore(p) { return '<a class="hxp-read" href="' + esc(p.u) + '">Read more<span class="hxp-sr"> about ' + esc(p.l) + '</span>' + ic('open') + '</a>'; }

    function mode() { var w = innerWidth, h = innerHeight; return w >= 800 && w > h ? 'land' : (w >= 600 ? 'port' : 'phone'); }
    var M = mode();

    /* ---------- home: profile + grid ---------- */
    var face = ctx.page && ctx.page.avatar ? '<img src="' + esc(ctx.page.avatar) + '" alt="">' : 'T';
    var tiles = P.map(function (p, i) {
      if (!i) return ''; /* the newest one has its own card */
      var n = p.ph.length;
      return '<a class="hxp-tile" href="' + esc(p.u) + '" data-i="' + i + '" aria-label="' + esc(p.l + ', ' + p.dl + (n > 1 ? ', ' + n + ' photos' : '')) + '">' +
        img(p.ph[0], 400, '', i > 11) + (n > 1 ? '<span class="hxp-plus" aria-hidden="true">+' + (n - 1) + '</span>' : '') + '</a>';
    }).join('');
    /* ---------- the newest photo post, big (Nov 5, mockup v62) ---------- */
    function ago(p) {
      var t = Date.parse(p.ts || ''), s = t ? (Date.now() - t) / 1000 : -1;
      if (s < 0) return '';
      var n = function (v, u) { v = Math.max(1, Math.floor(v)); return v + ' ' + u + (v === 1 ? '' : 's') + ' ago'; };
      if (s < 3600) return n(s / 60, 'minute');
      if (s < 86400) return n(s / 3600, 'hour');
      if (s < 172800) return 'Yesterday';
      if (s < 604800) return n(s / 86400, 'day');
      if (s < 2592000) return n(s / 604800, 'week');
      if (s < 31536000) return n(s / 2592000, 'month');
      return '';
    }
    var N = P[0], NN = N.ph.length, NA = ago(N);
    var newest = '<section class="hxp-new" aria-label="Newest photo">' +
      '<div class="hxp-nhead"><span class="hxp-chip"><i aria-hidden="true"></i>Newest</span>' + (NA ? '<time class="hxp-ago" datetime="' + esc(N.ts) + '">' + esc(NA) + '</time>' : '') + '</div>' +
      '<div class="hxp-ncard">' +
        '<div class="hxp-nshot" role="link" tabindex="0" aria-label="' + esc('Open ' + N.l + (NN > 1 ? ', ' + NN + ' photos' : '')) + '"><div class="hxp-car">' +
          N.ph.map(function (ph, k) { return '<figure>' + img(ph, M === 'phone' ? 800 : 1200, alt(N, k), k > 0) + '</figure>'; }).join('') + '</div>' + more(NN) + dots(NN) + '</div>' +
        '<div class="hxp-nwords"><time class="hxp-date" datetime="' + esc(N.d) + '">' + esc(N.dl) + '</time>' +
          (N.t ? '<h2 class="hxp-title">' + esc(N.t) + '</h2>' : '') + (N.c ? '<p class="hxp-cap">' + esc(N.c) + '</p>' : '') +
          (NN > 1 ? '<div class="hxp-thumbs hxp-nthumbs">' + N.ph.map(function (ph, j) { return '<button type="button" data-nk="' + j + '"' + (j ? '' : ' class="on" aria-current="true"') + ' aria-label="Photo ' + (j + 1) + ' of ' + NN + '">' + img(ph, 400, '', true) + '</button>'; }).join('') + '</div>' : '') +
          '<div class="hxp-nact">' + readMore(N) + '</div></div>' +
      '</div></section>';
    var older = P.slice(1), olderPh = older.reduce(function (s, p) { return s + p.ph.length; }, 0);
    var moreHead = older.length ? '<div class="hxp-mhead"><h2>More photos</h2><span>' + older.length + (older.length === 1 ? ' post' : ' posts') + ' · ' + olderPh + (olderPh === 1 ? ' photo' : ' photos') + '</span></div>' : '';
    var counts = '<div class="hxp-counts"><span><strong>' + P.length + '</strong>' + (P.length === 1 ? 'post' : 'posts') + '</span><span><strong>' + D.photos + '</strong>' + (D.photos === 1 ? 'photo' : 'photos') + '</span></div>';
    var root = ctx.el('<div class="hx-photos" data-mode="' + M + '">' +
      '<main class="hxp-home" aria-label="Photos">' +
        '<header class="hxp-prof"><div class="hxp-face">' + face + '</div><div class="hxp-info"><h1>' + esc((ctx.page && ctx.page.site) || 'Toby Geeks Out!') + '</h1><p class="hxp-bio">' + esc(D.bio || '') + '</p></div>' + counts + '</header>' +
        newest + moreHead + (older.length ? '<div class="hxp-grid">' + tiles + '</div>' : '') +
      '</main>' +
      '<section class="hxp-det" aria-label="Photo post" aria-hidden="true"></section></div>');
    var det = root.querySelector('.hxp-det');
    /* the gallery, one tap away while a photo is open (Nov 3, Toby: "from a
       widget, if they want more photos, either keep going or go to the
       gallery"). Bottom right on the phone, where Surprise me sits on
       posts; between Newer and Older on the wide screens. */
    var gal = ctx.el('<button type="button" class="hxp-gal" data-gallery aria-label="All photos" title="All photos">' + ic('grid') + '</button>');
    root.appendChild(gal);
    document.body.appendChild(root);
    de.classList.add('hxp-on');
    ctx.own();

    /* the newest card: swipe through its photos (the pill, dots and, on
       wide screens, the thumbnails follow); a tap opens the photo feed
       at the photo showing */
    var nshot = root.querySelector('.hxp-nshot'), ncar = nshot.querySelector('.hxp-car');
    if (NN > 1) {
      var npill = nshot.querySelector('.hxp-pill span'), ndots = nshot.querySelectorAll('.hxp-dots i'), nlast = 0, nraf = 0;
      ncar.addEventListener('scroll', function () {
        if (nraf) return;
        nraf = requestAnimationFrame(function () {
          nraf = 0;
          var k = Math.max(0, Math.min(NN - 1, at(ncar)));
          if (k === nlast) return;
          nlast = k;
          if (npill) npill.textContent = k ? (k + 1) + ' / ' + NN : '+' + (NN - 1) + ' more';
          [].forEach.call(ndots, function (d, j) { d.classList.toggle('on', j === k); });
          [].forEach.call(root.querySelectorAll('[data-nk]'), function (b, j) { b.classList.toggle('on', j === k); if (j === k) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
          var nx = ncar.querySelectorAll('img')[k + 1]; if (nx) nx.removeAttribute('loading');
        });
      }, { passive: true });
    }

    /* a resized photo that will not load falls back to the original */
    root.addEventListener('error', function (e) {
      var t = e.target;
      if (t && t.tagName === 'IMG' && t.getAttribute('data-o') && t.src !== t.getAttribute('data-o')) t.src = t.getAttribute('data-o');
    }, true);

    /* the browser bar stays white too (custom_footer.html re-sets it to the sky) */
    function tint() { var m = document.querySelector('meta[name="theme-color"]'); if (!m) { m = document.createElement('meta'); m.name = 'theme-color'; document.head.appendChild(m); } m.setAttribute('content', '#FFFFFF'); }
    tint(); setInterval(tint, 20000);

    /* ---------- carousels: swipe, or tap for the next photo ---------- */
    function at(car) { return car.clientWidth ? Math.round(car.scrollLeft / car.clientWidth) : 0; }
    function goPhoto(car, k, smooth) { car.scrollTo({ left: k * car.clientWidth, behavior: smooth ? 'smooth' : 'auto' }); }
    function wire(box, p, onMove) {
      var car = box.querySelector('.hxp-car'), n = p.ph.length;
      if (!car || n < 2) return car;
      var pill = box.querySelector('.hxp-pill span'), ds = box.querySelectorAll('.hxp-dots i'), last = 0, raf = 0;
      car.addEventListener('scroll', function () {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = 0;
          var k = Math.max(0, Math.min(n - 1, at(car)));
          if (k === last) return;
          last = k;
          if (pill) pill.textContent = k ? (k + 1) + ' / ' + n : '+' + (n - 1) + ' more';
          [].forEach.call(ds, function (d, j) { d.classList.toggle('on', j === k); });
          if (onMove) onMove(k);
        });
      }, { passive: true });
      car.addEventListener('click', function () { goPhoto(car, (at(car) + 1) % n, true); });
      return car;
    }

    /* ---------- detail ---------- */
    var open = false, cur = 0, built = '';

    function feedHTML() {
      return '<div class="hxp-col">' + P.map(function (p, i) {
        var hero = p.ph.map(function (ph, k) { return '<figure>' + img(ph, 800, alt(p, k), k > 0 || i !== cur) + '</figure>'; }).join('');
        return '<article class="hxp-post" data-i="' + i + '"><div class="hxp-hero"><div class="hxp-car"' + (p.ph.length > 1 ? ' role="button" tabindex="0" aria-label="Next photo"' : '') + '>' + hero + '</div>' + more(p.ph.length) + dots(p.ph.length) + '</div>' +
          '<div class="hxp-text">' + words(p, true) + readMore(p) + '</div></article>';
      }).join('') + '</div>';
    }
    function buildFeed() {
      det.className = 'hxp-det hxp-feed' + (open ? ' on' : '');
      det.innerHTML = feedHTML();
      [].forEach.call(det.querySelectorAll('.hxp-post'), function (a) { wire(a, P[+a.getAttribute('data-i')]); });
      built = 'feed';
    }

    var stepK = 0;
    function showSplit(i, k) {
      cur = i; stepK = k || 0;
      var p = P[i], n = p.ph.length;
      var stage = p.ph.map(function (ph, j) { return '<figure>' + img(ph, 0, alt(p, j), Math.abs(j - stepK) > 1) + '</figure>'; }).join('');
      var thumbs = n > 1 ? '<div class="hxp-more">' + ic('stack') + n + ' photos in this post</div><div class="hxp-thumbs">' +
        p.ph.map(function (ph, j) { return '<button type="button" data-k="' + j + '"' + (j === stepK ? ' class="on" aria-current="true"' : '') + ' aria-label="Photo ' + (j + 1) + ' of ' + n + '">' + img(ph, 400, '', true) + '</button>'; }).join('') + '</div>' : '';
      det.className = 'hxp-det hxp-split' + (open ? ' on' : '');
      det.innerHTML = '<div class="hxp-left"><div class="hxp-car">' + stage + '</div>' + more(n) + dots(n) +
          '<button type="button" class="hxp-arrow l" data-step="-1" aria-label="Previous"' + (i === 0 && stepK === 0 ? ' disabled' : '') + '>' + ic('l') + '</button>' +
          '<button type="button" class="hxp-arrow r" data-step="1" aria-label="Next"' + (i === P.length - 1 && stepK === n - 1 ? ' disabled' : '') + '>' + ic('r') + '</button></div>' +
        '<div class="hxp-right"><div class="hxp-text">' + words(p, false) + thumbs + readMore(p) + '</div>' +
          '<div class="hxp-nav"><button type="button" data-go="-1"' + (i === 0 ? ' disabled' : '') + '>' + ic('l') + 'Newer</button><button type="button" class="hxp-all" data-gallery>' + ic('grid') + 'All photos</button><button type="button" data-go="1"' + (i === P.length - 1 ? ' disabled' : '') + '>Older' + ic('r') + '</button></div></div>';
      var car = wire(det.querySelector('.hxp-left'), p, function (k) {
        stepK = k;
        [].forEach.call(det.querySelectorAll('.hxp-thumbs button'), function (b, j) { b.classList.toggle('on', j === k); if (j === k) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
        det.querySelector('.hxp-arrow.l').disabled = i === 0 && k === 0;
        det.querySelector('.hxp-arrow.r').disabled = i === P.length - 1 && k === n - 1;
      });
      if (car && stepK) requestAnimationFrame(function () { goPhoto(car, stepK, false); });
      built = 'split';
      if (open) try { history.replaceState({ hxp: 1, i: i }, ''); } catch (e) {}
    }
    function step(d) {
      var p = P[cur], car = det.querySelector('.hxp-car'), k = car ? at(car) : 0;
      if (d > 0 && k < p.ph.length - 1) return goPhoto(car, k + 1, true);
      if (d < 0 && k > 0) return goPhoto(car, k - 1, true);
      var j = cur + d;
      if (j >= 0 && j < P.length) showSplit(j, d < 0 ? P[j].ph.length - 1 : 0);
    }

    function openPost(i, push, k) {
      cur = i; k = k || 0;
      if (M === 'land') showSplit(i, k);
      else {
        if (built !== 'feed') buildFeed();
        var a = det.querySelector('.hxp-post[data-i="' + i + '"]');
        det.scrollTop = a ? a.offsetTop : 0;
        if (a) {
          var ims = a.querySelectorAll('img'), im = ims[k] || ims[0]; if (im) im.removeAttribute('loading');
          /* from the newest card: the feed starts on the photo that was showing */
          var fc = k && a.querySelector('.hxp-car'); if (fc) requestAnimationFrame(function () { goPhoto(fc, k, false); });
        }
      }
      if (!open && push !== false) try { history.pushState({ hxp: 1, i: i }, ''); } catch (e) {}
      open = true;
      det.classList.add('on');
      det.setAttribute('aria-hidden', 'false');
      de.classList.add('hxp-lock');
      setTimeout(function () { var f = det.querySelector(M === 'land' ? '.hxp-arrow:not([disabled]), .hxp-read' : '.hxp-read'); if (f && M === 'land') f.focus({ preventScroll: true }); }, 320);
    }
    function feedIndex() {
      var best = cur, top = det.getBoundingClientRect().top + 40;
      [].forEach.call(det.querySelectorAll('.hxp-post'), function (a) { if (a.getBoundingClientRect().top <= top) best = +a.getAttribute('data-i'); });
      return best;
    }
    function close() {
      if (!open) return;
      if (built === 'feed') cur = feedIndex();
      open = false;
      det.classList.remove('on');
      det.setAttribute('aria-hidden', 'true');
      de.classList.remove('hxp-lock');
      var t = cur ? root.querySelector('.hxp-tile[data-i="' + cur + '"]') : nshot;
      if (t) {
        var r = t.getBoundingClientRect();
        if (r.top < 56 || r.bottom > innerHeight) window.scrollTo(0, Math.max(0, window.scrollY + r.top - innerHeight / 3));
        try { t.focus({ preventScroll: true }); } catch (e) {}
      }
    }
    /* to the grid, keeping back = where you came from */
    function toGallery() {
      if (deep) { deep = false; close(); try { history.replaceState(null, ''); } catch (e) {} }
      else back();
    }
    /* deep = opened straight from the home screen's Photo widget, so back
       goes back home instead of to the grid (Nov 2, Toby: fewer taps) */
    var deep = false;
    function back() {
      if (deep) { history.back(); return; }                          /* came from the home screen: go home */
      if (history.state && history.state.hxp) history.back(); else close();
    }

    /* Leaving for the post (Read more, or any link in the open post):
       save which post he was on in this history entry, so coming back
       reopens that same photo instead of the grid (Nov 2, Toby). */
    function remember() {
      if (!open) return;
      var i = built === 'feed' ? feedIndex() : cur;
      try { history.replaceState({ hxp: 1, i: i, deep: deep ? 1 : 0 }, ''); } catch (e) {}
    }
    det.addEventListener('click', function (e) { if (e.target.closest('a[href]')) remember(); }, true);
    window.addEventListener('pagehide', remember);

    root.addEventListener('click', function (e) {
      var t = e.target.closest('.hxp-tile');
      if (t && !(e.metaKey || e.ctrlKey || e.shiftKey)) { e.preventDefault(); openPost(+t.getAttribute('data-i')); return; }
      if (e.target.closest('.hxp-nshot')) { openPost(0, undefined, NN > 1 ? at(ncar) : 0); return; }
      var nk = e.target.closest('[data-nk]'); if (nk) { goPhoto(ncar, +nk.getAttribute('data-nk'), true); return; }
      var s = e.target.closest('[data-step]'); if (s) { step(+s.getAttribute('data-step')); return; }
      if (e.target.closest('[data-gallery]')) { toGallery(); return; }
      var g = e.target.closest('[data-go]'); if (g) { var j = cur + +g.getAttribute('data-go'); if (j >= 0 && j < P.length) showSplit(j, 0); return; }
      var k = e.target.closest('[data-k]'); if (k) { var car = det.querySelector('.hxp-car'); if (car) goPhoto(car, +k.getAttribute('data-k'), true); }
    });
    root.addEventListener('keydown', function (e) {
      if (e.target.classList && (e.target.classList.contains('hxp-car') || e.target.classList.contains('hxp-nshot')) && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); e.target.click(); }
    });
    document.addEventListener('keydown', function (e) {
      if (!open || document.querySelector('.hx-sheet.open')) return;
      if (e.key === 'Escape') back();
      /* J = next, K = previous, like the arrow keys (Nov 3) */
      else if (built === 'split' && !(e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) && /^(ArrowRight|ArrowLeft|j|k)$/.test(e.key)) { e.preventDefault(); step(e.key === 'ArrowRight' || e.key === 'j' ? 1 : -1); }
    });
    /* the app bar's back button closes the post first */
    ctx.bar.addEventListener('click', function (e) {
      if (open && e.target.closest('.hb-back')) { e.preventDefault(); e.stopPropagation(); back(); }
      /* the Photos icon and name: close the photo and show the grid, even
         when it came from the home screen (Nov 3, Toby: "how do I go back
         to the Photos home page?"). Back from the grid still goes home. */
      else if (open && e.target.closest('.hb-app')) {
        e.preventDefault(); e.stopPropagation();
        toGallery();
      }
    }, true);
    window.addEventListener('popstate', function (e) {
      if (e.state && e.state.hxp) { if (!open) openPost(e.state.i || 0, false); }
      else close();
    });
    /* turning the phone or unfolding swaps the layout */
    var rz = 0;
    window.addEventListener('resize', function () {
      clearTimeout(rz);
      rz = setTimeout(function () {
        var m = mode(); if (m === M) return;
        var wasFeed = built === 'feed';
        if (open && wasFeed) cur = feedIndex();
        M = m; root.setAttribute('data-mode', m);
        if (!open) { built = ''; return; }
        if (m === 'land') showSplit(cur, 0);
        else { if (!wasFeed) buildFeed(); openPost(cur, false); }
      }, 120);
    });
    /* back on this page after a reload with the feed still in history */
    if (history.state && history.state.hxp) { deep = !!history.state.deep; openPost(Math.min(P.length - 1, history.state.i || 0), false); }
    /* /photo/#post=/2026/...: open that post right away (the home screen's
       Photo widget links here, so one tap shows the photo) */
    else {
      var hm = location.hash.match(/^#post=(.+)$/);
      if (hm) {
        var want = decodeURIComponent(hm[1]);
        for (var q = 0; q < P.length; q++) if (P[q].u === want) {
          deep = true;
          try { history.replaceState({ hxp: 1, i: q, deep: 1 }, '', location.pathname + location.search); } catch (e) {}
          openPost(q, false);
          break;
        }
      }
    }
  };
})();

/* ------------------------------------------------------------------
   Small apps (v37 mockup): About, Contact, Follow. Nov 2, 2026.
   (Uses was one too, until Nov 8: Toby's Classic Geek Gear page now
   shows as it is in Hutch.)
   One shared shell: the app bar (from hutch.js), then the page Toby
   wrote in Micro.blog, moved (not copied) out of #main-content into
   the app so his words, links and any form keep working as they are.
   Each app adds its own small touch on top:
     About    his face, name and a few facts counted by Hugo
     Contact  a big "Email me" button from the page's own mailto link
     Follow   every way to follow as a big tappable row
   Landscape (unfolded sideways, desktop): About and Contact go two
   panes that scroll on their own; Follow goes two columns.
   No page body found = nothing happens and the Traditional page shows.
   Data: partials/hutch-data/small.html. Styles: css/apps/small.css.
   ------------------------------------------------------------------ */
(function () {
  window.HutchApps = window.HutchApps || {};

  var I = {
    mail: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3.5 7.5 12 13l8.5-5.5"/>',
    rss: '<path d="M4.5 4.5a15 15 0 0 1 15 15"/><path d="M4.5 10.8a8.7 8.7 0 0 1 8.7 8.7"/><circle cx="5.3" cy="18.7" r="1.6"/>',
    json: '<path d="M9.5 4.5c-2 0-2.7 1-2.7 2.6v2c0 1.4-.7 2.4-2.1 2.9 1.4.5 2.1 1.5 2.1 2.9v2c0 1.6.7 2.6 2.7 2.6"/><path d="M14.5 4.5c2 0 2.7 1 2.7 2.6v2c0 1.4.7 2.4 2.1 2.9-1.4.5-2.1 1.5-2.1 2.9v2c0 1.6-.7 2.6-2.7 2.6"/>',
    mb: '<path fill="currentColor" stroke="none" d="M12 0C5.4 0 0 4.9 0 10.95 0 17 5.4 21.9 12 21.9c1.4 0 2.85-.25 4.2-.7.15-.05.35 0 .45.1 1 1.35 2.55 2.3 4.25 2.7l.25-.1v-.3a4.65 4.65 0 01.2-5.9C22.9 15.85 24 13.5 24 10.95 24 4.9 18.55 0 12 0zm-.05 5.2c.15 0 .3.1.35.25L13.55 9l3.85.1c.15 0 .3.1.35.2.05.15 0 .3-.15.4L14.55 12l1.1 3.6c.05.15 0 .3-.15.4h-.4l-3.15-2.15L8.8 16h-.4c-.15-.1-.2-.25-.15-.4l1.1-3.6L6.3 9.7c-.15-.1-.2-.25-.15-.4.05-.1.2-.2.35-.2l3.85-.1 1.25-3.55c.05-.15.2-.25.35-.25z"/>',
    bsky: '<path fill="currentColor" stroke="none" d="M5.202 2.857C7.954 4.922 10.913 9.11 12 11.358c1.087-2.247 4.046-6.436 6.798-8.501C20.783 1.366 24 .213 24 3.883c0 .732-.42 6.156-.667 7.037-.856 3.061-3.978 3.842-6.755 3.37 4.854.826 6.089 3.562 3.422 6.299-5.065 5.196-7.28-1.304-7.847-2.97-.104-.305-.152-.448-.153-.327 0-.121-.05.022-.153.327-.568 1.666-2.782 8.166-7.847 2.97-2.667-2.737-1.432-5.473 3.422-6.3-2.777.473-5.899-.308-6.755-3.369C.42 10.04 0 4.615 0 3.883c0-3.67 3.217-2.517 5.202-1.026"/>',
    masto: '<path fill="currentColor" stroke="none" d="M23.268 5.313c-.35-2.578-2.617-4.61-5.304-5.004C17.51.242 15.792 0 11.813 0h-.03c-3.98 0-4.835.242-5.288.309C3.882.692 1.496 2.518.917 5.127.64 6.412.61 7.837.661 9.143c.074 1.874.088 3.745.26 5.611.118 1.24.325 2.47.62 3.68.55 2.237 2.777 4.098 4.96 4.857 2.336.792 4.849.923 7.256.38.265-.061.527-.132.786-.213.585-.184 1.27-.39 1.774-.753a.057.057 0 0 0 .023-.043v-1.809a.052.052 0 0 0-.02-.041.053.053 0 0 0-.046-.01 20.282 20.282 0 0 1-4.709.545c-2.73 0-3.463-1.284-3.674-1.818a5.593 5.593 0 0 1-.319-1.433.053.053 0 0 1 .066-.054c1.517.363 3.072.546 4.632.546.376 0 .75 0 1.125-.01 1.57-.044 3.224-.124 4.768-.422.038-.008.077-.015.11-.024 2.435-.464 4.753-1.92 4.989-5.604.008-.145.03-1.52.03-1.67.002-.512.167-3.63-.024-5.545zm-3.748 9.195h-2.561V8.29c0-1.309-.55-1.976-1.67-1.976-1.23 0-1.846.79-1.846 2.35v3.403h-2.546V8.663c0-1.56-.617-2.35-1.848-2.35-1.112 0-1.668.668-1.67 1.977v6.218H4.822V8.102c0-1.31.337-2.35 1.011-3.12.696-.77 1.608-1.164 2.74-1.164 1.311 0 2.302.5 2.962 1.498l.638 1.06.638-1.06c.66-.999 1.65-1.498 2.96-1.498 1.13 0 2.043.395 2.74 1.164.675.77 1.012 1.81 1.012 3.12z"/>',
    link: '<path d="M10.2 13.8a4.2 4.2 0 0 0 6 0l3-3a4.2 4.2 0 1 0-6-6l-1.3 1.3"/><path d="M13.8 10.2a4.2 4.2 0 0 0-6 0l-3 3a4.2 4.2 0 1 0 6 6l1.3-1.3"/>',
    page: '<path d="M6 3h9l4 4v14H6z M14 3v5h5 M9 13h7 M9 17h7"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18 M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>',
    chev: '<path d="M9 6l6 6-6 6"/>',
    copy: '<rect x="8.7" y="8.7" width="11.8" height="11.8" rx="2"/><path d="M4.5 15V5.7a2 2 0 0 1 2-2h9.3"/>',
    archive: '<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v10h14V9 M10 13h4"/>',
    laptop: '<rect x="5" y="5" width="14" height="10" rx="1.5"/><path d="M2.5 19h19"/>',
    monitor: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M9 20h6 M12 16v4"/>',
    desktop: '<rect x="5" y="8" width="14" height="10" rx="2"/><path d="M9 12h6"/>',
    phone: '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18h2"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8 M8 12h5"/>',
    pen: '<path d="M4 20h4L19 9l-4-4L4 16z M14 6l4 4"/>',
    code: '<path d="M8 7l-5 5 5 5 M16 7l5 5-5 5 M14 4l-4 16"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    spark: '<path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>',
    brick: '<rect x="3" y="9" width="18" height="10" rx="1.5"/><path d="M6.5 9V6.5h4V9 M13.5 9V6.5h4V9"/>',
    bird: '<path d="M4 15c4 0 6-2 7-6 1-3 4-4 6-3l3 1-3 1c0 6-4 10-11 10l-2-3z"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3 M12 19v3 M2 12h3 M19 12h3 M4.9 4.9l2.1 2.1 M17 17l2.1 2.1 M4.9 19.1L7 17 M17 7l2.1-2.1"/>'
  };
  function svg(k) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (I[k] || I.link) + '</svg>'; }
  var PAL = ['#1E2D4A', '#5B7A8C', '#7A8F6A', '#C4622D', '#D9A441', '#7C5A7A', '#3E7C7A', '#3F7FA6', '#8C6A4F'];

  /* what kind of link is this? -> [icon, tile color, label, short host] */
  function kindOf(a) {
    var h = a.getAttribute('href') || '', u;
    if (/^mailto:/i.test(h)) return ['mail', '#C4622D', 'Email', h.replace(/^mailto:/i, '').split('?')[0]];
    try { u = new URL(h, location.href); } catch (e) { return ['link', '#6B7280', '', h]; }
    var host = u.hostname.replace(/^www\./, ''), p = u.pathname;
    if (/\.json$/i.test(p) || /feed\.json/i.test(p)) return ['json', '#7A8F6A', 'JSON feed', host];
    if (/(feed|rss|atom)(\.xml)?$|\.xml$|\/rss\/?$/i.test(p)) return ['rss', '#E08A3C', 'RSS feed', host];
    if (host === 'micro.blog') return ['mb', '#5B7A8C', 'Micro.blog', host];
    if (host === 'bsky.app' || /bsky\.social$/.test(host)) return ['bsky', '#3F7FA6', 'Bluesky', host];
    if (/mastodon|masto|fosstodon|hachyderm|social$/.test(host) && /\/@/.test(p)) return ['masto', '#6B5CA5', 'Mastodon', host];
    if (/buttondown|substack|mailchimp|convertkit|kit\.com/.test(host)) return ['mail', '#C4622D', 'Newsletter', host];
    if (u.origin === location.origin || /tobygeeksout\.micro\.blog$/.test(host)) return ['page', '#8C6A4F', '', 'On this blog'];
    return ['globe', '#6B7280', '', host];
  }
  /* a list where every item is just one link */
  function isLinkList(ul) {
    var lis = [].filter.call(ul.children, function (n) { return n.tagName === 'LI'; });
    if (!lis.length) return false;
    return lis.every(function (li) {
      var as = li.querySelectorAll('a');
      return as.length === 1 && li.textContent.trim() === as[0].textContent.trim() && !li.querySelector('ul,ol');
    });
  }
  function rowFor(a, ctx, sub) {
    var k = kindOf(a);
    var label = a.textContent.trim() || k[2] || k[3];
    a.className = (a.className ? a.className + ' ' : '') + 'hx-sm-row';
    a.innerHTML = '<span class="ri" style="background:' + k[1] + '">' + svg(k[0]) + '</span><span class="m"><b>' + ctx.esc(label) + '</b><small>' + ctx.esc(sub || k[3]) + '</small></span><span class="chev">' + svg('chev') + '</span>';
    return a;
  }
  /* tidy the page's own HTML for the app: link lists become tappable rows,
     tables scroll sideways inside themselves, empty paragraphs go */
  function tidy(doc, ctx) {
    [].forEach.call(doc.querySelectorAll('ul,ol'), function (ul) {
      if (!isLinkList(ul) || ul.closest('.uses, form, .hx-sm-keep')) return;
      var box = document.createElement('div'); box.className = 'hx-sm-links';
      [].forEach.call(ul.querySelectorAll('a'), function (a) { box.appendChild(rowFor(a, ctx)); });
      ul.parentNode.replaceChild(box, ul);
    });
    [].forEach.call(doc.querySelectorAll('table'), function (t) {
      if (t.parentNode.classList.contains('hx-sm-tw')) return;
      var w = document.createElement('div'); w.className = 'hx-sm-tw'; t.parentNode.insertBefore(w, t); w.appendChild(t);
    });
    [].forEach.call(doc.querySelectorAll('p'), function (p) { if (!p.textContent.trim() && !p.querySelector('img,iframe,video,input,button,form')) p.remove(); });
    [].forEach.call(doc.querySelectorAll('form'), function (f) { f.classList.add('hx-sm-form'); });
  }

  /* clipboard API first, then the old textarea way (same idea as the theme's .tgo-rss-copy) */
  function copyOld(t) {
    var ta = document.createElement('textarea'), ok = false; ta.value = t; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:-99px;opacity:0';
    document.body.appendChild(ta); ta.select();
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; } ta.remove();
    return ok;
  }
  function copyText(t) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(t).catch(function () { if (!copyOld(t)) throw new Error('copy'); });
    return copyOld(t) ? Promise.resolve() : Promise.reject(new Error('copy'));
  }

  function shell(ctx) {
    var body = document.querySelector('#main-content .page-body');
    if (!body) return null;
    var root = ctx.el('<div class="hx-sm hx-sm--' + ctx.key + (ctx.dark ? ' dark' : '') + '" role="main">' +
      '<div class="hx-sm-panes"><div class="hx-sm-side"></div><div class="hx-sm-main"><div class="hx-sm-doc"></div></div></div>' +
      '<div class="hx-sm-snack" role="status" aria-live="polite"></div></div>');
    var doc = root.querySelector('.hx-sm-doc');
    while (body.firstChild) doc.appendChild(body.firstChild);
    var snack = root.querySelector('.hx-sm-snack'), st;
    root.snack = function (msg) { snack.textContent = msg; snack.classList.add('show'); clearTimeout(st); st = setTimeout(function () { snack.classList.remove('show'); }, 2000); };
    root.side = root.querySelector('.hx-sm-side');
    root.main = root.querySelector('.hx-sm-main');
    root.doc = doc;
    var t = (ctx.data && ctx.data.title) || ctx.page.title || '';
    root.title = t && t.toLowerCase() !== String(ctx.app[0]).toLowerCase() ? t : '';
    return root;
  }
  function finish(ctx, root, two) {
    /* inside a desktop window: always one column (Nov 5, Toby: no two panes there) */
    if (document.documentElement.classList.contains('hutch-win')) two = false;
    if (two) root.classList.add('hx-sm-split');
    document.body.appendChild(root);
    ctx.own();
    /* landscape two panes: each pane scrolls on its own; elsewhere the page scrolls */
    if (two) {
      var mq = window.matchMedia('(min-width: 840px) and (orientation: landscape)');
      var set = function () { document.documentElement.classList.toggle('hx-sm-two', mq.matches); };
      set(); if (mq.addEventListener) mq.addEventListener('change', set); else if (mq.addListener) mq.addListener(set);
    }
  }
  function titleHTML(ctx, root) { return root.title ? '<h1 class="hx-sm-title">' + ctx.esc(root.title) + '</h1>' : ''; }

  /* ---------------- About ---------------- */
  HutchApps.about = function (ctx) {
    var root = shell(ctx); if (!root) return;
    var d = ctx.data || {}, name = d.name || '', av = d.avatar || ctx.page.avatar || '';
    var face = av ? '<img class="face" src="' + ctx.esc(av) + '" alt="" width="104" height="104" decoding="async">'
                  : '<span class="face face-t">' + ctx.esc((name || 'T').charAt(0)) + '</span>';
    var facts = [];
    if (d.posts) facts.push('<div><span>Posts</span><b>' + ctx.esc(String(d.posts)) + '</b></div>');
    if (d.since) facts.push('<div><span>Posting here since</span><b>' + ctx.esc(d.since) + '</b></div>');
    if (d.cats && d.cats.length) facts.push('<div class="wa"><span>Writes about</span><span class="hx-sm-chips">' +
      d.cats.map(function (c) { return '<a href="' + ctx.esc(c.u) + '">' + ctx.esc(c.n) + '</a>'; }).join('') + '</span></div>');
    /* his logo on top, like the cover of the page, then his photo and
       name (Nov 2, Toby). Same day/night pair as the Traditional header. */
    var logo = (function () {
      var is70 = document.documentElement.classList.contains('fonts-70s');
      var up = 'https://tobygeeksout.micro.blog/uploads/2026/';
      var src = ctx.dark ? (is70 ? up + 'night-v2-toby-geeks-out-new-logo-1500-x-600-px.png' : up + 'sunset-toby-geeks-out-new-logo.png')
                         : (is70 ? up + 'toby-geeks-out-newest-v2-logo-1500-x-600-px.png' : up + 'tobygeeksoutlogonew.png');
      return '<img class="hx-sm-logo" src="' + src + '" alt="' + ctx.esc(d.site || 'Toby Geeks Out!') + '" decoding="async">';
    })();
    /* Get to know me (Nov 9, Toby): The Long Road Here lives here now, and
       so does Knowember outside November (in November it's on the home
       screen), with the badge from the Classic rail */
    var gtk = '<a class="hx-sm-gtk-row" href="/the-long-road-here/"><span class="tx"><b>The Long Road Here</b><small>Every blog I\'ve kept since 2004</small></span><i aria-hidden="true">›</i></a>';
    if (new Date().getMonth() !== 10) gtk += '<a class="hx-sm-gtk-row" href="/knowember/"><img src="https://tobygeeksout.micro.blog/uploads/2026/knowember-paper-red.png" alt="" width="99" height="35" loading="lazy" decoding="async"><span class="tx"><b>Knowember</b><small>One photo, three questions</small></span><i aria-hidden="true">›</i></a>';
    root.side.innerHTML = '<div class="hx-sm-hero">' + logo + face + (name ? '<h2>' + ctx.esc(name) + '</h2>' : '') + '</div>' +
      (facts.length ? '<div class="hx-sm-facts">' + facts.join('') + '</div>' : '') +
      '<div class="hx-sm-gtk"><h3>Get to know me</h3>' + gtk + '</div>';
    if (root.title) root.doc.insertAdjacentHTML('afterbegin', titleHTML(ctx, root));
    tidy(root.doc, ctx);
    finish(ctx, root, true);
  };

  /* ---------------- Contact ---------------- */
  HutchApps.contact = function (ctx) {
    var root = shell(ctx); if (!root) return;
    var doc = root.doc, btns = '';
    var mail = doc.querySelector('a[href^="mailto:" i]');
    if (mail) btns += '<a class="hx-sm-big" href="' + ctx.esc(mail.getAttribute('href')) + '">' + svg('mail') + '<span>Email me</span></a>';
    var mb = [].filter.call(doc.querySelectorAll('a[href]'), function (a) { return kindOf(a)[0] === 'mb'; })[0];
    if (mb) btns += '<a class="hx-sm-big alt" href="' + ctx.esc(mb.getAttribute('href')) + '" target="_blank" rel="noopener">' + svg('mb') + '<span>Reply on Micro.blog</span></a>';
    /* the page's opening paragraph sits above the buttons, like the mockup */
    var first = doc.firstElementChild, intro = '';
    if (first && first.tagName === 'P' && !first.querySelector('a[href^="mailto:" i]')) { intro = first.outerHTML; first.remove(); }
    root.side.innerHTML = titleHTML(ctx, root) + '<div class="hx-sm-intro">' + intro + '</div>' + (btns ? '<div class="hx-sm-bigs">' + btns + '</div>' : '');
    tidy(doc, ctx);
    [].forEach.call(doc.querySelectorAll('form'), function (f) {
      if (!f.parentNode.classList.contains('hx-sm-card')) { var c = document.createElement('div'); c.className = 'hx-sm-card'; f.parentNode.insertBefore(c, f); c.appendChild(f); }
      /* in a desktop window (Nov 5): name and email side by side, so the
         whole note fits without scrolling. The same fields, only grouped. */
      if (document.documentElement.classList.contains('hutch-win')) {
        var ins = [].filter.call(f.querySelectorAll('input'), function (i) { return /^(text|email|)$/i.test(i.getAttribute('type') || ''); }).slice(0, 2);
        if (ins.length === 2) {
          var row = document.createElement('div'); row.className = 'hx-sm-pairs';
          ins[0].parentNode.insertBefore(row, ins[0].previousElementSibling && ins[0].previousElementSibling.tagName === 'LABEL' ? ins[0].previousElementSibling : ins[0]);
          ins.forEach(function (i) {
            var lab = (i.id && f.querySelector('label[for="' + i.id + '"]')) || (i.previousElementSibling && i.previousElementSibling.tagName === 'LABEL' ? i.previousElementSibling : null);
            var pr = document.createElement('div'); pr.className = 'hx-sm-pair';
            if (lab) pr.appendChild(lab); pr.appendChild(i); row.appendChild(pr);
          });
        }
      }
    });
    finish(ctx, root, true);
  };

  /* ---------------- Uses ----------------
     Nov 8 (Toby): no Hutch version of Uses any more. Toby redesigned
     Geek Gear in Classic (cards with the real logos, two columns, "I
     built these"), and Hutch shows that page as it is, under the Uses
     app bar (hutch.js no longer loads a module for /uses/). */

  /* ---------------- Follow ---------------- */
  HutchApps.follow = function (ctx) {
    var root = shell(ctx); if (!root) return;
    var doc = root.doc, d = ctx.data || {}, used = [];
    var links = [].slice.call(doc.querySelectorAll('a[href]'));
    /* Nov 5 (v65): the full color drawings, the same as the app icons */
    function icon(k, ic, col) { return ctx.art ? '<span class="ai">' + ctx.art(k) + '</span>' : '<span class="ri" style="background:' + col + '">' + svg(ic) + '</span>'; }
    function find(kind) { for (var i = 0; i < links.length; i++) if (used.indexOf(links[i]) < 0 && kindOf(links[i])[0] === kind && !links[i].closest('form')) { used.push(links[i]); return links[i]; } return null; }
    var rows = [];

    /* 1. email newsletter: the page's own signup form, moved in whole */
    var form = [].filter.call(doc.querySelectorAll('form'), function (f) { return f.querySelector('input[type="email"], input[name*="email" i]'); })[0];
    var nlLink = null;
    if (!form) { nlLink = [].filter.call(links, function (a) { var k = kindOf(a); return k[0] === 'mail' && k[2] === 'Newsletter'; })[0] || null; if (nlLink) used.push(nlLink); }
    if (form || nlLink) {
      var sub = 'New posts in your inbox', prev = form && form.previousElementSibling;
      if (prev && prev.tagName === 'P' && !prev.querySelector('a') && prev.textContent.length < 160) { sub = prev.textContent.trim(); prev.remove(); }
      /* Nov 3 (Toby: the "Enjoying this?" box was empty and unreadable at
         night): when the form sat inside its own signup box, the box's
         words come along (the pitch under the row title, the "no spam"
         note under the button) and the emptied box goes away. */
      var box = form, note = '';
      while (box && box.parentNode !== doc) box = box.parentNode;
      if (box && box !== form) {
        var ps = [].filter.call(box.querySelectorAll('p'), function (q) { return !q.contains(form) && !form.contains(q) && q.textContent.trim(); });
        var pitch = null;
        ps.forEach(function (q) {
          var tx = q.textContent.replace(/\s+/g, ' ').trim();
          if (/spam|unsubscribe/i.test(tx) && tx.length < 120) { note = tx; return; }
          if (tx.length > 30 && tx.length < 320 && (!pitch || /pitch/.test(q.className) || tx.length > pitch.length)) pitch = tx;
        });
        if (pitch) sub = pitch;
      }
      if (form) {
        /* Nov 5 (v65): a heading (icon, title, one line), then the pitch, the form and the note */
        var row = ctx.el('<div class="hx-sm-row hx-sm-nl"><div class="hd">' + icon('mail', 'mail', '#C4622D') + '<span class="m"><b>Email newsletter</b><small>New posts in your inbox</small></span></div>' +
          (sub && sub !== 'New posts in your inbox' ? '<p class="pitch">' + ctx.esc(sub) + '</p>' : '') + '</div>');
        form.classList.add('hx-sm-subform');
        /* a visible label would repeat the row title; keep it for screen readers */
        [].forEach.call(form.querySelectorAll('label'), function (l) { l.classList.add('hx-sm-sr'); });
        var em = form.querySelector('input[type="email"], input[name*="email" i]');
        if (em && !em.getAttribute('placeholder')) em.setAttribute('placeholder', 'you@example.com');
        row.appendChild(form);
        if (note) row.appendChild(ctx.el('<p class="hx-sm-nlnote">' + ctx.esc(note) + '</p>'));
        if (box && box !== form && box.parentNode && !box.querySelector('a[href], form, input, img, iframe, video')) box.remove();
        rows.push(row);
      } else rows.push(rowA(nlLink.getAttribute('href'), 'mail', 'mail', '#C4622D', 'Email newsletter', sub, 'Sign up', true));
    }

    /* 2. feeds: the page's own links if it has them, else the theme's (same as the side rail) */
    var rss = find('rss'), json = find('json');
    var rssU = rss ? rss.href : d.rss, jsonU = json ? json.href : d.json;
    var nlRows = rows; rows = []; /* the newsletter goes on its own; feeds and Elsewhere get groups (Nov 5, v65) */
    var feeds = [], socs = [];
    if (rssU) feeds.push(rowCopy(rssU, 'follow', 'rss', '#E08A3C', 'RSS feed', 'For your feed reader'));
    if (jsonU) feeds.push(rowCopy(jsonU, 'json', 'json', '#7A8F6A', 'JSON feed', 'For readers that speak JSON Feed'));

    /* 3. past newsletters (the side rail's "Browse past newsletters" link), with the feeds */
    if (d.past && (form || nlLink)) feeds.push(rowA(d.past, 'archive', 'archive', '#8C6A4F', 'Past newsletters', 'Read the ones you missed', 'Open', false, true));

    /* 4. Elsewhere: the page's own links, else the same ones as the
       Connect & Share box on posts (Nov 5, Toby: v65) */
    var mb = find('mb'), bs = find('bsky'), ma = find('masto');
    var mbU = mb ? mb.getAttribute('href') : d.mb, bsU = bs ? bs.getAttribute('href') : d.bsky, maU = ma ? ma.getAttribute('href') : d.masto;
    if (mbU) socs.push(soc(mbU, 'mb', 'Micro.blog'));
    if (bsU) socs.push(soc(bsU, 'bsky', 'Bluesky'));
    if (maU) socs.push(soc(maU, 'masto', 'Mastodon'));

    if (!nlRows.length && !feeds.length && !socs.length) { finish(ctx, root, false); tidy(doc, ctx); return; }

    /* take what moved into rows out of the page text, then drop headings left with nothing under them */
    used.forEach(function (a) {
      var li = a.closest('li');
      if (li && li.textContent.trim() === a.textContent.trim()) { var ul = li.parentNode; li.remove(); if (!ul.querySelector('li')) ul.remove(); return; }
      var p = a.parentNode;
      if (p && p.tagName === 'P' && p.textContent.trim() === a.textContent.trim()) p.remove();
    });
    [].slice.call(doc.querySelectorAll('h1,h2,h3,h4')).forEach(function (h) {
      var n = h.nextElementSibling;
      if (!n || /^H[1-4]$/.test(n.tagName)) h.remove();
    });
    /* page text before the first heading stays on top as the intro; the rest goes under the rows */
    var intro = document.createElement('div'); intro.className = 'hx-sm-intro';
    while (doc.firstElementChild && !/^H[1-4]$/.test(doc.firstElementChild.tagName)) intro.appendChild(doc.firstElementChild);
    var rest = doc.innerHTML.trim() ? [].slice.call(doc.childNodes) : [];
    doc.innerHTML = '';
    /* Nov 5 (v65, Toby: "a lot of wasted space"): the newsletter on the
       left, Feeds and Elsewhere on the right on wide screens, the pair
       centered on the screen; one column on phones and the Fold upright */
    if (!intro.textContent.trim()) intro.innerHTML = '<p>Get new posts the way you like to read.</p>';
    var fl = ctx.el('<div class="hx-fl"><div class="hx-fl-l"></div><div class="hx-fl-r"></div></div>'), fL = fl.firstChild, fR = fl.lastChild;
    if (root.title) fL.insertAdjacentHTML('beforeend', titleHTML(ctx, root));
    fL.appendChild(intro);
    nlRows.forEach(function (r) { fL.appendChild(r); });
    var list = document.createElement('div'); list.className = 'hx-sm-follow';
    if (feeds.length) { list.insertAdjacentHTML('beforeend', '<h2 class="hx-fl-sec">Feeds</h2>'); var fg = document.createElement('div'); fg.className = 'hx-fl-rows'; feeds.forEach(function (r) { fg.appendChild(r); }); list.appendChild(fg); }
    if (socs.length) { list.insertAdjacentHTML('beforeend', '<h2 class="hx-fl-sec">Elsewhere</h2>'); var sg = document.createElement('div'); sg.className = 'hx-fl-socs'; socs.forEach(function (r) { sg.appendChild(r); }); list.appendChild(sg); }
    fR.appendChild(list);
    doc.appendChild(fl);
    root.classList.add('hx-fl-on');
    if (rest.length) { var more = document.createElement('div'); more.className = 'hx-sm-more'; rest.forEach(function (n) { more.appendChild(n); }); doc.appendChild(more); }
    tidy(doc, ctx);
    list.addEventListener('click', function (e) {
      var b = e.target.closest('[data-copy]'); if (!b) return;
      var u = b.getAttribute('data-copy');
      copyText(u).then(function () {
        root.snack('Feed link copied');
        b.classList.add('done'); var g = b.querySelector('.go'); if (g) g.textContent = 'Copied';
        setTimeout(function () { b.classList.remove('done'); if (g) g.textContent = 'Copy'; }, 2000);
      }, function () { location.href = u; });
    });
    finish(ctx, root, false);

    function handle(a) {
      try { var u = new URL(a.href); var h = u.pathname.replace(/^\/(profile\/)?/, '').replace(/\/$/, ''); return h ? (h.charAt(0) === '@' ? h : '@' + h) + (u.hostname === 'bsky.app' ? '' : ' · ' + u.hostname) : u.hostname; } catch (e) { return ''; }
    }
    function rowA(href, art, ic, col, t, s, go, ext, same) {
      var out = !same && !/^\//.test(href) && href.indexOf(location.origin) !== 0;
      return ctx.el('<a class="hx-sm-row" href="' + ctx.esc(href) + '"' + (out ? ' target="_blank" rel="me noopener"' : '') + '>' + icon(art, ic, col) + '<span class="m"><b>' + ctx.esc(t) + '</b><small>' + ctx.esc(s) + '</small></span><span class="go">' + ctx.esc(go) + '</span></a>');
    }
    function rowCopy(u, art, ic, col, t, s) {
      return ctx.el('<button type="button" class="hx-sm-row" data-copy="' + ctx.esc(u) + '" aria-label="Copy the ' + ctx.esc(t) + ' link">' + icon(art, ic, col) + '<span class="m"><b>' + ctx.esc(t) + '</b><small>' + ctx.esc(s) + '</small></span><span class="go">Copy</span></button>');
    }
    /* an Elsewhere tile: icon, name, handle */
    function soc(href, k, t) {
      var a = document.createElement('a'); a.href = href;
      return ctx.el('<a class="hx-fl-soc" href="' + ctx.esc(href) + '" target="_blank" rel="me noopener" aria-label="Follow on ' + ctx.esc(t) + '">' + icon(k, k, '#6B7280') + '<b>' + ctx.esc(t) + '</b><small>' + ctx.esc(handle(a).replace(/\.bsky\.social$/, '').replace(/ · .*$/, '')) + '</small></a>');
    }
  };
})();

/* ------------------------------------------------------------------
   Word Nerd app (Hutch OS, Nov 2, 2026, Toby + Claude). Mockup v25.
   Page: /categories/word-of-the-day/. Data: partials/hutch-data/words.html
   (every Word of the Day post, newest first).
     Phone + unfolded upright: Latest alert card on top, then All words
       (search, Newest / A-Z). A word opens its own card, which slides in
       over the list (Android back closes it). Newer / Older at the bottom.
     Landscape (840px+ wide): list on the left with a mini Latest card,
       the word card on the right. Each pane scrolls on its own.
   Read more opens the post. (The Random dice button was taken out Nov 3.)
   Colors follow the sky: light by day, dark at dusk and night.
   ------------------------------------------------------------------ */
(function () {
  window.HutchApps = window.HutchApps || {};
  HutchApps.words = function (ctx) {
    var D = ctx.data, W = D && D.words;
    if (!W || !W.length) return; /* no data: the Traditional page stays */
    var esc = ctx.esc, de = document.documentElement;

    var P = {
      dice: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.3" fill="currentColor"/><circle cx="15" cy="15" r="1.3" fill="currentColor"/><circle cx="15" cy="9" r="1.3" fill="currentColor"/><circle cx="9" cy="15" r="1.3" fill="currentColor"/>',
      search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
      open: '<path d="M14 4h6v6 M20 4l-9 9 M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
      chev: '<path d="M9 6l6 6-6 6"/>',
      x: '<path d="M6 6l12 12M18 6L6 18"/>'
    };
    function ic(k) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + P[k] + '</svg>'; }

    /* Roboto Serif for the words, like a dictionary (UI stays Roboto) */
    if (!document.getElementById('hxw-font')) {
      var lk = document.createElement('link'); lk.id = 'hxw-font'; lk.rel = 'stylesheet';
      lk.href = 'https://fonts.googleapis.com/css2?family=Roboto+Serif:ital,opsz,wght@0,8..144,400..700;1,8..144,400..600&display=swap';
      document.head.appendChild(lk);
    }

    var curY = W[0].y;
    W.forEach(function (x, i) {
      x.i = i;
      x.m = x.m || []; x.x = x.x || [];
      x.ps = (x.pos || '').toLowerCase().split(/\s*(?:[,\/·•|;&]|\band\b|\bor\b)\s*/).filter(Boolean);
      x.hay = (x.w + ' ' + x.m.map(function (s) { return s.t; }).join(' ')).toLowerCase();
      x.ld = x.y === curY ? x.d : x.d.split(' ')[0] + ' ' + x.y;   /* list date */
      x.fd = x.d + ', ' + x.y;                                       /* full date */
    });

    var q = '', sort = 'new', sel = 0, open = false;
    try { if (ctx.ls('hxw-sort') === 'az') sort = 'az'; } catch (e) {}
    var mq = window.matchMedia('(min-width: 840px) and (orientation: landscape)');
    function two() { return mq.matches; }

    de.classList.add('hxw-on');
    if (ctx.dark) de.classList.add('hxw-dk');

    function chips(x) { return x.ps.length ? '<div class="hxw-pos">' + x.ps.map(function (p) { return '<span>' + esc(p) + '</span>'; }).join('') + '</div>' : ''; }
    function means(x) {
      if (!x.m.length) return '';
      var multi = x.m.length > 1;
      return '<ol class="hxw-means' + (multi ? ' multi' : '') + '">' + x.m.map(function (s, n) {
        return '<li>' + (multi ? '<span class="hxw-n" aria-hidden="true">' + esc(s.n || String(n + 1)) + '</span>' : '') + esc(s.t) + '</li>';
      }).join('') + '</ol>';
    }
    function card(x, o) {
      o = o || {};
      return (o.today ? '<div class="hxw-lbl"><span>Latest alert</span><span>' + esc(x.d) + '</span></div>' : '') +
        /* long words get smaller type so they don't break mid-word (Nov 3) */
        '<h2 class="hxw-word' + (x.w.length > 15 ? ' xlong' : x.w.length > 11 ? ' long' : '') + '">' + esc(x.w) + '</h2>' +
        (x.pr ? '<div class="hxw-syl">' + esc(x.pr) + '</div>' : '') +
        chips(x) + means(x) +
        (x.ex ? '<p class="hxw-ex">' + esc(x.ex) + '</p>' : '') +
        /* Roots, Close cousins, First known use... on every card, including
           Latest alert (Nov 2, Toby: Petrichor wasn't showing all) */
        (x.x.length ? '<dl class="hxw-extra">' + x.x.map(function (e) {
          return '<div>' + (e.l ? '<dt>' + esc(e.l) + '</dt>' : '') + '<dd>' + esc(e.t) + '</dd></div>'; }).join('') + '</dl>' : '') +
        /* Read more only when the post has something the card doesn't
           (Toby's own words, a note, a video). Otherwise the date links to
           the post with ∞, like the Traditional Word Nerd page. */
        (x.more ? '<div class="hxw-acts"><a class="hxw-btn" href="' + esc(x.u) + '">Read more' + ic('open') + '<span class="hxw-sr"> about ' + esc(x.w) + '</span></a></div>' : '') +
        '<a class="hxw-posted" href="' + esc(x.u) + '">' + (o.big ? 'Posted ' + esc(x.fd) + ' in Word Nerd Alert' : esc(x.fd)) + ' <span aria-hidden="true">∞</span></a>';
    }

    var root = ctx.el(
      '<div class="hx-words">' +
        '<div class="hxw-main"><div class="hxw-wrap">' +
          '<section class="hxw-today" aria-label="Latest alert">' + card(W[0], { today: true }) + '</section>' +
          '<button type="button" class="hxw-mini" data-i="0"><span class="hxw-mt"><span class="hxw-lbl"><span>Latest alert · ' + esc(W[0].d) + '</span></span><span class="w">' + esc(W[0].w) + '</span></span><span class="go">' + ic('chev') + '</span></button>' +
          '<div class="hxw-lhead"><h2>All words</h2><small>' + W.length + (W.length === 1 ? ' word' : ' words') + '</small></div>' +
          '<label class="hxw-search">' + ic('search') + '<input type="search" placeholder="Search words and meanings" aria-label="Search words and meanings" autocomplete="off"><button type="button" class="hxw-clr" aria-label="Clear search" hidden>' + ic('x') + '</button></label>' +
          '<div class="hxw-seg" role="group" aria-label="Sort"><button type="button" data-sort="new">Newest</button><button type="button" data-sort="az">A–Z</button></div>' +
          '<div class="hxw-list"></div>' +
        '</div></div>' +
        '<div class="hxw-detail" aria-live="polite"><div class="hxw-dbody"></div><div class="hxw-pn"></div></div>' +
        /* no Random button (Nov 3, Toby): some posts' cards don't read
           right on their own, so words are only reached from the list */
      '</div>');
    document.body.appendChild(root);
    ctx.own();

    var list = root.querySelector('.hxw-list'), main = root.querySelector('.hxw-main'), detail = root.querySelector('.hxw-detail'),
        dbody = root.querySelector('.hxw-dbody'), pn = root.querySelector('.hxw-pn'), input = root.querySelector('.hxw-search input'),
        clr = root.querySelector('.hxw-clr');

    function item(x) {
      return '<a class="hxw-it' + (two() && x.i === sel ? ' sel' : '') + '" href="' + esc(x.u) + '" data-i="' + x.i + '">' +
        '<span class="m"><span class="w">' + esc(x.w) + (x.ps[0] ? '<i>' + esc(x.ps[0]) + '</i>' : '') + '</span>' +
        (x.m[0] ? '<span class="d">' + esc(x.m[0].t) + '</span>' : '') + '</span>' +
        (x.m.length > 1 ? '<span class="plus" title="' + (x.m.length - 1) + ' more meaning' + (x.m.length > 2 ? 's' : '') + '">+' + (x.m.length - 1) + '</span>' : '') +
        (sort === 'new' ? '<span class="dt">' + esc(x.ld) + '</span>' : '') + '</a>';
    }
    function renderList() {
      [].forEach.call(root.querySelectorAll('[data-sort]'), function (b) { var on = b.getAttribute('data-sort') === sort; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      /* Newest: the latest word is already up top, so the list starts after it */
      var items = W.filter(function (x) { return q ? x.hay.indexOf(q) > -1 : (sort === 'az' || x.i > 0); });
      if (sort === 'az') items = items.slice().sort(function (a, b) { return a.w.localeCompare(b.w, undefined, { sensitivity: 'base' }); });
      if (!items.length) { list.innerHTML = '<div class="hxw-empty">' + (q ? 'No words match “' + esc(input.value.trim()) + '”' : 'The latest word is the only one so far.') + '</div>'; return; }
      var out = '', last = '';
      items.forEach(function (x) {
        if (sort === 'az') {
          var L = x.w.charAt(0).toUpperCase();
          if (!/[A-Z]/.test(L)) L = '#';
          if (L !== last) { last = L; out += '<div class="hxw-letter">' + L + '</div>'; }
        }
        out += item(x);
      });
      list.innerHTML = out;
    }

    function pnBtn(x, dir) {
      return '<button type="button" class="' + dir + '"' + (x ? ' data-i="' + x.i + '"' : ' disabled') + '><small>' + (dir === 'newer' ? '‹ Newer' : 'Older ›') + '</small><b>' + (x ? esc(x.w) : (dir === 'newer' ? 'This is the newest' : 'This is the first')) + '</b></button>';
    }
    function show(i, how) {
      sel = i; var x = W[i];
      dbody.innerHTML = '<article class="hxw-card">' + card(x, { today: i === 0, big: true }) + '</article>';
      dbody.scrollTop = 0;
      pn.innerHTML = pnBtn(W[i - 1], 'newer') + pnBtn(W[i + 1], 'older');
      if (two()) {
        [].forEach.call(list.querySelectorAll('.hxw-it'), function (a) { a.classList.toggle('sel', +a.getAttribute('data-i') === i); });
        root.querySelector('.hxw-mini').classList.toggle('sel', i === 0);
        return;
      }
      if (!open) {
        open = true; de.classList.add('hxw-open');
        if (how !== 'nohist') { try { history.pushState({ hxwCard: 1, i: i }, ''); } catch (e) {} }
      } else if (history.state && history.state.hxwCard) { try { history.replaceState({ hxwCard: 1, i: i }, ''); } catch (e) {} }
    }
    function close(viaPop) {
      if (!open) return;
      open = false; de.classList.remove('hxw-open');
      if (!viaPop && history.state && history.state.hxwCard) { try { history.back(); } catch (e) {} }
    }

    window.addEventListener('popstate', function () { if (open) close(true); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) close(); });
    /* the app bar's back arrow closes the card first */
    ctx.bar.addEventListener('click', function (e) {
      if (open && e.target.closest('.hb-back, .hb-app')) { e.preventDefault(); e.stopPropagation(); close(); }
    }, true);

    root.addEventListener('click', function (e) {
      var t = e.target;
      var s = t.closest('[data-sort]');
      if (s) { sort = s.getAttribute('data-sort'); ctx.ls('hxw-sort', sort); renderList(); return; }
      if (t.closest('.hxw-clr')) { input.value = ''; q = ''; clr.hidden = true; renderList(); input.focus(); return; }
      var w = t.closest('[data-i]');
      if (w && !w.disabled) {
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.button > 0) return; /* let a new tab open the post */
        e.preventDefault(); show(+w.getAttribute('data-i'));
      }
    });
    input.addEventListener('input', function () { q = input.value.trim().toLowerCase(); clr.hidden = !input.value; renderList(); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') input.blur(); });

    function layout() {
      var t = two();
      de.classList.toggle('hxw-two', t);
      if (t) { if (open) { open = false; de.classList.remove('hxw-open'); } show(sel); }
      renderList();
    }
    if (mq.addEventListener) mq.addEventListener('change', layout); else if (mq.addListener) mq.addListener(layout);
    layout();
    /* swipe between words on an open card, the same as posts (Nov 3,
       Toby: keep it consistent). Finger left = older word, right = newer.
       The Newer / Older buttons stay. Swiping doesn't add back steps, so
       back still closes the card. */
    /* desktop: the ← → keys step through words too (the card already has
       Newer / Older buttons, so no extra arrows) */
    if (ctx.arrows) ctx.arrows({
      buttons: false,
      active: function () { return open || two(); },
      has: function (dir) { return !!W[dir < 0 ? sel + 1 : sel - 1]; },
      go: function (dir) { show(dir < 0 ? sel + 1 : sel - 1); },
      label: function () { return ''; }
    });
    if (ctx.swipe) ctx.swipe({
      active: function (t) { return (open || two()) && !!(t && t.closest && t.closest('.hxw-detail')); },
      has: function (dir) { return !!W[dir < 0 ? sel + 1 : sel - 1]; },
      go: function (dir) { show(dir < 0 ? sel + 1 : sel - 1); }
    });
    /* coming back from a post (Read more or the date link): reopen the card
       he was on instead of dropping him on the list (Nov 2, Toby) */
    var hs = history.state;
    if (hs && hs.hxwCard && W[hs.i || 0]) show(hs.i || 0, 'nohist');
  };
})();
