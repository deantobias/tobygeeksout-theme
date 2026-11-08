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
      /* the Den icon and name go all the way back to Den's main screen (Nov 3) */
      else if (state.view !== 'home' && e.target.closest('.hb-app')) { e.preventDefault(); e.stopPropagation(); history.go(state.view === 'detail' && state.fromList ? -2 : -1); }
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
        /* newest wins (Nov 5): the Watching page links the card to Trakt
           when Trakt is newer than the post, so the post isn't used here */
        if (p && p.url) { try { if (new URL(href, location.href).pathname !== new URL(p.url, location.href).pathname) p = null; } catch (er) {} }
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
