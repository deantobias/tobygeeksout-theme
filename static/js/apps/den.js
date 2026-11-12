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
      /* Nov 12 (Toby: "I was sure I finished ep 2"): Trakt logs an episode once it is finished, so episode 2 of 8 is 2/8 done */
      if (x.kind === 'TV' && x.ep && x.eps) return Math.min(100, Math.round(x.ep / x.eps * 100));
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
      history: { title: 'History', items: function () { return histAll(); }, empty: 'No ratings yet.' }
    };
    function get(id) { var all = READ.concat(WATCH, HIST, QUEUE_ALL, FIN_TV, FIN_MV); for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i]; return null; }

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
    /* Nov 12 (Toby: "add it as history, the rating will be updated"): a season
       or movie he finished in the last 30 days and has not rated yet sits in
       History with "Not rated yet" where the stars go. His review takes its
       place once he rates it; after 30 days without one it drops off.
       Seasons come from the Watching page (window.tgoFinished), movies from
       his public Trakt history. */
    var FIN_TV = [], FIN_MV = [], FIN_DAYS = 30;
    function rated(n, kind, season) {
      return HIST.some(function (h) { return h.kind === kind && norm(h.t) === n && (kind !== 'TV' || !h.season || !season || h.season >= season); });
    }
    function isoDay(ms) { var d = new Date(ms); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
    function histAll() {
      var extra = FIN_TV.concat(FIN_MV); if (!extra.length) return HIST;
      return extra.concat(HIST).map(function (x, i) { return [x, i]; }).sort(function (a, b) {
        var da = a[0].iso || '', db = b[0].iso || ''; return da === db ? a[1] - b[1] : (da < db ? 1 : -1);
      }).map(function (p) { return p[0]; });
    }
    function rate(x) { return x.fin && !x.r ? '<span class="tm unr">Not rated yet</span>' : stars(x.r); }
    function histTile(x) {
      return '<button type="button" class="it it-hist" data-pick="' + x.id + '">' + art(x) + '<span class="cap">' + rate(x) + '<span class="tt">' + esc(x.t) + '</span><span class="tm">' +
        (x.kind === 'TV' && x.season ? 'Season ' + x.season + ' · ' : '') + esc(whenShort(x)) + '</span></span></button>';
    }
    /* Nov 12 (Toby, mockup v129): a rated movie or season also says the day
       he finished watching it (Trakt), when that is not the day he rated it.
       x.wd / x.wdate are filled in by readSeen(); no Trakt record, no change. */
    function whenShort(x) {
      var w = x.fin ? x.d : x.wd;
      return w ? (x.kind === 'Movie' ? 'Watched ' : '') + w : x.d;
    }
    function whenList(x) {
      var verb = x.kind === 'Movie' ? 'Watched ' : 'Finished ';
      if (x.fin) return verb + x.d;
      return x.wd ? verb + x.wd + ' · Rated ' + x.d : x.d;
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
    /* Nov 12 (Toby): Waiting for opens here in the Den too, like Currently
       and History, with a permalink to the queue post */
    function relLine(x) { var r = relShort(x); return x.out ? 'Out now' : (r === 'TBA' ? 'No date yet' : 'Coming ' + r); }
    function queueTile(x) {
      return '<button type="button" class="it it-hist it-q" data-pick="' + x.id + '"><div class="poster" style="background:' + grad(x) + '"><div class="pn">' + esc(x.t) + '</div>' + img(x.cover) +
        '<span class="qbadge ' + soon(x) + '">' + esc(relShort(x)) + '</span></div><span class="cap"><span class="tt">' + esc(x.t) + '</span><span class="tm">' +
        esc(x.out ? 'Out now · ' + x.kind : x.kind + (relShort(x) !== 'TBA' ? ' · ' + relShort(x) : ' · No date yet')) + '</span></span></button>';
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
        var meta = x.sec === 'queue' ? esc(x.kind + ' · ' + relLine(x)) : h ? (x.kind === 'Book' ? (x.who ? esc(x.who) + ' · ' : '') : x.kind + (x.kind === 'TV' && x.season ? ' · Season ' + x.season : '') + ' · ') + esc(x.kind === 'Book' ? x.d : whenList(x))
          : x.kind === 'Book' ? esc(where(x)) + (x.who ? ' · ' + esc(x.who) : '')
          : x.kind === 'TV' ? 'TV · ' + esc(where(x)) + (x.epn ? ' · ' + esc(x.epn) : '') : esc(where(x));
        return '<button type="button" class="li' + (two() && x.id === state.id ? ' sel' : '') + '" data-pick="' + x.id + '"><span class="mini">' + art(x) + '</span><span class="m"><span class="tt">' + esc(x.t) + '</span>' +
          '<span class="tm">' + meta + '</span>' + (h ? rate(x) : bar(x)) + '</span></button>';
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
          return { ov: s.overview || '', net: s.network || '', genres: s.genres || [], cert: s.certification || '', status: s.status || '', y: s.year || '', tmdb: (s.ids && s.ids.tmdb) || 0, trakt: (s.ids && s.ids.trakt) || 0 };
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
    /* Nov 12 (Toby: a watched episode should say WHEN he watched it): the day
       each episode of this season was finished, from his public Trakt history */
    var TUSER = 'technogeek75';
    function seenDates(traktId, n) {
      if (!traktId) return Promise.resolve({});
      return cached('tgo_den_seen_v1_' + traktId + '_' + n, HOUR / 2, function () {
        return tget('/users/' + TUSER + '/history/shows/' + traktId + '?limit=300').then(function (list) {
          var out = {};
          (list || []).forEach(function (h) {
            var e = h.episode; if (!e || e.season !== n || !h.watched_at) return;
            if (!out[e.number] || h.watched_at > out[e.number]) out[e.number] = h.watched_at;
          });
          return out;
        });
      }, function (v) { for (var k in v) return false; return true; });
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
          .then(function (tmdb) {
            var c = seenDates(t.show && t.show.trakt, x.season).then(function (d) { t.seen = d; }, function () {});
            return Promise.all([c, stillsFor(tmdb, x.season).then(function (s) { t.st = s.st; t.bd = s.bd; }, function () {})]);
          });
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

    /* what Trakt knows about a title on the Waiting for list (found through
       the Trakt link in its post): synopsis, release date, running time, genres */
    var I = {};
    function loadInfo(x, p) {
      var src = (p && p.trakt) || (x.fin ? x.url : '');
      var m = src ? src.match(/trakt\.tv\/(movies|shows)\/([^\/?#]+)/) : null;
      if (!m) return Promise.resolve(null);
      var key = m[1] + '/' + decodeURIComponent(m[2]);
      return cached('tgo_den_info_v1_' + key, 7 * DAY, function () {
        return tget('/' + m[1] + '/' + encodeURIComponent(decodeURIComponent(m[2])) + '?extended=full').then(function (j) {
          return { ov: j.overview || '', tag: j.tagline || '', tmdb: (j.ids && j.ids.tmdb) || 0, rel: j.released || j.first_aired || '', rt: j.runtime || 0, genres: j.genres || [], cert: j.certification || '', type: m[1] };
        });
      }).then(function (v) { I[x.url] = v; return v; }, function () { return null; });
    }
    function longDate(iso) {
      var d = new Date(String(iso).length === 10 ? iso + 'T12:00:00' : iso); if (!iso || isNaN(d)) return '';
      return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
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
      return '<div class="lbl">Get the book</div><div class="btns">' + ext('Amazon', 'https://www.amazon.com/s?k=' + e) + ext('Bookshop.org', isbn ? 'https://bookshop.org/book/' + isbn : 'https://bookshop.org/search?keywords=' + e) + ext('Nook', 'https://www.barnesandnoble.com/s/' + e) + '</div>' +
        (isbn ? '<div class="lbl">On Micro.blog</div><div class="btns">' + ext('Add to my bookshelf', 'https://micro.blog/books/' + isbn, 'solid') + '</div><p class="hint">Opens this book on Micro.blog, where members pick a shelf.</p>' : '');
    }
    function epsHtml(x, t) {
      var eps = (t && t.eps) || []; if (!eps.length) return '';
      /* Nov 12 (Toby: "I was sure I finished ep 2"): Trakt only logs an episode
         once it is finished, so the logged episode is WATCHED (ticked, with its
         synopsis) and the one after it is "Up next". Later ones stay quiet. */
      var cur = x.fin ? eps.length : (x.ep || 0), st = (t && t.st) || {}, sd = (t && t.seen) || {};
      var open = OPENEPS[x.id], from = open ? 0 : Math.max(0, cur - 2), to = open ? eps.length : Math.min(eps.length, cur + 3);
      var rows = eps.slice(from, to).map(function (e) {
        var seen = cur && e.n <= cur, next = e.n === cur + 1, later = !seen && !next;
        var aired = e.air && new Date(e.air) <= new Date();
        var th = st[e.n] ? '<span class="eth">' + img(st[e.n]) + (seen ? '<em>' + ic('check') + '</em>' : '') + '</span>' : '<span class="enum' + (seen ? ' seen' : '') + (next ? ' now' : '') + '">' + (seen ? ic('check') : e.n) + '</span>';
        var when = airDate(e.air) ? (aired ? '' : 'Airs ') + airDate(e.air) : '';
        if (seen && sd[e.n] && airDate(sd[e.n])) when = 'Watched ' + airDate(sd[e.n]);
        var meta = [next ? 'Up next' : '', when, e.rt ? e.rt + ' min' : ''].filter(Boolean).join(' · ');
        return '<li class="ep' + (next ? ' now' : '') + (later ? ' later' : '') + (st[e.n] ? ' pic' : '') + '">' + th + '<span class="etx"><span class="en"><b>E' + e.n + '</b>' + (e.t ? ' · ' + esc(e.t) : '') + '</span>' +
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
      if ((x.sec === 'watching' || x.fin) && x.kind === 'TV') {
        var e = null; ((t && t.eps) || []).forEach(function (q) { if (q.n === x.ep) e = q; });
        var wd = t && t.seen && t.seen[x.ep] ? airDate(t.seen[x.ep]) : '';
        var small = [wd ? 'Watched ' + wd : '', e && e.rt ? e.rt + ' min' : (x.rt ? x.rt + ' min' : ''), !wd && e && e.air ? 'aired ' + airDate(e.air) : '', left(x) ? left(x).replace(/^(\d+) left/, function (m, n) { return n + (n === '1' ? ' episode left' : ' episodes left'); }) : ''].filter(Boolean).join(' · ');
        var name = (e && e.t) || x.epn;
        var val = x.ep ? 'E' + x.ep + (name ? ' · ' + esc(name) : '') : (x.season ? 'Season ' + x.season : '');
        if (!small && x.ep && x.eps && x.ep >= x.eps) small = 'Season finished';
        else if (x.ep && x.eps && x.ep >= x.eps) small += ' · season finished';
        if (x.fin) { val = 'Season ' + x.season + (x.eps ? ' · ' + x.eps + ' episodes' : ''); small = (x.d ? x.d + ' · ' : '') + 'Not rated yet'; }
        if (val) h += '<div class="prog"><div class="lbl first">' + (x.fin ? 'Finished' : 'Last watched') + '</div><div class="pv">' + val + (small ? '<span class="left">' + esc(small) + '</span>' : '') + '</div>' + (pct(x) >= 0 && !x.fin ? '<div class="bar"><i style="width:' + pct(x) + '%"></i></div>' : '') + '</div>';
        var ov = x.fin ? '' : (e && e.ov) || (p && p.syn) || sumOf(x);
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
        if (x.fin) return h + permaHtml('Finished ' + (x.date || x.d) + ' · Not rated yet', x);
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
      /* Waiting for (Nov 12, Toby): synopsis, release, where to watch, Trakt.
         Trakt does not give out streaming / rent / buy lists without a login
         (watchnow answers 403), so "Where to watch" opens TMDB's page for it. */
      if (x.sec === 'queue') {
        var i = I[x.url] || null;
        var qf = (p && p.facts.length ? p.facts.slice() : []);
        if (i && i.rel) qf.push([new Date(i.rel) > new Date() ? 'Coming' : 'Released', longDate(i.rel)]);
        if (i && i.rt) qf.push(['Runtime', i.rt + ' min']);
        h += factsHtml(qf);
        var qs = (p && p.syn) || (i && i.ov) || '', qt = (p && p.tag) || (i && i.tag) || '';
        if (qs || qt) h += '<div class="lbl">Synopsis</div>' + (qt ? '<p class="tagline">' + esc(qt) + '</p>' : '') + (qs ? '<p class="summary">' + esc(qs) + '</p>' : '');
        if (p && p.thoughts.length) h += '<div class="lbl">My thoughts</div><div class="thoughts">' + p.thoughts.map(function (t0) { return '<p class="summary">' + esc(t0) + '</p>'; }).join('') + '</div>';
        if (i && (i.genres.length || i.cert)) h += '<div class="chips">' + i.genres.slice(0, 4).map(cap).concat([i.cert]).filter(Boolean).map(function (c) { return '<span>' + esc(c) + '</span>'; }).join('') + '</div>';
        var qw = (p && p.where) || (i && i.tmdb ? 'https://www.themoviedb.org/' + (i.type === 'shows' ? 'tv' : 'movie') + '/' + i.tmdb + '/watch' : '');
        var qb = (qw ? ext('Where to watch', qw) : '') + (p && p.trailer ? ext('Trailer', p.trailer) : '') + (p && p.trakt ? ext('More on Trakt', p.trakt) : '');
        if (qb) h += '<div class="btns">' + qb + '</div>' + (qw ? '<p class="hint">Where to watch lists the streaming, rent and buy choices.</p>' : '');
        return h + permaHtml('On the Waiting for list · ' + relLine(x), x);
      }
      /* a movie or a show he rated, or a movie he is watching */
      if (x.fin) {
        var fi = I[x.url] || null;
        h += x.r ? rateHtml(x, p) : '<div class="rate"><b>Not rated yet</b></div>';
        h += factsHtml([['Released', fi && fi.rel ? longDate(fi.rel) : x.y], ['Runtime', fi && fi.rt ? fi.rt + ' min' : '']]);
        if (fi && (fi.ov || fi.tag)) h += '<div class="lbl">Synopsis</div>' + (fi.tag ? '<p class="tagline">' + esc(fi.tag) + '</p>' : '') + (fi.ov ? '<p class="summary">' + esc(fi.ov) + '</p>' : '');
        if (fi && (fi.genres.length || fi.cert)) h += '<div class="chips">' + fi.genres.slice(0, 4).map(cap).concat([fi.cert]).filter(Boolean).map(function (c) { return '<span>' + esc(c) + '</span>'; }).join('') + '</div>';
        var fw = x.tmdb ? 'https://www.themoviedb.org/movie/' + x.tmdb + '/watch' : '';
        h += '<div class="btns">' + (fw ? ext('Where to watch', fw) : '') + ext('More on Trakt', x.url) + '</div>' + (fw ? '<p class="hint">Where to watch lists the streaming, rent and buy choices.</p>' : '');
        return h + permaHtml('Watched ' + (x.date || x.d) + (x.r ? ' · Rated on Trakt' : ' · Not rated yet'), x);
      }
      if (done) h += rateHtml(x, p);
      var mf = p && p.facts.length ? p.facts.slice() : [[x.kind === 'TV' ? 'Created by' : 'Director', x.who], ['Released', x.y]];
      if (done && x.wdate) mf.push([x.kind === 'TV' ? 'Finished' : 'Watched', x.wdate]);
      h += factsHtml(mf);
      h += synHtml(p, x, 'Synopsis');
      var b = '';
      if (p && p.where) b += ext('Where to watch', p.where);
      if (p && p.trailer) b += ext('Trailer', p.trailer);
      if (p && p.trakt) b += ext('More on Trakt', p.trakt);
      else if (p && p.tmdb && !p.where) b += ext('More on TMDB', p.tmdb);
      else if (!local(x.url) && x.url) b += ext('More on Trakt', x.url);
      if (b) h += '<div class="btns">' + b + '</div>';
      return h + permaHtml(x.sec === 'queue' ? 'On the Waiting for list' : done ? (x.wdate ? 'Rated ' : 'Finished ') + (x.date || x.d) : (x.d ? 'Started ' + x.d : ''), x);
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
      else if (x.kind === 'TV') sub = x.season ? 'Season ' + x.season + (!done && x.ep ? (x.eps ? ' · ' + x.ep + ' of ' + x.eps + ' watched' : ' · Episode ' + x.ep) : '') : '';
      if (x.sec === 'queue') sub = relLine(x);
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
      loadPost(x).then(function (p) { if (p) patch(x); if (x.sec === 'queue') loadInfo(x, p).then(function (i) { if (i) patch(x); }); });
      if (x.sec === 'watching' || (x.fin && x.kind === 'TV')) loadShow(x).then(function (t) { if (t) { patch(x); paintCards(); } });
      if (x.fin && x.kind === 'Movie') loadInfo(x, null).then(function (i) { if (i) patch(x); });
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
    root.addEventListener('pointerdown', function (e) { var p = e.target.closest && e.target.closest('[data-pick]'); if (p) { var x = get(p.getAttribute('data-pick')); if (x) { loadPost(x); if (x.sec === 'watching' || (x.fin && x.kind === 'TV')) loadShow(x); else if (x.fin) loadInfo(x, null); } } }, { passive: true });
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
      openWanted();
      if (state.view !== 'home' && (state.sec === 'watching')) { if (state.id && !get(state.id)) state.id = null; render(); }
    }
    if (grid && window.MutationObserver) {
      var tmr = 0;
      new MutationObserver(function () { clearTimeout(tmr); tmr = setTimeout(syncWatch, 60); }).observe(grid.parentNode || grid, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['data-ep', 'data-eps', 'data-epn', 'data-rt', 'src'] });
    }

    /* ---------- History: finished, not rated yet (last 30 days) ---------- */
    function histChanged() {
      renderHome();
      if (state.view !== 'home' && state.sec === 'history') { if (state.id && !get(state.id)) state.id = null; render(); }
    }
    function finItem(o) { o.sec = 'history'; o.fin = 1; o.sum = ''; o.who = ''; o.d = airDate(o.at); o.date = longDate(new Date(o.at).toISOString()); o.iso = isoDay(o.at); return o; }
    function readFin() {
      var since = Date.now() - FIN_DAYS * DAY;
      FIN_TV = (window.tgoFinished || []).filter(function (f) { return f && f.title && f.last >= since && !rated(norm(f.title), 'TV', f.season); }).map(function (f) {
        return finItem({ id: 'f' + norm(f.title) + (f.season || ''), kind: 'TV', t: f.title, n: norm(f.title), season: f.season, ep: f.eps || f.ep, eps: f.eps || f.ep, epn: '', r: 0, y: '', cover: f.poster || '', url: f.url || '', slug: f.slug || '', tmdb: f.tmdb || 0, at: f.last });
      });
      histChanged();
    }
    document.addEventListener('tgo:finished', readFin);
    function readMovies() {
      var since = Date.now() - FIN_DAYS * DAY;
      cached('tgo_den_mv_v1', HOUR / 2, function () {
        return Promise.all([
          tget('/users/' + TUSER + '/history/movies?limit=100&start_at=' + encodeURIComponent(new Date(since).toISOString())),
          tget('/users/' + TUSER + '/ratings/movies').catch(function () { return []; })
        ]).then(function (r) {
          var stars10 = {}, seen = {}, out = [];
          (r[1] || []).forEach(function (q) { if (q.movie && q.movie.ids) stars10[q.movie.ids.trakt] = q.rating || 0; });
          (r[0] || []).forEach(function (q) {
            var m = q.movie; if (!m || !m.ids || !m.title || seen[m.ids.trakt]) return;
            seen[m.ids.trakt] = 1;
            out.push({ k: m.ids.trakt, t: m.title, y: m.year || '', slug: m.ids.slug || '', tmdb: m.ids.tmdb || 0, at: new Date(q.watched_at).getTime(), r: (stars10[m.ids.trakt] || 0) / 2 });
          });
          return out;
        });
      }, function (v) { return !v.length; }).then(function (list) {
        FIN_MV = (list || []).filter(function (m) { return m.at >= since && m.slug && !rated(norm(m.t), 'Movie'); }).map(function (m) {
          return finItem({ id: 'm' + m.k, kind: 'Movie', t: m.t, n: norm(m.t), y: m.y ? String(m.y) : '', r: m.r, cover: '', url: 'https://trakt.tv/movies/' + encodeURIComponent(m.slug), slug: m.slug, tmdb: m.tmdb, at: m.at });
        });
        if (!FIN_MV.length) return;
        histChanged();
        if (window.tgoPoster) FIN_MV.forEach(function (x) { window.tgoPoster(x.tmdb, 'movie').then(function (u) { if (u && !x.cover) { x.cover = u; histChanged(); } }); });
      }).catch(function () {});
    }

    /* ---------- History: the day he watched what he rated (Trakt history) ---------- */
    function readSeen() {
      if (!HIST.some(function (x) { return x.kind !== 'Book'; })) return;
      cached('tgo_den_when_v1', HOUR, function () {
        return Promise.all([
          tget('/users/' + TUSER + '/history/movies?limit=1000'),
          tget('/users/' + TUSER + '/history/episodes?limit=1000').catch(function () { return []; })
        ]).then(function (r) {
          var mv = {}, tv = {};
          (r[0] || []).forEach(function (q) {
            if (!q.movie || !q.watched_at) return;
            var n = norm(q.movie.title), a = mv[n] = mv[n] || [];
            if (a.length < 4) a.push(q.watched_at);
          });
          (r[1] || []).forEach(function (q) {
            if (!q.show || !q.episode || !q.watched_at) return;
            var n = norm(q.show.title), a = tv[n + '|' + q.episode.season] = tv[n + '|' + q.episode.season] || [], b = tv[n + '|0'] = tv[n + '|0'] || [];
            if (a.length < 3) a.push(q.watched_at);
            if (b.length < 3) b.push(q.watched_at);
          });
          return { mv: mv, tv: tv };
        });
      }, function (v) { for (var k in v.mv) return false; for (var k2 in v.tv) return false; return true; }).then(function (d) {
        var any = false;
        HIST.forEach(function (x) {
          if (x.kind === 'Book' || !x.iso) return;
          var list = (x.kind === 'Movie' ? d.mv[norm(x.t)] : d.tv[norm(x.t) + '|' + (x.season || 0)]) || [];
          /* newest first: the latest watch on or before the day he rated it */
          for (var i = 0; i < list.length; i++) {
            var t = new Date(list[i]).getTime(); if (isNaN(t)) continue;
            var day = isoDay(t);
            if (day > x.iso) continue;
            if (day < x.iso) { x.wd = airDate(list[i]); x.wdate = longDate(list[i]); any = true; }
            break;
          }
        });
        if (any) histChanged();
      }).catch(function () {});
    }

    /* ---------- a title tapped in the home screen's Currently card (Nov 12, Toby) ----------
       The card links here as /watching/#open=w-<title> or #open=r-<title>;
       the Den opens on that title's details. A show that only lives on
       Trakt joins the list a moment later, so this is tried again when the
       Watching list arrives (for a few seconds, and never after a tap). */
    var want = location.hash.match(/^#open=([wr])-(.+)$/);
    function openWanted() {
      if (!want) return;
      var n = ''; try { n = decodeURIComponent(want[2]); } catch (e) { n = want[2]; }
      var list = want[1] === 'w' ? WATCH : READ, x = null;
      list.forEach(function (q) { if (!x && (q.n || norm(q.t)) === n) x = q; });
      if (!x) return;
      want = null;
      try { history.replaceState(history.state, '', location.pathname + location.search); } catch (e) {}
      openItem(x.id);
    }
    if (want) {
      setTimeout(function () { want = null; }, 8000);
      root.addEventListener('pointerdown', function () { want = null; }, { passive: true, once: true });
    }

    /* ---------- go ---------- */
    readSeen();
    if (window.tgoFinished && window.tgoFinished.length) readFin();
    readMovies();
    renderHome();
    syncWatch();
    var hs0 = history.state;
    if (hs0 && hs0.hxd) { state = { view: hs0.view, sec: hs0.sec, id: hs0.id, filter: hs0.filter || 'All', fromList: hs0.fromList }; want = null; }
    render();
    openWanted();
  };
})();
