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
      if (open && e.target.closest('.hb-back')) { e.preventDefault(); e.stopPropagation(); close(); }
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
    /* coming back from a post (Read more or the date link): reopen the card
       he was on instead of dropping him on the list (Nov 2, Toby) */
    var hs = history.state;
    if (hs && hs.hxwCard && W[hs.i || 0]) show(hs.i || 0, 'nohist');
  };
})();
