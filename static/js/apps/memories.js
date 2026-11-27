/* ---------- Memories app (/memories/), Nov 26, 2026 (Toby, mockups v250-v279) ----------
   His On This Day posts as a journal.
   Desktops, laptops and iPads held sideways: the Index on the desk at the
     left (today's memory on a sticky note, the filters, then every memory
     by month), and a hardcover journal at the right. Tap the cover, the
     note or a memory: the cover swings open to that memory's page; Newer
     and Older (or the arrow keys, or a swipe) turn the page.
   Phones and iPads held upright: just the journal. "Tap to open" opens it
     to the Index, written on the inside page; tap a memory to turn to its
     page; "Index" (or Back) goes back to the list.
   A page: the photo as a taped polaroid with the day it was taken written
     on it (a stack when the post has more photos), a little map beside it,
     then "N years ago", the place with a map pin, the title and his words,
     all handwritten on the ruled lines; the permalink with the day it was
     posted, Newer and Older. Tap the polaroid for the whole photo.
   Night (Hutch's dark sky): the desk, the Index and the cover go dark; the
     page stays paper, a little softer.
   /memories/#post=/2026/11/25/...: opens that memory's page right away
     (the home screen's On This Day card links here); Back goes home.
   Data: partials/hutch-data/memories.html. */
