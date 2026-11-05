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
    /* his logo on top, like the cover of the page, then his photo and
       name (Nov 2, Toby). Same day/night pair as the Traditional header. */
    var logo = (function () {
      var is70 = document.documentElement.classList.contains('fonts-70s');
      var up = 'https://tobygeeksout.micro.blog/uploads/2026/';
      var src = ctx.dark ? (is70 ? up + 'night-v2-toby-geeks-out-new-logo-1500-x-600-px.png' : up + 'sunset-toby-geeks-out-new-logo.png')
                         : (is70 ? up + 'toby-geeks-out-newest-v2-logo-1500-x-600-px.png' : up + 'tobygeeksoutlogonew.png');
      return '<img class="hx-sm-logo" src="' + src + '" alt="' + ctx.esc(d.site || 'Toby Geeks Out!') + '" decoding="async">';
    })();
    root.side.innerHTML = '<div class="hx-sm-hero">' + logo + face + (name ? '<h2>' + ctx.esc(name) + '</h2>' : '') + '</div>' +
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
