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
    function back() { if (history.state && history.state.hxp) history.back(); else if (deep) history.back(); else close(); }

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
    if (history.state && history.state.hxp) openPost(Math.min(P.length - 1, history.state.i || 0), false);
    /* /photo/#post=/2026/...: open that post right away (the home screen's
       Photo widget links here, so one tap shows the photo) */
    else {
      var hm = location.hash.match(/^#post=(.+)$/);
      if (hm) {
        var want = decodeURIComponent(hm[1]);
        for (var q = 0; q < P.length; q++) if (P[q].u === want) {
          deep = true;
          try { history.replaceState(history.state, '', location.pathname + location.search); } catch (e) {}
          openPost(q, false);
          break;
        }
      }
    }
  };
})();
