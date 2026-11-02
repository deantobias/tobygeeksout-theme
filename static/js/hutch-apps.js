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
        '<div class="ar-lbl">All folders<span>' + FOLDERS.length + '</span></div><div class="ar-fwrap"></div></div></div></div>' +
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
    if (back) back.addEventListener('click', function (e) { if (open) { e.stopImmediatePropagation(); history.back(); } }, true);
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
          ps.slice(0, mx).map(function (p) { return '<span class="ca-chip" style="background:' + color(p) + '">' + esc(p.t.replace(/^\W*(Word Nerd Alert|Blaugust Day \d+|Now Watching):\s*/i, '')) + '</span>'; }).join('') +
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
    var READ = D.reading || [], WATCH_POSTS = D.watching || [], HIST = D.history || [];
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
      open: '<path d="M14 4h6v6 M20 4l-9 9 M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'
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
    tag(READ, 'reading'); tag(WATCH, 'watching'); tag(HIST, 'history');
    var SECTIONS = {
      reading: { title: 'Currently reading', items: function () { return READ; }, empty: 'Between books right now.' },
      watching: { title: 'Currently watching', items: function () { return WATCH; }, empty: 'Nothing playing right now.' },
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
    function watchCard(x) {
      var bg = x.cover ? img(x.cover, 'blur') : '';
      var line2 = x.kind === 'TV' ? (x.epn || (x.d ? 'Last watched ' + x.d : '')) : 'Movie' + (x.y ? ' · ' + x.y : '');
      return '<button type="button" class="it hd-wcard" data-pick="' + x.id + '"><span class="blurbg" style="background:' + grad(x) + '"></span>' + bg +
        '<span class="thumb" style="background:' + grad(x) + '"><span class="tn">' + esc(x.t) + '</span>' + img(x.cover) + '</span>' +
        '<span class="winfo"><span class="ty">' + (x.kind === 'TV' ? 'TV' : 'Movie') + '</span><span class="nm">' + esc(x.t) + '</span>' +
        '<span class="ep">' + esc(x.kind === 'TV' ? where(x) + (left(x) ? '  ·  ' + left(x) : '') : (x.d ? 'Started ' + x.d : 'Movie')) + '</span>' +
        (line2 ? '<span class="en">' + esc(line2) + '</span>' : '') + bar(x) + '</span></button>';
    }
    function histTile(x) {
      return '<button type="button" class="it it-hist" data-pick="' + x.id + '">' + art(x) + '<span class="cap">' + stars(x.r) + '<span class="tt">' + esc(x.t) + '</span><span class="tm">' +
        (x.kind === 'TV' && x.season ? 'Season ' + x.season + ' · ' : '') + esc(x.d) + '</span></span></button>';
    }
    function section(key, tiles, count) {
      var S = SECTIONS[key], items = S.items();
      return '<section class="sec sec-' + key + '"><button type="button" class="shead" data-open="' + key + '"><h2>' + S.title + '</h2>' + ic('chev') +
        (count ? '<small>' + items.length + '</small>' : '') + '</button>' +
        (items.length ? '<div class="row">' + items.slice(0, 24).map(tiles).join('') + '</div>' : '<p class="none">' + S.empty + '</p>') + '</section>';
    }
    function renderHome() {
      var y = homeEl.scrollTop;
      var keepX = {};
      [].forEach.call(homeEl.querySelectorAll('.row'), function (r) { keepX[r.parentNode.className] = r.scrollLeft; });
      homeEl.innerHTML = section('reading', bookTile) + section('watching', watchCard) + section('history', histTile, true);
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
    function detail(x) {
      if (!x) return '<p class="none pad">Pick something on the left.</p>';
      var done = x.sec === 'history', p = pct(x);
      var meta = x.kind === 'Book' ? 'Book' + (x.who ? ' · ' + esc(x.who) : '') : (x.kind === 'TV' ? 'TV' : 'Movie') + (x.y ? ' · ' + esc(x.y) : '');
      var sub = '';
      if (x.kind === 'TV') sub = done ? (x.season ? 'Season ' + x.season : '') : (x.season ? 'Season ' + x.season + (x.ep ? ' · Episode ' + x.ep + (x.eps ? ' of ' + x.eps : '') : '') : '');
      else if (x.kind === 'Movie' && x.who) sub = 'Directed by ' + esc(x.who);
      if (x.kind === 'TV' && done && x.who) sub += (sub ? ' · ' : '') + 'Created by ' + esc(x.who);
      var prog = '';
      if (!done) {
        var label = x.kind === 'TV' ? 'Now on' : 'Progress', val = '';
        if (x.kind === 'TV') val = x.ep ? 'E' + x.ep + (x.epn ? ' · ' + esc(x.epn) : '') + (left(x) ? '<span class="left">' + esc(left(x)) + '</span>' : '') : (x.season ? 'Season ' + x.season : '');
        else if (x.kind === 'Book') val = esc(where(x)) + (x.page && x.total && x.pct >= 0 ? ' · ' + x.pct + '%' : '');
        else val = x.d ? 'Started ' + esc(x.d) : '';
        if (val) prog = '<div class="prog"><div class="lbl first">' + label + '</div><div class="pv">' + val + '</div>' + (p >= 0 ? '<div class="bar"><i style="width:' + p + '%"></i></div>' : '') + '</div>';
      }
      var ext = /^https?:/i.test(x.url || '') && (x.url || '').indexOf(location.origin) !== 0;
      var btn = x.url ? '<a class="btn" href="' + esc(x.url) + '"' + (ext ? ' rel="noopener"' : '') + '>' + (ext ? 'See it on Trakt' : 'Read the post') + ' ' + ic('open') + '</a>' : '';
      var when = done ? 'Finished ' + esc(x.date || x.d) : (x.kind === 'Book' ? 'Reading now' : 'Watching now') + (x.d ? ' · ' + (x.kind === 'Book' ? 'updated ' : 'last posted ') + esc(x.d) : '');
      if (!done && ext) when = 'Watching now' + (x.d ? ' · last watched ' + esc(x.d) : '');
      var bg = x.cover ? img(x.cover, 'bgimg') : '';
      return '<div class="dtop"><div class="bg" style="background:' + (x.kind === 'Book' ? bookBg(x) : grad(x)) + '"></div>' + bg + '<div class="art">' + art(x) + '</div><div class="info">' +
        '<div class="meta">' + meta + '</div><h2>' + esc(x.t) + '</h2>' + (sub ? '<div class="sub2">' + sub + '</div>' : '') +
        (done ? '<div class="rate">' + stars(x.r) + '<b>' + rtext(x.r) + ' of 5</b></div>' : '') + '</div></div>' +
        '<div class="dbody">' + prog + (x.sum ? '<div class="lbl">Summary</div><p class="summary">' + esc(x.sum) + '</p>' : '') + btn +
        '<div class="when">' + when + '</div></div>';
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
    }, true);

    root.addEventListener('click', function (e) {
      var t = e.target;
      var o = t.closest('[data-open]'); if (o) { openList(o.getAttribute('data-open')); return; }
      var f = t.closest('[data-f]'); if (f) { state.filter = f.getAttribute('data-f'); state.id = null; go(state, false); return; }
      var p = t.closest('[data-pick]'); if (p) { openItem(p.getAttribute('data-pick')); return; }
    });
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
        /* Trakt's latest episode, number, name and season size (data-* on the card) */
        var tep = +(card.getAttribute('data-ep') || 0), tepn = card.getAttribute('data-epn') || '', teps = +(card.getAttribute('data-eps') || 0), trt = +(card.getAttribute('data-rt') || 0);
        if (p) {
          var c = {}; for (var k in p) c[k] = p[k];
          if (season > (c.season || 0)) { c.season = season; c.ep = 0; c.eps = 0; c.epn = ''; }
          if (tep && season >= (c.season || 0) && tep >= (c.ep || 0)) { c.ep = tep; c.epn = tepn || (tep === c.ep ? c.epn : ''); if (teps) c.eps = teps; }
          if (trt) c.rt = trt;
          else if (teps && !c.eps && season === c.season) c.eps = teps;
          if (!c.cover && cover) c.cover = cover;
          if (d && /Last watched/i.test((card.querySelector('.wr-date') || {}).textContent || '')) c.d = d;
          out.push(c);
        } else {
          out.push({ id: 't' + n, sec: 'watching', kind: /movie/i.test(prog) ? 'Movie' : 'TV', t: t, n: n, season: season, ep: tep, eps: teps, epn: tepn, rt: trt, y: '', cover: cover, url: href, d: d, date: dtx, sum: '' });
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
   Home: profile header + a square grid of every photo post's first
   photo, "+N" when the post holds more. 3 across on the phone, 4 on the
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
      var n = p.ph.length;
      return '<a class="hxp-tile" href="' + esc(p.u) + '" data-i="' + i + '" aria-label="' + esc(p.l + ', ' + p.dl + (n > 1 ? ', ' + n + ' photos' : '')) + '">' +
        img(p.ph[0], 400, '', i > 11) + (n > 1 ? '<span class="hxp-plus" aria-hidden="true">+' + (n - 1) + '</span>' : '') + '</a>';
    }).join('');
    var counts = '<div class="hxp-counts"><span><strong>' + P.length + '</strong>' + (P.length === 1 ? 'post' : 'posts') + '</span><span><strong>' + D.photos + '</strong>' + (D.photos === 1 ? 'photo' : 'photos') + '</span></div>';
    var root = ctx.el('<div class="hx-photos" data-mode="' + M + '">' +
      '<main class="hxp-home" aria-label="Photos">' +
        '<header class="hxp-prof"><div class="hxp-face">' + face + '</div><div class="hxp-info"><h1>' + esc((ctx.page && ctx.page.site) || 'Toby Geeks Out!') + '</h1><p class="hxp-bio">' + esc(D.bio || '') + '</p></div>' + counts + '</header>' +
        '<div class="hxp-grid">' + tiles + '</div>' +
      '</main>' +
      '<section class="hxp-det" aria-label="Photo post" aria-hidden="true"></section></div>');
    var det = root.querySelector('.hxp-det');
    document.body.appendChild(root);
    de.classList.add('hxp-on');
    ctx.own();

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
          '<div class="hxp-nav"><button type="button" data-go="-1"' + (i === 0 ? ' disabled' : '') + '>' + ic('l') + 'Newer</button><button type="button" data-go="1"' + (i === P.length - 1 ? ' disabled' : '') + '>Older' + ic('r') + '</button></div></div>';
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

    function openPost(i, push) {
      cur = i;
      if (M === 'land') showSplit(i, 0);
      else {
        if (built !== 'feed') buildFeed();
        var a = det.querySelector('.hxp-post[data-i="' + i + '"]');
        det.scrollTop = a ? a.offsetTop : 0;
        if (a) { var im = a.querySelector('img'); if (im) im.removeAttribute('loading'); }
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
      var t = root.querySelector('.hxp-tile[data-i="' + cur + '"]');
      if (t) {
        var r = t.getBoundingClientRect();
        if (r.top < 56 || r.bottom > innerHeight) window.scrollTo(0, Math.max(0, window.scrollY + r.top - innerHeight / 3));
        try { t.focus({ preventScroll: true }); } catch (e) {}
      }
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
      var s = e.target.closest('[data-step]'); if (s) { step(+s.getAttribute('data-step')); return; }
      var g = e.target.closest('[data-go]'); if (g) { var j = cur + +g.getAttribute('data-go'); if (j >= 0 && j < P.length) showSplit(j, 0); return; }
      var k = e.target.closest('[data-k]'); if (k) { var car = det.querySelector('.hxp-car'); if (car) goPhoto(car, +k.getAttribute('data-k'), true); }
    });
    root.addEventListener('keydown', function (e) {
      if (e.target.classList && e.target.classList.contains('hxp-car') && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); e.target.click(); }
    });
    document.addEventListener('keydown', function (e) {
      if (!open || document.querySelector('.hx-sheet.open')) return;
      if (e.key === 'Escape') back();
      else if (built === 'split' && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { e.preventDefault(); step(e.key === 'ArrowRight' ? 1 : -1); }
    });
    /* the app bar's back button closes the post first */
    ctx.bar.addEventListener('click', function (e) {
      if (open && e.target.closest('.hb-back')) { e.preventDefault(); e.stopPropagation(); back(); }
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
   Small apps (v37 mockup): About, Contact, Uses, Follow. Nov 2, 2026.
   One shared shell: the app bar (from hutch.js), then the page Toby
   wrote in Micro.blog, moved (not copied) out of #main-content into
   the app so his words, links and any form keep working as they are.
   Each app adds its own small touch on top:
     About    his face, name and a few facts counted by Hugo
     Contact  a big "Email me" button from the page's own mailto link
     Uses     the Geek Gear shortcode as icon rows, one card per section
     Follow   every way to follow as a big tappable row
   Landscape (unfolded sideways, desktop): About and Contact go two
   panes that scroll on their own; Uses and Follow go two columns.
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
    root.side.innerHTML = '<div class="hx-sm-hero">' + face + (name ? '<h2>' + ctx.esc(name) + '</h2>' : '') +
      (d.site ? '<div class="sub">' + ctx.esc(d.site) + '</div>' : '') + '</div>' +
      (facts.length ? '<div class="hx-sm-facts">' + facts.join('') + '</div>' : '');
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
    });
    finish(ctx, root, true);
  };

  /* ---------------- Uses ---------------- */
  var USE_IC = [[/computer|mac|laptop|desk/i, 'laptop'], [/phone|mobile/i, 'phone'], [/communic|chat|talk|caption/i, 'chat'],
    [/writ|read|blog/i, 'pen'], [/build|code|dev/i, 'code'], [/photo|camera/i, 'camera'], [/\bai\b|helper/i, 'spark'],
    [/browser|web/i, 'globe'], [/screen|offline|hobby|life|lego/i, 'brick']];
  var ITEM_IC = [[/monitor|display/i, 'monitor'], [/mac mini|desktop|\bpc\b/i, 'desktop'], [/pixel|galaxy|iphone|phone/i, 'phone'],
    [/camera/i, 'camera'], [/perch/i, 'bird'], [/studio|editor/i, 'pen'], [/claude|gemini|chatgpt/i, 'spark'], [/micro\.blog/i, 'mb']];
  function pick(list, s, dflt) { for (var i = 0; i < list.length; i++) if (list[i][0].test(s)) return list[i][1]; return dflt; }
  HutchApps.uses = function (ctx) {
    var root = shell(ctx); if (!root) return;
    var doc = root.doc, u = doc.querySelector('.uses');
    var head = titleHTML(ctx, root);
    if (u) {
      var out = '';
      var intro = u.querySelector('.uses-intro'), upd = u.querySelector('.uses-updated');
      if (upd) out += '<div class="hx-sm-updated">' + upd.innerHTML + '</div>';
      if (intro) out += '<p class="hx-sm-lede">' + intro.innerHTML + '</p>';
      out += '<div class="hx-sm-groups">';
      [].forEach.call(u.querySelectorAll('.uses-group'), function (g, gi) {
        var h = g.querySelector('.uses-head'), hs = h ? h.textContent.trim() : '';
        var sic = pick(USE_IC, hs, 'gear'), col = PAL[gi % PAL.length];
        out += '<section class="hx-sm-group">' + (h ? '<h3>' + h.innerHTML + '</h3>' : '');
        var lis = g.querySelectorAll('.uses-list > li');
        if (lis.length) {
          out += '<div class="hx-sm-uses">';
          [].forEach.call(lis, function (li) {
            var nm = li.querySelector('.uses-name'), why = li.querySelector('.uses-why'), tags = '';
            var nmc = nm ? nm.cloneNode(true) : null;
            if (nmc) [].forEach.call(nmc.querySelectorAll('.uses-tag'), function (t) { tags += '<span class="tag">' + t.innerHTML + '</span>'; t.remove(); });
            var label = nmc ? nmc.innerHTML.trim() : li.innerHTML;
            var ik = pick(ITEM_IC, nmc ? nmc.textContent : '', sic);
            out += '<div class="it"><span class="ri" style="background:' + col + '">' + svg(ik) + '</span><span class="m"><b>' + label + '</b>' + tags +
              (why ? '<small>' + why.innerHTML + '</small>' : '') + '</span></div>';
          });
          out += '</div>';
        }
        [].forEach.call(g.querySelectorAll(':scope > p'), function (p) { out += '<div class="hx-sm-note"><span class="ri" style="background:' + col + '">' + svg(sic) + '</span><p>' + p.innerHTML + '</p></div>'; });
        out += '</section>';
      });
      out += '</div>';
      var box = document.createElement('div'); box.className = 'hx-sm-usesapp'; box.innerHTML = out;
      u.parentNode.replaceChild(box, u);
    }
    if (head) doc.insertAdjacentHTML('afterbegin', head);
    tidy(doc, ctx);
    finish(ctx, root, false);
  };

  /* ---------------- Follow ---------------- */
  HutchApps.follow = function (ctx) {
    var root = shell(ctx); if (!root) return;
    var doc = root.doc, d = ctx.data || {}, used = [];
    var links = [].slice.call(doc.querySelectorAll('a[href]'));
    function find(kind) { for (var i = 0; i < links.length; i++) if (used.indexOf(links[i]) < 0 && kindOf(links[i])[0] === kind && !links[i].closest('form')) { used.push(links[i]); return links[i]; } return null; }
    var rows = [];

    /* 1. email newsletter: the page's own signup form, moved in whole */
    var form = [].filter.call(doc.querySelectorAll('form'), function (f) { return f.querySelector('input[type="email"], input[name*="email" i]'); })[0];
    var nlLink = null;
    if (!form) { nlLink = [].filter.call(links, function (a) { var k = kindOf(a); return k[0] === 'mail' && k[2] === 'Newsletter'; })[0] || null; if (nlLink) used.push(nlLink); }
    if (form || nlLink) {
      var sub = 'New posts in your inbox', prev = form && form.previousElementSibling;
      if (prev && prev.tagName === 'P' && !prev.querySelector('a') && prev.textContent.length < 160) { sub = prev.textContent.trim(); prev.remove(); }
      if (form) {
        var row = ctx.el('<div class="hx-sm-row hx-sm-nl"><span class="ri" style="background:#C4622D">' + svg('mail') + '</span><span class="m"><b>Email newsletter</b><small>' + ctx.esc(sub) + '</small></span></div>');
        form.classList.add('hx-sm-subform');
        /* a visible label would repeat the row title; keep it for screen readers */
        [].forEach.call(form.querySelectorAll('label'), function (l) { l.classList.add('hx-sm-sr'); });
        var em = form.querySelector('input[type="email"], input[name*="email" i]');
        if (em && !em.getAttribute('placeholder')) em.setAttribute('placeholder', 'you@example.com');
        row.appendChild(form);
        rows.push(row);
      } else rows.push(rowA(nlLink.getAttribute('href'), 'mail', '#C4622D', 'Email newsletter', sub, 'Sign up', true));
    }

    /* 2. feeds: the page's own links if it has them, else the theme's (same as the side rail) */
    var rss = find('rss'), json = find('json');
    var rssU = rss ? rss.href : d.rss, jsonU = json ? json.href : d.json;
    if (rssU) rows.push(rowCopy(rssU, 'rss', '#E08A3C', 'RSS feed', 'For your feed reader'));
    if (jsonU) rows.push(rowCopy(jsonU, 'json', '#7A8F6A', 'JSON feed', 'For readers that speak JSON Feed'));

    /* 3. social: only what the page itself links to */
    var mb = find('mb'), bs = find('bsky'), ma = find('masto');
    if (mb) rows.push(rowA(mb.getAttribute('href'), 'mb', '#5B7A8C', 'Micro.blog', 'Follow on the timeline', 'Follow'));
    if (bs) rows.push(rowA(bs.getAttribute('href'), 'bsky', '#3F7FA6', 'Bluesky', handle(bs), 'Follow'));
    if (ma) rows.push(rowA(ma.getAttribute('href'), 'masto', '#6B5CA5', 'Mastodon', handle(ma), 'Follow'));

    /* 4. past newsletters (the side rail's "Browse past newsletters" link) */
    if (d.past && (form || nlLink)) rows.push(rowA(d.past, 'archive', '#8C6A4F', 'Past newsletters', 'Read the ones you missed', 'Open', false, true));

    if (!rows.length) { finish(ctx, root, false); tidy(doc, ctx); return; }

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
    if (root.title) doc.insertAdjacentHTML('beforeend', titleHTML(ctx, root));
    doc.appendChild(intro);
    var list = document.createElement('div'); list.className = 'hx-sm-follow';
    rows.forEach(function (r) { list.appendChild(r); });
    doc.appendChild(list);
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
    function rowA(href, ic, col, t, s, go, ext, same) {
      var out = !same && !/^\//.test(href) && href.indexOf(location.origin) !== 0;
      return ctx.el('<a class="hx-sm-row" href="' + ctx.esc(href) + '"' + (out ? ' target="_blank" rel="me noopener"' : '') + '><span class="ri" style="background:' + col + '">' + svg(ic) + '</span><span class="m"><b>' + ctx.esc(t) + '</b><small>' + ctx.esc(s) + '</small></span><span class="go">' + ctx.esc(go) + '</span></a>');
    }
    function rowCopy(u, ic, col, t, s) {
      return ctx.el('<button type="button" class="hx-sm-row" data-copy="' + ctx.esc(u) + '" aria-label="Copy the ' + ctx.esc(t) + ' link"><span class="ri" style="background:' + col + '">' + svg(ic) + '</span><span class="m"><b>' + ctx.esc(t) + '</b><small>' + ctx.esc(s) + '</small></span><span class="go">Copy</span></button>');
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
   Random (the dice button) opens any word. Read more opens the post.
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
        '<h2 class="hxw-word">' + esc(x.w) + '</h2>' +
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
        '<button type="button" class="hxw-fab" data-random aria-label="Random word">' + ic('dice') + '<span>Random</span></button>' +
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
    function random() {
      if (W.length < 2) return show(0);
      var i; do { i = Math.floor(Math.random() * W.length); } while (i === sel && (open || two()));
      show(i);
    }

    window.addEventListener('popstate', function () { if (open) close(true); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) close(); });
    /* the app bar's back arrow closes the card first */
    ctx.bar.addEventListener('click', function (e) {
      if (open && e.target.closest('.hb-back')) { e.preventDefault(); e.stopPropagation(); close(); }
    }, true);

    root.addEventListener('click', function (e) {
      var t = e.target;
      if (t.closest('[data-random]')) { random(); return; }
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
    /* coming back from a post (Read more or the date link): reopen the card
       he was on instead of dropping him on the list (Nov 2, Toby) */
    var hs = history.state;
    if (hs && hs.hxwCard && W[hs.i || 0]) show(hs.i || 0, 'nohist');
  };
})();