(function () {
  window.HutchApps = window.HutchApps || {};
  HutchApps.memories = function (ctx) {
    var D = ctx.data;
    if (!D || !D.posts || !D.posts.length) return; /* no data: keep the Traditional page */
    var P = D.posts, esc = ctx.esc, de = document.documentElement, CALM = !!ctx.calm;

    var IC = {
      link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>',
      l: '<path d="M15 5l-7 7 7 7"/>', r: '<path d="M9 5l7 7-7 7"/>',
      x: '<path d="M6 6l12 12M18 6L6 18"/>',
      stack: '<rect x="7" y="7" width="13" height="13" rx="1.5"/><path d="M4 16V5a1 1 0 0 1 1-1h11"/>',
      book: '<path d="M3 5.5C5.5 4.5 9 4.5 12 6.5c3-2 6.5-2 9-1v13c-2.5-1-6-1-9 1-3-2-6.5-2-9-1z"/><path d="M12 6.5v13"/>'
    };
    function ic(k) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IC[k] + '</svg>'; }
    /* the map pin by the place (Nov 26, Toby: "a map pin like on maps") */
    var PIN = '<svg class="hxm-pin" viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="hxmPinG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E9744C"/><stop offset=".55" stop-color="#C8402A"/><stop offset="1" stop-color="#93290F"/></linearGradient></defs>' +
      '<ellipse cx="16" cy="29.6" rx="5.5" ry="1.6" fill="rgba(38,42,54,.22)"/><path d="M16 29C16 29 6.5 19.8 6.5 12.5a9.5 9.5 0 0 1 19 0C25.5 19.8 16 29 16 29z" fill="url(#hxmPinG)" stroke="#fff" stroke-width="1.4"/>' +
      '<circle cx="16" cy="12.4" r="3.6" fill="#fff"/><path d="M10.6 8.6a6.6 6.6 0 0 1 4-3.1" stroke="#fff" stroke-width="1.4" stroke-linecap="round" fill="none" opacity=".55"/></svg>';
    /* a drawn map, for a place with no spot to show */
    var DRAWN = '<svg class="hxm-drawn" viewBox="0 0 120 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="120" height="120" fill="#EEF0E6"/><path d="M-5 84 C25 76 50 94 80 82 S110 66 125 70" stroke="#BCD6EA" stroke-width="11" fill="none"/><g stroke="#fff" stroke-width="6"><path d="M0 34H120M0 104H120M28 0V120M84 0V120"/></g><g stroke="#F3DCAE" stroke-width="7"><path d="M-5 12 L125 54"/></g><g fill="#DDE7D3"><rect x="36" y="42" width="40" height="24" rx="3"/><rect x="92" y="8" width="26" height="20" rx="3"/><rect x="2" y="44" width="20" height="22" rx="3"/></g></svg>';
    var MPIN = '<svg class="hxm-mpin" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z" fill="#C8402A" stroke="#fff" stroke-width="1.6"/><circle cx="12" cy="10" r="2.6" fill="#fff"/></svg>';

    /* Micro.blog's resizer for his uploads; the original if it fails */
    function sz(src, w) { return /cdn\.uploads\.micro\.blog/.test(src) ? 'https://cdn.micro.blog/photos/' + w + 'x/' + encodeURIComponent(src) : src; }
    function img(ph, w, alt, lazy) {
      return '<img src="' + esc(sz(ph.s, w)) + '" data-o="' + esc(ph.s) + '" alt="' + esc(alt || '') + '"' + (lazy ? ' loading="lazy"' : '') + ' decoding="async" draggable="false">';
    }

    /* today, the reader's own day */
    var now = new Date(), TODAY = now.getFullYear() + '-' + ('0' + (now.getMonth() + 1)).slice(-2) + '-' + ('0' + now.getDate()).slice(-2);
    var TI = -1; for (var q0 = 0; q0 < P.length; q0++) if (P[q0].d === TODAY) { TI = q0; break; }
    function years(p) { return p.y ? p.y + (p.y === 1 ? ' year' : ' years') + ' ago' : ''; }
    function place(p) { return p.ln ? String(p.ln).replace(/[\s.,;]+$/, '') : ''; }
    /* the spot: from the check-in, or from its OpenStreetMap link */
    function spot(p) {
      var la = parseFloat(p.la), lo = parseFloat(p.lo);
      if (!(isFinite(la) && isFinite(lo)) && p.lu) {
        var m1 = /[?&]mlat=(-?[\d.]+)/.exec(p.lu), m2 = /[?&]mlon=(-?[\d.]+)/.exec(p.lu);
        if (m1 && m2) { la = parseFloat(m1[1]); lo = parseFloat(m2[1]); }
      }
      return isFinite(la) && isFinite(lo) && Math.abs(la) <= 85 ? [la, lo] : null;
    }
    function mapUrl(p, s) {
      if (p.lu) return p.lu;
      if (s) return 'https://www.openstreetmap.org/?mlat=' + s[0] + '&mlon=' + s[1] + '#map=16/' + s[0] + '/' + s[1];
      return 'https://www.openstreetmap.org/search?query=' + encodeURIComponent(place(p));
    }
    /* the little map: OpenStreetMap tiles around the spot (zoom 16, drawn at
       half size so they stay sharp), the spot in the middle */
    function tiles(s) {
      var z = 16, n = Math.pow(2, z), T = 128;
      var fx = (s[1] + 180) / 360 * n, r = s[0] * Math.PI / 180;
      var fy = (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * n;
      var tx = Math.floor(fx), ty = Math.floor(fy), ox = (fx - tx) * T, oy = (fy - ty) * T, h = '';
      for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
        var x = ((tx + dx) % n + n) % n, y = ty + dy;
        if (y < 0 || y >= n) continue;
        h += '<img src="https://tile.openstreetmap.org/' + z + '/' + x + '/' + y + '.png" alt="" loading="lazy" decoding="async" draggable="false" style="left:' + ((dx + 1) * T) + 'px;top:' + ((dy + 1) * T) + 'px">';
      }
      return '<span class="hxm-tiles" style="--ox:' + (T + ox).toFixed(1) + 'px;--oy:' + (T + oy).toFixed(1) + 'px">' + h + '</span>';
    }

    var MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    var BANDS = [['all', 'All', function () { return true; }], ['a', '1–5 years ago', function (p) { return p.y >= 1 && p.y <= 5; }],
      ['b', '6–10 years ago', function (p) { return p.y >= 6 && p.y <= 10; }], ['c', 'More than 10', function (p) { return p.y > 10; }]];
    var shown = BANDS.filter(function (b, j) { return !j || P.some(b[2]); });

    /* ---------- the Index ---------- */
    function note() {
      var F = TI >= 0 ? P[TI] : P[0], ph = F.ph && F.ph[0];
      var thumb = ph ? '<span class="hxm-nph">' + img(ph, 400, '') + '</span>' : '';
      if (TI >= 0) {
        return '<button type="button" class="hxm-note" data-i="' + TI + '">' + thumb + '<span class="hxm-ntx">' +
          '<span class="hxm-ny">' + esc(F.y ? years(F) + ' today' : 'On this day') + '</span><span class="hxm-nt">' + esc(F.t) + '</span>' +
          '<span class="hxm-ngo">Open today’s page</span></span></button>';
      }
      /* Nov 26 (Toby): a day with no memory says so, and offers the latest one */
      return '<button type="button" class="hxm-note none" data-i="0">' + thumb + '<span class="hxm-ntx">' +
        '<span class="hxm-ny">No memory for today yet</span><span class="hxm-nl">Latest memory, ' + esc(F.dl.replace(/,\s*\d{4}$/, '')) + '</span>' +
        '<span class="hxm-nt">' + esc(F.t) + '</span><span class="hxm-ngo">Open it</span></span></button>';
    }
    function toc(band) {
      var test = (BANDS.filter(function (b) { return b[0] === band; })[0] || BANDS[0])[2], h = '', key = '';
      P.forEach(function (p, j) {
        if (!test(p)) return;
        var k = p.d.slice(0, 7);
        if (k !== key) {
          key = k;
          var yy = +k.slice(0, 4);
          h += '<h3 class="hxm-mon">' + MON[+k.slice(5, 7) - 1] + (yy !== now.getFullYear() ? ' ' + yy : '') + '</h3>';
        }
        h += '<button type="button" class="hxm-row" data-i="' + j + '"><span class="hxm-rd">' + (+p.d.slice(8, 10)) + '</span>' +
          '<span class="hxm-rt">' + esc(p.t) + '</span><span class="hxm-ry">' + (p.y ? p.y + (p.y === 1 ? ' year' : ' years') : '') + '</span></button>';
      });
      return h || '<p class="hxm-none">No memories from then yet.</p>';
    }
    var idx = ctx.el('<section class="hxm-idx" aria-label="Index">' +
      '<div class="hxm-ih"><h2>Index</h2><span>' + P.length + (P.length === 1 ? ' memory' : ' memories') + '</span></div>' + note() +
      (shown.length > 2 ? '<div class="hxm-filters" role="group" aria-label="Show memories from">' + shown.map(function (b, j) {
        return '<button type="button" data-band="' + b[0] + '" aria-pressed="' + (j ? 'false' : 'true') + '">' + b[1] + '</button>';
      }).join('') + '</div>' : '') +
      '<nav class="hxm-toc" aria-label="Memories">' + toc('all') + '</nav></section>');

    /* ---------- the desk and the journal ---------- */
    var root = ctx.el('<div class="hx-mem"><div class="hxm-desk"><div class="hxm-book">' +
      '<article class="hxm-leaf hxm-pg" aria-label="Memory"></article>' +
      '<section class="hxm-leaf hxm-ixp" aria-label="Index"></section>' +
      '<div class="hxm-leaf hxm-cover" role="button" tabindex="0" aria-label="Open the Memories journal"><span class="hxm-ctl" aria-hidden="true">Memories</span>' +
        '<span class="hxm-hint" aria-hidden="true">' + ic('book') + 'Tap to open</span><span class="hxm-band" aria-hidden="true"></span></div>' +
      '<span class="hxm-ribbon" aria-hidden="true"></span></div></div>' +
      '<div class="hxm-lb" role="dialog" aria-modal="true" aria-label="Photo" hidden><button type="button" class="hxm-lbx">Close</button>' +
        '<button type="button" class="hxm-lbp" aria-label="Previous photo">' + ic('l') + '</button><img alt=""><button type="button" class="hxm-lbn" aria-label="Next photo">' + ic('r') + '</button>' +
        '<div class="hxm-lbc"></div><div class="hxm-lbk" aria-live="polite"></div></div></div>');
    var desk = root.querySelector('.hxm-desk'), book = root.querySelector('.hxm-book'), pg = root.querySelector('.hxm-pg'),
      ixp = root.querySelector('.hxm-ixp'), cover = root.querySelector('.hxm-cover'), ribbon = root.querySelector('.hxm-ribbon'), lb = root.querySelector('.hxm-lb');
    document.body.appendChild(root);
    document.body.appendChild(lb); /* above the app bar */
    de.classList.add('hxm-on');
    ctx.own();

    /* a resized photo that will not load falls back to the original; a map
       that will not load becomes the drawn one */
    root.addEventListener('error', function (e) {
      var t = e.target;
      if (!t || t.tagName !== 'IMG') return;
      if (t.getAttribute('data-o') && t.src !== t.getAttribute('data-o')) { t.src = t.getAttribute('data-o'); return; }
      var tl = t.closest('.hxm-tiles');
      if (tl && !tl.getAttribute('data-x')) { tl.setAttribute('data-x', '1'); tl.outerHTML = DRAWN; }
    }, true);
    /* the browser bar matches the desk */
    function tint() {
      var m = document.querySelector('meta[name="theme-color"]');
      if (!m) { m = document.createElement('meta'); m.name = 'theme-color'; document.head.appendChild(m); }
      m.setAttribute('content', de.classList.contains('hx-dark') ? '#1C1A18' : '#F3ECE1');
    }
    tint(); setInterval(tint, 20000);

    /* ---------- the layout: desk (Index + journal) or journal only ---------- */
    var mode = '';
    function layout() {
      var w = innerWidth, h = innerHeight;
      var m = w < 760 || (h > w && w < 1100) ? 'one' : (h < 560 ? 'one' : 'desk');
      var short = h < 560 && w > h;
      root.classList.toggle('short', short);
      root.classList.toggle('tab', m === 'one' && h > w && w >= 600);
      if (m === mode) return;
      mode = m; root.setAttribute('data-mode', m);
      if (m === 'one') ixp.appendChild(idx); else desk.insertBefore(idx, book);
    }
    layout();

    /* ---------- a page ---------- */
    var cur = -1, lh = 32;
    function pageHTML(i) {
      var p = P[i], ph = p.ph || [], n = ph.length, s = '', pl = place(p), sp = pl ? spot(p) : null;
      for (var k = Math.min(n, 3) - 1; k >= 1; k--) s += '<span class="hxm-ph hxm-b' + k + '" aria-hidden="true">' + img(ph[k], 800, '', true) + '<span class="hxm-cap">&nbsp;</span></span>';
      s += '<button type="button" class="hxm-ph" data-k="0" aria-label="' + esc('See the whole photo' + (n > 1 ? ', 1 of ' + n : '')) + '"><i class="hxm-tape" aria-hidden="true"></i>' +
        (n ? img(ph[0], 800, ph[0].a || p.t) : '<span class="hxm-blank">' + esc(p.t) + '</span>') +
        '<span class="hxm-cap">' + esc(p.tk || p.dl) + '</span>' + (n > 1 ? '<span class="hxm-cnt">' + ic('stack') + n + ' photos</span>' : '') + '</button>';
      var chip = pl ? '<a class="hxm-map" href="' + esc(mapUrl(p, sp)) + '" target="_blank" rel="noopener" aria-label="' + esc('Map of ' + pl) + '">' +
        '<span class="hxm-mbox">' + (sp ? tiles(sp) : DRAWN) + MPIN + '</span><span class="hxm-mcap">' + (sp ? '© OpenStreetMap' : 'Map') + '</span></a>' : '';
      var words = p.h ? '<div class="hxm-wd hxm-html">' + p.h + '</div>' : (p.x ? '<div class="hxm-wd"><p>' + esc(p.x) + '</p></div>' : '<div class="hxm-wd"></div>');
      var nav = '<button type="button" class="hxm-nv" data-go="-1" aria-label="Newer memory"' + (i === 0 ? ' disabled' : '') + '>' + ic('l') + 'Newer</button>' +
        '<button type="button" class="hxm-nv o" data-go="1" aria-label="Older memory"' + (i === P.length - 1 ? ' disabled' : '') + '>Older' + ic('r') + '</button>';
      return '<div class="hxm-in"><button type="button" class="hxm-back" data-a="index">' + ic('l') + 'Index</button>' +
        '<div class="hxm-shot' + (chip ? '' : ' solo') + (n > 1 ? ' multi' : '') + '">' + s + chip + '</div>' +
        '<div class="hxm-ya">' + esc(years(p) || 'On this day') + '</div>' +
        (pl ? '<div class="hxm-pl">' + PIN + '<span>' + esc(pl) + '</span></div>' : '') +
        '<h1 class="hxm-tt" tabindex="-1">' + esc(p.t) + '</h1>' + words + '</div>' +
        '<div class="hxm-tb"><a class="hxm-perma" href="' + esc(p.u) + '" aria-label="' + esc('Permalink, posted ' + p.dl) + '">' + ic('link') + '<time datetime="' + esc(p.d) + '">' + esc(p.dl) + '</time></a>' +
        '<nav class="hxm-nav" aria-label="More memories">' + nav + '</nav></div>';
    }
    /* the ruled lines: one line height for the page, from its height */
    function sizes() {
      var h = pg.clientHeight || 600, one = mode === 'one', short = root.classList.contains('short');
      lh = short ? 26 : Math.max(one ? 28 : 30, Math.min(40, Math.round(h / (one ? 24 : 21))));
      pg.style.setProperty('--lh', lh + 'px');
      var L = h / lh, phl;
      if (short) {
        var tb = pg.querySelector('.hxm-tb');
        phl = Math.max(3, Math.floor((h - (tb ? tb.offsetHeight : 64) - lh) / lh - 1.9));
      } else phl = one && !root.classList.contains('tab') ? (L < 22 ? 4 : 5) : (L < 19 ? 5 : L < 23 ? 6 : 7);
      pg.style.setProperty('--phl', phl);
    }
    /* every line of writing sits on a ruled line (Nov 26, Toby) */
    function snap() {
      var ya = pg.querySelector('.hxm-ya'), wd = pg.querySelector('.hxm-wd'), inn = pg.querySelector('.hxm-in');
      if (!ya || !wd || !pg.clientHeight) return;
      var els = [ya, pg.querySelector('.hxm-pl'), pg.querySelector('.hxm-tt')].filter(Boolean);
      els.forEach(function (e) { e.style.top = '0px'; }); wd.style.paddingTop = '0px'; ya.style.marginTop = '0px';
      var T = pg.getBoundingClientRect().top, base = ya.getBoundingClientRect().top - T, mg = Math.ceil(base / lh - 0.001) * lh - base;
      ya.style.marginTop = mg + 'px';
      var rt = base + mg + lh;
      pg.style.setProperty('--rt', rt + 'px');
      pg.style.setProperty('--rh', Math.max(0, Math.round(wd.getBoundingClientRect().top - T - rt)) + 'px');
      els.concat([wd]).forEach(function (e) {
        var t = e === wd ? (wd.querySelector('p,li,blockquote') || wd) : e;
        var pr = document.createElement('span'); pr.style.cssText = 'display:inline-block;width:0;height:0';
        t.insertBefore(pr, t.firstChild);
        var off = e === ya ? lh : 0, b = pr.getBoundingClientRect().top - e.getBoundingClientRect().top - off;
        t.removeChild(pr);
        var sh = Math.round(lh - Math.max(3, lh * 0.12) - b);
        if (e === wd) wd.style.paddingTop = Math.max(0, sh) + 'px'; else e.style.top = sh + 'px';
      });
      var sh0 = pg.querySelector('.hxm-shot'); if (sh0 && root.classList.contains('short')) pg.style.setProperty('--sw', Math.round(wd.getBoundingClientRect().left - pg.getBoundingClientRect().left - 8) + 'px');
      fade();
    }
    /* a long post: the words scroll inside the page, a soft fade shows there's more */
    function fade() {
      var wd = pg.querySelector('.hxm-wd'), inn = pg.querySelector('.hxm-in'); if (!wd || !inn) return;
      var more = wd.scrollHeight > wd.clientHeight + 4;
      inn.classList.toggle('more', more && wd.scrollTop + wd.clientHeight < wd.scrollHeight - 4);
      if (more) wd.setAttribute('tabindex', '0'); else wd.removeAttribute('tabindex');
    }
    var fitT = 0;
    function fitSoon() { clearTimeout(fitT); fitT = setTimeout(function () { if (cur >= 0) { sizes(); snap(); } }, 40); }
    function fill(i) {
      cur = i;
      pg.innerHTML = pageHTML(i);
      sizes(); snap();
      var wd = pg.querySelector('.hxm-wd'); if (wd) wd.addEventListener('scroll', fade, { passive: true });
      [].forEach.call(pg.querySelectorAll('img'), function (im) { if (!im.complete) im.addEventListener('load', fitSoon); });
      [].forEach.call(idx.querySelectorAll('[data-i].hxm-row'), function (b) { if (+b.getAttribute('data-i') === i) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
      ribbon.classList.toggle('off', !(i === TI || !cover.classList.contains('open')));
    }
    function flip(i) {
      if (CALM) { fill(i); return; }
      var dir = i > cur ? 1 : -1, f = pg.cloneNode(true);
      f.className = 'hxm-leaf hxm-pg hxm-flip' + (dir < 0 ? ' back' : '');
      f.removeAttribute('aria-label'); f.setAttribute('aria-hidden', 'true');
      book.appendChild(f); fill(i);
      requestAnimationFrame(function () { requestAnimationFrame(function () { f.classList.add('go'); }); });
      setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); }, 700);
    }

    /* ---------- where we are: 0 the cover, 1 the Index (one-journal screens), 2 a page ---------- */
    var level = 0, deep = false;
    function setLevel(l, i, how) {
      if (l === 2) {
        var was = level;
        cover.classList.add('open');
        if (was === 2 && how !== 'plain') flip(i); else fill(i);
        ixp.classList.add('away');
        level = 2;
        root.classList.add('reading'); de.classList.add('hxm-read');
        setTimeout(function () { var h = pg.querySelector('.hxm-tt'); if (h) try { h.focus({ preventScroll: true }); } catch (e) {} }, CALM ? 30 : 420);
      } else if (l === 1) {
        cover.classList.add('open'); ixp.classList.remove('away');
        ribbon.classList.add('off');
        level = 1; root.classList.remove('reading');
        setTimeout(function () { var n = ixp.querySelector('.hxm-note,.hxm-row'); if (n) try { n.focus({ preventScroll: true }); } catch (e) {} }, CALM ? 30 : 420);
      } else {
        cover.classList.remove('open'); ixp.classList.remove('away');
        level = 0; root.classList.remove('reading');
        ribbon.classList.remove('off');
        setTimeout(function () { try { cover.focus({ preventScroll: true }); } catch (e) {} }, CALM ? 30 : 500);
      }
      de.classList.toggle('hxm-read', level > 0);
    }
    function go(i) {
      if (i < 0 || i >= P.length) return;
      if (level === 2) { setLevel(2, i); try { history.replaceState({ hxm: 2, i: i, deep: deep ? 1 : 0 }, ''); } catch (e) {} return; }
      try { history.pushState({ hxm: 2, i: i }, ''); } catch (e) {}
      setLevel(2, i);
    }
    function openCover() {
      if (mode === 'one') { try { history.pushState({ hxm: 1 }, ''); } catch (e) {} setLevel(1); }
      else go(TI >= 0 ? TI : 0);
    }
    function back() {
      if (deep && level === 2) { history.back(); return; }
      if (history.state && history.state.hxm) history.back();
      else setLevel(level === 2 && mode === 'one' ? 1 : 0);
    }

    cover.addEventListener('click', openCover);
    cover.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCover(); } });
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-band]');
      if (b) {
        [].forEach.call(root.querySelectorAll('[data-band]'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        idx.querySelector('.hxm-toc').innerHTML = toc(b.getAttribute('data-band'));
        if (cur >= 0 && level === 2) fill(cur);
        return;
      }
      var t = e.target.closest('.hxm-idx [data-i]');
      if (t) { go(+t.getAttribute('data-i')); return; }
      var g = e.target.closest('[data-go]');
      if (g) { go(cur + +g.getAttribute('data-go')); return; }
      if (e.target.closest('[data-a="index"]')) {
        /* opened from the home screen's card: the Index is still one tap away */
        if (deep) { deep = false; try { history.replaceState({ hxm: 1 }, ''); } catch (er) {} setLevel(1); } else back();
        return;
      }
      var ph = e.target.closest('.hxm-pg button.hxm-ph');
      if (ph) bigOpen(0);
    });

    /* ---------- the whole photo ---------- */
    var VW = (function () { var t = Math.max(innerWidth, innerHeight) * Math.min(window.devicePixelRatio || 1, 2); return t <= 900 ? 800 : t <= 1300 ? 1200 : t <= 1700 ? 1600 : 2000; })();
    var lbI = 0, lbBack = null;
    function lbShow() {
      var p = P[cur], ph = p.ph || [], n = ph.length, x = ph[lbI]; if (!x) return;
      var im = lb.querySelector('img'); im.src = sz(x.s, VW); im.setAttribute('data-o', x.s); im.alt = x.a || p.t;
      lb.querySelector('.hxm-lbc').textContent = p.tk || p.dl;
      lb.querySelector('.hxm-lbk').textContent = n > 1 ? (lbI + 1) + ' of ' + n : '';
      lb.querySelector('.hxm-lbp').hidden = lb.querySelector('.hxm-lbn').hidden = n < 2;
    }
    function bigOpen(k) {
      if (!P[cur] || !(P[cur].ph || []).length) return;
      lbI = k; lbShow(); lbBack = document.activeElement;
      lb.hidden = false; de.classList.add('hxm-big-on');
      try { lb.querySelector('.hxm-lbx').focus({ preventScroll: true }); } catch (e) {}
    }
    function lbStep(d) { var n = (P[cur].ph || []).length; if (n < 2) return; lbI = (lbI + d + n) % n; lbShow(); }
    function bigClose() {
      if (lb.hidden) return false;
      lb.hidden = true; de.classList.remove('hxm-big-on');
      if (lbBack && lbBack.focus) try { lbBack.focus({ preventScroll: true }); } catch (e) {}
      return true;
    }
    lb.addEventListener('click', function (e) {
      e.stopPropagation();
      if (e.target.closest('.hxm-lbp')) lbStep(-1);
      else if (e.target.closest('.hxm-lbn')) lbStep(1);
      else bigClose();
    });

    /* ---------- keys and swipes ---------- */
    document.addEventListener('keydown', function (e) {
      if (document.querySelector('.hx-sheet.open')) return;
      if (!lb.hidden) {
        if (e.key === 'Escape') { e.preventDefault(); bigClose(); }
        else if (e.key === 'ArrowLeft') lbStep(-1); else if (e.key === 'ArrowRight') lbStep(1);
        return;
      }
      if (e.key === 'Escape' && level > 0) { e.preventDefault(); back(); return; }
      if (level !== 2 || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (e.target.closest && e.target.closest('input,textarea,select,[contenteditable]')) return;
      if (e.key === 'ArrowLeft' && cur > 0) { e.preventDefault(); go(cur - 1); }
      else if (e.key === 'ArrowRight' && cur < P.length - 1) { e.preventDefault(); go(cur + 1); }
    });
    var sx = null, sy = 0;
    pg.addEventListener('touchstart', function (e) { if (e.touches.length === 1) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; } else sx = null; }, { passive: true });
    pg.addEventListener('touchend', function (e) {
      if (sx === null || level !== 2) return;
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; sx = null;
      if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      if (dx < 0 && cur < P.length - 1) go(cur + 1); else if (dx > 0 && cur > 0) go(cur - 1);
    }, { passive: true });

    /* the app bar: Back closes the page (or the journal) first; the Memories icon and name close the journal */
    ctx.bar.addEventListener('click', function (e) {
      if (level > 0 && e.target.closest('.hb-back')) { e.preventDefault(); e.stopPropagation(); back(); }
      else if (level > 0 && e.target.closest('.hb-app')) {
        e.preventDefault(); e.stopPropagation();
        deep = false; setLevel(0); try { history.replaceState(null, ''); } catch (er) {}
      }
    }, true);
    window.addEventListener('popstate', function (e) {
      bigClose();
      var s = e.state;
      if (s && s.hxm === 2) { if (level !== 2) setLevel(2, Math.min(P.length - 1, s.i || 0), 'plain'); else go(s.i || 0); }
      else if (s && s.hxm === 1) setLevel(1);
      else setLevel(0);
    });
    /* leaving for the post: come back to the same page */
    function remember() { if (level === 2) try { history.replaceState({ hxm: 2, i: cur, deep: deep ? 1 : 0 }, ''); } catch (e) {} }
    pg.addEventListener('click', function (e) { if (e.target.closest('a[href]')) remember(); }, true);
    window.addEventListener('pagehide', remember);

    var rz = 0;
    window.addEventListener('resize', function () {
      clearTimeout(rz);
      rz = setTimeout(function () {
        var was = mode; layout();
        if (was !== mode && level === 1 && mode === 'desk') setLevel(0);
        if (cur >= 0 && level === 2) { sizes(); snap(); }
      }, 120);
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitSoon);

    /* ---------- start ---------- */
    function now0(l, i) { root.classList.add('still'); setLevel(l, i, 'plain'); setTimeout(function () { root.classList.remove('still'); }, 60); }
    var st = history.state;
    if (st && st.hxm === 2) { deep = !!st.deep; now0(2, Math.min(P.length - 1, st.i || 0)); }
    else if (st && st.hxm === 1 && mode === 'one') now0(1);
    else {
      var hm = location.hash.match(/^#post=(.+)$/);
      if (hm) {
        var want = decodeURIComponent(hm[1]);
        for (var q = 0; q < P.length; q++) if (P[q].u === want) {
          /* from the home screen's On This Day card: straight to the page, no cover */
          deep = true;
          try { history.replaceState({ hxm: 2, i: q, deep: 1 }, '', location.pathname + location.search); } catch (e) {}
          now0(2, q);
          break;
        }
      }
    }
  };
})();
