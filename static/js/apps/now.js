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
