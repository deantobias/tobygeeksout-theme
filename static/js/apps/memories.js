/* ---------- Memories app (/memories/), Nov 25, 2026 (Toby, mockup v225) ----------
   His On This Day posts, journal style. Always light, like paper.
   Home: the newest memory big (taped print, "Today's memory" when it was
     posted today, else "Latest memory"), then filters (All, 1-5 years
     ago, 6-10 years ago, More than 10), then every other memory grouped
     by the month it was posted, as small prints: the day the photo was
     taken written under it, then the title and how many years ago.
     2 across on the phone, 3 on tablets upright, 4 on wide screens.
   Tap a memory: its journal page inside the app (the print big, swipe
     or tap for its other photos, the years, title, place and words,
     View the post, then Newer / Older). Back closes the page.
   /memories/#post=/2026/11/25/...: opens that memory right away (the
     home screen's On This Day card links here); Back goes home.
   Data: partials/hutch-data/memories.html. */
(function () {
  window.HutchApps = window.HutchApps || {};
  HutchApps.memories = function (ctx) {
    var D = ctx.data;
    if (!D || !D.posts || !D.posts.length) return; /* no data: keep the Traditional page */
    var P = D.posts, esc = ctx.esc, de = document.documentElement;

    var IC = {
      open: '<path d="M14 4h6v6 M20 4l-9 9 M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
      link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
      pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
      l: '<path d="M15 6l-6 6 6 6"/>', r: '<path d="M9 6l6 6-6 6"/>'
    };
    function ic(k) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IC[k] + '</svg>'; }
    /* Micro.blog's resizer for his uploads; the original if it fails */
    function sz(src, w) { return /cdn\.uploads\.micro\.blog/.test(src) ? 'https://cdn.micro.blog/photos/' + w + 'x/' + encodeURIComponent(src) : src; }
    function img(ph, w, alt, lazy) {
      return '<img src="' + esc(sz(ph.s, w)) + '" data-o="' + esc(ph.s) + '" alt="' + esc(alt || '') + '"' + (lazy ? ' loading="lazy"' : '') + ' decoding="async" draggable="false">';
    }

    /* today, the reader's own day */
    var now = new Date(), TODAY = now.getFullYear() + '-' + ('0' + (now.getMonth() + 1)).slice(-2) + '-' + ('0' + now.getDate()).slice(-2);
    function isToday(p) { return p.d === TODAY; }
    function years(p, long) {
      if (!p.y) return '';
      return p.y + (p.y === 1 ? ' year' : ' years') + ' ago' + (long && isToday(p) ? ' today' : '');
    }
    function place(p, cls) {
      if (!p.ln) return '';
      var inner = ic('pin') + '<span>' + esc(p.ln) + '</span>';
      return p.lu ? '<a class="' + cls + '" href="' + esc(p.lu) + '" aria-label="' + esc(p.ln + ', open the map') + '">' + inner + '</a>' : '<span class="' + cls + '">' + inner + '</span>';
    }
    function viewPost(p) { return '<a class="hxm-go" href="' + esc(p.u) + '">View the post<span class="hxm-sr"> ' + esc(p.t) + '</span>' + ic('open') + '</a>'; }
    /* a print: white border, the day it was taken written under it */
    function print(p, w, lazy, tape) {
      var ph = p.ph && p.ph[0];
      return '<span class="hxm-print">' + (tape ? '<i class="hxm-tape" aria-hidden="true"></i>' : '') +
        (ph ? img(ph, w, '', lazy) : '<span class="hxm-blank" aria-hidden="true">' + esc(p.t) + '</span>') +
        '<span class="hxm-hand">' + esc(p.tk || p.dl) + '</span></span>';
    }

    function mode() { var w = innerWidth; return w >= 900 ? 'land' : (w >= 520 ? 'port' : 'phone'); }
    var M = mode();

    /* ---------- home ---------- */
    var F = P[0];
    var featured = '<section class="hxm-today" aria-label="' + (isToday(F) ? 'Today\'s memory' : 'Latest memory') + '">' +
      '<a class="hxm-fprint" href="' + esc(F.u) + '" data-i="0" aria-label="' + esc('Open ' + F.t) + '">' + print(F, 800, false, true) + '</a>' +
      '<div class="hxm-fwords"><span class="hxm-chip"><i aria-hidden="true"></i>' + (isToday(F) ? 'Today\'s memory' : 'Latest memory') + '</span>' +
        (F.y ? '<div class="hxm-ago">' + esc(years(F, true)) + '</div>' : '') +
        '<h2 class="hxm-tt">' + esc(F.t) + '</h2>' + place(F, 'hxm-pl') +
        (F.x ? '<p class="hxm-wd">' + esc(F.x) + '</p>' : '') +
        /* Nov 25 (Toby): the button opens the post itself, like on a memory's page */
        '<div class="hxm-acts">' + viewPost(F) + '</div></div></section>';

    /* filters: only the ones that hold a memory; none when only one would */
    var BANDS = [['all', 'All', function () { return true; }], ['a', '1–5 years ago', function (p) { return p.y >= 1 && p.y <= 5; }],
      ['b', '6–10 years ago', function (p) { return p.y >= 6 && p.y <= 10; }], ['c', 'More than 10', function (p) { return p.y > 10; }]];
    var rest = P.slice(1);
    var shown = BANDS.filter(function (b, j) { return !j || rest.some(b[2]); });
    var filters = shown.length > 2 ? '<div class="hxm-filters" role="group" aria-label="Show memories from">' + shown.map(function (b, j) {
      return '<button type="button" data-band="' + b[0] + '" aria-pressed="' + (j ? 'false' : 'true') + '">' + b[1] + '</button>';
    }).join('') + '</div>' : '';

    var MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    function groups(band) {
      var test = (BANDS.filter(function (b) { return b[0] === band; })[0] || BANDS[0])[2], out = [], cur = null, n = 0;
      rest.forEach(function (p, j) {
        if (!test(p)) return;
        var key = p.d.slice(0, 7);
        if (!cur || cur.k !== key) {
          var yy = +key.slice(0, 4), mm = +key.slice(5, 7) - 1;
          cur = { k: key, name: MON[mm] + (yy !== now.getFullYear() ? ' ' + yy : ''), items: [] };
          out.push(cur);
        }
        cur.items.push('<a class="hxm-card" href="' + esc(p.u) + '" data-i="' + (j + 1) + '">' + print(p, 400, n++ > 7) +
          '<b>' + esc(p.t) + '</b>' + (p.y ? '<small>' + esc(years(p)) + '</small>' : '') + '</a>');
      });
      if (!out.length) return '<p class="hxm-none">No memories from then yet.</p>';
      return out.map(function (g) {
        return '<h2 class="hxm-mon">' + esc(g.name) + '</h2><p class="hxm-sub">' + g.items.length + (g.items.length === 1 ? ' memory' : ' memories') + '</p>' +
          '<div class="hxm-grid">' + g.items.join('') + '</div>';
      }).join('');
    }

    var root = ctx.el('<div class="hx-mem" data-mode="' + M + '">' +
      '<main class="hxm-home" aria-label="Memories">' + featured + (rest.length ? filters + '<div class="hxm-list">' + groups('all') + '</div>' : '') + '</main>' +
      '<article class="hxm-page" aria-label="Memory" hidden></article></div>');
    var home = root.querySelector('.hxm-home'), page = root.querySelector('.hxm-page'), list = root.querySelector('.hxm-list');
    document.body.appendChild(root);
    de.classList.add('hxm-on');
    ctx.own();

    /* a resized photo that will not load falls back to the original */
    root.addEventListener('error', function (e) {
      var t = e.target;
      if (t && t.tagName === 'IMG' && t.getAttribute('data-o') && t.src !== t.getAttribute('data-o')) t.src = t.getAttribute('data-o');
    }, true);
    /* the browser bar matches the paper */
    function tint() { var m = document.querySelector('meta[name="theme-color"]'); if (!m) { m = document.createElement('meta'); m.name = 'theme-color'; document.head.appendChild(m); } m.setAttribute('content', '#F3ECE1'); }
    tint(); setInterval(tint, 20000);

    /* ---------- the journal page ---------- */
    var open = false, cur = 0, deep = false, homeY = 0;
    function at(car) { return car.clientWidth ? Math.round(car.scrollLeft / car.clientWidth) : 0; }
    function show(i) {
      cur = i;
      var p = P[i], n = (p.ph || []).length;
      var shots = n ? p.ph.map(function (ph, k) { return '<figure>' + img(ph, M === 'phone' ? 800 : 1200, ph.a || (n > 1 ? p.t + ', photo ' + (k + 1) + ' of ' + n : p.t), k > 0) + '</figure>'; }).join('') : '';
      var dots = n > 1 && n <= 10 ? '<span class="hxm-dots" aria-hidden="true">' + p.ph.map(function (x, k) { return '<i' + (k ? '' : ' class="on"') + '></i>'; }).join('') + '</span>' : '';
      page.innerHTML = '<div class="hxm-sheet">' +
        '<div class="hxm-pprint"><span class="hxm-print"><i class="hxm-tape" aria-hidden="true"></i>' +
          (n ? '<span class="hxm-car"' + (n > 1 ? ' role="button" tabindex="0" aria-label="Next photo"' : '') + '>' + shots + '</span>' : '<span class="hxm-blank" aria-hidden="true">' + esc(p.t) + '</span>') +
          '<span class="hxm-hand">' + esc(p.tk || p.dl) + '</span></span>' + dots + (n > 1 ? '<span class="hxm-n hxm-sr" aria-live="polite">1 of ' + n + '</span>' : '') + '</div>' +
        '<div class="hxm-pwords"><span class="hxm-chip"><i aria-hidden="true"></i>On This Day</span>' +
          (p.y ? '<div class="hxm-ago">' + esc(years(p, true)) + '</div>' : '') +
          '<h1 class="hxm-tt">' + esc(p.t) + '</h1>' + place(p, 'hxm-pl') +
          /* his own words with their links, bold and italic (Nov 25, Toby) */
          (p.h ? '<div class="hxm-wd hxm-html">' + p.h + '</div>' : p.x ? '<p class="hxm-wd">' + esc(p.x) + '</p>' : '') +
          /* View the post, Newer and Older share one row (Nov 25: the page fits the screen) */
          /* Nov 25 (Toby): the page already shows the whole post, so a permalink
             with the day it was posted, in place of a big View the post button */
          '<div class="hxm-acts"><a class="hxm-perma" href="' + esc(p.u) + '" aria-label="' + esc('Permalink, posted ' + p.dl) + '">' + ic('link') + '<time datetime="' + esc(p.d) + '">' + esc(p.dl) + '</time></a>' +
          '<nav class="hxm-nav" aria-label="More memories"><button type="button" data-go="-1" aria-label="Newer memory"' + (i === 0 ? ' disabled' : '') + '>' + ic('l') + '<span>Newer</span></button>' +
            '<button type="button" data-go="1" aria-label="Older memory"' + (i === P.length - 1 ? ' disabled' : '') + '><span>Older</span>' + ic('r') + '</button></nav></div></div></div>';
      page.querySelector('.hxm-print').classList.toggle('multi', n > 1);
      [].forEach.call(page.querySelectorAll('.hxm-car img'), function (im) { if (!im.complete) im.addEventListener('load', fitSoon); });
      fit();
      var car = page.querySelector('.hxm-car');
      if (car && n > 1) {
        var ds = page.querySelectorAll('.hxm-dots i'), lab = page.querySelector('.hxm-n'), last = 0, raf = 0;
        car.addEventListener('scroll', function () {
          if (raf) return;
          raf = requestAnimationFrame(function () {
            raf = 0;
            var k = Math.max(0, Math.min(n - 1, at(car)));
            if (k === last) return;
            last = k;
            [].forEach.call(ds, function (d, j) { d.classList.toggle('on', j === k); });
            if (lab) lab.textContent = (k + 1) + ' of ' + n;
            var nx = car.querySelectorAll('img')[k + 1]; if (nx) nx.removeAttribute('loading');
          });
        }, { passive: true });
        car.addEventListener('click', function () { car.scrollTo({ left: (at(car) + 1) % n * car.clientWidth, behavior: 'smooth' }); });
      }
    }
    /* Nov 25 (Toby: "everything in one page without scrolling"): the
       photo takes only the room the words and buttons leave, so a memory
       fits on the screen. Very long posts still scroll, with the photo
       never smaller than about a third of the screen. */
    var fitT = 0;
    function fitSoon() { clearTimeout(fitT); fitT = setTimeout(fit, 30); }
    function fit() {
      var im = page.querySelector('.hxm-car img'), sheet = page.querySelector('.hxm-sheet');
      if (!im || !sheet || page.hidden) return;
      /* offsetHeight: the photo's own height (the print is tilted, so its box is taller) */
      /* side by side: wide screens, and phones held sideways */
      var car = im.closest('.hxm-car'), wide = innerWidth >= 900 || (innerWidth > innerHeight && innerWidth >= 560 && innerHeight <= 520);
      var cw = (car.parentNode.parentNode.clientWidth || car.clientWidth) - 16;
      var nw = im.naturalWidth, nh = im.naturalHeight;
      /* the tallest the photo can be at this width */
      var capW = nw && nh ? Math.floor(cw * nh / nw) : Math.floor(cw * 0.75);
      var minH = Math.round(innerHeight * (wide ? 0.4 : 0.22));
      page.style.setProperty('--phh', capW + 'px');
      /* how far the whole page runs past the screen with the photo at its tallest */
      var over = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) - innerHeight;
      var h = Math.max(minH, Math.min(capW, Math.floor(im.offsetHeight - over)));
      page.style.setProperty('--phh', h + 'px');
      /* several photos share one frame as wide as the first photo at that height */
      page.style.setProperty('--phw', (nw && nh ? Math.min(cw, Math.round(h * nw / nh)) : cw) + 16 + 'px');
    }
    function openPage(i, push) {
      if (!open) homeY = window.scrollY;
      show(i);
      if (!open && push !== false) try { history.pushState({ hxm: 1, i: i }, ''); } catch (e) {}
      else if (open) try { history.replaceState({ hxm: 1, i: i, deep: deep ? 1 : 0 }, ''); } catch (e) {}
      open = true;
      home.hidden = true; page.hidden = false;
      root.classList.add('reading'); de.classList.add('hxm-read');
      window.scrollTo(0, 0);
      fit(); setTimeout(fit, 300);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitSoon);
      setTimeout(function () { var h = page.querySelector('.hxm-tt'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); } }, 60);
    }
    function close() {
      if (!open) return;
      open = false;
      page.hidden = true; home.hidden = false; page.innerHTML = '';
      root.classList.remove('reading'); de.classList.remove('hxm-read');
      var t = root.querySelector('.hxm-home [data-i="' + cur + '"]');
      window.scrollTo(0, homeY);
      if (t) {
        var r = t.getBoundingClientRect();
        if (r.top < 56 || r.bottom > innerHeight) window.scrollTo(0, Math.max(0, window.scrollY + r.top - innerHeight / 3));
        try { t.focus({ preventScroll: true }); } catch (e) {}
      }
    }
    function back() {
      if (deep) { history.back(); return; }                       /* came from the home screen: go home */
      if (history.state && history.state.hxm) history.back(); else close();
    }
    /* leaving for the post: come back to the same page */
    function remember() { if (open) try { history.replaceState({ hxm: 1, i: cur, deep: deep ? 1 : 0 }, ''); } catch (e) {} }
    page.addEventListener('click', function (e) { if (e.target.closest('a[href]')) remember(); }, true);
    window.addEventListener('pagehide', remember);

    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-band]');
      if (b) {
        [].forEach.call(root.querySelectorAll('[data-band]'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        if (list) list.innerHTML = groups(b.getAttribute('data-band'));
        return;
      }
      var g = e.target.closest('[data-go]');
      if (g) { var j = cur + +g.getAttribute('data-go'); if (j >= 0 && j < P.length) openPage(j); return; }
      var t = e.target.closest('.hxm-home [data-i]');
      if (t && !(e.metaKey || e.ctrlKey || e.shiftKey)) { e.preventDefault(); openPage(+t.getAttribute('data-i')); }
    });
    root.addEventListener('keydown', function (e) {
      if (e.target.classList && e.target.classList.contains('hxm-car') && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); e.target.click(); }
    });
    document.addEventListener('keydown', function (e) {
      if (!open || document.querySelector('.hx-sheet.open')) return;
      if (e.key === 'Escape') back();
      else if (!(e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) && /^(ArrowRight|ArrowLeft)$/.test(e.key) && !(e.target.closest && e.target.closest('.hxm-car'))) {
        var j = cur + (e.key === 'ArrowRight' ? 1 : -1); if (j >= 0 && j < P.length) { e.preventDefault(); openPage(j); }
      }
    });
    /* the app bar: Back closes the page first; the Memories icon and name go to the home */
    ctx.bar.addEventListener('click', function (e) {
      if (open && e.target.closest('.hb-back')) { e.preventDefault(); e.stopPropagation(); back(); }
      else if (open && e.target.closest('.hb-app')) {
        e.preventDefault(); e.stopPropagation();
        if (deep) { deep = false; close(); try { history.replaceState(null, ''); } catch (er) {} } else back();
      }
    }, true);
    window.addEventListener('popstate', function (e) {
      if (e.state && e.state.hxm) { if (!open) openPage(e.state.i || 0, false); }
      else close();
    });
    var rz = 0;
    window.addEventListener('resize', function () {
      clearTimeout(rz);
      rz = setTimeout(function () { fit(); var m = mode(); if (m === M) return; M = m; root.setAttribute('data-mode', m); }, 120);
    });

    /* back here after a reload with a page still in history */
    if (history.state && history.state.hxm) { deep = !!history.state.deep; openPage(Math.min(P.length - 1, history.state.i || 0), false); }
    else {
      var hm = location.hash.match(/^#post=(.+)$/);
      if (hm) {
        var want = decodeURIComponent(hm[1]);
        for (var q = 0; q < P.length; q++) if (P[q].u === want) {
          deep = true;
          try { history.replaceState({ hxm: 1, i: q, deep: 1 }, '', location.pathname + location.search); } catch (e) {}
          openPage(q, false);
          break;
        }
      }
    }
  };
})();
