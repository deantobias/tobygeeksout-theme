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
