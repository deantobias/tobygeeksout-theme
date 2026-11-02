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
